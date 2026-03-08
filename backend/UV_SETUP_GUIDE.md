# Backend Setup Guide Using `uv`

## What is `uv`?

`uv` is a blazingly fast Python package installer and resolver written in Rust. It's much faster than pip and handles virtual environments efficiently.

## Installation Status

✅ **`uv` is already installed**: `/usr/local/bin/uv` (v0.10.4)

## Setup Instructions

### Step 1: Initialize Project with `uv`

```bash
cd backend

# Create a new virtual environment (optional, uv creates one automatically)
uv venv
source .venv/bin/activate  # macOS/Linux
# or
.\.venv\Scripts\activate  # Windows
```

### Step 2: Install Dependencies with `uv`

```bash
# Install all project dependencies
uv sync

# Or use uv pip install for specific packages
uv pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings psycopg2-binary

# Or use uv pip compile to lock dependencies
uv pip compile requirements.txt --output-file requirements.lock
```

### Step 3: Run Python Commands with `uv`

```bash
# Run Python script directly
uv run python test_settings.py

# Run a module
uv run python -m app.core.config

# Run with arguments
uv run python -c "from app.core.config import settings; print(settings.BACKEND_CORS_ORIGINS)"

# Run Alembic migrations
uv run alembic upgrade head

# Start backend server
uv run uvicorn main:app --reload
```

## Recommended Commands

### Quick Start (All-in-One)

```bash
#!/bin/bash
cd backend

# 1. Sync all dependencies using uv
echo "📦 Installing dependencies with uv..."
uv sync

# 2. Test configuration loads correctly
echo "🔍 Testing configuration..."
uv run python test_settings.py

# 3. Run migrations
echo "📊 Running database migrations..."
uv run alembic upgrade head

# 4. Start backend
echo "🚀 Starting backend server..."
uv run uvicorn main:app --reload
```

### Individual Commands

```bash
# Test that settings load
uv run python test_settings.py

# Run migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "Add user tables"

# Run backend with auto-reload
uv run uvicorn main:app --reload

# Run backend in production mode
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Check database tables
uv run alembic current

# Downgrade one revision
uv run alembic downgrade -1
```

## Using `uv` with PostgreSQL

### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name likho-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=likho \
  -p 5432:5432 \
  -d postgres:latest

# Then run migrations
uv run alembic upgrade head
```

### Option 2: System PostgreSQL

```bash
# macOS
brew services start postgresql

# Ubuntu
sudo service postgresql start

# Create database
psql -U postgres -c "CREATE DATABASE likho;"

# Run migrations
uv run alembic upgrade head
```

## Project Configuration

### `pyproject.toml`

The project is configured with:
- **Python**: ≥3.10
- **Dependencies**:
  - fastapi
  - uvicorn
  - sqlalchemy
  - alembic
  - pydantic & pydantic-settings
  - psycopg2-binary

### Environment Variables (`.env`)

```env
# App
PROJECT_NAME=Likho Backend
API_V1_STR=/api/v1

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/likho

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:1420,http://127.0.0.1:1420,tauri://localhost

# JWT
SECRET_KEY=change-me-in-production-use-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Troubleshooting

### Issue: `uv sync` fails

**Solution:**
```bash
# Use --python flag to specify Python version
uv sync --python python3

# Or reinstall
uv venv --python python3
source .venv/bin/activate
uv sync
```

### Issue: Module not found

**Solution:**
```bash
# Make sure dependencies are installed
uv sync --refresh

# Test imports
uv run python -c "import fastapi; print(fastapi.__version__)"
```

### Issue: Database connection fails

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Update DATABASE_URL in .env if needed
# Default: postgresql://postgres:postgres@localhost:5432/likho
```

### Issue: Alembic command not found

**Solution:**
```bash
# Use uv run to run alembic
uv run alembic --version

# Or install separately
uv pip install alembic
```

## Advanced `uv` Usage

### Create a Requirements Lock File

```bash
# Generate a lock file for reproducible installs
uv pip compile pyproject.toml --output-file requirements.lock

# Install from lock file
uv pip install -r requirements.lock
```

### Use Specific Python Version

```bash
# List available Python versions
uv python list

# Use a specific version
uv run --python 3.11 python test_settings.py
```

### Run in Docker

```bash
# Install uv in Docker
RUN pip install uv

# Use uv in Dockerfile
RUN uv venv
RUN uv sync

CMD ["uv", "run", "uvicorn", "main:app"]
```

### Performance Tips

- `uv` is much faster than pip (5-10x faster)
- Use `uv sync` for reproducible environments
- Use `--python` flag to avoid downloading Python
- Cache `.venv` in Docker for faster builds

## Migration Workflow

```bash
# 1. Make changes to models in app/modules/users/models.py

# 2. Create migration
uv run alembic revision --autogenerate -m "Describe changes"

# 3. Review generated migration in alembic/versions/

# 4. Apply migration
uv run alembic upgrade head

# 5. Test that everything works
uv run python test_settings.py

# 6. Start backend
uv run uvicorn main:app --reload
```

## Resources

- **uv Documentation**: https://docs.astral.sh/uv/
- **Alembic Documentation**: https://alembic.sqlalchemy.org/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLAlchemy Documentation**: https://docs.sqlalchemy.org/

## Summary

| Task | Command |
|------|---------|
| Install deps | `uv sync` |
| Run script | `uv run python script.py` |
| Run server | `uv run uvicorn main:app --reload` |
| Run migrations | `uv run alembic upgrade head` |
| Create migration | `uv run alembic revision --autogenerate -m "msg"` |
| Test config | `uv run python test_settings.py` |
| Check DB | `uv run alembic current` |

You're all set! Use `uv` for lightning-fast Python development. ⚡
