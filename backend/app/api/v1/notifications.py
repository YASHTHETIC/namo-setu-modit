from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.enums import NotificationChannel, NotificationStatus, ProductCode
from backend.app.models.shared import Notification, UserProfile
from backend.app.models.user import User
from backend.app.schemas.platform import (
    NotificationPreferenceUpdate,
    NotificationRead,
    PaginatedResponse,
    StandardResponse,
)
from backend.app.services.notification_service import (
    create_in_app_notification,
    notification_service,
)

router = APIRouter()


@router.get("/notifications", response_model=PaginatedResponse[NotificationRead])
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    channel: str | None = None,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaginatedResponse[NotificationRead]:
    query = select(Notification).where(Notification.user_id == user.id)
    if channel:
        query = query.where(Notification.channel == channel)
    if unread_only:
        query = query.where(Notification.status != NotificationStatus.READ.value)
    query = query.order_by(Notification.created_at.desc())

    count_q = select(func.count(Notification.id)).where(Notification.user_id == user.id)
    if channel:
        count_q = count_q.where(Notification.channel == channel)
    if unread_only:
        count_q = count_q.where(Notification.status != NotificationStatus.READ.value)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    items = [NotificationRead.model_validate(item) for item in result.scalars().all()]
    pages = (total + page_size - 1) // page_size if total else 0
    return PaginatedResponse(items=items, page=page, page_size=page_size, total=total, pages=pages)


@router.get("/notifications/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, int]:
    count = await notification_service.get_unread_count(db, user.id)
    return {"count": count}


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
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    success = await notification_service.mark_as_read(db, notification_id, user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    await db.commit()
    return StandardResponse(message="Notification marked as read", data=notification_id)


@router.post("/notifications/read-all", response_model=StandardResponse[int])
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[int]:
    count = await notification_service.mark_all_as_read(db, user.id)
    await db.commit()
    return StandardResponse(message=f"{count} notifications marked as read", data=count)


@router.delete("/notifications/{notification_id}", response_model=StandardResponse[str])
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    await db.delete(notification)
    await db.commit()
    return StandardResponse(message="Notification deleted", data=notification_id)


@router.patch("/notifications/preferences", response_model=StandardResponse[str])
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    profile.notification_preferences_json = payload.notification_preferences_json
    await db.commit()
    return StandardResponse(message="Notification preferences updated", data=user.id)
