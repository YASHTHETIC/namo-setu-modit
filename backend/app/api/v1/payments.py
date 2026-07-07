from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.payment import (
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PaymentHistoryResponse,
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentListResponse,
    PaymentRead,
    RefundCreate,
    RefundRead,
    WebhookResponse,
)
from backend.app.services.payment_service import PaymentService

router = APIRouter()


@router.post("/checkout", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    payload: CheckoutSessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    return await PaymentService.create_checkout_session(db, user=user, payload=payload)


@router.post("/intent", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    payload: PaymentIntentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaymentIntentResponse:
    return await PaymentService.create_payment_intent(db, user=user, payload=payload)


@router.get("/{payment_id}", response_model=PaymentRead)
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaymentRead:
    return await PaymentService.get_payment(db, user=user, payment_id=payment_id)


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaymentHistoryResponse:
    return await PaymentService.get_user_payments(db, user=user)


@router.post("/refund", response_model=RefundRead, status_code=status.HTTP_201_CREATED)
async def request_refund(
    payload: RefundCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RefundRead:
    return await PaymentService.create_refund(db, user=user, payload=payload)


@router.post("/webhook", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    await PaymentService.handle_webhook(db, payload=payload, signature=signature)
    return WebhookResponse(received=True)


@router.post("/donation", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_donation_checkout(
    payload: CheckoutSessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    return await PaymentService.create_donation_checkout(db, user=user, payload=payload)


@router.post("/booking", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_booking_checkout(
    payload: CheckoutSessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    return await PaymentService.create_booking_checkout(db, user=user, payload=payload)


@router.post("/order", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_order_checkout(
    payload: CheckoutSessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    return await PaymentService.create_order_checkout(db, user=user, payload=payload)
