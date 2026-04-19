"""
DGNL Moi Ngay - Application Configuration
Loads settings from environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://dgnl_user:dgnl_secret@db:5432/dgnl_db"
    POSTGRES_USER: str = "dgnl_user"
    POSTGRES_PASSWORD: str = "dgnl_secret"
    POSTGRES_DB: str = "dgnl_db"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = "your-google-client-id.apps.googleusercontent.com"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:3000,http://localhost:3080"

    class Config:
        case_sensitive = True


settings = Settings()