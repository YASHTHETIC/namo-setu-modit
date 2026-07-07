from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import httpx
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.models.enums import PaymentStatus, RefundStatus, TransactionType
from backend.app.models.modit import ModitPayment, Transaction
from backend.app.models.namo_setu import BookingPayment, Donation, NamoBooking, Refund

settings = get_settings()

STRIPE_BASE_URL = "https://api.stripe.com/v1"


def make_payment_reference(prefix: str = "PAY") -> str:
    return f"{prefix}-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


def make_refund_reference() -> str:
    return f"REF-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


def amount_to_stripe(amount: float, currency: str) -> int:
    zero_decimal = {"BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"}
    if currency.upper() in zero_decimal:
        return int(amount)
    return int(round(amount * 100))


def stripe_status_to_payment_status(stripe_status: str) -> str:
    mapping = {
        "succeeded": PaymentStatus.CAPTURED.value,
        "processing": PaymentStatus.AUTHORIZED.value,
        "requires_payment_method": PaymentStatus.PENDING.value,
        "requires_confirmation": PaymentStatus.PENDING.value,
        "requires_action": PaymentStatus.PENDING.value,
        "canceled": PaymentStatus.FAILED.value,
        "requires_capture": PaymentStatus.AUTHORIZED.value,
    }
    return mapping.get(stripe_status, PaymentStatus.PENDING.value)


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.stripe_secret_key}",
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _verify_webhook_signature(payload: bytes, sig_header: str, secret: str) -> dict[str, Any]:
    elements = {}
    for item in sig_header.split(","):
        parts = item.strip().split("=", 1)
        if len(parts) == 2:
            elements[parts[0].strip()] = parts[1].strip()

    timestamp = elements.get("t", "")
    expected_sig = elements.get("v1", "")

    signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
    computed = hmac.new(secret.encode("utf-8"), signed_payload.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed, expected_sig):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    return json.loads(payload.decode("utf-8"))


class PaymentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # 1. Checkout Session
    # ------------------------------------------------------------------
    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        metadata: dict[str, str],
        success_url: str,
        cancel_url: str,
    ) -> dict[str, Any]:
        stripe_amount = amount_to_stripe(amount, currency)

        body = {
            "mode": "payment",
            "amount": str(stripe_amount),
            "currency": currency.lower(),
            "success_url": success_url,
            "cancel_url": cancel_url,
        }

        for key, value in metadata.items():
            body[f"metadata[{key}]"] = value

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{STRIPE_BASE_URL}/checkout/sessions", headers=_auth_headers(), data=body)

        if resp.status_code != 200:
            detail = resp.json().get("error", {}).get("message", resp.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe error: {detail}")

        data = resp.json()
        payment_reference = make_payment_reference()
        booking_id = metadata.get("booking_id")
        donation_id = metadata.get("donation_id")

        payment_record = BookingPayment(
            booking_id=booking_id,
            donation_id=donation_id,
            payment_reference=payment_reference,
            provider="stripe",
            amount=amount,
            currency=currency,
            payment_status=PaymentStatus.PENDING.value,
            external_id=data["id"],
        )
        self.session.add(payment_record)
        await self.session.flush()

        return {
            "session_id": data["id"],
            "url": data["url"],
            "payment_reference": payment_reference,
        }

    # ------------------------------------------------------------------
    # 2. PaymentIntent
    # ------------------------------------------------------------------
    async def create_payment_intent(
        self,
        amount: float,
        currency: str,
        metadata: dict[str, str],
    ) -> dict[str, Any]:
        stripe_amount = amount_to_stripe(amount, currency)

        body = {
            "amount": str(stripe_amount),
            "currency": currency.lower(),
        }

        for key, value in metadata.items():
            body[f"metadata[{key}]"] = value

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{STRIPE_BASE_URL}/payment_intents", headers=_auth_headers(), data=body)

        if resp.status_code != 200:
            detail = resp.json().get("error", {}).get("message", resp.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe error: {detail}")

        data = resp.json()
        payment_reference = make_payment_reference()
        booking_id = metadata.get("booking_id")
        donation_id = metadata.get("donation_id")

        payment_record = BookingPayment(
            booking_id=booking_id,
            donation_id=donation_id,
            payment_reference=payment_reference,
            provider="stripe",
            amount=amount,
            currency=currency,
            payment_status=stripe_status_to_payment_status(data.get("status", "")),
            external_id=data["id"],
        )
        self.session.add(payment_record)
        await self.session.flush()

        return {
            "payment_intent_id": data["id"],
            "client_secret": data["client_secret"],
            "payment_reference": payment_reference,
        }

    # ------------------------------------------------------------------
    # 3. Confirm / Verify Payment
    # ------------------------------------------------------------------
    async def confirm_payment(self, payment_reference: str) -> dict[str, Any]:
        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.payment_reference == payment_reference)
        )
        payment = result.scalar_one_or_none()
        if payment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        if not payment.external_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No external Stripe ID associated with this payment")

        resource = "checkout/sessions" if payment.external_id.startswith("cs_") else "payment_intents"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{STRIPE_BASE_URL}/{resource}/{payment.external_id}", headers=_auth_headers())

        if resp.status_code != 200:
            detail = resp.json().get("error", {}).get("message", resp.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe error: {detail}")

        data = resp.json()
        stripe_status = data.get("status", "")
        new_status = stripe_status_to_payment_status(stripe_status)

        payment.payment_status = new_status
        if new_status == PaymentStatus.CAPTURED.value:
            payment.paid_at = datetime.now(timezone.utc)

        await self.session.flush()

        return {
            "payment_reference": payment_reference,
            "payment_status": payment.payment_status,
            "external_id": payment.external_id,
            "stripe_status": stripe_status,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        }

    # ------------------------------------------------------------------
    # 4. Refund
    # ------------------------------------------------------------------
    async def process_refund(
        self,
        payment_id: str,
        amount: float,
        reason: str | None = None,
    ) -> dict[str, Any]:
        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        if payment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        if payment.payment_status != PaymentStatus.CAPTURED.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment has not been captured, cannot refund")

        if amount > float(payment.amount):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refund amount exceeds payment amount")

        stripe_amount = amount_to_stripe(amount, payment.currency)

        body: dict[str, str] = {
            "payment_intent": payment.external_id,
            "amount": str(stripe_amount),
        }
        if reason:
            body["reason"] = reason

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{STRIPE_BASE_URL}/refunds", headers=_auth_headers(), data=body)

        if resp.status_code != 200:
            detail = resp.json().get("error", {}).get("message", resp.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe error: {detail}")

        data = resp.json()
        refund_reference = make_refund_reference()

        refund_record = Refund(
            booking_id=payment.booking_id,
            payment_id=payment.id,
            refund_reference=refund_reference,
            amount=amount,
            currency=payment.currency,
            refund_status=RefundStatus.REQUESTED.value if data.get("status") == "pending" else RefundStatus.PROCESSED.value,
            reason=reason,
            processed_at=datetime.now(timezone.utc) if data.get("status") in ("succeeded", "pending") else None,
        )
        self.session.add(refund_record)

        if data.get("status") == "succeeded":
            payment.payment_status = PaymentStatus.REFUNDED.value

        await self.session.flush()

        return {
            "refund_id": data.get("id"),
            "refund_reference": refund_reference,
            "amount": amount,
            "currency": payment.currency,
            "status": data.get("status"),
            "reason": reason,
        }

    # ------------------------------------------------------------------
    # 5. Webhook Handler
    # ------------------------------------------------------------------
    async def handle_webhook(self, payload: bytes, sig_header: str) -> dict[str, Any]:
        if not settings.stripe_webhook_secret:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Stripe webhook secret not configured")

        event_data = _verify_webhook_signature(payload, sig_header, settings.stripe_webhook_secret)
        event_type = event_data.get("type", "")
        event_object = event_data.get("data", {}).get("object", {})

        result: dict[str, Any] = {
            "event_type": event_type,
            "event_id": event_data.get("id"),
            "handled": True,
        }

        if event_type == "checkout.session.completed":
            result.update(await self._handle_checkout_completed(event_object))
        elif event_type == "payment_intent.succeeded":
            result.update(await self._handle_payment_intent_succeeded(event_object))
        elif event_type == "payment_intent.payment_failed":
            result.update(await self._handle_payment_intent_failed(event_object))
        elif event_type == "charge.refunded":
            result.update(await self._handle_charge_refunded(event_object))
        else:
            result["handled"] = False
            result["message"] = f"Unhandled event type: {event_type}"

        return result

    async def _handle_checkout_completed(self, obj: dict[str, Any]) -> dict[str, Any]:
        session_id = obj.get("id")
        payment_intent = obj.get("payment_intent")

        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.external_id == session_id)
        )
        payment = result.scalar_one_or_none()
        if payment is None and payment_intent:
            result = await self.session.execute(
                select(BookingPayment).where(BookingPayment.external_id == payment_intent)
            )
            payment = result.scalar_one_or_none()

        if payment is None:
            return {"message": "No matching payment record found"}

        payment.payment_status = PaymentStatus.CAPTURED.value
        payment.paid_at = datetime.now(timezone.utc)
        if payment_intent and not payment.external_id:
            payment.external_id = payment_intent

        await self.session.flush()
        return {"payment_reference": payment.payment_reference, "status": payment.payment_status}

    async def _handle_payment_intent_succeeded(self, obj: dict[str, Any]) -> dict[str, Any]:
        pi_id = obj.get("id")
        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.external_id == pi_id)
        )
        payment = result.scalar_one_or_none()

        if payment is None:
            metadata = obj.get("metadata", {})
            booking_id = metadata.get("booking_id")
            donation_id = metadata.get("donation_id")
            amount = obj.get("amount", 0) / 100.0
            currency = (obj.get("currency") or "inr").upper()

            payment = BookingPayment(
                booking_id=booking_id,
                donation_id=donation_id,
                payment_reference=make_payment_reference(),
                provider="stripe",
                amount=amount,
                currency=currency,
                payment_status=PaymentStatus.CAPTURED.value,
                external_id=pi_id,
                paid_at=datetime.now(timezone.utc),
            )
            self.session.add(payment)
        else:
            payment.payment_status = PaymentStatus.CAPTURED.value
            payment.paid_at = datetime.now(timezone.utc)

        await self.session.flush()
        return {"payment_reference": payment.payment_reference, "status": payment.payment_status}

    async def _handle_payment_intent_failed(self, obj: dict[str, Any]) -> dict[str, Any]:
        pi_id = obj.get("id")
        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.external_id == pi_id)
        )
        payment = result.scalar_one_or_none()

        if payment is None:
            return {"message": "No matching payment record found"}

        payment.payment_status = PaymentStatus.FAILED.value
        await self.session.flush()
        return {"payment_reference": payment.payment_reference, "status": payment.payment_status}

    async def _handle_charge_refunded(self, obj: dict[str, Any]) -> dict[str, Any]:
        payment_intent_id = obj.get("payment_intent")
        amount_refunded = obj.get("amount_refunded", 0) / 100.0
        refund_id_stripe = obj.get("id")

        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.external_id == payment_intent_id)
        )
        payment = result.scalar_one_or_none()

        if payment is None:
            return {"message": "No matching payment record found"}

        existing = await self.session.execute(
            select(Refund).where(Refund.refund_reference == refund_id_stripe)
        )
        if existing.scalar_one_or_none() is not None:
            return {"message": "Refund already recorded"}

        refund_reference = make_refund_reference()
        refund_record = Refund(
            booking_id=payment.booking_id,
            payment_id=payment.id,
            refund_reference=refund_reference,
            amount=amount_refunded,
            currency=payment.currency,
            refund_status=RefundStatus.PROCESSED.value,
            processed_at=datetime.now(timezone.utc),
        )
        self.session.add(refund_record)

        total_refunded_result = await self.session.execute(
            select(func.coalesce(func.sum(Refund.amount), 0)).where(Refund.payment_id == payment.id)
        )
        total_refunded = float(total_refunded_result.scalar_one())

        if total_refunded >= float(payment.amount):
            payment.payment_status = PaymentStatus.REFUNDED.value

        await self.session.flush()
        return {"refund_reference": refund_reference, "total_refunded": total_refunded}

    # ------------------------------------------------------------------
    # 6. Payment History
    # ------------------------------------------------------------------
    async def get_payment_history(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(BookingPayment)
            .join(NamoBooking, NamoBooking.id == BookingPayment.booking_id, isouter=True)
            .join(Donation, Donation.id == BookingPayment.donation_id, isouter=True)
            .where(
                (NamoBooking.user_id == user_id) | (Donation.user_id == user_id)
            )
            .order_by(BookingPayment.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        payments = result.scalars().all()

        return [
            {
                "id": p.id,
                "payment_reference": p.payment_reference,
                "amount": float(p.amount),
                "currency": p.currency,
                "payment_status": p.payment_status,
                "provider": p.provider,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in payments
        ]

    # ------------------------------------------------------------------
    # 7. Payment Details
    # ------------------------------------------------------------------
    async def get_payment_details(self, payment_id: str) -> dict[str, Any]:
        result = await self.session.execute(
            select(BookingPayment).where(BookingPayment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        if payment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        refunds_result = await self.session.execute(
            select(Refund).where(Refund.payment_id == payment.id).order_by(Refund.created_at.desc())
        )
        refunds = refunds_result.scalars().all()

        return {
            "id": payment.id,
            "payment_reference": payment.payment_reference,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "payment_status": payment.payment_status,
            "provider": payment.provider,
            "external_id": payment.external_id,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
            "created_at": payment.created_at.isoformat(),
            "refunds": [
                {
                    "id": r.id,
                    "refund_reference": r.refund_reference,
                    "amount": float(r.amount),
                    "currency": r.currency,
                    "refund_status": r.refund_status,
                    "reason": r.reason,
                    "processed_at": r.processed_at.isoformat() if r.processed_at else None,
                }
                for r in refunds
            ],
        }

    # ------------------------------------------------------------------
    # 8. Donation Payment
    # ------------------------------------------------------------------
    async def create_donation_payment(
        self,
        donation_id: str,
        amount: float,
        currency: str,
    ) -> dict[str, Any]:
        donation = await self.session.get(Donation, donation_id)
        if donation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")

        frontend_url = settings.frontend_url.rstrip("/")
        success_url = f"{frontend_url}/donations/{donation_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/donations/{donation_id}/cancel"

        metadata = {
            "donation_id": donation_id,
            "temple_id": donation.temple_id,
            "donor_name": donation.donor_name,
            "purpose": donation.purpose or "",
        }

        return await self.create_checkout_session(amount, currency, metadata, success_url, cancel_url)

    # ------------------------------------------------------------------
    # 9. Booking Payment
    # ------------------------------------------------------------------
    async def create_booking_payment(
        self,
        booking_id: str,
        amount: float,
        currency: str,
    ) -> dict[str, Any]:
        booking = await self.session.get(NamoBooking, booking_id)
        if booking is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        frontend_url = settings.frontend_url.rstrip("/")
        success_url = f"{frontend_url}/bookings/{booking_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/bookings/{booking_id}/cancel"

        metadata = {
            "booking_id": booking_id,
            "temple_id": booking.temple_id,
            "booking_number": booking.booking_number,
        }

        return await self.create_checkout_session(amount, currency, metadata, success_url, cancel_url)

    # ------------------------------------------------------------------
    # 10. MODIT Order Payment
    # ------------------------------------------------------------------
    async def create_order_payment(
        self,
        order_id: str,
        amount: float,
        currency: str,
    ) -> dict[str, Any]:
        from backend.app.models.modit import Order

        order = await self.session.get(Order, order_id)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        frontend_url = settings.frontend_url.rstrip("/")
        success_url = f"{frontend_url}/orders/{order_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/orders/{order_id}/cancel"

        metadata = {
            "order_id": order_id,
            "organization_id": order.organization_id,
            "order_number": order.order_number,
        }

        stripe_amount = amount_to_stripe(amount, currency)

        body = {
            "mode": "payment",
            "amount": str(stripe_amount),
            "currency": currency.lower(),
            "success_url": success_url,
            "cancel_url": cancel_url,
        }

        for key, value in metadata.items():
            body[f"metadata[{key}]"] = value

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{STRIPE_BASE_URL}/checkout/sessions", headers=_auth_headers(), data=body)

        if resp.status_code != 200:
            detail = resp.json().get("error", {}).get("message", resp.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe error: {detail}")

        data = resp.json()
        payment_reference = make_payment_reference("MODIT")

        modit_payment = ModitPayment(
            organization_id=order.organization_id,
            purchase_order_id=order.purchase_order_id,
            payment_reference=payment_reference,
            payment_status=PaymentStatus.PENDING.value,
            amount=amount,
            currency=currency,
            transaction_type=TransactionType.DEBIT.value,
        )
        self.session.add(modit_payment)
        await self.session.flush()

        return {
            "session_id": data["id"],
            "url": data["url"],
            "payment_reference": payment_reference,
        }
