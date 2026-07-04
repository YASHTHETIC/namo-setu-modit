from functools import lru_cache
from typing import Any
from urllib.parse import parse_qs, urlparse, urlunparse

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Foundation API"
    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    password_reset_token_expire_minutes: int = 30
    email_verification_token_expire_minutes: int = 1440
    max_sessions_per_user: int = 5
    storage_root: str = "storage"
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    openai_api_key: str | None = None
    langchain_tracing_v2: bool = False
    langchain_api_key: str | None = None
    chroma_db_path: str = "/data/chroma"
    faiss_index_path: str = "/data/faiss"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ("database_url", "redis_url", "celery_broker_url", "celery_result_backend"):
                val = data.get(key)
                if isinstance(val, str):
                    val = val.strip()
                    data[key] = val
            db_url = data.get("database_url", "")
            if "sslmode=" in db_url:
                parsed = urlparse(db_url)
                params = parse_qs(parsed.query)
                params.pop("sslmode", None)
                new_query = "&".join(f"{k}={v[0]}" for k, v in params.items())
                data["database_url"] = urlunparse(parsed._replace(query=new_query))
            if isinstance(data.get("backend_cors_origins"), str):
                import json
                raw = data["backend_cors_origins"].strip()
                if raw.startswith("["):
                    data["backend_cors_origins"] = json.loads(raw)
                elif "," in raw:
                    data["backend_cors_origins"] = [o.strip() for o in raw.split(",") if o.strip()]
                else:
                    data["backend_cors_origins"] = [raw] if raw else []
        return data


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
