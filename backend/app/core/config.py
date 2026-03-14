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

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS: comma-separated origins in .env, e.g. http://localhost:3000,http://localhost:5173
    BACKEND_CORS_ORIGINS: str | List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "tauri://localhost",
    ]

    # Collaboration
    COLLAB_PERSIST_INTERVAL_SECONDS: int = 30
    COLLAB_SESSION_TIMEOUT_MINUTES: int = 5
    COLLAB_MAX_UPDATES_BEFORE_PERSIST: int = 100

    # Rate Limiting
    # Default rate limit settings (requests per window)
    RATE_LIMIT_DEFAULT_REQUESTS: int = 100  # 100 requests per minute
    RATE_LIMIT_DEFAULT_WINDOW: int = 60     # 1 minute window
    
    # Rate limit whitelist (IP addresses or CIDR ranges)
    # Example: ["127.0.0.1", "10.0.0.0/8", "192.168.1.0/24"]
    RATE_LIMIT_WHITELIST: List[str] = []
    
    # Enable/disable rate limiting
    RATE_LIMIT_ENABLED: bool = True
    
    # Graceful degradation: if True, allows requests when Redis is down
    RATE_LIMIT_GRACEFUL_DEGRADATION: bool = True

    # S3 releases bucket (optional; leave empty to disable presigned upload)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_RELEASES_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_RELEASES_PREFIX: str = "releases"

    @property
    def s3_releases_configured(self) -> bool:
        return bool(
            self.AWS_ACCESS_KEY_ID
            and self.AWS_SECRET_ACCESS_KEY
            and self.AWS_RELEASES_BUCKET
        )

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
    
    @field_validator("RATE_LIMIT_WHITELIST", mode="before")
    @classmethod
    def parse_rate_limit_whitelist(cls, v):
        """Parse rate limit whitelist from string or list."""
        if isinstance(v, str):
            if not v or v.isspace():
                return []
            # Parse comma-separated string into list
            ips = [ip.strip() for ip in v.split(",") if ip.strip()]
            return ips if ips else []
        if isinstance(v, list):
            return [str(ip).strip() for ip in v if ip]
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
        REDIS_URL="redis://localhost:6379/0",
        BACKEND_CORS_ORIGINS=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:1420",
            "http://127.0.0.1:1420",
            "tauri://localhost",
        ],
        RATE_LIMIT_DEFAULT_REQUESTS=100,
        RATE_LIMIT_DEFAULT_WINDOW=60,
        RATE_LIMIT_WHITELIST=[],
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_GRACEFUL_DEGRADATION=True,
    )
