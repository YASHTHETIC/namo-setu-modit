from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.modit import ModitPayment
from backend.app.models.user import User
from backend.app.schemas.modit import (
    RazorpayOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
    RazorpayVerifyResponse,
)

router = APIRouter()


async def _own_org_ids(db: AsyncSession, user: User) -> list[str]:
    from backend.app.models.modit import OrganizationUser

    rows = await db.execute(select(OrganizationUser.organization_id).where(OrganizationUser.user_id == user.id))
    return [row[0] for row in rows.all()]


@router.post("/razorpay/order", response_model=RazorpayOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_razorpay_order(
    payload: RazorpayOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RazorpayOrderResponse:
    """Create a Razorpay order for an unpaid checkout order.

    Amount comes from the server-side order — client totals are ignored.
    """
    from backend.app.services.razorpay import create_razorpay_order as _create

    return RazorpayOrderResponse.model_validate(await _create(db, user.id, payload.order_id))


@router.post("/razorpay/verify", response_model=RazorpayVerifyResponse)
async def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RazorpayVerifyResponse:
    """Verify the Razorpay widget callback (HMAC) and capture the payment."""
    from backend.app.services.razorpay import verify_razorpay_payment as _verify

    return RazorpayVerifyResponse.model_validate(
        await _verify(
            db,
            user.id,
            payload.order_id,
            payload.razorpay_order_id,
            payload.razorpay_payment_id,
            payload.razorpay_signature,
        )
    )


@router.get("/history")
async def get_payment_history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Payments for the caller's own organizations (status filter optional)."""
    own_orgs = await _own_org_ids(db, user)
    if not own_orgs:
        return {"items": [], "total": 0}

    stmt = select(ModitPayment).where(ModitPayment.organization_id.in_(own_orgs))
    result = await db.execute(stmt.order_by(ModitPayment.created_at.desc()))
    payments = result.scalars().all()
    return {
        "items": [
            {
                "id": p.id,
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.payment_status,
                "description": p.payment_reference,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "receipt_url": None,
            }
            for p in payments
        ],
        "total": len(payments),
    }
