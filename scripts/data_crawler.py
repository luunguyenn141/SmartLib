import os
import time
import re
from typing import Dict, List

import requests
import psycopg2
from sentence_transformers import SentenceTransformer

# --- CAU HINH DATABASE ---
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "smartlib"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# --- CAU HINH API ---
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")
USER_AGENT = "SmartLibCrawler/1.0 (+https://example.local)"

# --- CAU HINH AI MODEL ---
MODEL_NAME = os.getenv("MODEL_NAME", "paraphrase-multilingual-MiniLM-L12-v2")
_MODEL = None


def get_model():
    global _MODEL
    if _MODEL is None:
        print("LOADING MODEL...")
        _MODEL = SentenceTransformer(MODEL_NAME)
    return _MODEL


def get_db_connection():
    """CONNECT TO POSTGRESQL"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"ERROR: {e}")
        return None


def clean_html(raw_html: str) -> str:
    """Ham lam sach the HTML trong mo ta sach (vi du <p>, <br>)"""
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()


def _request_with_retry(url: str, params: Dict[str, str], timeout_s: int = 10) -> requests.Response:
    max_retries = 4
    backoff_s = 1
    last_exc = None
    headers = {"User-Agent": USER_AGENT}

    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=timeout_s, headers=headers)
            if resp.status_code in (429, 500, 502, 503, 504):
                if attempt < max_retries:
                    time.sleep(backoff_s)
                    backoff_s *= 2
                    continue
            return resp
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < max_retries:
                time.sleep(backoff_s)
                backoff_s *= 2
                continue
            raise

    if last_exc:
        raise last_exc
    raise RuntimeError("Request failed without exception")


def fetch_books_from_google(keyword: str, max_total: int = 120) -> List[dict]:
    """Goi API Google Books de lay sach theo tu khoa (co phan trang)."""
    print(f"Searching books with keyword: '{keyword}'...")
    api_url = "https://www.googleapis.com/books/v1/volumes"

    all_items: List[dict] = []
    start_index = 0
    page_size = 40

    while True:
        params = {
            "q": keyword,
            "maxResults": page_size,
            "startIndex": start_index,
            "langRestrict": "vi",
            "printType": "books",
        }
        if GOOGLE_BOOKS_API_KEY:
            params["key"] = GOOGLE_BOOKS_API_KEY

        response = _request_with_retry(api_url, params)
        if response.status_code != 200:
            print(f"ERROR WHEN CALLING API: {response.status_code} - {response.text[:200]}")
            break

        items = response.json().get("items", [])
        if not items:
            break

        all_items.extend(items)
        print(f"  - Page {start_index // page_size + 1}: +{len(items)} books")

        start_index += page_size
        if len(all_items) >= max_total:
            break

    return all_items[:max_total]


def save_books_to_db(books: List[dict], batch_size: int = 50) -> None:
    """Luu sach va Vector vao Database (idempotent)."""
    conn = get_db_connection()
    if not conn:
        return

    cur = conn.cursor()
    inserted = 0
    updated = 0
    failed = 0
    processed = 0

    for item in books:
        volume_info = item.get("volumeInfo", {})
        google_books_id = item.get("id")

        # 1. Trich xuat thong tin co ban
        title = volume_info.get("title")
        authors = ", ".join(volume_info.get("authors", ["Unknown"]))
        description_raw = volume_info.get("description", "")
        description = clean_html(description_raw)
        image_url = volume_info.get("imageLinks", {}).get("thumbnail", "")
        published_date = volume_info.get("publishedDate", "")
        identifiers = volume_info.get("industryIdentifiers", []) or []
        isbn_13 = None
        isbn_10 = None
        for ident in identifiers:
            if ident.get("type") == "ISBN_13" and ident.get("identifier"):
                isbn_13 = ident["identifier"]
            if ident.get("type") == "ISBN_10" and ident.get("identifier"):
                isbn_10 = ident["identifier"]
        isbn = isbn_13 or isbn_10 or None
        total_copies = 1
        available_copies = 1

        # Bo qua neu khong co tieu de hoac id
        if not title or not google_books_id:
            continue

        # 2. Xu ly Vector (AI Magic)
        text_to_embed = f"{title} {description}".strip() if description else title
        embedding = get_model().encode(text_to_embed, normalize_embeddings=True).tolist()

        # 3. Luu vao PostgreSQL
        try:
            cur.execute("SAVEPOINT book_row;")
            insert_query = """
            INSERT INTO books (
                google_books_id, title, author, description, image_url, published_date,
                isbn, total_copies, available_copies, embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (google_books_id) DO UPDATE SET
                title = EXCLUDED.title,
                author = EXCLUDED.author,
                description = EXCLUDED.description,
                image_url = EXCLUDED.image_url,
                published_date = EXCLUDED.published_date,
                isbn = EXCLUDED.isbn,
                total_copies = EXCLUDED.total_copies,
                available_copies = EXCLUDED.available_copies,
                embedding = EXCLUDED.embedding
            RETURNING (xmax = 0) AS inserted
            """
            cur.execute(
                insert_query,
                (
                    google_books_id, title, authors, description, image_url, published_date,
                    isbn, total_copies, available_copies, embedding
                ),
            )
            was_inserted = cur.fetchone()[0]
            if was_inserted:
                inserted += 1
            else:
                updated += 1
            cur.execute("RELEASE SAVEPOINT book_row;")
        except Exception as e:
            print(f"WARNING cannot save book '{title}': {e}")
            cur.execute("ROLLBACK TO SAVEPOINT book_row;")
            failed += 1
            cur.execute("RELEASE SAVEPOINT book_row;")

        processed += 1
        if processed % batch_size == 0:
            conn.commit()

    conn.commit()
    cur.close()
    conn.close()
    print(f"Done. Insert: {inserted}, Update: {updated}, Fail: {failed}")


def _extract_isbn(volume_info: dict) -> str | None:
    identifiers = volume_info.get("industryIdentifiers", []) or []
    isbn_13 = None
    isbn_10 = None
    for ident in identifiers:
        if ident.get("type") == "ISBN_13" and ident.get("identifier"):
            isbn_13 = ident["identifier"]
        if ident.get("type") == "ISBN_10" and ident.get("identifier"):
            isbn_10 = ident["identifier"]
    return isbn_13 or isbn_10 or None


def save_isbn_from_items(items: List[dict], batch_size: int = 100) -> None:
    """Update ISBN only for existing rows (no embedding)."""
    conn = get_db_connection()
    if not conn:
        return

    cur = conn.cursor()
    updated = 0
    skipped = 0
    failed = 0
    processed = 0

    for item in items:
        volume_info = item.get("volumeInfo", {})
        google_books_id = item.get("id")
        isbn = _extract_isbn(volume_info)

        if not google_books_id or not isbn:
            skipped += 1
            continue

        try:
            cur.execute(
                "UPDATE books SET isbn = %s WHERE google_books_id = %s",
                (isbn, google_books_id),
            )
            if cur.rowcount > 0:
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"WARNING cannot update isbn for '{google_books_id}': {e}")
            failed += 1

        processed += 1
        if processed % batch_size == 0:
            conn.commit()

    conn.commit()
    cur.close()
    conn.close()
    print(f"ISBN update done. Updated: {updated}, Skipped: {skipped}, Fail: {failed}")


def backfill_isbn(max_missing: int = 0, sleep_s: float = 0.2) -> None:
    """Backfill ISBN for existing rows that miss it."""
    conn = get_db_connection()
    if not conn:
        return

    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, google_books_id
        FROM books
        WHERE isbn IS NULL AND google_books_id IS NOT NULL
        ORDER BY id
        """
    )
    rows = cur.fetchall()
    if max_missing > 0:
        rows = rows[:max_missing]

    updated = 0
    failed = 0
    for book_id, google_books_id in rows:
        try:
            url = f"https://www.googleapis.com/books/v1/volumes/{google_books_id}"
            params = {}
            if GOOGLE_BOOKS_API_KEY:
                params["key"] = GOOGLE_BOOKS_API_KEY
            resp = _request_with_retry(url, params)
            if resp.status_code != 200:
                failed += 1
                continue
            volume_info = resp.json().get("volumeInfo", {})
            isbn = _extract_isbn(volume_info)
            if not isbn:
                failed += 1
                continue
            cur.execute(
                "UPDATE books SET isbn = %s WHERE id = %s",
                (isbn, book_id),
            )
            updated += 1
            if updated % 50 == 0:
                conn.commit()
            time.sleep(sleep_s)
        except Exception:
            failed += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"Backfill ISBN done. Updated: {updated}, Failed: {failed}")


def reembed_all(batch_size: int = 200) -> None:
    """Recompute embeddings for all rows (useful after changing MODEL_NAME)."""
    conn = get_db_connection()
    if not conn:
        return

    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, description
        FROM books
        WHERE title IS NOT NULL
        ORDER BY id
        """
    )
    rows = cur.fetchall()
    updated = 0
    for book_id, title, description in rows:
        text_to_embed = f"{title} {description or ''}".strip()
        embedding = get_model().encode(text_to_embed, normalize_embeddings=True).tolist()
        cur.execute("UPDATE books SET embedding = %s WHERE id = %s", (embedding, book_id))
        updated += 1
        if updated % batch_size == 0:
            conn.commit()
            print(f"Re-embedded {updated} books...")
    conn.commit()
    cur.close()
    conn.close()
    print(f"Re-embedding done. Updated: {updated}")


if __name__ == "__main__":
    if os.getenv("BACKFILL_ISBN_ONLY") == "1":
        max_missing_env = os.getenv("BACKFILL_MAX", "")
        sleep_env = os.getenv("BACKFILL_SLEEP", "")
        max_missing = int(max_missing_env) if max_missing_env.isdigit() else 0
        sleep_s = float(sleep_env) if sleep_env else 0.2
        backfill_isbn(max_missing=max_missing, sleep_s=sleep_s)
        raise SystemExit(0)
    if os.getenv("REEMBED_ALL") == "1":
        batch_env = os.getenv("REEMBED_BATCH", "")
        batch_size = int(batch_env) if batch_env.isdigit() else 200
        reembed_all(batch_size=batch_size)
        raise SystemExit(0)
    # Danh sach tu khoa de cao du lieu (Da dang chu de)
    keywords = [
        # --- 1. Cong nghe thong tin (IT) ---
        "Lap trinh Java Spring Boot",
        "Lap trinh Python co ban",
        "Cau truc du lieu va giai thuat",
        "Tri tue nhan tao va Machine Learning",
        "Thiet ke he thong System Design",
        "Blockchain va tien dien tu",
        "Clean Code",

        # --- 2. Kinh te & Ky nang (Self-Help) ---
        "Dac nhan tam",
        "Cha giau cha ngheo",
        "Tu duy phan bien",
        "Quan tri kinh doanh",
        "Marketing can ban",
        "Dau tu chung khoan",
        "Ky nang quan ly thoi gian",

        # --- 3. Van hoc & Tieu thuyet ---
        "Harry Potter",
        "Sherlock Holmes",
        "Tieu thuyet trinh tham Higashino Keigo",
        "Rung Na Uy Haruki Murakami",
        "Nha gia kim",
        "Hoang tu be",
        "Chua te nhung chiec nhan",
        "Truyen Kieu Nguyen Du",
        "So do Vu Trong Phung",
        "Nguyen Nhat Anh",

        # --- 4. Lich su & Van hoa ---
        "Lich su Viet Nam qua cac thoi ky",
        "Van minh lua nuoc",
        "Chien tranh the gioi thu hai",
        "Sapiens luoc su loai nguoi",
        "Van hoa Nhat Ban",

        # --- 5. Khoa hoc & Doi song ---
        "Vu tru va ho den Stephen Hawking",
        "Nguon goc cac loai Darwin",
        "Sach day nau an mon Viet",
        "Cham soc suc khoe va dinh duong",
        "Tam ly hoc hanh vi",

        # --- 6. Truyen tranh / Manga (De test tim kiem hinh anh/ten) ---
        "Doraemon",
        "Tham tu lung danh Conan",
        "One Piece",
        "Naruto",
    ]

    # Tao bang neu chua co (chay 1 lan cho chac)
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        # Dam bao extension vector da bat
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        # Tao bang books
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                google_books_id TEXT,
                title TEXT NOT NULL,
                author TEXT,
                description TEXT,
                image_url TEXT,
                published_date TEXT,
                isbn TEXT,
                total_copies INTEGER,
                available_copies INTEGER,
                embedding vector(384) -- Vector 384 chieu cho MiniLM
            );
            """
        )
        # Index for faster vector search
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS books_embedding_hnsw
            ON books USING hnsw (embedding vector_cosine_ops);
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS books_isbn_idx ON books (isbn);")
        # Dam bao co cot google_books_id va unique constraint
        cur.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS google_books_id TEXT;")
        cur.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;")
        cur.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS total_copies INTEGER;")
        cur.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS available_copies INTEGER;")
        cur.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'books_google_books_id_key'
                ) THEN
                    ALTER TABLE books ADD CONSTRAINT books_google_books_id_key UNIQUE (google_books_id);
                END IF;
            END $$;
            """
        )
        conn.commit()
        cur.close()
        conn.close()
        print("Checked/created table 'books'.")

    # Bat dau cao
    isbn_only = os.getenv("ISBN_FROM_SEARCH") == "1"
    max_total_env = os.getenv("MAX_TOTAL", "")
    max_total = int(max_total_env) if max_total_env.isdigit() else 120
    limit_env = os.getenv("KEYWORD_LIMIT", "")
    keyword_limit = int(limit_env) if limit_env.isdigit() else 0
    if keyword_limit > 0:
        keywords = keywords[:keyword_limit]

    for kw in keywords:
        books = fetch_books_from_google(kw, max_total=max_total)
        if isbn_only:
            save_isbn_from_items(books)
        else:
            save_books_to_db(books)
        time.sleep(1)  # Nghi giua cac tu khoa de tranh bi gioi han boi API

    print("\nFINISHED. Du lieu da san sang de demo AI Search.")
