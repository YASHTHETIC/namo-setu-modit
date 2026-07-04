from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.shared import AuditLog, Notification
from backend.app.models.enums import AnalyticsEventType, NotificationChannel, NotificationStatus, ProductCode


async def record_audit_log(
    session: AsyncSession,
    *,
    product_code: ProductCode | str,
    actor_user_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str,
    before_json: str | None = None,
    after_json: str | None = None,
    request_id: str | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        product_code=product_code.value if isinstance(product_code, ProductCode) else product_code,
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=before_json,
        after_json=after_json,
        request_id=request_id,
        ip_address=ip_address,
    )
    session.add(entry)
    await session.flush()
    return entry


async def queue_notification(
    session: AsyncSession,
    *,
    product_code: ProductCode | str,
    user_id: str,
    channel: NotificationChannel | str,
    title: str,
    message: str,
    template_key: str | None = None,
    metadata_json: str | None = None,
    scheduled_at: datetime | None = None,
) -> Notification:
    entry = Notification(
        product_code=product_code.value if isinstance(product_code, ProductCode) else product_code,
        user_id=user_id,
        channel=channel.value if isinstance(channel, NotificationChannel) else channel,
        title=title,
        message=message,
        template_key=template_key,
        metadata_json=metadata_json,
        status=NotificationStatus.QUEUED.value,
        scheduled_at=scheduled_at,
    )
    session.add(entry)
    await session.flush()
    return entry


async def record_login_event(
    session: AsyncSession,
    *,
    user_id: str | None,
    action: str,
    request_id: str | None = None,
    ip_address: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    payload = None if details is None else __import__("json").dumps(details)
    return await record_audit_log(
        session,
        product_code=ProductCode.MODIT,
        actor_user_id=user_id,
        action=action,
        entity_type="security_event",
        entity_id=user_id or "system",
        after_json=payload,
        request_id=request_id,
        ip_address=ip_address,
    )
