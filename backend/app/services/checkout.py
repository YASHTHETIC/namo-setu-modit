"""Real B2C checkout: the server is the source of truth.

Prices, GST, shipping and coupons are computed here from the synced retail
catalog — the client only sends SKUs + quantities. Unknown SKUs, tampered
prices and short stock fail loudly (400/404) instead of a fake success.

Companion seeder: backend/app/seeders/catalog.py (must run at least once).
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
from datetime import date, datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.modit import (
    Category,
    CreditAccount,
    GST,
    Inventory,
    ModitNotification,
    ModitPayment,
    Order,
    OrderItem,
    Organization,
    OrganizationUser,
    PlatformCoupon,
    Product,
    PurchaseOrder,
)
from backend.app.models.user import User
from backend.app.schemas.modit import CheckoutRequest, CheckoutResponse
from backend.app.services.modit import make_modit_reference

RETAIL_ORG_NAME = "MODIT Retail"
FREE_SHIPPING_THRESHOLD = 5000.0
FLAT_SHIPPING_FEE = 250.0
DEFAULT_GST_RATE = 18.0


def money(value: float) -> float:
    """Ledger rounding — always half-up (₹ convention). Python's builtin
    round() is banker's rounding, which can drift totals by a paisa against
    the frontend and payment gateway amounts."""
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

# Mirror of the storefront's built-in coupons — used only while the
# platform_coupons table has no rows (e.g. a DB that hasn't run the
# 20261022_0001 seed). Once admin-managed rows exist they are the truth.
BUILT_IN_COUPONS: tuple[dict, ...] = (
    {"code": "FIRST100", "type": "flat", "value": 100.0, "max": None, "min_order": 1000.0, "till": "2026-12-31", "category": None},
    {"code": "BULK10", "type": "percent", "value": 10.0, "max": 500.0, "min_order": 5000.0, "till": "2026-12-31", "category": None},
    {"code": "CEMENT50", "type": "flat", "value": 50.0, "max": None, "min_order": 2000.0, "till": "2026-12-31", "category": "cement"},
    {"code": "PAINT15", "type": "percent", "value": 15.0, "max": 300.0, "min_order": 1000.0, "till": "2026-12-31", "category": "painting"},
    {"code": "FREESHIP", "type": "ship", "value": 0.0, "max": None, "min_order": 0.0, "till": "2026-12-31", "category": None},
    {"code": "DIWALI20", "type": "percent", "value": 20.0, "max": 400.0, "min_order": 1500.0, "till": "2026-11-30", "category": "tiling"},
    {"code": "LIGHT200", "type": "flat", "value": 200.0, "max": None, "min_order": 3000.0, "till": "2026-12-31", "category": "lighting"},
)


def _validate_coupon_rows(
    rows: list[dict], code: str, subtotal: float, category_slugs: set[str], today: date
) -> tuple[float, bool]:
    """Shared coupon rules. `rows` carry the same keys as BUILT_IN_COUPONS
    plus optional usage_limit/used_count (DB-backed rows)."""
    coupon = next((c for c in rows if c["code"] == code.strip().upper()), None)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown coupon code: {code}")
    if today.isoformat() > coupon["till"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Coupon {coupon['code']} has expired")
    if subtotal < coupon["min_order"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon {coupon['code']} needs a minimum order of ₹{coupon['min_order']:,.0f}",
        )
    if coupon.get("category") and coupon["category"] not in category_slugs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon {coupon['code']} applies to {coupon['category']} products only",
        )
    used_count = coupon.get("used_count") or 0
    usage_limit = coupon.get("usage_limit")
    if usage_limit is not None and used_count >= usage_limit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Coupon {coupon['code']} usage limit reached")
    if coupon["type"] == "flat":
        return money(min(coupon["value"], subtotal)), False
    if coupon["type"] == "percent":
        disc = money(subtotal * coupon["value"] / 100)
        if coupon["max"] is not None:
            disc = min(disc, money(float(coupon["max"])))
        return disc, False
    return 0.0, True  # free shipping


def validate_coupon(
    code: str | None, subtotal: float, category_slugs: set[str], today: date | None = None
) -> tuple[float, bool]:
    """Return (discount_amount, free_shipping). Raises 400 on invalid coupons."""
    if not code:
        return 0.0, False
    today = today or date.today()
    rows = [dict(c) for c in BUILT_IN_COUPONS]
    return _validate_coupon_rows(rows, code, subtotal, category_slugs, today)


async def validate_coupon_db(
    session: AsyncSession, code: str | None, subtotal: float, category_slugs: set[str], today: date | None = None
) -> tuple[float, bool, str | None]:
    """Checkout validation: admin-managed platform_coupons first, built-in
    mirror while the table is empty. Returns the matched coupon row id so
    place_checkout_order can count usage."""
    if not code:
        return 0.0, False, None
    today = today or date.today()
    rows: list[dict] = []
    row_ids: dict[str, str] = {}
    try:
        result = await session.execute(
            select(PlatformCoupon).where(
                PlatformCoupon.is_active.is_(True), PlatformCoupon.deleted_at.is_(None)
            )
        )
        for c in result.scalars().all():
            normalized = {
                "code": str(getattr(c, "code", "") or "").upper(),
                "type": str(getattr(c, "discount_type", "") or "").lower(),
                "value": float(getattr(c, "discount_value", 0) or 0),
                "max": getattr(c, "max_discount", None),
                "min_order": float(getattr(c, "min_order", 0) or 0),
                "till": getattr(c, "valid_till", None).isoformat() if getattr(c, "valid_till", None) else "9999-12-31",
                "category": getattr(c, "category", None),
                "usage_limit": getattr(c, "usage_limit", None),
                "used_count": getattr(c, "used_count", 0) or 0,
            }
            if normalized["code"] and normalized["type"] in ("flat", "percent", "ship"):
                rows.append(normalized)
                row_ids[normalized["code"]] = getattr(c, "id", None)
    except Exception:
        # Table not migrated yet / read issues → fall back to built-ins.
        rows = []
    if rows:
        discount, free_ship = _validate_coupon_rows(rows, code, subtotal, category_slugs, today)
        return discount, free_ship, row_ids.get(code.strip().upper())
    discount, free_ship = validate_coupon(code, subtotal, category_slugs, today)
    return discount, free_ship, None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def get_or_create_personal_org(session: AsyncSession, user: User) -> Organization:
    """Every buyer gets one personal org so orders/payments stay isolated."""
    membership = (
        (
            await session.execute(
                select(OrganizationUser).where(
                    OrganizationUser.user_id == user.id,
                    OrganizationUser.role_name == "owner",
                )
            )
        )
        .scalars()
        .first()
    )
    if membership is not None:
        org = await session.get(Organization, membership.organization_id)
        if org is not None:
            return org
    display = (getattr(user, "full_name", None) or getattr(user, "email", "customer")).strip() or "customer"
    if "@" in display and not getattr(user, "full_name", None):
        display = display.split("@")[0]
    org = Organization(
        id=str(uuid4()),
        owner_user_id=user.id,
        name=f"{display} (Individual)",
        organization_type="customer",
        is_active=True,
    )
    session.add(org)
    await session.flush()
    session.add(
        OrganizationUser(
            id=str(uuid4()),
            organization_id=org.id,
            user_id=user.id,
            role_name="owner",
            is_primary=True,
        )
    )
    await session.flush()
    return org


async def _get_retail_org(session: AsyncSession) -> Organization:
    org = (
        (await session.execute(select(Organization).where(Organization.name == RETAIL_ORG_NAME)))
        .scalars()
        .first()
    )
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Store catalog is not synced yet. Please try again later.",
        )
    return org


async def compute_checkout_totals(
    session: AsyncSession, payload: CheckoutRequest
) -> dict:
    """Validate SKUs against the retail catalog and compute server-side totals."""
    org = await _get_retail_org(session)
    lines: list[dict] = []
    category_slugs: set[str] = set()
    subtotal = 0.0
    gst_total = 0.0
    for item in payload.items:
        product = (
            (
                await session.execute(
                    select(Product).where(
                        Product.organization_id == org.id,
                        Product.sku == item.sku,
                        Product.is_active.is_(True),
                        Product.deleted_at.is_(None),
                    )
                )
            )
            .scalars()
            .first()
        )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown product SKU: {item.sku}"
            )
        rate = DEFAULT_GST_RATE
        if getattr(product, "gst_id", None):
            gst = await session.get(GST, product.gst_id)
            if gst is not None:
                try:
                    rate = float(getattr(gst, "rate_percent", None) or DEFAULT_GST_RATE)
                except (TypeError, ValueError):
                    rate = DEFAULT_GST_RATE
        category = await session.get(Category, product.category_id)
        category_slug = getattr(category, "slug", "") or ""
        if category_slug:
            category_slugs.add(category_slug)
        try:
            unit_price = money(float(getattr(product, "list_price", 0) or 0))
        except (TypeError, ValueError):
            unit_price = 0.0
        if unit_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item.sku} is not priced for sale",
            )
        line_total = money(unit_price * float(item.quantity))
        gst_amount = money(line_total * rate / 100)
        subtotal += line_total
        gst_total += gst_amount
        lines.append(
            {
                "product": product,
                "sku": getattr(product, "sku", None) or item.sku,
                "name": getattr(product, "name", None) or item.sku,
                "quantity": float(item.quantity),
                "unit_price": unit_price,
                "gst_amount": gst_amount,
                "line_total": line_total,
            }
        )
    subtotal = money(subtotal)
    gst_total = money(gst_total)
    discount, free_ship, coupon_row_id = await validate_coupon_db(session, payload.coupon_code, subtotal, category_slugs)
    shipping = 0.0 if (free_ship or (subtotal - discount) >= FREE_SHIPPING_THRESHOLD) else FLAT_SHIPPING_FEE
    grand = money(subtotal - discount + shipping + gst_total)
    return {
        "retail_org": org,
        "lines": lines,
        "category_slugs": category_slugs,
        "subtotal": subtotal,
        "discount_total": discount,
        "shipping_total": shipping,
        "gst_total": gst_total,
        "grand_total": grand,
        "coupon_row_id": coupon_row_id,
    }


async def _decrement_inventory(session: AsyncSession, product_id: str, quantity: float) -> None:
    rows = (
        (
            await session.execute(
                # Row lock so two concurrent checkouts of the same SKU cannot
                # both pass the availability check and oversell (lost update).
                select(Inventory).where(Inventory.product_id == product_id).with_for_update()
            )
        )
        .scalars()
        .all()
    )
    if not rows:
        return  # made-to-order / untracked product
    available = sum(r.quantity_on_hand for r in rows)
    if available < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock (only {available:g} available)",
        )
    remaining = quantity
    for row in sorted(rows, key=lambda r: r.quantity_on_hand, reverse=True):
        if remaining <= 0:
            break
        take = min(row.quantity_on_hand, remaining)
        row.quantity_on_hand -= take
        remaining -= take


async def _require_credit_approval(session: AsyncSession, organization_id: str, grand_total: float) -> None:
    """Net-30 needs an active credit account covering the order. Fail loudly otherwise."""
    stmt = (
        select(CreditAccount)
        .where(CreditAccount.organization_id == organization_id, CreditAccount.is_active.is_(True))
        .limit(1)
    )
    account = (await session.execute(stmt)).scalars().first()
    if account is None or float(account.available_credit) < float(grand_total):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business credit needs approval for this account. Use COD/UPI or contact support@modit.in for Net-30 terms.",
        )


async def _find_order_by_reference(session: AsyncSession, organization_id: str, ref: str) -> Order | None:
    """Idempotency lookup: same buyer org + same client reference = same order."""
    stmt = (
        select(Order)
        .where(Order.organization_id == organization_id, Order.client_reference == ref)
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first()


async def _stored_checkout_response(session: AsyncSession, order: Order) -> CheckoutResponse:
    """Rebuild a placement response from stored rows (retry-safe replays)."""
    po = await session.get(PurchaseOrder, order.purchase_order_id) if order.purchase_order_id else None
    pay_stmt = select(ModitPayment).where(ModitPayment.order_id == order.id).limit(1)
    payment = (await session.execute(pay_stmt)).scalars().first()
    item_stmt = select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id)
    rows = (await session.execute(item_stmt)).scalars().all()
    items = []
    for row in rows:
        product = await session.get(Product, row.product_id)
        items.append(
            {
                "product_id": row.product_id,
                "sku": getattr(product, "sku", None) or row.product_id,
                "name": getattr(product, "name", None) or row.product_id,
                "quantity": float(row.quantity),
                "unit_price": float(row.unit_price),
                "gst_amount": float(row.gst_amount),
                "line_total": float(row.line_total),
            }
        )
    try:
        totals = json.loads(order.totals_json) if order.totals_json else {}
    except (TypeError, ValueError):
        totals = {}
    return CheckoutResponse(
        id=order.id,
        order_number=order.order_number,
        purchase_order_id=order.purchase_order_id or "",
        status=order.status,
        subtotal=float(totals.get("subtotal", 0.0)),
        discount_total=float(totals.get("discount_total", 0.0)),
        shipping_total=float(totals.get("shipping_total", 0.0)),
        gst_total=float(totals.get("gst_total", 0.0)),
        grand_total=float((po.total_amount if po is not None else totals.get("grand_total", 0.0)) or 0.0),
        payment_id=payment.id if payment else "",
        payment_status=payment.payment_status if payment else "pending",
        payment_reference=payment.payment_reference if payment else "",
        items=items,
    )


async def place_checkout_order(
    session: AsyncSession, user: User, payload: CheckoutRequest
) -> CheckoutResponse:
    """Create PO + Order + items + payment atomically. Returns server totals."""
    computed = await compute_checkout_totals(session, payload)
    org = await get_or_create_personal_org(session, user)

    # Retry-safe: same buyer + same reference replays the stored order.
    ref = (getattr(payload, "client_reference", None) or "").strip() or None
    if ref:
        existing = await _find_order_by_reference(session, org.id, ref)
        if existing is not None:
            return await _stored_checkout_response(session, existing)

    if str(getattr(payload, "payment_method", "cod") or "cod").lower() == "credit":
        await _require_credit_approval(session, org.id, computed["grand_total"])

    now = _utcnow()

    po = PurchaseOrder(
        id=str(uuid4()),
        organization_id=org.id,
        order_number=make_modit_reference("PO"),
        status="placed",
        order_date=now.date(),
        total_amount=computed["grand_total"],
    )
    session.add(po)
    await session.flush()

    address_json = None
    if payload.address_snapshot:
        try:
            address_json = json.dumps(payload.address_snapshot)[:4000]
        except (TypeError, ValueError):
            address_json = None

    order = Order(
        id=str(uuid4()),
        organization_id=org.id,
        purchase_order_id=po.id,
        order_number=make_modit_reference("ORD"),
        status="placed",
        placed_at=now,
        notes=payload.notes,
        shipping_address_json=address_json,
        gstin=(payload.gstin or None),
        client_reference=ref,
        totals_json=json.dumps(
            {
                "subtotal": computed["subtotal"],
                "discount_total": computed["discount_total"],
                "shipping_total": computed["shipping_total"],
                "gst_total": computed["gst_total"],
                "grand_total": computed["grand_total"],
            }
        ),
    )
    session.add(order)
    await session.flush()

    item_reads = []
    for line in computed["lines"]:
        await _decrement_inventory(session, line["product"].id, line["quantity"])
        order_item = OrderItem(
            id=str(uuid4()),
            order_id=order.id,
            purchase_order_id=po.id,
            product_id=line["product"].id,
            quantity=line["quantity"],
            unit_price=line["unit_price"],
            gst_amount=line["gst_amount"],
            line_total=line["line_total"],
        )
        session.add(order_item)
        item_reads.append(
            {
                "product_id": line["product"].id,
                "sku": line["sku"],
                "name": line["name"],
                "quantity": line["quantity"],
                "unit_price": line["unit_price"],
                "gst_amount": line["gst_amount"],
                "line_total": line["line_total"],
            }
        )

    payment = ModitPayment(
        id=str(uuid4()),
        organization_id=org.id,
        purchase_order_id=po.id,
        order_id=order.id,
        payment_reference=make_modit_reference("PAY"),
        payment_status="pending",
        amount=computed["grand_total"],
        currency="INR",
        transaction_type="debit",
    )
    session.add(payment)

    # Count coupon usage on the admin-managed row (built-in mirror codes
    # have no row — nothing to count).
    coupon_row_id = computed.get("coupon_row_id")
    if coupon_row_id:
        coupon_row = await session.get(PlatformCoupon, coupon_row_id)
        if coupon_row is not None:
            coupon_row.used_count = int(getattr(coupon_row, "used_count", 0) or 0) + 1

    # Staff see the order in admin immediately (same transaction).
    await _notify_staff_new_order(session, computed["retail_org"].id, order, computed["grand_total"])
    try:
        await session.commit()
    except IntegrityError as exc:
        # Lost a double-tap race on client_reference: replay the winner.
        await session.rollback()
        if ref and "client_reference" in str(getattr(exc, "orig", exc)):
            existing = await _find_order_by_reference(session, org.id, ref)
            if existing is not None:
                return await _stored_checkout_response(session, existing)
        raise

    # Customer email is fire-and-forget (SMTP must never slow checkout).
    customer_email = getattr(user, "email", None)
    if customer_email:
        lines_html = "".join(
            f"<li>{it['name']} × {it['quantity']:g} — ₹{it['line_total']:,.0f}</li>" for it in item_reads
        )
        try:
            asyncio.get_running_loop().create_task(
                _send_order_email(
                    customer_email,
                    f"Order confirmed: {order.order_number}",
                    f"<p>Hi, your MODIT order <b>{order.order_number}</b> is confirmed.</p>"
                    f"<ul>{lines_html}</ul>"
                    f"<p><b>Amount due: ₹{computed['grand_total']:,.0f}</b></p>"
                    f"<p>Track it anytime from Orders in the app.</p>",
                )
            )
        except RuntimeError:
            pass  # no running loop (e.g. scripts) — skip silently

    return CheckoutResponse(
        id=order.id,
        order_number=order.order_number,
        purchase_order_id=po.id,
        status=order.status,
        subtotal=computed["subtotal"],
        discount_total=computed["discount_total"],
        shipping_total=computed["shipping_total"],
        gst_total=computed["gst_total"],
        grand_total=computed["grand_total"],
        payment_id=payment.id,
        payment_status=payment.payment_status,
        payment_reference=payment.payment_reference,
        items=item_reads,
    )


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    """HMAC-SHA256(order_id|payment_id) check. Pure — unit tested."""
    if not all([order_id, payment_id, signature, secret]):
        return False
    expected = hmac.new(
        secret.encode("utf-8"), f"{order_id}|{payment_id}".encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


logger = logging.getLogger(__name__)


async def _send_order_email(to: str | None, subject: str, html_body: str) -> None:
    """Best-effort only — never raises, never blocks checkout."""
    if not to:
        return
    try:
        from backend.app.services.email_service import EmailService

        await EmailService().send_email(to, subject, html_body, html=True)
    except Exception as exc:
        logger.warning("order email failed (non-fatal): %s", exc)


async def _notify_staff_new_order(session: AsyncSession, retail_org_id: str, order: Order, grand_total: float) -> None:
    """In-app notification for every staff member. Swallowed on error."""
    try:
        from backend.app.models.user import Role, User

        staff = (
            (
                await session.execute(
                    select(User)
                    .join(User.roles)
                    .where(Role.name.in_(["super_admin", "admin"]), User.is_active.is_(True))
                )
            )
            .scalars()
            .all()
        )
        for member in staff:
            session.add(
                ModitNotification(
                    id=str(uuid4()),
                    organization_id=retail_org_id,
                    user_id=getattr(member, "id", None),
                    channel="in_app",
                    title=f"New order {order.order_number}",
                    body=f"₹{grand_total:,.0f} · {order.order_number} placed. Dispatch from Purchases.",
                    status="queued",
                )
            )
    except Exception as exc:
        logger.warning("staff order notification failed (non-fatal): %s", exc)
