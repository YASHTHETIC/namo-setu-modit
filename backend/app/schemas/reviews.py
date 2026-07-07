from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class ReviewCreate(BaseModel):
    target_type: str
    target_id: str
    rating: int = Field(ge=1, le=5)
    title: str | None = None
    body: str | None = None


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    title: str | None = None
    body: str | None = None


class ReviewRead(ORMModel):
    id: str
    product_code: str
    user_id: str | None = None
    target_type: str
    target_id: str
    rating: int
    title: str | None = None
    body: str | None = None
    is_verified: bool
    created_at: datetime
    user_name: str | None = None
    user_avatar: str | None = None


class ReviewListResponse(BaseModel):
    reviews: list[ReviewRead]
    total: int
    average_rating: float
    rating_distribution: dict[int, int]


class ReviewLikeCreate(BaseModel):
    review_id: str


class ReviewLikeRead(ORMModel):
    id: str
    user_id: str
    review_id: str
    created_at: datetime


class ReviewCommentCreate(BaseModel):
    body: str


class ReviewCommentRead(ORMModel):
    id: str
    user_id: str
    body: str
    created_at: datetime
    user_name: str | None = None


class ReviewReportCreate(BaseModel):
    reason: str = Field(max_length=100)
    details: str | None = None


class ReviewStatsResponse(BaseModel):
    total_reviews: int
    average_rating: float
    rating_distribution: dict[int, int]
    total_likes: int
    total_comments: int
