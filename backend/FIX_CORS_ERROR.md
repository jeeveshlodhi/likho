# Fix: BACKEND_CORS_ORIGINS Parsing Error

## Problem
```
pydantic_settings.exceptions.SettingsError: error parsing value for field "BACKEND_CORS_ORIGINS" from source "DotEnvSettingsSource"
```

## Root Causes

This error typically occurs when:
1. `.env` file format is incorrect (spaces, line breaks, missing values)
2. Missing or incomplete `.env` file entries
3. Database URL is malformed
4. Configuration hasn't been updated properly

## Solution

### Step 1: Verify `.env` File Format

Your `.env` file **MUST** have this exact format (no extra spaces, all on one line):

```env
# App
PROJECT_NAME=Likho Backend
API_V1_STR=/api/v1

# Database (PostgreSQL connection URL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/likho

# JWT Configuration
SECRET_KEY=change-me-in-production-use-a-long-random-string-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS – comma-separated list of allowed origins (no spaces!)
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:1420,http://127.0.0.1:1420,tauri://localhost
```

### Step 2: Critical Requirements

⚠️  **IMPORTANT** - These are the most common causes of the parsing error:

1. **No spaces around commas** in `BACKEND_CORS_ORIGINS`:
   ❌ WRONG: `http://localhost:3000, http://localhost:5173`
   ✅ CORRECT: `http://localhost:3000,http://localhost:5173`

2. **All on ONE line** - No line breaks in `BACKEND_CORS_ORIGINS`:
   ❌ WRONG:
   ```env
   BACKEND_CORS_ORIGINS=http://localhost:3000,\
     http://localhost:5173
   ```
   ✅ CORRECT:
   ```env
   BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. **Database URL must be complete**:
   ❌ WRONG: `postgresql://postgres:postgres/likho`
   ✅ CORRECT: `postgresql://postgres:postgres@localhost:5432/likho`

4. **All required variables present**:
   - PROJECT_NAME
   - API_V1_STR
   - DATABASE_URL
   - SECRET_KEY
   - ACCESS_TOKEN_EXPIRE_MINUTES
   - BACKEND_CORS_ORIGINS

### Step 3: Copy from Example

The easiest way to get a correct `.env` file:

```bash
cd backend
cp .env.example .env
```

Then verify the DATABASE_URL matches your PostgreSQL setup:
- If using Docker: `postgresql://postgres:postgres@localhost:5432/likho`
- If using local PostgreSQL: update host/port as needed

### Step 4: Verify Configuration Loads

```bash
# Using uv (recommended)
uv run python test_settings.py

# Or with traditional Python
cd backend
python3 -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
python test_settings.py
```

Expected output:
```
============================================================
LIKHO BACKEND - SETTINGS VALIDATION
============================================================

✅ .env file found at: ...

📋 .env contents:
  PROJECT_NAME=Likho Backend
  API_V1_STR=/api/v1
  DATABASE_URL=postgresql://postgres:***@localhost:5432/likho
  SECRET_KEY=***redacted***
  ACCESS_TOKEN_EXPIRE_MINUTES=1440
  BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,...

============================================================
LOADING SETTINGS...
============================================================

✅ Settings loaded successfully!

📦 Application Configuration:
   Project: Likho Backend
   API Version: /api/v1

🗄️  Database Configuration:
   Database: postgresql://postgres:***@localhost:5432/likho

🔐 JWT Configuration:
   Secret Key: Set ✅
   Token Expiry: 1440 minutes (24 hours)

🌐 CORS Configuration:
   Total Origins: 6
     1. http://localhost:3000
     2. http://localhost:5173
     3. http://127.0.0.1:5173
     4. http://localhost:1420
     5. http://127.0.0.1:1420
     6. tauri://localhost

✅ All settings validated successfully!
============================================================
```

## Quick Fix Checklist

- [ ] `.env` file exists in `backend/` directory
- [ ] All required variables are present (no missing lines)
- [ ] `BACKEND_CORS_ORIGINS` has NO SPACES around commas
- [ ] `BACKEND_CORS_ORIGINS` is ALL ON ONE LINE
- [ ] `DATABASE_URL` is complete with `@hostname:port`
- [ ] `SECRET_KEY` is set to something (can be dummy value)
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` is set to a number (e.g., 1440)
- [ ] `test_settings.py` runs without errors
- [ ] PostgreSQL container is running: `docker ps | grep postgres`

## If Still Failing

Try this nuclear option:

```bash
# Delete .env completely
rm backend/.env

# Copy fresh from example
cp backend/.env.example backend/.env

# Update DATABASE_URL if needed (if not using default port 5432):
# sed -i 's/@localhost:5432/@your-host:your-port/g' backend/.env

# Test again
cd backend
uv run python test_settings.py
```

## PostgreSQL Setup (if needed)

```bash
# Using Docker (recommended)
docker run --name likho-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=likho \
  -p 5432:5432 \
  -d postgres:latest

# Verify it's running
docker ps | grep postgres
```

## Environment Variables Summary

| Variable | Example | Notes |
|----------|---------|-------|
| PROJECT_NAME | Likho Backend | Just a display name |
| API_V1_STR | /api/v1 | API route prefix |
| DATABASE_URL | postgresql://postgres:postgres@localhost:5432/likho | Must include username, password, host, port |
| SECRET_KEY | abcd1234... | Change in production! |
| ACCESS_TOKEN_EXPIRE_MINUTES | 1440 | 24 hours = 1440 minutes |
| BACKEND_CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | NO SPACES, all one line |

## Support

If you still have issues:

1. Run: `uv run python test_settings.py` and share the output
2. Check: `cat backend/.env` (redact password)
3. Verify: `docker ps` (is PostgreSQL running?)
4. Try: `uv sync --refresh` (update dependencies)
