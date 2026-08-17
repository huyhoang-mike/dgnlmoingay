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

    # Payments (SePay)
    PAYMENT_PROVIDER: str = "sepay"
    PAYMENT_ORDER_PREFIX: str = "DGNL"
    PAYMENT_ORDER_EXPIRY_MINUTES: int = 60
    COURSE_PRICE_VND: int = 699000
    SEPAY_WEBHOOK_SECRET: str = ""
    SEPAY_WEBHOOK_HEADER: str = "x-sepay-token"

    # Bank info for dynamic VietQR
    BANK_NAME: str = "TP BANK"
    BANK_BIN: str = "970423"
    BANK_ACCOUNT_NUMBER: str = "04351047435"
    BANK_ACCOUNT_NAME: str = "NGUYEN HUY HOANG"

    # Post-payment links
    COURSE_ZALO_GROUP_URL: str = ""
    COURSE_YOUTUBE_GUIDE_URL: str = ""
    SUPPORT_ZALO_URL: str = "https://zalo.me/0355912940"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:3000,http://localhost:3080"

    class Config:
        case_sensitive = True


settings = Settings()