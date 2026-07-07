from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class CheckoutSessionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    product: str
    success_url: str
    cancel_url: str
    metadata: dict | None = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str
    payment_reference: str


class PaymentIntentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    metadata: dict | None = None


class PaymentIntentResponse(BaseModel):
    payment_intent_id: str
    client_secret: str
    payment_reference: str


class PaymentRead(ORMModel):
    id: str
    payment_reference: str
    provider: str
    amount: float
    currency: str
    payment_status: str
    external_id: str | None = None
    paid_at: datetime | None = None
    created_at: datetime


class PaymentListResponse(BaseModel):
    payments: list[PaymentRead]
    total: int


class RefundCreate(BaseModel):
    payment_id: str
    amount: float | None = None
    reason: str | None = None


class RefundRead(ORMModel):
    id: str
    refund_reference: str
    amount: float
    currency: str
    refund_status: str
    reason: str | None = None
    processed_at: datetime | None = None
    created_at: datetime


class WebhookResponse(BaseModel):
    received: bool


class PaymentHistoryResponse(BaseModel):
    payments: list[PaymentRead]
