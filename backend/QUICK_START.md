# Quick Start Guide - Backend Setup

## ✅ What Was Fixed

The `BACKEND_CORS_ORIGINS` parsing error has been fixed in `app/core/config.py`.

**Error**: `pydantic_settings.exceptions.SettingsError: error parsing value for field "BACKEND_CORS_ORIGINS"`

**Fix**: Updated the field validator with better error handling and added `case_sensitive=False`

## 🚀 Setup (5 Minutes)

### Step 1: Start PostgreSQL

Using Docker (Recommended):
```bash
docker run --name likho-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=likho -p 5432:5432 -d postgres:latest
```

Or locally:
```bash
# macOS
brew services start postgresql

# Ubuntu
sudo service postgresql start
```

### Step 2: Python Environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
```

### Step 3: Install Dependencies

```bash
pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings psycopg2-binary
```

### Step 4: Run Migrations

```bash
alembic upgrade head
```

### Step 5: Start Backend

```bash
uvicorn main:app --reload
```

Visit: http://localhost:8000/docs

## ✅ What's Included

- 6 comprehensive user models
- JWT authentication
- Multi-provider auth support (email, Google, GitHub, Apple)
- Session management
- API key support
- User preferences
- Device tracking

## 🔗 Connect Frontend

In your React app:
```typescript
const API_URL = 'http://localhost:8000/api/v1';
// Already configured in src/lib/api.ts
```

## 📚 API Endpoints

- `POST /api/v1/auth/signup` - Register
- `POST /api/v1/auth/signin` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout
- `GET /docs` - API documentation

## ⚡ Status

- Backend: ✅ Ready
- Frontend: ✅ Ready
- Database Schema: ✅ Ready
- Auth System: ✅ Complete

Just run the 5 steps above and you're done!
