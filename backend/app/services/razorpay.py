"""Razorpay online payments, verified server-side.

Flow: checkout (pending payment) -> create_razorpay_order (server amount!) ->
frontend Razorpay widget -> verify_razorpay_payment (HMAC) -> captured.

Amounts ALWAYS come from the server-side order. The client amount is ignored,
so a tampered checkout total can never become a real charge.
"""

from __future__ import annotations

import base64
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.models.enums import PaymentStatus
from backend.app.models.modit import ModitPayment, Order, OrderItem, Transaction
from backend.app.services.checkout import verify_razorpay_signature

settings = get_settings()

RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"


def _require_keys() -> tuple[str, str]:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online payments are not configured yet. Please use Cash on Delivery.",
        )
    return settings.razorpay_key_id, settings.razorpay_key_secret


async def _get_owned_order(session: AsyncSession, user_id: str, order_id: str) -> Order:
    from backend.app.models.modit import OrganizationUser

    order = await session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    memberships = (
        (await session.execute(select(OrganizationUser).where(OrganizationUser.user_id == user_id)))
        .scalars()
        .all()
    )
    org_ids = {m.organization_id for m in memberships}
    if order.organization_id not in org_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def _order_total(session: AsyncSession, order_id: str) -> float:
    rows = (
        (await session.execute(select(OrderItem).where(OrderItem.order_id == order_id)))
        .scalars()
        .all()
    )
    return round(sum(float(r.line_total) for r in rows), 2)


async def create_razorpay_order(session: AsyncSession, user_id: str, order_id: str) -> dict:
    """Create a Razorpay order for an unpaid checkout order. Returns widget params."""
    key_id, key_secret = _require_keys()
    order = await _get_owned_order(session, user_id, order_id)
    total = await _order_total(session, order_id)
    if total <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has no chargeable amount")
    payment = (
        (
            await session.execute(
                select(ModitPayment).where(
                    ModitPayment.order_id == order_id,
                    ModitPayment.payment_status == PaymentStatus.PENDING.value,
                )
            )
        )
        .scalars()
        .first()
    )
    if payment is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No pending payment for this order")
    auth = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            RAZORPAY_ORDERS_URL,
            headers={"Authorization": f"Basic {auth}"},
            json={"amount": int(round(total * 100)), "currency": "INR", "receipt": order.order_number},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment gateway error. Please try again."
        )
    data = resp.json()
    session.add(
        Transaction(
            id=_new_id(),
            payment_id=payment.id,
            transaction_reference=f"RZP-ORD-{data.get('id', 'unknown')}",
            transaction_type="debit",
            amount=total,
            provider_name="razorpay",
            external_id=data.get("id"),
            occurred_at=datetime.now(timezone.utc),
        )
    )
    await session.commit()
    return {
        "key_id": key_id,
        "razorpay_order_id": data.get("id"),
        "amount_paise": int(round(total * 100)),
        "currency": "INR",
    }


def _new_id() -> str:
    from uuid import uuid4

    return str(uuid4())


async def verify_razorpay_payment(
    session: AsyncSession,
    user_id: str,
    order_id: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> dict:
    """Verify the widget callback HMAC and mark the payment captured."""
    _, key_secret = _require_keys()
    order = await _get_owned_order(session, user_id, order_id)
    ok = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature, key_secret)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")
    payment = (
        (
            await session.execute(select(ModitPayment).where(ModitPayment.order_id == order_id))
        )
        .scalars()
        .first()
    )
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
    payment.payment_status = "captured"
    payment.paid_at = datetime.now(timezone.utc)
    session.add(
        Transaction(
            id=_new_id(),
            payment_id=payment.id,
            transaction_reference=f"RZP-PAY-{razorpay_payment_id}",
            transaction_type="debit",
            amount=float(payment.amount),
            provider_name="razorpay",
            external_id=razorpay_payment_id,
            occurred_at=datetime.now(timezone.utc),
        )
    )
    await session.commit()
    return {"verified": True, "payment_status": payment.payment_status, "order_id": order.id}
