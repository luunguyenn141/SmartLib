import os
from typing import List, Optional

import psycopg2
from psycopg2 import pool
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

DB_NAME = os.getenv("DB_NAME", "smartlib")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

MODEL_NAME = os.getenv("MODEL_NAME", "paraphrase-multilingual-MiniLM-L12-v2")
TOP_K_DEFAULT = int(os.getenv("TOP_K_DEFAULT", "10"))
TOP_K_MAX = int(os.getenv("TOP_K_MAX", "50"))
EF_SEARCH_DEFAULT = int(os.getenv("EF_SEARCH_DEFAULT", "64"))
EF_SEARCH_MAX = int(os.getenv("EF_SEARCH_MAX", "256"))

app = FastAPI(title="SmartLib AI Service", version="0.1.0")

_model = SentenceTransformer(MODEL_NAME)
_db_pool: Optional[pool.SimpleConnectionPool] = None


def get_pool() -> pool.SimpleConnectionPool:
    global _db_pool
    if _db_pool is None:
        _db_pool = pool.SimpleConnectionPool(
            1,
            10,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
        )
    return _db_pool


def to_pgvector(vec: List[float]) -> str:
    # Convert Python list to pgvector literal
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language query")
    top_k: int = Field(default=TOP_K_DEFAULT, ge=1, le=TOP_K_MAX)
    ef_search: Optional[int] = Field(default=None, ge=8, le=EF_SEARCH_MAX)


class SearchResult(BaseModel):
    id: int
    google_books_id: Optional[str]
    title: Optional[str]
    author: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    published_date: Optional[str]
    score: float


@app.on_event("startup")
def startup_event():
    # Initialize pool early to fail fast if DB not reachable
    get_pool()


@app.on_event("shutdown")
def shutdown_event():
    if _db_pool:
        _db_pool.closeall()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/search", response_model=List[SearchResult])
def search_books(payload: SearchRequest):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is empty")

    embedding = _model.encode(query, normalize_embeddings=True).tolist()
    vec_literal = to_pgvector(embedding)
    ef_search = payload.ef_search
    if ef_search is None:
        # Heuristic: keep recall reasonable as top_k grows.
        ef_search = max(EF_SEARCH_DEFAULT, payload.top_k * 4)
    if ef_search > EF_SEARCH_MAX:
        ef_search = EF_SEARCH_MAX

    sql = """
        SELECT
            id,
            google_books_id,
            title,
            author,
            description,
            image_url,
            published_date,
            1.0 / (1.0 + (embedding <=> %s::vector)) AS score
        FROM books
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """

    pool_obj = get_pool()
    conn = pool_obj.getconn()
    try:
        with conn.cursor() as cur:
            # ef_search higher = better recall, slower. Keep bounded for safety.
            cur.execute("SET LOCAL hnsw.ef_search = %s;", (ef_search,))
            cur.execute(sql, (vec_literal, vec_literal, payload.top_k))
            rows = cur.fetchall()
    finally:
        pool_obj.putconn(conn)

    results = [
        SearchResult(
            id=row[0],
            google_books_id=row[1],
            title=row[2],
            author=row[3],
            description=row[4],
            image_url=row[5],
            published_date=row[6],
            score=float(row[7]),
        )
        for row in rows
    ]
    return results


@app.get("/config")
def config_info():
    return {
        "db_host": DB_HOST,
        "db_name": DB_NAME,
        "model": MODEL_NAME,
        "top_k_default": TOP_K_DEFAULT,
        "top_k_max": TOP_K_MAX,
        "ef_search_default": EF_SEARCH_DEFAULT,
        "ef_search_max": EF_SEARCH_MAX,
    }
