from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.enums import NotificationChannel, NotificationStatus, ProductCode
from backend.app.models.shared import Notification


async def create_in_app_notification(
    session: AsyncSession,
    *,
    product_code: ProductCode | str,
    user_id: str,
    channel: NotificationChannel | str,
    title: str,
    message: str,
    template_key: str | None = None,
    metadata_json: str | None = None,
) -> Notification:
    notification = Notification(
        product_code=product_code.value if isinstance(product_code, ProductCode) else product_code,
        user_id=user_id,
        channel=channel.value if isinstance(channel, NotificationChannel) else channel,
        title=title,
        message=message,
        template_key=template_key,
        status=NotificationStatus.QUEUED.value,
        metadata_json=metadata_json,
    )
    session.add(notification)
    await session.flush()
    return notification
