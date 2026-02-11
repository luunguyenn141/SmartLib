# SmartLib

SmartLib is an AI-powered personal reading companion.

The current direction is focused on individual users:
- Track reading habits with sessions, minutes/pages, goals, and dashboard insights.
- Discover books with semantic search.
- Get personalized recommendations based on reading behavior.

## Architecture

- `frontend` (React + TypeScript + Vite): user-facing app (`Home`, `SmartSearch`, `Books`, `My Library`).
- `backend` (Spring Boot 3, Java 17): auth, user profile, personal reading APIs, book APIs, integration to AI service.
- `ai_service` (FastAPI, Python): embedding-based semantic search over pgvector.
- `db` (PostgreSQL + pgvector): books, users, personal reading data.

## Key Features

- Personal dashboard:
  - reading minutes today/month
  - monthly output chart
  - reading goals
  - recent reading sessions
- My Library:
  - status tracking (`TO_READ`, `READING`, `FINISHED`, `DROPPED`)
  - rating
  - total minutes/pages read per book
- Reading session flow:
  - start/stop timer on currently reading books
  - save session minutes/pages
  - finish/drop actions
- Smart search:
  - natural-language semantic search
  - recommendation cards from AI search seed

## Quick Start (Docker + Local Frontend)

### 1) Start backend stack

```sh
docker compose up -d --build
```

Services:
- Backend: `http://localhost:8080`
- AI service: `http://localhost:8000/health`
- Postgres: `localhost:5432`

### 2) Start frontend

```sh
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

## Useful APIs

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Books:
  - `GET /api/books`
  - `GET /api/books/{id}`
- Personal reading:
  - `GET /api/my/dashboard`
  - `GET /api/my/books`
  - `POST /api/my/books`
  - `PATCH /api/my/books/{id}`
  - `DELETE /api/my/books/{id}`
  - `GET /api/my/sessions`
  - `POST /api/my/sessions`
  - `GET /api/my/goals`
  - `PUT /api/my/goals`
- AI Search:
  - `POST /api/search`

## Environment Variables

### docker-compose

- `DB_URL`, `DB_USER`, `DB_PASSWORD` (backend)
- `AI_SERVICE_URL` (backend)
- `JWT_SECRET`, `JWT_EXPIRATION_MS` (backend)
- `MODEL_NAME` (ai_service)
- `GOOGLE_BOOKS_API_KEY` (optional, for crawler/quota)

### crawler script (`scripts/data_crawler.py`)

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `GOOGLE_BOOKS_API_KEY` (optional)

## Current Scope

This version intentionally removes old admin/loan workflow focus from UI and prioritizes personal reading habit workflows.

## Status

Active development. Core personal-reading flow + semantic search are running end-to-end.
