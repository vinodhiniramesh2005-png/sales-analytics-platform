import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AI Sales Analytics Platform"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database/app.db")

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "reports")
    CHARTS_DIR: str = os.getenv("CHARTS_DIR", "charts")

    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "100/minute")

    class Config:
        env_file = ".env"


settings = Settings()

for d in [settings.UPLOAD_DIR, settings.REPORTS_DIR, settings.CHARTS_DIR, "database"]:
    os.makedirs(d, exist_ok=True)
