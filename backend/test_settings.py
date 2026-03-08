#!/usr/bin/env python3
"""Test that settings load correctly with detailed debugging"""
import os
import sys
from pathlib import Path

print("=" * 60)
print("LIKHO BACKEND - SETTINGS VALIDATION")
print("=" * 60)

# Check if .env file exists
env_file = Path(".env")
if env_file.exists():
    print(f"\n✅ .env file found at: {env_file.absolute()}")
    print("\n📋 .env contents:")
    print("-" * 60)
    with open(".env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                if "SECRET" in line or "PASSWORD" in line:
                    key = line.split("=")[0]
                    print(f"  {key}=***redacted***")
                else:
                    print(f"  {line}")
    print("-" * 60)
else:
    print(f"\n⚠️  .env file NOT found!")
    print(f"   Expected at: {env_file.absolute()}")
    print(f"   Please copy .env.example to .env and update values")

print("\n" + "=" * 60)
print("LOADING SETTINGS...")
print("=" * 60)

try:
    from app.core.config import settings

    print('\n✅ Settings loaded successfully!')
    print(f'\n📦 Application Configuration:')
    print(f'   Project: {settings.PROJECT_NAME}')
    print(f'   API Version: {settings.API_V1_STR}')

    print(f'\n🗄️  Database Configuration:')
    db_url = settings.DATABASE_URL
    # Mask password for security
    if "@" in db_url:
        scheme, rest = db_url.split("://", 1)
        creds, host = rest.split("@", 1)
        username = creds.split(":")[0]
        masked_url = f"{scheme}://{username}:***@{host}"
        print(f'   Database: {masked_url}')
    else:
        print(f'   Database: {db_url}')

    print(f'\n🔐 JWT Configuration:')
    print(f'   Secret Key: {"Set ✅" if settings.SECRET_KEY else "NOT SET ❌"}')
    print(f'   Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes ({settings.ACCESS_TOKEN_EXPIRE_MINUTES // 60} hours)')

    print(f'\n🌐 CORS Configuration:')
    print(f'   Total Origins: {len(settings.BACKEND_CORS_ORIGINS)}')
    for i, origin in enumerate(settings.BACKEND_CORS_ORIGINS, 1):
        print(f'     {i}. {origin}')

    print('\n✅ All settings validated successfully!')
    print("=" * 60)

except Exception as e:
    print(f'\n❌ ERROR loading settings:')
    print(f'\n   {type(e).__name__}: {str(e)}')
    print(f'\n📍 Traceback:')
    import traceback
    traceback.print_exc()
    print("\n" + "=" * 60)
    print("TROUBLESHOOTING:")
    print("  1. Make sure DATABASE_URL is in correct format:")
    print("     postgresql://username:password@host:port/database")
    print("  2. Make sure BACKEND_CORS_ORIGINS has NO SPACES around commas")
    print("  3. Make sure all required env vars are in .env file")
    print("  4. Try: cp .env.example .env")
    print("=" * 60)
    sys.exit(1)
