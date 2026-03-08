import os
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Likho Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/likho"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS: comma-separated origins in .env, e.g. http://localhost:3000,http://localhost:5173
    BACKEND_CORS_ORIGINS: str | List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "tauri://localhost",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            # Handle empty string
            if not v or v.isspace():
                return [
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            # Parse comma-separated string into list
            origins = [origin.strip() for origin in v.split(",") if origin.strip()]
            return origins if origins else []
        if isinstance(v, list):
            # If already a list, clean it up
            return [str(origin).strip() for origin in v if origin]
        # Default: return empty list
        return []


# Initialize settings with proper error handling
try:
    settings = Settings()
except Exception as e:
    print(f"⚠️  Error loading settings: {e}")
    print("Using default settings...")
    settings = Settings(
        PROJECT_NAME="Likho Backend",
        API_V1_STR="/api/v1",
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/likho",
        SECRET_KEY="change-me-in-production-use-a-long-random-string",
        ACCESS_TOKEN_EXPIRE_MINUTES=1440,
        BACKEND_CORS_ORIGINS=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:1420",
            "http://127.0.0.1:1420",
            "tauri://localhost",
        ],
    )
