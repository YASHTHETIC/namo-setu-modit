from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.enums import NotificationChannel, NotificationStatus, ProductCode
from backend.app.models.shared import Notification, UserProfile
from backend.app.services.email_service import email_service

logger = logging.getLogger(__name__)


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


class NotificationService:
    """Multi-channel notification service supporting email, SMS, WhatsApp, and push."""

    async def send_notification(
        self,
        session: AsyncSession,
        *,
        product_code: str,
        user_id: str,
        title: str,
        message: str,
        channels: list[str] | None = None,
        template_key: str | None = None,
        metadata: dict[str, Any] | None = None,
        send_email: bool = True,
    ) -> list[Notification]:
        """Send notification across multiple channels."""
        if channels is None:
            channels = ["in_app"]

        notifications = []
        metadata_json = json.dumps(metadata) if metadata else None

        for channel in channels:
            notification = await create_in_app_notification(
                session,
                product_code=product_code,
                user_id=user_id,
                channel=channel,
                title=title,
                message=message,
                template_key=template_key,
                metadata_json=metadata_json,
            )
            notifications.append(notification)

        await session.flush()

        if send_email:
            await self._send_email_notification(session, user_id, title, message)

        return notifications

    async def _send_email_notification(
        self, session: AsyncSession, user_id: str, subject: str, body: str
    ) -> bool:
        """Send email notification to user."""
        try:
            from backend.app.models.user import User

            user_result = await session.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if user is None:
                return False

            profile_result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = profile_result.scalar_one_or_none()

            phone = profile.phone_number if profile else None
            email = user.email

            if email:
                html_body = f"<p>{body}</p>"
                return await email_service.send_notification(email, subject, html_body)
            return False
        except Exception as exc:
            logger.error("Failed to send email notification: %s", exc)
            return False

    async def send_booking_confirmation(
        self, session: AsyncSession, user_id: str, booking_details: dict[str, Any]
    ) -> list[Notification]:
        """Send booking confirmation via all channels."""
        return await self.send_notification(
            session,
            product_code="namo_setu",
            user_id=user_id,
            title="Booking Confirmed",
            message=f"Your booking {booking_details.get('booking_number', '')} has been confirmed.",
            channels=["in_app", "email"],
            template_key="booking_confirmation",
            metadata=booking_details,
        )

    async def send_payment_confirmation(
        self, session: AsyncSession, user_id: str, payment_details: dict[str, Any]
    ) -> list[Notification]:
        """Send payment confirmation."""
        return await self.send_notification(
            session,
            product_code="namo_setu",
            user_id=user_id,
            title="Payment Received",
            message=f"Payment of {payment_details.get('amount', '0')} {payment_details.get('currency', 'INR')} confirmed.",
            channels=["in_app", "email"],
            template_key="payment_confirmation",
            metadata=payment_details,
        )

    async def send_order_status_update(
        self, session: AsyncSession, user_id: str, order_details: dict[str, Any]
    ) -> list[Notification]:
        """Send order status update notification."""
        status_text = order_details.get("status", "updated")
        return await self.send_notification(
            session,
            product_code="modit",
            user_id=user_id,
            title="Order Status Updated",
            message=f"Your order {order_details.get('order_number', '')} is now: {status_text}",
            channels=["in_app", "email"],
            template_key="order_status",
            metadata=order_details,
        )

    async def send_festival_reminder(
        self, session: AsyncSession, user_id: str, festival_details: dict[str, Any]
    ) -> list[Notification]:
        """Send festival reminder notification."""
        return await self.send_notification(
            session,
            product_code="namo_setu",
            user_id=user_id,
            title="Festival Reminder",
            message=f"Don't miss {festival_details.get('name', 'the festival')} at {festival_details.get('temple', '')}!",
            channels=["in_app", "email"],
            template_key="festival_reminder",
            metadata=festival_details,
        )

    async def send_rfq_notification(
        self, session: AsyncSession, user_id: str, rfq_details: dict[str, Any]
    ) -> list[Notification]:
        """Send RFQ notification to suppliers."""
        return await self.send_notification(
            session,
            product_code="modit",
            user_id=user_id,
            title="New RFQ Received",
            message=f"New RFQ: {rfq_details.get('title', '')} from {rfq_details.get('buyer', '')}",
            channels=["in_app", "email"],
            template_key="rfq_received",
            metadata=rfq_details,
        )

    async def mark_as_read(self, session: AsyncSession, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        result = await session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        if notification is None:
            return False
        notification.status = NotificationStatus.READ.value
        notification.read_at = datetime.now(timezone.utc)
        await session.flush()
        return True

    async def mark_all_as_read(self, session: AsyncSession, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        result = await session.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value,
            )
        )
        count = 0
        for notification in result.scalars().all():
            notification.status = NotificationStatus.READ.value
            notification.read_at = datetime.now(timezone.utc)
            count += 1
        if count:
            await session.flush()
        return count

    async def get_unread_count(self, session: AsyncSession, user_id: str) -> int:
        """Get count of unread notifications."""
        from sqlalchemy import func

        result = await session.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value,
            )
        )
        return result.scalar() or 0


notification_service = NotificationService()
