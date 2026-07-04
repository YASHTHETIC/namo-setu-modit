from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.enums import NotificationStatus, ProductCode
from backend.app.models.shared import Notification, UserProfile
from backend.app.models.user import User
from backend.app.schemas.platform import NotificationPreferenceUpdate, NotificationRead, PaginatedResponse, StandardResponse
from backend.app.services.notification_service import create_in_app_notification

router = APIRouter()


@router.get("/notifications", response_model=PaginatedResponse[NotificationRead])
async def list_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> PaginatedResponse[NotificationRead]:
    result = await db.execute(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()))
    items = [NotificationRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(
    title: str,
    message: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NotificationRead:
    notification = await create_in_app_notification(
        db,
        product_code=ProductCode.MODIT,
        user_id=user.id,
        channel="in_app",
        title=title,
        message=message,
    )
    await db.commit()
    await db.refresh(notification)
    return NotificationRead.model_validate(notification)


@router.post("/notifications/{notification_id}/read", response_model=StandardResponse[str])
async def mark_notification_read(notification_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.status = NotificationStatus.READ.value
    notification.read_at = func.now()
    await db.commit()
    return StandardResponse(message="Notification marked as read", data=notification_id)


@router.patch("/notifications/preferences", response_model=StandardResponse[str])
async def update_notification_preferences(payload: NotificationPreferenceUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    profile.notification_preferences_json = payload.notification_preferences_json
    await db.commit()
    return StandardResponse(message="Notification preferences updated", data=user.id)
