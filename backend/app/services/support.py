"""Order-context support chat with rule-based bot auto-replies.

The bot answers instantly for the common cases (tracking, refunds, payments,
coupons, escalation) and always includes live order context when the thread
is linked to an order. Human handoff = status stays open for the support team.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.modit import Order, SupportConversation, SupportMessage

SENDER_USER = "user"
SENDER_BOT = "bot"
SENDER_AGENT = "agent"


def generate_bot_reply(body: str | None, order_status: str | None = None) -> str:
    """Pure rule matcher: message text (+ optional order status) -> reply."""
    text = (body or "").lower()
    order_bit = (
        f" Your order is currently '{order_status}'." if order_status else " Share your order ID and I'll pull its live status."
    )

    def has(*keywords: str) -> bool:
        return any(k in text for k in keywords)

    if has("refund", "return", "replace", "damag", "broken", "wrong item", "missing item"):
        return (
            "For damaged, wrong, or missing items, raise a return from Orders > Return and we'll "
            f"arrange a refund to the original payment method.{order_bit}"
        )
    if has("track", "where", "status", "deliver", "arriv", "late", "delay", "rider", "driver"):
        if order_status in ("dispatched", "in_transit"):
            return (
                "Your order is on the way — open Track Order for the rider's live location and ETA."
            )
        return f"I can check that for you.{order_bit}"
    if has("pay", "upi", "cod", "invoice", "gst", "bill", "charg", "debited"):
        return (
            "Payments: UPI, cards, and COD with OTP verification are supported, and GST invoices "
            "are attached to every order under Orders > Invoice. If money was debited but no order "
            "was created, it auto-refunds within 5-7 business days."
        )
    if has("coupon", "discount", "offer", "promo", "wallet", "point"):
        return (
            "Apply one coupon per order on the checkout screen; wallet balance and loyalty points "
            "can be combined with it. Expired or inapplicable codes show the exact reason at checkout."
        )
    if has("human", "agent", "call", "phone", "complaint", "escalat"):
        return (
            "I've flagged this thread for our support team — an agent will reply here shortly. "
            "For urgent site-delivery issues, keep your order number handy."
        )
    return (
        "Thanks for reaching out! Ask me about tracking, refunds/returns, payments and GST "
        f"invoices, or coupons — or type 'agent' to reach a human.{order_bit}"
    )


async def create_conversation(
    session: AsyncSession,
    user_id: str,
    subject: str,
    order_id: str | None = None,
) -> SupportConversation:
    conversation = SupportConversation(user_id=user_id, order_id=order_id, subject=subject, status="open")
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def list_conversations(session: AsyncSession, user_id: str) -> list[SupportConversation]:
    result = await session.execute(
        select(SupportConversation)
        .where(SupportConversation.user_id == user_id, SupportConversation.deleted_at.is_(None))
        .order_by(SupportConversation.created_at.desc())
    )
    return list(result.scalars().all())


async def _get_owned_conversation(
    session: AsyncSession, user_id: str, conversation_id: str
) -> SupportConversation:
    conversation = await session.get(SupportConversation, conversation_id)
    if conversation is None or getattr(conversation, "user_id", None) != user_id:
        # 404 (not 403) so conversation IDs can't be probed across users.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


async def get_conversation_detail(
    session: AsyncSession, user_id: str, conversation_id: str
) -> tuple[SupportConversation, list[SupportMessage]]:
    conversation = await _get_owned_conversation(session, user_id, conversation_id)
    result = await session.execute(
        select(SupportMessage)
        .where(SupportMessage.conversation_id == conversation.id)
        .order_by(SupportMessage.created_at.asc())
    )
    return conversation, list(result.scalars().all())


async def post_user_message(
    session: AsyncSession, user_id: str, conversation_id: str, body: str
) -> tuple[SupportMessage, SupportMessage]:
    """Store the user message and an instant bot reply. Returns (user, bot)."""
    conversation = await _get_owned_conversation(session, user_id, conversation_id)
    user_message = SupportMessage(conversation_id=conversation.id, sender=SENDER_USER, body=body)
    session.add(user_message)

    order_status: str | None = None
    order_id = getattr(conversation, "order_id", None)
    if order_id:
        order = await session.get(Order, order_id)
        if order is not None:
            order_status = getattr(order, "status", None)

    bot_message = SupportMessage(
        conversation_id=conversation.id,
        sender=SENDER_BOT,
        body=generate_bot_reply(body, order_status=order_status),
    )
    session.add(bot_message)
    await session.commit()
    await session.refresh(user_message)
    await session.refresh(bot_message)
    return user_message, bot_message
