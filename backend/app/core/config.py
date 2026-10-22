from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AnyHttpUrl

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

    PROJECT_NAME: str = "BookLoop"
    PROJECT_DESCRIPTION: str = "Peer-to-peer used-book marketplace for India"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./bookloop.db",
        description="Database connection string (PostgreSQL for prod, SQLite for zero-config local dev)",
    )
    
    # Security
    SECRET_KEY: str = "bookloop-super-secret-dev-key-change-in-production-12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://usedbooks-six.vercel.app",
        "http://usedbooks-six.vercel.app",
    ]

    # Pilot City Launch Settings
    LAUNCH_CITY: str = "Bidar"
    LAUNCH_STATE: str = "Karnataka"
    LAUNCH_PINCODES: List[str] = ["585401", "585402", "585403", "585404"]

    # Commercial & Marketplace Commission Rules (CONFIGURABLE)
    DEFAULT_COMMISSION_PERCENT: float = 10.0
    COMMISSION_GST_PERCENT: float = 18.0
    DEFAULT_INTRACITY_SHIPPING_FLAT_INR: float = 40.0
    DEFAULT_INTERCITY_SHIPPING_BASE_INR: float = 70.0
    SETTLEMENT_HOLD_DAYS: int = 3

    # Payment Gateway Configuration (Razorpay / Sandbox)
    RAZORPAY_KEY_ID: str = "rzp_test_bookloop_sandbox"
    RAZORPAY_KEY_SECRET: str = "secret_bookloop_sandbox_key_123"
    RAZORPAY_WEBHOOK_SECRET: str = "webhook_secret_sandbox_bookloop_456"

settings = Settings()
