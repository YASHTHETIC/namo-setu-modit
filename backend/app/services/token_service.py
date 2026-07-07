from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.core.security import hash_token
from backend.app.models.shared import (
    EmailVerificationToken,
    PasswordResetToken,
    UserSession,
)
from backend.app.models.user import RefreshToken


class TokenService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Password Reset Tokens ───────────────────────────────────────────

    async def generate_password_reset_token(self, user_id: str) -> str:
        settings = get_settings()
        raw_token = secrets.token_urlsafe(48)
        token_hash = hash_token(raw_token)
        now = datetime.now(timezone.utc)

        token_record = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=now + timedelta(minutes=settings.password_reset_token_expire_minutes),
        )
        self.session.add(token_record)
        await self.session.flush()
        return raw_token

    async def validate_password_reset_token(self, token: str) -> str | None:
        token_hash = hash_token(token)
        now = datetime.now(timezone.utc)

        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.revoked == False,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            return None

        record.used_at = now
        await self.session.flush()
        return record.user_id

    # ── Email Verification Tokens ───────────────────────────────────────

    async def generate_email_verification_token(self, user_id: str, email: str) -> str:
        settings = get_settings()
        raw_token = secrets.token_urlsafe(48)
        token_hash = hash_token(raw_token)
        now = datetime.now(timezone.utc)

        token_record = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            email_address=email,
            expires_at=now + timedelta(minutes=settings.email_verification_token_expire_minutes),
        )
        self.session.add(token_record)
        await self.session.flush()
        return raw_token

    async def validate_email_verification_token(self, token: str) -> tuple[str | None, str | None]:
        token_hash = hash_token(token)
        now = datetime.now(timezone.utc)

        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.revoked == False,
            EmailVerificationToken.verified_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            return None, None

        record.verified_at = now
        await self.session.flush()
        return record.user_id, record.email_address

    # ── Session Management ──────────────────────────────────────────────

    async def revoke_all_user_sessions(self, user_id: str, except_session_id: str | None = None) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.is_revoked == False,
                UserSession.expires_at > now,
            )
            .values(is_revoked=True)
        )
        if except_session_id:
            stmt = stmt.where(UserSession.id != except_session_id)
        await self.session.execute(stmt)

        refresh_stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > now,
            )
            .values(revoked=True)
        )
        if except_session_id:
            refresh_stmt = refresh_stmt.where(RefreshToken.id != except_session_id)
        await self.session.execute(refresh_stmt)
        await self.session.flush()

    async def get_user_sessions(self, user_id: str) -> list[dict]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.is_revoked == False,
                UserSession.expires_at > now,
            )
            .order_by(UserSession.created_at.desc())
        )
        result = await self.session.execute(stmt)
        sessions = result.scalars().all()

        return [
            {
                "id": s.id,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "expires_at": s.expires_at.isoformat(),
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions
        ]

    async def revoke_session(self, session_id: str, user_id: str) -> bool:
        now = datetime.now(timezone.utc)
        stmt = select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == user_id,
            UserSession.is_revoked == False,
        )
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            return False

        record.is_revoked = True
        await self.session.flush()
        return True
