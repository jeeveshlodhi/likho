# Backend Setup and Migrations Guide

## Issue Fixed

The `BACKEND_CORS_ORIGINS` parsing error has been fixed in `app/core/config.py`. The validator now properly handles:
- Comma-separated strings from `.env` file
- Direct list values
- Fallback handling for edge cases

## Prerequisites

Before running migrations, ensure you have:

1. **Python 3.12+**
   ```bash
   python3 --version
   ```

2. **Virtual Environment**
   ```bash
   python3 -m venv .venv
   ```

3. **PostgreSQL Database** (for production/migrations)
   ```bash
   # macOS (if using Homebrew)
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo service postgresql start

   # Or use Docker
   docker run --name likho-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=likho -p 5432:5432 -d postgres:latest
   ```

## Setup Steps

### 1. Activate Virtual Environment

```bash
source .venv/bin/activate  # macOS/Linux
# or
.\.venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
# or
pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings psycopg2-binary
```

### 3. Update Environment Variables

Check your `.env` file:

```bash
cat .env
```

Should look like:

```env
# App
PROJECT_NAME=Likho Backend
API_V1_STR=/api/v1

# Database – For migrations, use PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/likho

# CORS – comma-separated origins
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:1420,http://127.0.0.1:1420,tauri://localhost
```

### 4. Create Database (PostgreSQL Only)

```bash
psql -U postgres -c "CREATE DATABASE likho;"
```

Or if using Docker:

```bash
docker exec likho-postgres psql -U postgres -c "CREATE DATABASE likho;"
```

### 5. Run Alembic Migrations

```bash
# Initialize alembic (if not already done)
alembic init alembic

# Create migration from models
alembic revision --autogenerate -m "Create user tables"

# Apply migrations
alembic upgrade head
```

### 6. Verify Database Tables

```bash
# Connect to database
psql -U postgres -d likho

# List tables
\dt
```

Should show:
- `users`
- `user_auth`
- `sessions`
- `api_keys`
- `user_preferences`
- `device_registry`

## Running the Backend

```bash
# Development (with auto-reload)
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Testing Settings

Once the environment is working:

```bash
python3 << 'EOF'
from app.core.config import settings

print('✅ Configuration Status:')
print(f'  Project: {settings.PROJECT_NAME}')
print(f'  API Version: {settings.API_V1_STR}')
print(f'  Database: {settings.DATABASE_URL}')
print(f'  CORS Origins: {len(settings.BACKEND_CORS_ORIGINS)} configured')
print(f'  JWT Secret: {"✅ Set" if settings.SECRET_KEY else "❌ Not set"}')
print('\n✅ All settings loaded successfully!')
EOF
```

## Quick Docker Setup (Recommended)

For a complete isolated setup with PostgreSQL:

```bash
# 1. Start PostgreSQL container
docker run --name likho-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=likho \
  -p 5432:5432 \
  -d postgres:latest

# 2. Create venv and install deps
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings psycopg2-binary

# 3. Run migrations
alembic upgrade head

# 4. Start backend
uvicorn main:app --reload
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'pydantic'"

**Solution:**
```bash
# Ensure venv is activated
source .venv/bin/activate

# Reinstall dependencies
pip install --upgrade pip
pip install pydantic pydantic-settings fastapi
```

### Issue: "psycopg2 error" or database connection fails

**Solution:**
```bash
# Install psycopg2-binary
pip install psycopg2-binary

# Test connection
psql -U postgres -d likho -c "SELECT version();"
```

### Issue: "Alembic not found"

**Solution:**
```bash
pip install alembic

# Verify
alembic --version
```

### Issue: ".env" file not recognized

**Solution:**
```bash
# Ensure .env exists in the backend directory
ls -la .env

# If missing, copy from example
cp .env.example .env

# Update values as needed
nano .env
```

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/dbname` |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,http://localhost:5173` |
| `SECRET_KEY` | JWT signing key | Long random string for production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | 1440 (24 hours) |
| `PROJECT_NAME` | API title in docs | "Likho Backend" |
| `API_V1_STR` | API version prefix | "/api/v1" |

## Migration Files Location

```
backend/
├── alembic/
│   ├── versions/
│   │   └── 001_sochix_full_schema.py  ← Initial schema
│   ├── env.py
│   ├── script.py.mako
│   └── README
├── alembic.ini                        ← Alembic config
├── main.py
└── app/
    ├── core/
    │   ├── config.py                  ← ✅ FIXED
    │   ├── database.py
    │   └── base.py
    └── modules/
        └── users/
```

## Next Steps

1. ✅ Settings configuration fixed
2. ⏳ Set up PostgreSQL (local or Docker)
3. ⏳ Install Python dependencies
4. ⏳ Run Alembic migrations
5. ⏳ Test backend with `uvicorn`
6. ⏳ Connect frontend to backend API

## API Endpoints Ready

Once running, you'll have:

- **Sign Up**: `POST /api/v1/auth/signup`
- **Sign In**: `POST /api/v1/auth/signin`
- **Get User**: `GET /api/v1/auth/me`
- **Logout**: `POST /api/v1/auth/logout`
- **API Docs**: `GET /docs` (Swagger UI)
- **OpenAPI**: `GET /openapi.json`

## Support

If you encounter issues:

1. Check that Python version is 3.12+
2. Ensure PostgreSQL is running
3. Verify `.env` file has correct database URL
4. Check that all dependencies are installed
5. Look at error messages carefully - they often indicate the fix needed

Happy coding! 🚀
