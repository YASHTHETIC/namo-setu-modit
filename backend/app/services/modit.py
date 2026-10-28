from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.orm_utils import safe_collection_append
from backend.app.models.enums import (
    DeliveryStatus,
    InventoryStatus,
    OrderStatus,
    ProductCode,
    ProjectStatus,
    QuotationStatus,
    RFQStatus,
    ReturnStatus,
)
from backend.app.models.modit import (
    BOQ,
    BOQItem,
    Brand,
    Category,
    ConstructionSite,
    Delivery,
    Driver,
    Inventory,
    Invoice,
    MaterialRequest,
    MaterialRequestItem,
    ModitNotification,
    ModitPayment,
    Order,
    OrderItem,
    Organization,
    Product,
    ProductImage,
    Project,
    PurchaseOrder,
    Quotation,
    QuotationItem,
    RFQ,
    RFQItem,
    Return,
    GST,
    SubCategory,
    Supplier,
    Unit,
    Vehicle,
    Vendor,
    Warehouse,
)
from backend.app.models.shared import AnalyticsEvent
from backend.app.models.user import User
from backend.app.schemas.modit import (
    InventoryAnalytics,
    InventoryAlert,
    BrandRead,
    CategoryRead,
    GSTRead,
    ModitAnalyticsSummary,
    ProductDetailRead,
    ProductRead,
    ProjectDetailRead,
    ProjectRead,
    RFQDetailRead,
    RFQItemRead,
    SubCategoryRead,
    UnitRead,
)


def make_modit_reference(prefix: str) -> str:
    """Create a compact, human-readable business reference for MODIT."""
    return f"{prefix}-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


# Product Catalog Services
async def product_to_read(session: AsyncSession, product: Product) -> ProductRead:
    """Convert Product model to ProductRead schema."""
    return ProductRead.model_validate(product)


async def product_to_detail(session: AsyncSession, product: Product) -> ProductDetailRead:
    """Convert Product model to ProductDetailRead with relationships.

    Relationships are expected to be eager-loaded via selectinload by the
    caller (see search_products / get_product_or_404). Never refresh here:
    a refresh per row would turn a 1000-item listing into 1000 extra
    queries and blow the <100ms list budget. Missing relations simply
    surface as None / [] so the listing never 500s on partial data.
    """
    brand = getattr(product, "brand", None)
    category = getattr(product, "category", None)
    sub_category = getattr(product, "sub_category", None)
    unit = getattr(product, "unit", None)
    gst = getattr(product, "gst", None)
    images = getattr(product, "images", None) or []
    inventory = getattr(product, "inventory", None) or []

    images_data = []
    for img in images:
        images_data.append({
            "id": getattr(img, "id", ""),
            "media_id": getattr(img, "media_id", ""),
            "url": getattr(getattr(img, "media", None), "url", "") or "",
            "caption": getattr(img, "caption", None),
            "sort_order": getattr(img, "sort_order", 0),
            "is_primary": getattr(img, "is_primary", False),
        })

    base = ProductRead.model_validate(product).model_dump()
    # category / unit are NOT NULL in the DB but be defensive: the detail
    # schema requires them, so fall back to id-only stubs rather than 500.
    if category is None:
        category_data = {"id": product.category_id, "name": "", "slug": "",
                         "description": None, "parent_category_id": None,
                         "is_active": True, "created_at": product.created_at}
    else:
        category_data = CategoryRead.model_validate(category).model_dump()
    if unit is None:
        unit_data = {"id": product.unit_id, "name": "", "code": "",
                     "symbol": None, "is_active": True, "created_at": product.created_at}
    else:
        unit_data = UnitRead.model_validate(unit).model_dump()

    return ProductDetailRead(
        **base,
        brand=BrandRead.model_validate(brand).model_dump() if brand else None,
        category=category_data,
        sub_category=SubCategoryRead.model_validate(sub_category).model_dump() if sub_category else None,
        unit=unit_data,
        gst=GSTRead.model_validate(gst).model_dump() if gst else None,
        images=images_data,
        stock_units=float(sum(float(getattr(inv, "quantity_on_hand", 0) or 0) for inv in inventory)),
    )


async def _resolve_category_id(session: AsyncSession, category_id: str | None, category_slug: str | None) -> str | None:
    """Resolve a category filter to a category UUID.

    The storefront sends human slugs ("cement"); the admin sends UUIDs.
    A slug arriving in `category_id` (old frontend) is resolved too, so a
    category click never yields a silent 0-row result.
    """
    slug = (category_slug or "").strip() or None
    if not slug and category_id:
        # UUIDs contain hyphens and are 36 chars; anything else is a slug.
        candidate = category_id.strip()
        is_uuid_like = len(candidate) == 36 and "-" in candidate
        if not is_uuid_like:
            slug = candidate
        else:
            return candidate
    if slug:
        row = (await session.execute(
            select(Category.id).where(Category.slug == slug, Category.deleted_at.is_(None))
        )).scalar_one_or_none()
        if row is not None:
            if isinstance(row, str):
                return row
            try:
                return row[0]
            except (TypeError, KeyError, IndexError):
                candidate = getattr(row, "id", None)
                return candidate if isinstance(candidate, str) else "__no_such_category__"
        # Unknown slug: no product can match â€” return a sentinel that
        # matches nothing instead of ignoring the filter (which would
        # wrongly show the full catalog).
        return "__no_such_category__"
    return category_id


async def _resolve_brand_id(session: AsyncSession, brand_id: str | None, brand_slug: str | None) -> str | None:
    """Resolve a brand filter to a brand UUID (same slug-tolerance as categories)."""
    slug = (brand_slug or "").strip() or None
    if not slug and brand_id:
        candidate = brand_id.strip()
        is_uuid_like = len(candidate) == 36 and "-" in candidate
        if not is_uuid_like:
            slug = candidate
        else:
            return candidate
    if slug:
        row = (await session.execute(
            select(Brand.id).where(Brand.slug == slug, Brand.deleted_at.is_(None))
        )).scalar_one_or_none()
        if row is not None:
            if isinstance(row, str):
                return row
            try:
                return row[0]
            except (TypeError, KeyError, IndexError):
                candidate = getattr(row, "id", None)
                return candidate if isinstance(candidate, str) else "__no_such_brand__"
        return "__no_such_brand__"
    return brand_id


async def search_products(
    session: AsyncSession,
    query: str | None = None,
    category_id: str | None = None,
    brand_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
    category_slug: str | None = None,
    brand_slug: str | None = None,
    include_inactive: bool = False,
    supplier_id: str | None = None,
) -> tuple[list[ProductDetailRead], int, list[str]]:
    """Search products with filters.

    Returns enriched ProductDetailRead (brand/category/unit/gst/images)
    so the storefront can render without a second lookup per row.

    `include_inactive` is only passed for staff callers (admin console),
    so hidden/deactivated products stay manageable there.
    """
    resolved_category_id = await _resolve_category_id(session, category_id, category_slug)
    resolved_brand_id = await _resolve_brand_id(session, brand_id, brand_slug)

    stmt = (
        select(Product)
        .options(
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.sub_category),
            selectinload(Product.unit),
            selectinload(Product.gst),
            selectinload(Product.images).selectinload(ProductImage.media),
            selectinload(Product.inventory),
        )
    )
    if include_inactive:
        stmt = stmt.where(Product.deleted_at.is_(None))
    else:
        stmt = stmt.where(Product.is_active.is_(True), Product.deleted_at.is_(None))

    if query:
        stmt = stmt.where(
            or_(
                Product.name.ilike(f"%{query}%"),
                Product.sku.ilike(f"%{query}%"),
                Product.description.ilike(f"%{query}%"),
            )
        )

    if resolved_category_id:
        stmt = stmt.where(Product.category_id == resolved_category_id)

    if resolved_brand_id:
        stmt = stmt.where(Product.brand_id == resolved_brand_id)

    if supplier_id:
        stmt = stmt.where(Product.supplier_id == supplier_id)

    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await session.execute(count_stmt)
    total = total_result.scalar() or 0

    # Get paginated results
    stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Product.name.asc())
    result = await session.execute(stmt)
    products = result.scalars().all()

    items = [await product_to_detail(session, p) for p in products]
    
    # Generate suggestions
    suggestions = []
    if query and len(items) < 5:
        suggestion_stmt = select(Product.name).where(
            Product.name.ilike(f"%{query}%"), Product.is_active.is_(True)
        ).limit(5)
        suggestion_result = await session.execute(suggestion_stmt)
        suggestions = [row[0] for row in suggestion_result.all()]

    return items, total, suggestions


async def suggest_correction(
    session: AsyncSession,
    query: str | None,
    category_id: str | None = None,
    brand_id: str | None = None,
    limit: int = 200,
    category_slug: str | None = None,
    brand_slug: str | None = None,
) -> str | None:
    """Return a corrected query when `query` looks mistyped, else None.

    Used as a fallback: only called when the exact search returned nothing.
    """
    from backend.app.services.fuzzy import correct_query

    if not query or len(query.strip()) < 3:
        return None
    resolved_category_id = await _resolve_category_id(session, category_id, category_slug)
    resolved_brand_id = await _resolve_brand_id(session, brand_id, brand_slug)
    stmt = select(Product.name).where(Product.is_active.is_(True), Product.deleted_at.is_(None))
    if resolved_category_id:
        stmt = stmt.where(Product.category_id == resolved_category_id)
    if resolved_brand_id:
        stmt = stmt.where(Product.brand_id == resolved_brand_id)
    rows = (await session.execute(stmt.limit(limit))).all()
    names = [r if isinstance(r, str) else r[0] for r in rows if (r if isinstance(r, str) else r[0])]
    return correct_query(query, names)


async def get_product_or_404(session: AsyncSession, product_id: str) -> Product:
    """Get product by ID or slug and raise 404 otherwise.

    The storefront routes are slug-based (/products/acc-cement-50kg) while
    admin links carry UUIDs — accept both, like the category/brand filters.
    Without the slug fallback every PDP lookup 404s and silently renders
    stale static data instead of live admin-managed rows.
    """
    eager = (
        selectinload(Product.brand),
        selectinload(Product.category),
        selectinload(Product.sub_category),
        selectinload(Product.unit),
        selectinload(Product.gst),
        selectinload(Product.images).selectinload(ProductImage.media),
        selectinload(Product.inventory),
    )
    result = await session.execute(select(Product).options(*eager).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        # Not a UUID hit: try the slug (storefront URLs).
        result = await session.execute(select(Product).options(*eager).where(Product.slug == product_id))
        product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


# Inventory Services
async def get_inventory_alerts(session: AsyncSession, organization_id: str | None = None) -> list[InventoryAlert]:
    """Get low stock and out of stock alerts."""
    stmt = select(Inventory).options(
        selectinload(Inventory.product),
        selectinload(Inventory.warehouse),
    ).where(
        or_(
            Inventory.quantity_on_hand <= Inventory.reorder_level,
            Inventory.quantity_on_hand == 0,
        )
    )
    
    if organization_id:
        stmt = stmt.join(Warehouse).where(Warehouse.organization_id == organization_id)
    
    result = await session.execute(stmt)
    inventory_items = result.scalars().all()
    
    alerts = []
    for inv in inventory_items:
        alert_type = "out_of_stock" if inv.quantity_on_hand == 0 else "low_stock"
        alerts.append(
            InventoryAlert(
                product_id=inv.product_id,
                product_name=inv.product.name if inv.product else "Unknown",
                warehouse_id=inv.warehouse_id,
                warehouse_name=inv.warehouse.name if inv.warehouse else "Unknown",
                current_stock=inv.quantity_on_hand,
                reorder_level=inv.reorder_level,
                alert_type=alert_type,
            )
        )
    
    return alerts


async def get_inventory_analytics(session: AsyncSession, organization_id: str | None = None) -> InventoryAnalytics:
    """Get inventory analytics."""
    stmt = select(Inventory).options(selectinload(Inventory.product))
    if organization_id:
        stmt = stmt.join(Warehouse).where(Warehouse.organization_id == organization_id)
    
    result = await session.execute(stmt)
    inventory_items = result.scalars().all()
    
    total_products = len(inventory_items)
    low_stock_count = sum(1 for inv in inventory_items if inv.quantity_on_hand <= inv.reorder_level and inv.quantity_on_hand > 0)
    out_of_stock_count = sum(1 for inv in inventory_items if inv.quantity_on_hand == 0)
    
    total_value = sum(
        float(inv.quantity_on_hand * (inv.product.list_price or 0))
        for inv in inventory_items
        if inv.product
    )
    
    # Warehouse breakdown (single query instead of N+1)
    warehouse_breakdown = []
    warehouse_ids = set(inv.warehouse_id for inv in inventory_items)
    if warehouse_ids:
        wh_result = await session.execute(select(Warehouse).where(Warehouse.id.in_(warehouse_ids)))
        warehouses = {wh.id: wh for wh in wh_result.scalars().all()}
        for wid in warehouse_ids:
            wh = warehouses.get(wid)
            if wh:
                wh_items = [inv for inv in inventory_items if inv.warehouse_id == wid]
                warehouse_breakdown.append({
                    "warehouse_id": wid,
                    "warehouse_name": wh.name,
                    "product_count": len(wh_items),
                    "total_stock": sum(inv.quantity_on_hand for inv in wh_items),
                })
    
    return InventoryAnalytics(
        total_products=total_products,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        total_value=total_value,
        warehouse_breakdown=warehouse_breakdown,
    )


# RFQ Services
async def rfq_to_detail(session: AsyncSession, rfq: RFQ) -> RFQDetailRead:
    """Convert RFQ to detail view with items and quotations."""
    await session.refresh(rfq, ["items", "quotations"])

    # Human labels for RFQ lines â€” one batched lookup, no N+1. Display-only:
    # any session-shape quirk degrades to server ids without breaking reads.
    product_ids = {item.product_id for item in rfq.items if item.product_id}
    item_names: dict[str, str] = {}
    if product_ids:
        try:
            for pid, name in (
                await session.execute(select(Product.name).where(Product.id.in_(product_ids)))
            ).all():
                item_names[pid] = name
        except Exception:
            item_names = {}

    quotations_data = []
    for quote in rfq.quotations:
        quotations_data.append({
            "id": quote.id,
            "quotation_number": quote.quotation_number,
            "supplier_id": quote.supplier_id,
            "status": quote.status,
            "grand_total": float(quote.grand_total),
            "valid_until": quote.valid_until,
        })
    
    return RFQDetailRead(
        id=str(rfq.id),
        organization_id=str(rfq.organization_id),
        project_id=getattr(rfq, "project_id", None),
        rfq_number=rfq.rfq_number,
        status=rfq.status,
        requested_by_user_id=str(rfq.requested_by_user_id),
        due_date=getattr(rfq, "due_date", None),
        notes=getattr(rfq, "notes", None),
        created_at=rfq.created_at,
        items=[_rfq_item_read(item, item_names) for item in rfq.items],
        quotations=quotations_data,
    )


def _rfq_item_read(item: RFQItem, item_names: dict[str, str]) -> RFQItemRead:
    row = RFQItemRead.model_validate(item)
    row.product_name = item_names.get(item.product_id)
    return row


async def create_rfq(session: AsyncSession, organization_id: str, user_id: str, items: list[dict], **kwargs) -> RFQ:
    """Create a new RFQ with items."""
    rfq_number = make_modit_reference("RFQ")
    # Explicit id so RFQItem rows can reference it before the flush.
    rfq = RFQ(
        id=str(uuid4()),
        organization_id=organization_id,
        rfq_number=rfq_number,
        requested_by_user_id=user_id,
        status=RFQStatus.OPEN.value,
        **kwargs
    )
    session.add(rfq)

    for item_data in items:
        rfq_item = RFQItem(
            rfq_id=rfq.id,
            product_id=item_data["product_id"],
            requested_quantity=item_data["requested_quantity"],
            unit_price_hint=item_data.get("unit_price_hint"),
            notes=item_data.get("notes"),
        )
        session.add(rfq_item)
        # rfq is transient/pending here — appending is memory-only (no lazy
        # load). After the flush it would be persistent and an append would
        # raise MissingGreenlet, which is why this happens before flushing.
        safe_collection_append(rfq, "items", rfq_item)

    await session.flush()

    return rfq


# Project Services
async def project_to_detail(session: AsyncSession, project: Project) -> ProjectDetailRead:
    """Convert Project to detail view with related data."""
    await session.refresh(project, ["construction_sites", "material_requests", "boq"])
    
    return ProjectDetailRead(
        **ProjectRead.model_validate(project).model_dump(),
        construction_sites=[ConstructionSite.model_validate(site) for site in project.construction_sites],
        material_requests=[MaterialRequest.model_validate(req) for req in project.material_requests],
        boq=[BOQ.model_validate(boq) for boq in project.boq],
    )


async def create_project(session: AsyncSession, organization_id: str, **kwargs) -> Project:
    """Create a new project."""
    project_code = make_modit_reference("PRJ")
    project = Project(
        organization_id=organization_id,
        project_code=project_code,
        status=ProjectStatus.PLANNED.value,
        **kwargs
    )
    session.add(project)
    return project



async def create_modit_notification(session: AsyncSession, organization_id: str, user_id: str | None, title: str, body: str) -> ModitNotification:
    """Create a MODIT notification."""
    notification = ModitNotification(
        organization_id=organization_id,
        user_id=user_id,
        channel="in_app",
        title=title,
        body=body,
        status="queued",
    )
    session.add(notification)
    return notification


async def analytics_summary(session: AsyncSession) -> ModitAnalyticsSummary:
    """Get MODIT analytics summary."""
    total_organizations = await session.execute(select(func.count(Organization.id)))
    total_organizations = total_organizations.scalar() or 0
    
    total_products = await session.execute(select(func.count(Product.id)))
    total_products = total_products.scalar() or 0
    
    total_suppliers = await session.execute(select(func.count(Supplier.id)))
    total_suppliers = total_suppliers.scalar() or 0
    
    total_orders = await session.execute(select(func.count(Order.id)))
    total_orders = total_orders.scalar() or 0
    
    # Calculate total revenue from invoices
    revenue_stmt = select(func.sum(Invoice.grand_total))
    total_revenue_result = await session.execute(revenue_stmt)
    total_revenue = float(total_revenue_result.scalar() or 0)
    
    active_projects = await session.execute(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE.value)
    )
    active_projects = active_projects.scalar() or 0
    
    pending_rfqs = await session.execute(
        select(func.count(RFQ.id)).where(RFQ.status == RFQStatus.OPEN.value)
    )
    pending_rfqs = pending_rfqs.scalar() or 0
    
    low_stock_items = len(await get_inventory_alerts(session))
    
    return ModitAnalyticsSummary(
        total_organizations=total_organizations,
        total_products=total_products,
        total_suppliers=total_suppliers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_projects=active_projects,
        pending_rfqs=pending_rfqs,
        low_stock_items=low_stock_items,
    )


async def track_analytics_event(session: AsyncSession, user_id: str, event_name: str, properties: dict | None = None) -> AnalyticsEvent:
    """Track an analytics event for MODIT."""
    event = AnalyticsEvent(
        product_code=ProductCode.MODIT.value,
        user_id=user_id,
        event_name=event_name,
        properties_json=json.dumps(properties) if properties else None,
    )
    session.add(event)
    return event
