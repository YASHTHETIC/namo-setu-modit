from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.enums import ProductCode
from backend.app.models.shared import (
    Review,
    ReviewComment,
    ReviewLike,
    ReviewReport,
    UserProfile,
    MediaAsset,
)
from backend.app.models.user import User
from backend.app.schemas.reviews import (
    ReviewCommentCreate,
    ReviewCommentRead,
    ReviewCreate,
    ReviewListResponse,
    ReviewRead,
    ReviewReportCreate,
    ReviewStatsResponse,
    ReviewUpdate,
)
from backend.app.schemas.platform import StandardResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _review_to_read(review: Review, user: User | None = None) -> ReviewRead:
    user_name = None
    user_avatar = None
    if user:
        user_name = user.full_name
        if user.profile and user.profile.avatar_media:
            user_avatar = user.profile.avatar_media.url
    return ReviewRead.model_validate(review, from_attributes=True).model_copy(
        update={"user_name": user_name, "user_avatar": user_avatar}
    )


async def _get_review_with_user(
    db: AsyncSession, review_id: str
) -> tuple[Review, User | None]:
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.user).selectinload(User.profile).selectinload(UserProfile.avatar_media))
        .where(Review.id == review_id, Review.deleted_at.is_(None))
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
        )
    return review, review.user


async def _recalculate_rating_summary(
    db: AsyncSession, product_code: str, target_type: str, target_id: str
) -> tuple[float, dict[int, int]]:
    result = await db.execute(
        select(Review.rating).where(
            Review.product_code == product_code,
            Review.target_type == target_type,
            Review.target_id == target_id,
            Review.deleted_at.is_(None),
        )
    )
    ratings = [row[0] for row in result.all()]
    if not ratings:
        return 0.0, {i: 0 for i in range(1, 6)}
    avg = round(sum(ratings) / len(ratings), 2)
    dist: dict[int, int] = {i: 0 for i in range(1, 6)}
    for r in ratings:
        dist[r] = dist.get(r, 0) + 1
    return avg, dist


async def _get_stats_for_target(
    db: AsyncSession, product_code: str, target_type: str, target_id: str
) -> ReviewStatsResponse:
    avg, dist = await _recalculate_rating_summary(db, product_code, target_type, target_id)

    total_reviews_q = await db.execute(
        select(func.count()).select_from(
            select(Review.id).where(
                Review.product_code == product_code,
                Review.target_type == target_type,
                Review.target_id == target_id,
                Review.deleted_at.is_(None),
            ).subquery()
        )
    )
    total_reviews = total_reviews_q.scalar_one()

    review_ids_q = await db.execute(
        select(Review.id).where(
            Review.product_code == product_code,
            Review.target_type == target_type,
            Review.target_id == target_id,
            Review.deleted_at.is_(None),
        )
    )
    review_ids = [row[0] for row in review_ids_q.all()]

    total_likes = 0
    total_comments = 0
    if review_ids:
        likes_q = await db.execute(
            select(func.count()).select_from(
                select(ReviewLike.id).where(ReviewLike.review_id.in_(review_ids)).subquery()
            )
        )
        total_likes = likes_q.scalar_one()

        comments_q = await db.execute(
            select(func.count()).select_from(
                select(ReviewComment.id).where(ReviewComment.review_id.in_(review_ids)).subquery()
            )
        )
        total_comments = comments_q.scalar_one()

    return ReviewStatsResponse(
        total_reviews=total_reviews,
        average_rating=avg,
        rating_distribution=dist,
        total_likes=total_likes,
        total_comments=total_comments,
    )


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewRead:
    existing_q = await db.execute(
        select(Review.id).where(
            Review.user_id == user.id,
            Review.target_type == payload.target_type,
            Review.target_id == payload.target_id,
            Review.deleted_at.is_(None),
        )
    )
    if existing_q.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this item",
        )

    review = Review(
        product_code=ProductCode.NAMO_SETU.value
        if payload.target_type == "temple"
        else ProductCode.MODIT.value,
        user_id=user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        is_verified=True,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return _review_to_read(review, user)


@router.get("", response_model=ReviewListResponse)
async def list_reviews(
    target_type: str = Query(...),
    target_id: str = Query(...),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at", pattern="^(created_at|rating)$"),
    db: AsyncSession = Depends(get_db),
) -> ReviewListResponse:
    base_stmt = select(Review).where(
        Review.target_type == target_type,
        Review.target_id == target_id,
        Review.deleted_at.is_(None),
    )

    count_stmt = select(func.count()).select_from(
        select(Review.id).where(
            Review.target_type == target_type,
            Review.target_id == target_id,
            Review.deleted_at.is_(None),
        ).subquery()
    )
    total = (await db.execute(count_stmt)).scalar_one()

    order_col = Review.created_at.desc() if sort_by == "created_at" else Review.rating.desc()
    stmt = (
        base_stmt.options(
            selectinload(Review.user).selectinload(User.profile).selectinload(UserProfile.avatar_media)
        )
        .order_by(order_col)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    reviews = result.scalars().all()

    avg, dist = await _recalculate_rating_summary(
        db,
        reviews[0].product_code if reviews else (ProductCode.NAMO_SETU.value if target_type == "temple" else ProductCode.MODIT.value),
        target_type,
        target_id,
    )

    return ReviewListResponse(
        reviews=[_review_to_read(r, r.user) for r in reviews],
        total=total,
        average_rating=avg,
        rating_distribution=dist,
    )


@router.get("/stats", response_model=ReviewStatsResponse)
async def get_review_stats(
    target_type: str = Query(...),
    target_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> ReviewStatsResponse:
    product_code = (
        ProductCode.NAMO_SETU.value if target_type == "temple" else ProductCode.MODIT.value
    )
    return await _get_stats_for_target(db, product_code, target_type, target_id)


@router.get("/my-reviews", response_model=list[ReviewRead])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ReviewRead]:
    result = await db.execute(
        select(Review)
        .options(
            selectinload(Review.user).selectinload(User.profile).selectinload(UserProfile.avatar_media)
        )
        .where(Review.user_id == user.id, Review.deleted_at.is_(None))
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return [_review_to_read(r, r.user) for r in reviews]


@router.get("/{review_id}", response_model=ReviewRead)
async def get_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
) -> ReviewRead:
    review, user = await _get_review_with_user(db, review_id)
    return _review_to_read(review, user)


@router.put("/{review_id}", response_model=ReviewRead)
async def update_review(
    review_id: str,
    payload: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewRead:
    review, review_user = await _get_review_with_user(db, review_id)
    if review.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own review",
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    await db.commit()
    await db.refresh(review)
    return _review_to_read(review, review_user)


@router.delete("/{review_id}", response_model=StandardResponse[str])
async def delete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    review, _ = await _get_review_with_user(db, review_id)
    if review.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own review",
        )
    review.soft_delete()
    await db.commit()
    return StandardResponse(message="Review deleted", data=review_id)


@router.post("/{review_id}/like", response_model=StandardResponse[str])
async def toggle_like(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    review, _ = await _get_review_with_user(db, review_id)

    existing = await db.execute(
        select(ReviewLike).where(
            ReviewLike.user_id == user.id,
            ReviewLike.review_id == review_id,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        await db.commit()
        return StandardResponse(message="Like removed", data=review_id)
    else:
        new_like = ReviewLike(user_id=user.id, review_id=review_id)
        db.add(new_like)
        await db.commit()
        return StandardResponse(message="Review liked", data=review_id)


@router.get("/{review_id}/comments", response_model=list[ReviewCommentRead])
async def list_comments(
    review_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ReviewCommentRead]:
    await _get_review_with_user(db, review_id)

    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user).selectinload(User.profile).selectinload(UserProfile.avatar_media))
        .where(ReviewComment.review_id == review_id, ReviewComment.deleted_at.is_(None))
        .order_by(ReviewComment.created_at.asc())
    )
    comments = result.scalars().all()

    out: list[ReviewCommentRead] = []
    for c in comments:
        user_name = None
        if c.user:
            user_name = c.user.full_name
        out.append(
            ReviewCommentRead.model_validate(c, from_attributes=True).model_copy(
                update={"user_name": user_name}
            )
        )
    return out


@router.post(
    "/{review_id}/comments",
    response_model=ReviewCommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    review_id: str,
    payload: ReviewCommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewCommentRead:
    review, _ = await _get_review_with_user(db, review_id)

    comment = ReviewComment(
        user_id=user.id,
        review_id=review_id,
        body=payload.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    user_name = user.full_name
    return ReviewCommentRead.model_validate(comment, from_attributes=True).model_copy(
        update={"user_name": user_name}
    )


@router.delete(
    "/comments/{comment_id}", response_model=StandardResponse[str]
)
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    result = await db.execute(
        select(ReviewComment).where(
            ReviewComment.id == comment_id,
            ReviewComment.deleted_at.is_(None),
        )
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    if comment.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comment",
        )
    comment.soft_delete()
    await db.commit()
    return StandardResponse(message="Comment deleted", data=comment_id)


@router.post(
    "/{review_id}/report",
    response_model=StandardResponse[str],
    status_code=status.HTTP_201_CREATED,
)
async def report_review(
    review_id: str,
    payload: ReviewReportCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    review, _ = await _get_review_with_user(db, review_id)

    existing = await db.execute(
        select(ReviewReport).where(
            ReviewReport.review_id == review_id,
            ReviewReport.reporter_user_id == user.id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reported this review",
        )

    report = ReviewReport(
        review_id=review_id,
        reporter_user_id=user.id,
        reason=payload.reason,
        details=payload.details,
    )
    db.add(report)
    await db.commit()
    return StandardResponse(message="Review reported", data=review_id)
