# SmartLib

AI-powered library management system (work in progress).

## Services
- `ai_service`: FastAPI for semantic search using SentenceTransformers + pgvector.
- `db`: PostgreSQL with pgvector.
- `scripts/data_crawler.py`: Fetch books from Google Books API and store embeddings.

## Quick start
1. Start database and AI service:
   ```sh
   docker-compose up -d
   ```
2. Seed data (requires Python deps locally and API key optional):
   ```sh
   cd scripts
   python data_crawler.py
   ```
   Set env vars `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `GOOGLE_BOOKS_API_KEY` as needed.
3. Test search API:
   ```sh
   curl -X POST http://localhost:8000/search \
     -H "Content-Type: application/json" \
     -d '{"query": "sach lap trinh", "top_k": 5}'
   ```

## Environment variables
- DB_NAME (default: smartlib)
- DB_USER (default: postgres)
- DB_PASSWORD (default: postgres)
- DB_HOST (default: localhost)
- DB_PORT (default: 5432)
- MODEL_NAME (ai_service, default: all-MiniLM-L6-v2)
- GOOGLE_BOOKS_API_KEY (optional for higher quota)

## Notes
- pgvector extension is preinstalled in `db` image.
- `ai_service` uses simple connection pool via psycopg2; adjust max connections via code if needed.
