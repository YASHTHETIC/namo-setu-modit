"""Blinkit-style seller surface: a supplier login sees ONLY their own data.

Suppliers are NOT staff (see api/deps.py — the supplier role is deliberately
absent from STAFF_ROLE_NAMES), so none of the staff-gated admin routes open
for them. Everything here is scoped by suppliers.user_id -> users.id.
"""

from __future__ import annotations

import json as jsonlib
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import require_permission, require_supplier
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.core.security import hash_password
from backend.app.models.enums import OrderStatus, ProductCode, QuotationStatus, RFQStatus
from backend.app.services.audit_service import create_audit_log
from backend.app.models.modit import (
    GST,
    Order,
    OrderItem,
    Organization,
    Product,
    Quotation,
    QuotationItem,
    RFQ,
    RFQItem,
    Supplier,
)
from backend.app.models.user import Role, User
from backend.app.schemas.modit import RFQQuoteRequest, SupplierRFQRead
from backend.app.services.checkout import DEFAULT_GST_RATE

router = APIRouter(prefix="/supplier", tags=["supplier"])

# Orders that still count toward revenue / payouts.
REVENUE_STATUSES = {
    OrderStatus.PLACED.value,
    OrderStatus.ACCEPTED.value,
    OrderStatus.PACKED.value,
    OrderStatus.DISPATCHED.value,
    OrderStatus.DELIVERED.value,
}


def _fnum(value: object, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


async def get_my_supplier(user: User, db: AsyncSession) -> Supplier:
    """The supplier profile linked to this login (404 with guidance)."""
    result = await db.execute(select(Supplier).where(Supplier.user_id == user.id))
    supplier = result.scalars().first()
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supplier profile linked to this login — ask an administrator to link one.",
        )
    return supplier


class SupplierMe(BaseModel):
    id: str
    supplier_code: str
    organization_id: str | None = None
    is_verified: bool = False
    product_count: int = 0


class SupplierProduct(BaseModel):
    id: str
    sku: str | None = None
    name: str | None = None
    slug: str | None = None
    list_price: float = 0.0
    mrp: float | None = None
    is_active: bool = True
    approval_status: str | None = None


class SupplierProductList(BaseModel):
    items: list[SupplierProduct] = []
    total: int = 0
    page: int = 1
    page_size: int = 50


class SupplierOrderLine(BaseModel):
    product_name: str | None = None
    sku: str | None = None
    quantity: float = 0.0
    unit_price: float = 0.0
    line_total: float = 0.0


class SupplierOrder(BaseModel):
    id: str
    order_number: str | None = None
    status: str | None = None
    placed_at: datetime | None = None
    lines: list[SupplierOrderLine] = []
    my_total: float = 0.0


class SupplierSummary(BaseModel):
    supplier_code: str
    is_verified: bool = False
    product_count: int = 0
    active_product_count: int = 0
    order_count: int = 0
    revenue: float = 0.0
    payable: float = 0.0


class SupplierPayout(BaseModel):
    order_id: str
    order_number: str | None = None
    status: str | None = None
    amount: float = 0.0
    state: str = "pending"
    placed_at: datetime | None = None


def _to_product(p: Product) -> SupplierProduct:
    return SupplierProduct(
        id=str(getattr(p, "id", "")),
        sku=getattr(p, "sku", None),
        name=getattr(p, "name", None),
        slug=getattr(p, "slug", None),
        list_price=_fnum(getattr(p, "list_price", 0.0)),
        mrp=getattr(p, "mrp", None),
        is_active=bool(getattr(p, "is_active", True)),
        approval_status=getattr(p, "approval_status", None),
    )


async def _my_order_items(supplier: Supplier, db: AsyncSession) -> list[OrderItem]:
    """All order lines for this supplier's catalog — supplier filter runs in
    SQL (was a full-table scan + per-row db.get). Fake compatibility: the
    test double ignores SQL filters, so rival rows are still dropped here."""
    result = await db.execute(
        select(OrderItem)
        .join(Product, Product.id == OrderItem.product_id)
        .where(Product.supplier_id == supplier.id)
        .order_by(OrderItem.created_at.desc())
        .limit(2000)
    )
    items = list(result.scalars().all())
    product_ids = [getattr(item, "product_id", None) for item in items if getattr(item, "product_id", None)]
    products: dict[str, Product] = {}
    if product_ids:
        rows = await db.execute(select(Product).where(Product.id.in_(product_ids)))
        products = {p.id: p for p in rows.scalars().all()}
        # Missing ids (soft-deleted rows, exotic doubles): cheap per-id fallback.
        for pid in product_ids:
            if pid not in products:
                got = await db.get(Product, pid)
                if got is not None:
                    products[str(getattr(got, "id", pid))] = got
    mine: list[OrderItem] = []
    for item in items:
        product = products.get(getattr(item, "product_id", None))
        if product is not None and str(getattr(product, "supplier_id", "")) == str(supplier.id):
            # Stash the resolved product so callers never re-query.
            setattr(item, "_supplier_product", product)
            mine.append(item)
    return mine


async def _orders_by_id(db: AsyncSession, items: list[OrderItem]) -> dict[str, Order]:
    """Batched order lookup for order lines (one query, no per-line get).
    Ids the batch misses (soft delete, test doubles) fall back to db.get."""
    order_ids = [getattr(item, "order_id", None) for item in items if getattr(item, "order_id", None)]
    if not order_ids:
        return {}
    rows = await db.execute(select(Order).where(Order.id.in_(order_ids)))
    orders = {o.id: o for o in rows.scalars().all()}
    missing = {oid for oid in order_ids if str(oid) not in orders}
    for oid in missing:
        got = await db.get(Order, oid)
        if got is not None:
            orders[str(getattr(got, "id", oid))] = got
    return orders


async def _my_orders(supplier: Supplier, db: AsyncSession) -> list[SupplierOrder]:
    grouped: dict[str, SupplierOrder] = {}
    lines = await _my_order_items(supplier, db)
    orders = await _orders_by_id(db, lines)
    for item in lines:
        order = orders.get(getattr(item, "order_id", None))
        if order is None:
            continue
        status_value = getattr(order, "status", None)
        if status_value == OrderStatus.CANCELLED.value:
            continue
        key = str(getattr(order, "id", ""))
        product = getattr(item, "_supplier_product", None)
        line = SupplierOrderLine(
            product_name=getattr(product, "name", None),
            sku=getattr(product, "sku", None),
            quantity=_fnum(getattr(item, "quantity", 0.0)),
            unit_price=_fnum(getattr(item, "unit_price", 0.0)),
            line_total=_fnum(getattr(item, "line_total", 0.0)),
        )
        entry = grouped.get(key)
        if entry is None:
            entry = SupplierOrder(
                id=key,
                order_number=getattr(order, "order_number", None),
                status=status_value,
                placed_at=getattr(order, "placed_at", None),
            )
            grouped[key] = entry
        entry.lines.append(line)
        entry.my_total += line.line_total
    return sorted(grouped.values(), key=lambda o: str(o.placed_at or ""), reverse=True)


def require_verified_supplier():
    """Supplier login whose business profile is verified (approved).

    /me stays on the role-only gate so pending suppliers can see their
    application status; every data surface requires verification.
    """

    async def dependency(
        user: User = Depends(require_supplier()),
        db: AsyncSession = Depends(get_db),
    ) -> Supplier:
        supplier = await get_my_supplier(user, db)
        if not supplier.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier application under review - the hub unlocks after verification.",
            )
        return supplier

    return dependency


class SupplierApplyRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    contact_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(pattern=r"^\d{10}$")
    password: str = Field(min_length=8, max_length=128)
    gstin: str = Field(pattern=r"^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$")
    pan: str = Field(pattern=r"^[A-Z]{5}\d{4}[A-Z]$")
    city: str = Field(min_length=2, max_length=80)
    pincode: str = Field(pattern=r"^\d{6}$")
    categories: list[str] = Field(min_length=1, max_length=20)
    brands: list[str] = Field(default_factory=list, max_length=20)


class SupplierApplyResponse(BaseModel):
    supplier_id: str
    supplier_code: str
    status: str = "pending"


class SupplierApplicationRead(BaseModel):
    supplier_id: str
    supplier_code: str
    business_name: str
    contact_name: str
    email: str
    phone: str
    gstin: str
    pan: str
    city: str
    pincode: str
    categories: list[str] = []
    brands: list[str] = []
    status: str = "pending"


class ApplicationDecision(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")


def _application_settings(org: Organization | None) -> dict:
    if org is None:
        return {}
    try:
        data = jsonlib.loads(getattr(org, "settings_json", None) or "{}")
    except (TypeError, ValueError):
        data = {}
    return data if isinstance(data, dict) else {}


def _to_application(supplier: Supplier, org: Organization | None, user: User | None) -> SupplierApplicationRead:
    settings = _application_settings(org)
    brands = settings.get("brands", [])
    categories = settings.get("categories", [])
    return SupplierApplicationRead(
        supplier_id=str(supplier.id),
        supplier_code=supplier.supplier_code,
        business_name=getattr(org, "name", "") or "",
        contact_name=getattr(user, "full_name", "") or "",
        email=getattr(user, "email", "") or "",
        phone=str(settings.get("phone", "")),
        gstin=getattr(org, "gst_number", "") or "",
        pan=getattr(org, "pan_number", "") or "",
        city=str(settings.get("city", "")),
        pincode=str(settings.get("pincode", "")),
        categories=list(categories) if isinstance(categories, list) else [],
        brands=list(brands) if isinstance(brands, list) else [],
        status=str(settings.get("status", "pending")),
    )


@router.post("/apply", response_model=SupplierApplyResponse, status_code=status.HTTP_201_CREATED)
async def supplier_apply(payload: SupplierApplyRequest, db: AsyncSession = Depends(get_db)) -> SupplierApplyResponse:
    """Public supplier application (Seller-Hub style intake).

    Creates a supplier login + unverified business profile. The hub stays
    locked until staff approve (PATCH /supplier/applications/{id}).
    """
    email = str(payload.email).lower().strip()
    if (await db.execute(select(User).where(User.email == email))).scalars().first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered - log in instead.")
    gstin = payload.gstin.strip().upper()
    if (await db.execute(select(Organization).where(Organization.gst_number == gstin))).scalars().first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This GSTIN is already registered.")
    role = (await db.execute(select(Role).where(Role.name == "supplier"))).scalars().first()
    if role is None:
        role = Role(name="supplier", description="Supplier (own catalog only)")
        db.add(role)
        await db.flush()
    user = User(
        id=str(uuid4()),
        email=email,
        full_name=payload.contact_name.strip(),
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_verified=False,
    )
    user.roles.append(role)
    db.add(user)
    await db.flush()
    org = Organization(
        id=str(uuid4()),
        name=payload.business_name.strip(),
        legal_name=payload.business_name.strip(),
        organization_type="supplier",
        gst_number=gstin,
        pan_number=payload.pan.strip().upper(),
        billing_email=email,
        is_active=False,
        settings_json=jsonlib.dumps({
            "phone": payload.phone,
            "city": payload.city.strip(),
            "pincode": payload.pincode,
            "categories": payload.categories,
            "brands": payload.brands,
            "status": "pending",
        }),
    )
    db.add(org)
    await db.flush()
    code = ""
    for _ in range(5):
        code = "SUP-" + uuid4().hex[:8].upper()
        if (await db.execute(select(Supplier).where(Supplier.supplier_code == code))).scalars().first() is None:
            break
    supplier = Supplier(
        id=str(uuid4()),
        organization_id=org.id,
        supplier_code=code,
        is_verified=False,
        user_id=user.id,
    )
    db.add(supplier)
    await db.commit()
    return SupplierApplyResponse(supplier_id=str(supplier.id), supplier_code=code)


@router.get("/applications", response_model=list[SupplierApplicationRead])
async def list_supplier_applications(
    status: str | None = Query(default=None, pattern="^(pending|approved|rejected)$"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(PermissionName.ORGANIZATION_MANAGE)),
) -> list[SupplierApplicationRead]:
    """Staff queue of supplier applications (pending first)."""
    result = await db.execute(select(Supplier).order_by(Supplier.created_at.desc()))
    out: list[SupplierApplicationRead] = []
    for supplier in result.scalars().all():
        org = await db.get(Organization, supplier.organization_id)
        user = await db.get(User, supplier.user_id) if supplier.user_id else None
        app = _to_application(supplier, org, user)
        if status is not None and app.status != status:
            continue
        out.append(app)
    return out


@router.patch("/applications/{supplier_id}", response_model=SupplierApplicationRead)
async def decide_supplier_application(
    supplier_id: str,
    payload: ApplicationDecision,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(PermissionName.ORGANIZATION_MANAGE)),
) -> SupplierApplicationRead:
    """Staff approve/reject. Approve verifies the profile and activates the org."""
    supplier = await db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    org = await db.get(Organization, supplier.organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business profile not found")
    settings = _application_settings(org)
    before = {"status": settings.get("status"), "is_verified": bool(supplier.is_verified)}
    if payload.action == "approve":
        org.is_active = True
        supplier.is_verified = True
        settings["status"] = "approved"
    else:
        org.is_active = False
        supplier.is_verified = False
        settings["status"] = "rejected"
    org.settings_json = jsonlib.dumps(settings)
    await create_audit_log(
        db,
        product_code=ProductCode.MODIT,
        actor_user_id=user.id,
        action="modit.supplier.decision",
        entity_type="supplier",
        entity_id=str(supplier.id),
        before=before,
        after={"status": settings.get("status"), "is_verified": payload.action == "approve"},
    )
    await db.commit()
    user = await db.get(User, supplier.user_id) if supplier.user_id else None
    return _to_application(supplier, org, user)


@router.get("/me", response_model=SupplierMe)
async def supplier_me(
    user: User = Depends(require_supplier()),
    db: AsyncSession = Depends(get_db),
) -> SupplierMe:
    supplier = await get_my_supplier(user, db)
    total = await db.execute(
        select(func.count()).select_from(Product).where(Product.supplier_id == supplier.id)
    )
    return SupplierMe(
        id=str(supplier.id),
        supplier_code=supplier.supplier_code,
        organization_id=getattr(supplier, "organization_id", None),
        is_verified=bool(supplier.is_verified),
        product_count=int(total.scalar() or 0),
    )


@router.get("/products", response_model=SupplierProductList)
async def supplier_products(
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> SupplierProductList:
    total = await db.execute(
        select(func.count()).select_from(Product).where(Product.supplier_id == supplier.id)
    )
    result = await db.execute(
        select(Product)
        .where(Product.supplier_id == supplier.id)
        .order_by(Product.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return SupplierProductList(
        items=[_to_product(p) for p in result.scalars().all()],
        total=int(total.scalar() or 0),
        page=page,
        page_size=page_size,
    )


@router.get("/orders", response_model=list[SupplierOrder])
async def supplier_orders(
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierOrder]:
    return await _my_orders(supplier, db)


@router.get("/summary", response_model=SupplierSummary)
async def supplier_summary(
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
) -> SupplierSummary:
    total = await db.execute(
        select(func.count()).select_from(Product).where(Product.supplier_id == supplier.id)
    )
    active = await db.execute(
        select(func.count())
        .select_from(Product)
        .where(Product.supplier_id == supplier.id, Product.is_active.is_(True))
    )
    orders = await _my_orders(supplier, db)
    revenue = sum(o.my_total for o in orders if (o.status or "") in REVENUE_STATUSES)
    payable = sum(o.my_total for o in orders if o.status == OrderStatus.DELIVERED.value)
    return SupplierSummary(
        supplier_code=supplier.supplier_code,
        is_verified=bool(supplier.is_verified),
        product_count=int(total.scalar() or 0),
        active_product_count=int(active.scalar() or 0),
        order_count=len(orders),
        revenue=revenue,
        payable=payable,
    )


@router.get("/payouts", response_model=list[SupplierPayout])
async def supplier_payouts(
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierPayout]:
    """Computed settlement rows (no separate payout ledger yet).

    Amounts derive from real order lines; `state` is paid once the order is
    delivered, otherwise pending finance release. Honest by construction.
    """
    payouts: list[SupplierPayout] = []
    for order in await _my_orders(supplier, db):
        if (order.status or "") not in REVENUE_STATUSES:
            continue
        payouts.append(
            SupplierPayout(
                order_id=order.id,
                order_number=order.order_number,
                status=order.status,
                amount=order.my_total,
                state="paid" if order.status == OrderStatus.DELIVERED.value else "pending",
                placed_at=order.placed_at,
            )
        )
    return payouts


QUOTABLE_RFQ_STATUSES = frozenset({
    RFQStatus.OPEN.value, RFQStatus.SENT.value, RFQStatus.QUOTED.value,
})


@router.get("/rfqs", response_model=list[SupplierRFQRead])
async def supplier_rfq_inbox(
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierRFQRead]:
    """Open RFQs any verified supplier may quote (marketplace broadcast)."""
    rfq_rows = (
        (await db.execute(
            select(RFQ).where(RFQ.status.in_(QUOTABLE_RFQ_STATUSES)).order_by(RFQ.created_at.desc())
        ))
        .scalars()
        .all()
    )
    rfq_ids = [str(r.id) for r in rfq_rows]
    item_counts: dict[str, int] = {}
    quote_counts: dict[str, int] = {}
    if rfq_ids:
        item_counts = {
            r[0]: int(r[1])
            for r in (
                await db.execute(
                    select(RFQItem.rfq_id, func.count()).where(RFQItem.rfq_id.in_(rfq_ids)).group_by(RFQItem.rfq_id)
                )
            ).all()
        }
        quote_counts = {
            r[0]: int(r[1])
            for r in (
                await db.execute(
                    select(Quotation.rfq_id, func.count()).where(Quotation.rfq_id.in_(rfq_ids)).group_by(Quotation.rfq_id)
                )
            ).all()
        }
    return [
        SupplierRFQRead(
            id=str(rfq.id),
            rfq_number=rfq.rfq_number,
            notes=rfq.notes,
            due_date=rfq.due_date,
            status=rfq.status,
            items_count=item_counts.get(str(rfq.id), 0),
            quotes_count=quote_counts.get(str(rfq.id), 0),
            created_at=rfq.created_at,
        )
        for rfq in rfq_rows
    ]


class SupplierQuoteResponse(BaseModel):
    id: str
    quotation_number: str
    rfq_id: str
    subtotal: float
    gst_total: float
    grand_total: float
    status: str
    lines: list[dict] = []


@router.post("/rfq/{rfq_id}/quote", response_model=SupplierQuoteResponse, status_code=status.HTTP_201_CREATED)
async def supplier_quote_rfq(
    rfq_id: str,
    payload: RFQQuoteRequest,
    supplier: Supplier = Depends(require_verified_supplier()),
    db: AsyncSession = Depends(get_db),
) -> SupplierQuoteResponse:
    """Quote every requested line at your prices. Server computes GST per
    product (18% fallback) - totals are never client-trusted."""
    from backend.app.services.modit import make_modit_reference

    rfq = await db.get(RFQ, rfq_id)
    if rfq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")
    if (rfq.status or "") not in QUOTABLE_RFQ_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"RFQ is {rfq.status} - closed for quoting.",
        )
    wanted = {
        str(item.product_id): float(item.requested_quantity)
        for item in (
            (await db.execute(select(RFQItem).where(RFQItem.rfq_id == rfq.id))).scalars().all()
        )
    }
    if not wanted:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="RFQ has no items to quote.")
    given = {line.product_id: float(line.quantity) for line in payload.lines}
    if set(given) != set(wanted) or any(given[pid] != wanted[pid] for pid in wanted):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quote must cover every requested line at the requested quantities.",
        )
    subtotal = 0.0
    gst_total = 0.0
    item_reads = []
    for line in payload.lines:
        product = await db.get(Product, line.product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown product: {line.product_id}")
        rate = DEFAULT_GST_RATE
        if getattr(product, "gst_id", None):
            gst = await db.get(GST, product.gst_id)
            if gst is not None:
                try:
                    rate = float(getattr(gst, "rate_percent", None) or DEFAULT_GST_RATE)
                except (TypeError, ValueError):
                    rate = DEFAULT_GST_RATE
        line_total = round(float(line.unit_price) * float(line.quantity), 2)
        gst_amount = round(line_total * rate / 100, 2)
        subtotal += line_total
        gst_total += gst_amount
        item_reads.append({
            "product_id": line.product_id,
            "quantity": float(line.quantity),
            "unit_price": round(float(line.unit_price), 2),
            "gst_amount": gst_amount,
            "line_total": line_total,
        })
    quotation = Quotation(
        id=str(uuid4()),
        rfq_id=rfq.id,
        supplier_id=supplier.id,
        quotation_number=make_modit_reference("QTN"),
        status=QuotationStatus.SENT.value,
        valid_until=payload.valid_until,
        subtotal=round(subtotal, 2),
        gst_total=round(gst_total, 2),
        grand_total=round(subtotal + gst_total, 2),
        terms_and_conditions=payload.terms_and_conditions,
    )
    db.add(quotation)
    await db.flush()
    for row in item_reads:
        db.add(QuotationItem(
            id=str(uuid4()),
            quotation_id=quotation.id,
            product_id=row["product_id"],
            quantity=row["quantity"],
            unit_price=row["unit_price"],
            gst_amount=row["gst_amount"],
            line_total=row["line_total"],
        ))
    if (rfq.status or "") == RFQStatus.OPEN.value:
        rfq.status = RFQStatus.QUOTED.value
    await db.commit()
    return SupplierQuoteResponse(
        id=str(quotation.id),
        quotation_number=quotation.quotation_number,
        rfq_id=str(rfq.id),
        subtotal=quotation.subtotal,
        gst_total=quotation.gst_total,
        grand_total=quotation.grand_total,
        status=quotation.status,
        lines=item_reads,
    )
