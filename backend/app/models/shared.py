from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from backend.app.models.base import BaseModel
from backend.app.models.enums import (
    AIMessageRole,
    AddressOwnerType,
    AddressType,
    AnalyticsEventType,
    DocumentType,
    MediaType,
    NotificationChannel,
    NotificationStatus,
    ProductCode,
    ReviewTargetType,
    SearchSource,
    UserStatus,
)


class Country(BaseModel):
    __tablename__ = "countries"

    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    iso2: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)
    iso3: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)
    calling_code: Mapped[str | None] = mapped_column(String(8), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    states = relationship("State", back_populates="country", cascade="all, delete-orphan")

    @validates("name", "iso2", "iso3")
    def validate_strings(self, key: str, value: str) -> str:
        if not value or not value.strip():
            raise ValueError(f"{key} cannot be empty")
        return value.strip()


class State(BaseModel):
    __tablename__ = "states"
    __table_args__ = (UniqueConstraint("country_id", "name", name="uq_states_country_name"),)

    country_id: Mapped[str] = mapped_column(ForeignKey("countries.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    state_code: Mapped[str | None] = mapped_column(String(8), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    country = relationship("Country", back_populates="states")
    cities = relationship("City", back_populates="state", cascade="all, delete-orphan")


class City(BaseModel):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint("state_id", "name", name="uq_cities_state_name"),
        Index("ix_cities_state_country", "state_id", "country_id"),
    )

    country_id: Mapped[str] = mapped_column(ForeignKey("countries.id", ondelete="CASCADE"), nullable=False)
    state_id: Mapped[str] = mapped_column(ForeignKey("states.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    country = relationship("Country")
    state = relationship("State", back_populates="cities")


class Language(BaseModel):
    __tablename__ = "languages"

    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    iso_code: Mapped[str] = mapped_column(String(12), unique=True, nullable=False)
    script: Mapped[str | None] = mapped_column(String(40), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class UserProfile(BaseModel):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    language_id: Mapped[str | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"), nullable=True)
    avatar_media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=UserStatus.ACTIVE.value, nullable=False)
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferences_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    notification_preferences_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="profile")
    language = relationship("Language")
    avatar_media = relationship("MediaAsset")


class Address(BaseModel):
    __tablename__ = "addresses"
    __table_args__ = (
        CheckConstraint("user_id IS NOT NULL OR organization_id IS NOT NULL", name="ck_addresses_owner_required"),
        Index("ix_addresses_user_primary", "user_id", "is_primary"),
    )

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=True)
    country_id: Mapped[str] = mapped_column(ForeignKey("countries.id", ondelete="RESTRICT"), nullable=False)
    state_id: Mapped[str] = mapped_column(ForeignKey("states.id", ondelete="RESTRICT"), nullable=False)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    address_type: Mapped[str] = mapped_column(String(20), default=AddressType.HOME.value, nullable=False)
    owner_type: Mapped[str] = mapped_column(String(20), default=AddressOwnerType.USER.value, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")
    organization = relationship("Organization", back_populates="addresses")
    country = relationship("Country")
    state = relationship("State")
    city = relationship("City")


class UserSession(BaseModel):
    __tablename__ = "sessions"
    __table_args__ = (
        Index("ix_sessions_user_expires", "user_id", "expires_at"),
        UniqueConstraint("session_token", name="uq_sessions_session_token"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token: Mapped[str] = mapped_column(String(255), nullable=False)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="sessions")


class MediaAsset(BaseModel):
    __tablename__ = "media"
    __table_args__ = (Index("ix_media_product_owner", "product_code", "owner_user_id"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)

    owner = relationship("User", back_populates="media_assets")
    documents = relationship("DocumentAsset", back_populates="media_asset")

    @validates("file_size_bytes")
    def validate_file_size(self, key: str, value: int) -> int:
        if value < 0:
            raise ValueError("file size cannot be negative")
        return value


class DocumentAsset(BaseModel):
    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_product_type", "product_code", "document_type"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id", ondelete="SET NULL"), nullable=True)
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    issued_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    expires_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    owner = relationship("User", back_populates="documents")
    media_asset = relationship("MediaAsset", back_populates="documents")


class Notification(BaseModel):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_status", "user_id", "status"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    template_key: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=NotificationStatus.QUEUED.value, nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="notifications")


class AISession(BaseModel):
    __tablename__ = "ai_sessions"
    __table_args__ = (Index("ix_ai_sessions_user_product", "user_id", "product_code"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="ai_sessions")
    chats = relationship("AIChat", back_populates="session", cascade="all, delete-orphan")


class AIChat(BaseModel):
    __tablename__ = "ai_chats"
    __table_args__ = (Index("ix_ai_chats_session_created", "session_id", "created_at"),)

    session_id: Mapped[str] = mapped_column(ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    topic: Mapped[str | None] = mapped_column(String(255), nullable=True)

    session = relationship("AISession", back_populates="chats")
    messages = relationship("AIMessage", back_populates="chat", cascade="all, delete-orphan")


class AIMessage(BaseModel):
    __tablename__ = "ai_messages"
    __table_args__ = (Index("ix_ai_messages_chat_created", "chat_id", "created_at"),)

    chat_id: Mapped[str] = mapped_column(ForeignKey("ai_chats.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    chat = relationship("AIChat", back_populates="messages")


class SearchHistory(BaseModel):
    __tablename__ = "search_history"
    __table_args__ = (Index("ix_search_history_user_product_created", "user_id", "product_code", "created_at"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    query_text: Mapped[str] = mapped_column(String(500), nullable=False)
    filters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Recommendation(BaseModel):
    __tablename__ = "recommendations"
    __table_args__ = (Index("ix_recommendations_user_product", "user_id", "product_code"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)

    @validates("score")
    def validate_score(self, key: str, value: float) -> float:
        if value < 0 or value > 1:
            raise ValueError("score must be between 0 and 1")
        return value


class AnalyticsEvent(BaseModel):
    __tablename__ = "analytics_events"
    __table_args__ = (Index("ix_analytics_events_product_type_created", "product_code", "event_type", "created_at"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    event_name: Mapped[str] = mapped_column(String(150), nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_product_entity_created", "product_code", "entity_type", "created_at"),)

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(150), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    before_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)


class PasswordResetToken(BaseModel):
    __tablename__ = "password_reset_tokens"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requested_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="password_reset_tokens")


class EmailVerificationToken(BaseModel):
    __tablename__ = "email_verification_tokens"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email_address: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="email_verification_tokens")


class Review(BaseModel):
    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_product_target", "product_code", "target_type", "target_id"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
    )

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Rating(BaseModel):
    __tablename__ = "ratings"
    __table_args__ = (
        Index("ix_ratings_product_target", "product_code", "target_type", "target_id"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_ratings_rating_range"),
    )

    product_code: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    remark: Mapped[str | None] = mapped_column(String(255), nullable=True)
