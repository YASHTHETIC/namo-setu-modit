from functools import lru_cache
from typing import Annotated, Any

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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
    # Hard cap for any single uploaded file (product/customer media).
    max_upload_bytes: int = 5 * 1024 * 1024
    # First-staff bootstrap: this login email auto-gets super_admin on
    # register/login. Unset = disabled. Set once on the server, then remove.
    bootstrap_admin_email: str | None = None
    # Phone-OTP login: generic SMS gateway (POST {phone, code, sender}).
    # Unset gateway = OTP cannot send; OTP_DEBUG_TO_LOGS prints codes to
    # server logs for internal testing only (never to the client).
    sms_gateway_url: str | None = None
    sms_api_key: str | None = None
    sms_sender: str = "MODIT"
    otp_debug_to_logs: bool = False
    # NoDecode: pydantic-settings JSON-decodes list fields at the source level,
    # which rejects plain "a,b,c" env values before validators run. Skip the
    # source decoding; parse_cors_origins below handles str -> list.
    backend_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]
    )
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@foundation.com"
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    google_maps_api_key: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    frontend_url: str = "http://localhost:3000"

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
            import re as _re
            for key in ("database_url", "redis_url"):
                val = data.get(key)
                if isinstance(val, str):
                    val = _re.sub(r'[\r\n\t\x00-\x1f\x7f]+', '', val)
                    val = val.strip()
                    data[key] = val
            redis_url = data.get("redis_url", "")
            if isinstance(redis_url, str) and "localhost" not in redis_url:
                if redis_url.startswith("redis://"):
                    data["redis_url"] = "rediss://" + redis_url[len("redis://"):]
            if isinstance(data.get("backend_cors_origins"), str):
                import json
                raw = data["backend_cors_origins"].strip()
                if raw.startswith("["):
                    try:
                        data["backend_cors_origins"] = json.loads(raw)
                    except ValueError:
                        data["backend_cors_origins"] = [o.strip().strip("'\"") for o in raw.strip("[]").split(",") if o.strip()]
                elif "," in raw:
                    data["backend_cors_origins"] = [o.strip() for o in raw.split(",") if o.strip()]
                else:
                    data["backend_cors_origins"] = [raw] if raw else []
        return data

    @model_validator(mode="after")
    def _reject_default_jwt_secret_in_production(self) -> "Settings":
        """Fail fast at startup: shipping the placeholder JWT secret to
        production would let anyone forge tokens."""
        if self.environment == "production" and self.jwt_secret_key.strip() in ("", "change-me"):
            raise ValueError(
                "jwt_secret_key must be set to a strong random secret when environment=production"
            )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
