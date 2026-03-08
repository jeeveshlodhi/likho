# Likho Backend

FastAPI backend with a module-based structure. Entry point is **outside** the `app` package.

## Structure

```
backend/
├── main.py                 # Entry point; includes module routers here
├── app/
│   ├── core/               # Config, DB (base, engine, session), shared settings
│   └── modules/            # Feature modules (each: router, crud, models, schemas)
│       └── users/
```

## Run

From the `backend/` directory:

```bash
uvicorn main:app --reload
```

API: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

## Migrations (Alembic)

Schema is defined in the repo-root `schema.sql` (PostgreSQL). Migrations run that schema.

1. Set `DATABASE_URL` in `.env` to a PostgreSQL database.
2. From `backend/`:

```bash
alembic upgrade head
```

- `alembic revision -m "description"` – create a new revision
- `alembic upgrade head` – apply all migrations
- `alembic downgrade -1` – roll back one revision
