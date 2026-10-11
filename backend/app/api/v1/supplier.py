"""Blinkit-style seller surface: a supplier login sees ONLY their own data.

Suppliers are NOT staff (see api/deps.py — the supplier role is deliberately
absent from STAFF_ROLE_NAMES), so none of the staff-gated admin routes open
for them. Everything here is scoped by suppliers.user_id -> users.id.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import require_supplier
from backend.app.core.database import get_db
from backend.app.models.enums import OrderStatus
from backend.app.models.modit import Order, OrderItem, Product, Supplier
from backend.app.models.user import User

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
    result = await db.execute(select(OrderItem).join(Product, OrderItem.product_id == Product.id))
    items = list(result.scalars().all())
    mine: list[OrderItem] = []
    for item in items:
        product = await db.get(Product, getattr(item, "product_id", None))
        if product is not None and str(getattr(product, "supplier_id", "")) == str(supplier.id):
            # Stash the resolved product so callers never re-query.
            setattr(item, "_supplier_product", product)
            mine.append(item)
    return mine


async def _my_orders(supplier: Supplier, db: AsyncSession) -> list[SupplierOrder]:
    grouped: dict[str, SupplierOrder] = {}
    for item in await _my_order_items(supplier, db):
        order = await db.get(Order, getattr(item, "order_id", None))
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
    user: User = Depends(require_supplier()),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> SupplierProductList:
    supplier = await get_my_supplier(user, db)
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
    user: User = Depends(require_supplier()),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierOrder]:
    supplier = await get_my_supplier(user, db)
    return await _my_orders(supplier, db)


@router.get("/summary", response_model=SupplierSummary)
async def supplier_summary(
    user: User = Depends(require_supplier()),
    db: AsyncSession = Depends(get_db),
) -> SupplierSummary:
    supplier = await get_my_supplier(user, db)
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
    user: User = Depends(require_supplier()),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierPayout]:
    """Computed settlement rows (no separate payout ledger yet).

    Amounts derive from real order lines; `state` is paid once the order is
    delivered, otherwise pending finance release. Honest by construction.
    """
    supplier = await get_my_supplier(user, db)
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
