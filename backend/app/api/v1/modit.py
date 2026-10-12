from __future__ import annotations

import json
import pathlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_optional_user, is_staff, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import ProductCode
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
    AIMaterialRecommendationRequest,
    AIMaterialRecommendationResponse,
    AIProcurementAssistantRequest,
    AIProcurementAssistantResponse,
    AIQuoteComparisonResponse,
    AIVendorMatchingRequest,
    AIVendorMatchingResponse,
    BOQItemCreate,
    BOQItemRead,
    BOQReaderRequest,
    BOQReaderResponse,
    BOQRead,
    BrandRead,
    CartCreate,
    CartItemRead,
    CartItemUpsert,
    CartMergeRequest,
    CartQuantityUpdate,
    CartRead,
    CategoryRead,
    CategoryUpdate,
    CheckoutRequest,
    CheckoutResponse,
    ConstructionSiteCreate,
    ConstructionSiteRead,
    DeliveryCreate,
    DeliveryPingCreate,
    DeliveryPingRead,
    DeliveryRead,
    DeliveryTrackRead,
    DriverCreate,
    DriverRead,
    InventoryAlert,
    InventoryAnalytics,
    InventoryCreate,
    InventoryRead,
    InventoryUpdate,
    InvoiceCreate,
    InvoiceRead,
    MaterialRequestCreate,
    MaterialRequestItemCreate,
    MaterialRequestItemRead,
    MaterialRequestRead,
    ModitAnalyticsSummary,
    ModitListResponse,
    ModitNotificationRead,
    NearestWarehouseRead,
    OrderCreate,
    OrderDetailRead,
    OrderItemCreate,
    OrderItemRead,
    OrderRead,
    OrderStatusUpdate,
    ProductCreate,
    ProductDetailRead,
    ProductImageCreate,
    ProductImageRead,
    ProductRead,
    ProductSearchResponse,
    ProductUpdate,
    ProjectCreate,
    ProjectDetailRead,
    ProjectRead,
    ProjectUpdate,
    PurchaseOrderCreate,
    PurchaseOrderRead,
    QuotationCreate,
    QuotationDetailRead,
    QuotationItemCreate,
    QuotationItemRead,
    QuotationRead,
    RFQCreate,
    RFQDetailRead,
    RFQItemCreate,
    RFQItemRead,
    RFQRead,
    ReturnCreate,
    ReturnRead,
    ReturnStatusUpdate,
    SmartReorderResponse,
    SmartReorderRequest,
    SubCategoryCreate,
    SubCategoryRead,
    SubCategoryUpdate,
    SupportConversationCreate,
    SupportConversationDetailRead,
    SupportConversationRead,
    SupportMessageCreate,
    SupportMessageRead,
    SupplierCreate,
    SupplierRead,
    UnitRead,
    VendorCreate,
    VendorRead,
    VehicleCreate,
    VehicleRead,
    VoiceOrderRequest,
    VoiceOrderResponse,
    WarehouseCreate,
    WarehouseRead,
)
from backend.app.schemas.platform import StandardResponse
from backend.app.services.geo import find_nearest_warehouse
from backend.app.services.support import (
    create_conversation,
    get_conversation_detail,
    list_conversations,
    post_user_message,
)
from backend.app.services.tracking import get_delivery_track, get_order_delivery, record_delivery_ping
from backend.app.services.modit import (
    ai_boq_reader,
    ai_material_recommendation,
    ai_procurement_assistant,
    ai_quote_comparison,
    ai_vendor_matching,
    analytics_summary,
    create_modit_notification,
    create_project,
    create_rfq,
    get_inventory_alerts,
    get_inventory_analytics,
    get_product_or_404,
    product_to_detail,
    product_to_read,
    project_to_detail,
    rfq_to_detail,
    search_products,
    smart_reorder_suggestions,
    suggest_correction,
    track_analytics_event,
    voice_order_processing,
)
from backend.app.services.checkout import place_checkout_order

router = APIRouter(prefix="/modit", tags=["modit"])
admin_dependency = Depends(require_permission(PermissionName.CONFIG_READ))


def _pages(total: int, page_size: int) -> int:
    return (total + page_size - 1) // page_size if total else 0


async def _count(session: AsyncSession, stmt) -> int:
    return int((await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())


# =====================================================
# 1. Product Catalog
# =====================================================

@router.get("/products", response_model=ProductSearchResponse)
async def list_products(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    category_id: str | None = None,
    brand_id: str | None = None,
    category_slug: str | None = None,
    brand_slug: str | None = None,
    # Back-compat: older storefront sends the slug in `category`.
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> ProductSearchResponse:
    """List products with search and filters.

    Accepts category/brand as UUID *or* slug: `category_slug` (preferred),
    `category` (legacy slug alias), or a slug inside `category_id`.
    """
    eff_category_slug = category_slug or category
    items, total, suggestions = await search_products(
        db, query=search, category_id=category_id, brand_id=brand_id,
        page=page, page_size=page_size,
        category_slug=eff_category_slug, brand_slug=brand_slug,
    )
    did_you_mean: str | None = None
    if total == 0 and search:
        # Typo tolerance: retry once with the closest matching product name.
        corrected = await suggest_correction(
            db, search, category_id=category_id, brand_id=brand_id,
            category_slug=eff_category_slug, brand_slug=brand_slug,
        )
        if corrected:
            did_you_mean = corrected
            items, total, suggestions = await search_products(
                db, query=corrected, category_id=category_id, brand_id=brand_id,
                page=page, page_size=page_size,
                category_slug=eff_category_slug, brand_slug=brand_slug,
            )
    return ProductSearchResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        pages=_pages(total, page_size),
        filters={"category": [], "brand": []},
        did_you_mean=did_you_mean,
    )


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> ProductRead:
    """Create a product."""
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return await product_to_read(db, product)


@router.get("/products/{product_id}", response_model=ProductDetailRead)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)) -> ProductDetailRead:
    """Get product details."""
    product = await get_product_or_404(db, product_id)
    return await product_to_detail(db, product)


@router.patch("/products/{product_id}", response_model=ProductRead, dependencies=[admin_dependency])
async def update_product(product_id: str, payload: ProductUpdate, db: AsyncSession = Depends(get_db)) -> ProductRead:
    """Update product."""
    product = await get_product_or_404(db, product_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return await product_to_read(db, product)


@router.delete("/products/{product_id}", response_model=StandardResponse[str], dependencies=[admin_dependency])
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    """Delete product (soft delete)."""
    product = await get_product_or_404(db, product_id)
    product.is_active = False
    await db.commit()
    return StandardResponse(message="Product deleted", data=product_id)


@router.post("/products/{product_id}/images", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def add_product_image(product_id: str, payload: ProductImageCreate, db: AsyncSession = Depends(get_db)) -> ProductImageRead:
    """Add product image."""
    await get_product_or_404(db, product_id)
    image = ProductImage(product_id=product_id, **payload.model_dump())
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return ProductImageRead.model_validate(image)


# Categories
@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """List all categories with live product counts."""
    counts = dict(
        (
            await db.execute(
                select(Product.category_id, func.count())
                .where(Product.is_active.is_(True), Product.deleted_at.is_(None))
                .group_by(Product.category_id)
            )
        ).all()
    )
    result = await db.execute(select(Category).where(Category.is_active.is_(True), Category.deleted_at.is_(None)).order_by(Category.name.asc()))
    out: list[dict] = []
    for cat in result.scalars().all():
        payload = CategoryRead.model_validate(cat).model_dump(mode="json")
        payload["product_count"] = int(counts.get(cat.id, 0))
        out.append(payload)
    return out


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_category(payload: dict, db: AsyncSession = Depends(get_db)) -> Category:
    """Create a category."""
    category = Category(**payload)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryRead, dependencies=[admin_dependency])
async def update_category(category_id: str, payload: CategoryUpdate, db: AsyncSession = Depends(get_db)) -> Category:
    """Rename / describe / activate / deactivate a category. No deletes —
    deactivation hides it everywhere while products keep working."""
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return category


# Subcategories
@router.get("/subcategories", response_model=list[SubCategoryRead])
async def list_subcategories(category_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[SubCategory]:
    """List subcategories."""
    stmt = select(SubCategory).where(SubCategory.is_active.is_(True), SubCategory.deleted_at.is_(None))
    if category_id:
        stmt = stmt.where(SubCategory.category_id == category_id)
    result = await db.execute(stmt.order_by(SubCategory.name.asc()))
    return result.scalars().all()


@router.post("/subcategories", response_model=SubCategoryRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_subcategory(payload: SubCategoryCreate, db: AsyncSession = Depends(get_db)) -> SubCategory:
    """Create a subcategory."""
    item = SubCategory(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return SubCategoryRead.model_validate(item)


@router.patch("/subcategories/{subcategory_id}", response_model=SubCategoryRead, dependencies=[admin_dependency])
async def update_subcategory(subcategory_id: str, payload: SubCategoryUpdate, db: AsyncSession = Depends(get_db)) -> SubCategory:
    """Rename / describe / activate / deactivate a subcategory."""
    item = await db.get(SubCategory, subcategory_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategory not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return SubCategoryRead.model_validate(item)


# Brands
@router.get("/brands", response_model=list[BrandRead])
async def list_brands(db: AsyncSession = Depends(get_db)) -> list[Brand]:
    """List all brands."""
    result = await db.execute(select(Brand).where(Brand.is_active.is_(True), Brand.deleted_at.is_(None)).order_by(Brand.name.asc()))
    return result.scalars().all()


@router.post("/brands", response_model=BrandRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_brand(payload: dict, db: AsyncSession = Depends(get_db)) -> Brand:
    """Create a brand."""
    brand = Brand(**payload)
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


# Units
@router.get("/units", response_model=list[UnitRead])
async def list_units(db: AsyncSession = Depends(get_db)) -> list[Unit]:
    """List all units."""
    result = await db.execute(select(Unit).where(Unit.is_active.is_(True), Unit.deleted_at.is_(None)).order_by(Unit.name.asc()))
    return result.scalars().all()


@router.post("/units", response_model=UnitRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_unit(payload: dict, db: AsyncSession = Depends(get_db)) -> Unit:
    """Create a unit."""
    unit = Unit(**payload)
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return unit


# =====================================================
# 2. Supplier Platform
# =====================================================

@router.get("/suppliers", response_model=list[SupplierRead])
async def list_suppliers(db: AsyncSession = Depends(get_db)) -> list[Supplier]:
    """List all suppliers."""
    result = await db.execute(select(Supplier).order_by(Supplier.supplier_code.asc()))
    return result.scalars().all()


@router.post("/suppliers", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
async def create_supplier(payload: SupplierCreate, db: AsyncSession = Depends(get_db)) -> Supplier:
    """Create a supplier."""
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierRead.model_validate(supplier)


@router.get("/suppliers/{supplier_id}/vendors", response_model=list[VendorRead])
async def list_supplier_vendors(supplier_id: str, db: AsyncSession = Depends(get_db)) -> list[Vendor]:
    """List vendors for a supplier."""
    result = await db.execute(
        select(Vendor).where(Vendor.supplier_id == supplier_id, Vendor.is_active.is_(True), Vendor.deleted_at.is_(None)).order_by(Vendor.name.asc())
    )
    return result.scalars().all()


@router.post("/suppliers/{supplier_id}/vendors", response_model=VendorRead, status_code=status.HTTP_201_CREATED)
async def create_vendor(supplier_id: str, payload: VendorCreate, db: AsyncSession = Depends(get_db)) -> Vendor:
    """Create a vendor."""
    vendor = Vendor(supplier_id=supplier_id, **payload.model_dump())
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return VendorRead.model_validate(vendor)


@router.get("/warehouses", response_model=list[WarehouseRead])
async def list_warehouses(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Warehouse]:
    """List warehouses."""
    stmt = select(Warehouse).where(Warehouse.is_active.is_(True), Warehouse.deleted_at.is_(None))
    if organization_id:
        stmt = stmt.where(Warehouse.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Warehouse.name.asc()))
    return result.scalars().all()


@router.post("/warehouses", response_model=WarehouseRead, status_code=status.HTTP_201_CREATED)
async def create_warehouse(payload: WarehouseCreate, db: AsyncSession = Depends(get_db)) -> Warehouse:
    """Create a warehouse."""
    warehouse = Warehouse(**payload.model_dump())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return WarehouseRead.model_validate(warehouse)


@router.get("/warehouses/nearest", response_model=NearestWarehouseRead)
async def nearest_warehouse(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    organization_id: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> NearestWarehouseRead:
    """Closest geo-tagged warehouse to a point (hyperlocal fulfillment)."""
    warehouse, distance_km = await find_nearest_warehouse(db, lat, lng, organization_id)
    if warehouse is None or distance_km is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No geo-tagged warehouse found")
    data = WarehouseRead.model_validate(warehouse).model_dump()
    return NearestWarehouseRead(**data, distance_km=round(distance_km, 2))


# =====================================================
# 3. RFQ / Quotation System
# =====================================================

@router.get("/rfq", response_model=list[RFQRead])
async def list_rfqs(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[RFQRead]:
    """List RFQs."""
    stmt = select(RFQ)
    if organization_id:
        stmt = stmt.where(RFQ.organization_id == organization_id)
    result = await db.execute(stmt.order_by(RFQ.created_at.desc()))
    return [RFQRead.model_validate(item) for item in result.scalars().all()]


@router.post("/rfq", response_model=RFQDetailRead, status_code=status.HTTP_201_CREATED)
async def create_rfq_endpoint(
    payload: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> RFQDetailRead:
    """Create an RFQ with items."""
    items = payload.pop("items", [])
    org_id = payload.pop("organization_id", None)
    rfq = await create_rfq(db, org_id, user.id, items, **payload)
    await db.commit()
    await db.refresh(rfq)
    return await rfq_to_detail(db, rfq)


@router.get("/rfq/{rfq_id}", response_model=RFQDetailRead)
async def get_rfq(rfq_id: str, db: AsyncSession = Depends(get_db)) -> RFQDetailRead:
    """Get RFQ details."""
    rfq = await db.get(RFQ, rfq_id)
    if rfq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")
    return await rfq_to_detail(db, rfq)


@router.get("/rfq/{rfq_id}/quotations", response_model=list[QuotationRead])
async def list_rfq_quotations(rfq_id: str, db: AsyncSession = Depends(get_db)) -> list[QuotationRead]:
    """List quotations for an RFQ."""
    result = await db.execute(select(Quotation).where(Quotation.rfq_id == rfq_id, Quotation.deleted_at.is_(None)).order_by(Quotation.grand_total.asc()))
    return [QuotationRead.model_validate(item) for item in result.scalars().all()]


@router.post("/quotations", response_model=QuotationDetailRead, status_code=status.HTTP_201_CREATED)
async def create_quotation(payload: QuotationCreate, db: AsyncSession = Depends(get_db)) -> QuotationDetailRead:
    """Create a quotation."""
    quotation = Quotation(**payload.model_dump())
    db.add(quotation)
    await db.commit()
    await db.refresh(quotation)
    return QuotationDetailRead.model_validate(quotation)


@router.get("/quotations/{quotation_id}", response_model=QuotationDetailRead)
async def get_quotation(quotation_id: str, db: AsyncSession = Depends(get_db)) -> QuotationDetailRead:
    """Get quotation details."""
    quotation = await db.get(Quotation, quotation_id)
    if quotation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")
    await db.refresh(quotation, ["items"])
    return QuotationDetailRead(
        **QuotationRead.model_validate(quotation).model_dump(),
        items=[QuotationItemRead.model_validate(item) for item in quotation.items],
    )


# =====================================================
# 4. Orders
# =====================================================

@router.post("/cart", response_model=CartRead)
async def create_cart(payload: CartCreate, db: AsyncSession = Depends(get_db)) -> CartRead:
    """Create a cart from items."""
    items = []
    subtotal = 0.0
    gst_total = 0.0

    # One query for all products instead of a query per item (N+1).
    product_ids = {item.product_id for item in payload.items}
    products_by_id = {}
    if product_ids:
        product_rows = await db.execute(select(Product).where(Product.id.in_(product_ids)))
        products_by_id = {p.id: p for p in product_rows.scalars()}

    for item in payload.items:
        product = products_by_id.get(item.product_id)
        if product:
            line_total = item.quantity * item.unit_price
            subtotal += line_total
            gst_total += line_total * 0.18  # 18% GST
            items.append({
                "product_id": item.product_id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": line_total,
            })

    return CartRead(items=items, subtotal=subtotal, gst_total=gst_total, grand_total=subtotal + gst_total)


_ORDER_TOTAL_KEYS = ("subtotal", "discount_total", "shipping_total", "gst_total", "grand_total")


def _parse_order_totals(totals_json: str | None) -> dict[str, float]:
    """Stored server bill for an order. Missing/corrupt JSON = zeros (never crash the list)."""
    out = {key: 0.0 for key in _ORDER_TOTAL_KEYS}
    if not totals_json:
        return out
    try:
        data = json.loads(totals_json)
    except (TypeError, ValueError):
        return out
    if not isinstance(data, dict):
        return out
    for key in _ORDER_TOTAL_KEYS:
        try:
            out[key] = round(float(data.get(key, 0.0) or 0.0), 2)
        except (TypeError, ValueError):
            out[key] = 0.0
    return out


def _parse_order_address(address_json: str | None) -> dict | None:
    """Buyer address snapshot saved at placement (name/phone/line1/city/state/pincode)."""
    if not address_json:
        return None
    try:
        data = json.loads(address_json)
    except (TypeError, ValueError):
        return None
    return data if isinstance(data, dict) else None


@router.get("/orders", response_model=list[OrderRead])
async def list_orders(
    organization_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[OrderRead]:
    """List orders. Anonymous callers see nothing; customers see their own
    orgs; staff see everything when no org filter is given."""
    from backend.app.models.modit import OrganizationUser

    stmt = select(Order)
    if organization_id:
        stmt = stmt.where(Order.organization_id == organization_id)
    elif not is_staff(user):
        if user is None:
            return []
        org_ids = (
            (
                await db.execute(
                    select(OrganizationUser.organization_id).where(OrganizationUser.user_id == user.id)
                )
            )
            .scalars()
            .all()
        )
        if not org_ids:
            return []
        stmt = stmt.where(Order.organization_id.in_(org_ids))
    result = await db.execute(stmt.order_by(Order.created_at.desc()))
    orders = list(result.scalars().all())
    # One grouped count for every listed order (no N+1): the buyer Orders
    # page reads items_count/total straight off this payload.
    counts: dict[str, int] = {}
    if orders:
        count_rows = (
            (
                await db.execute(
                    select(OrderItem.order_id, func.count(OrderItem.id))
                    .where(OrderItem.order_id.in_([o.id for o in orders]))
                    .group_by(OrderItem.order_id)
                )
            )
            .all()
        )
        counts = {order_id: int(n) for order_id, n in count_rows}
    out: list[OrderRead] = []
    for item in orders:
        row = OrderRead.model_validate(item)
        row.total = _parse_order_totals(item.totals_json).get("grand_total", 0.0)
        row.items_count = counts.get(item.id, 0)
        out.append(row)
    return out


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> CheckoutResponse:
    """Real B2C checkout. Prices/tax/shipping/coupons come from the server
    catalog — client totals are never trusted."""
    return await place_checkout_order(db, user, payload)


@router.post("/orders", response_model=OrderDetailRead, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrderDetailRead:
    """Create an order."""
    from backend.app.services.modit import make_modit_reference
    
    order = Order(
        organization_id=payload.organization_id,
        purchase_order_id=payload.purchase_order_id,
        order_number=make_modit_reference("ORD"),
        status="placed",
        placed_at=datetime.now(timezone.utc),
        notes=payload.notes,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return OrderDetailRead(**OrderRead.model_validate(order).model_dump(), items=[])


@router.get("/orders/{order_id}", response_model=OrderDetailRead)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)) -> OrderDetailRead:
    """Get order details (shareable by unguessable UUID, e.g. family tracking)."""
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    await db.refresh(order, ["items"])
    delivery_id: str | None = None
    try:
        delivery = await get_order_delivery(db, order_id)
        delivery_id = getattr(delivery, "id", None)
    except HTTPException:
        delivery_id = None
    totals = _parse_order_totals(order.totals_json)
    # Human labels for each line in one batched lookup (no N+1).
    labels: dict[str, tuple[str | None, str | None]] = {}
    product_ids = list({it.product_id for it in order.items if it.product_id})
    if product_ids:
        for pid, sku, name in (
            await db.execute(select(Product.id, Product.sku, Product.name).where(Product.id.in_(product_ids)))
        ).all():
            labels[pid] = (sku, name)
    item_reads = []
    for it in order.items:
        row = OrderItemRead.model_validate(it)
        sku, name = labels.get(it.product_id, (None, None))
        row.sku = sku
        row.name = name
        item_reads.append(row)
    pay_status = "pending"
    pay_row = (
        (await db.execute(select(ModitPayment.payment_status).where(ModitPayment.order_id == order.id).limit(1)))
        .scalars()
        .first()
    )
    if pay_row:
        pay_status = str(pay_row)
    base = OrderRead.model_validate(order)
    base.total = totals.get("grand_total", 0.0)
    base.items_count = len(order.items)
    return OrderDetailRead(
        **base.model_dump(),
        items=item_reads,
        delivery_id=delivery_id,
        subtotal=totals.get("subtotal", 0.0),
        discount_total=totals.get("discount_total", 0.0),
        shipping_total=totals.get("shipping_total", 0.0),
        gst_total=totals.get("gst_total", 0.0),
        grand_total=totals.get("grand_total", 0.0),
        payment_status=pay_status,
        address=_parse_order_address(order.shipping_address_json),
    )


@router.get("/orders/{order_id}/delivery", response_model=DeliveryRead)
async def get_order_delivery_endpoint(order_id: str, db: AsyncSession = Depends(get_db)) -> DeliveryRead:
    """Latest delivery for an order (powers Track buttons). Public by unguessable UUID."""
    return DeliveryRead.model_validate(await get_order_delivery(db, order_id))


ORDER_STATUS_VALUES = frozenset({
    "draft", "placed", "accepted", "packed", "confirmed",
    "processing", "dispatched", "in_transit", "delivered", "cancelled",
})

# Buyers may only cancel before fulfillment starts. Staff can cancel anything
# (e.g. fraud, dead stock) — stock still goes back in both cases.
BUYER_CANCELLABLE = frozenset({"placed", "confirmed"})


def buyer_may_cancel(old_status: str | None, staff: bool) -> bool:
    """Pure transition rule, unit tested."""
    if staff:
        return True
    return (old_status or "") in BUYER_CANCELLABLE


async def _restore_inventory_for_order(session: AsyncSession, order_id: str) -> None:
    """Put reserved stock back when an order is cancelled."""
    from backend.app.models.modit import Inventory, OrderItem

    item_rows = (
        (await session.execute(select(OrderItem).where(OrderItem.order_id == order_id)))
        .scalars()
        .all()
    )
    for item in item_rows:
        inv_rows = (
            (
                await session.execute(
                    select(Inventory).where(Inventory.product_id == item.product_id)
                )
            )
            .scalars()
            .all()
        )
        if not inv_rows:
            continue
        target = max(inv_rows, key=lambda r: r.quantity_on_hand)
        target.quantity_on_hand = float(target.quantity_on_hand or 0) + float(item.quantity or 0)


async def _own_org_ids(session: AsyncSession, user: User) -> list[str]:
    from backend.app.models.modit import OrganizationUser

    rows = (
        (await session.execute(select(OrganizationUser.organization_id).where(OrganizationUser.user_id == user.id)))
        .scalars()
        .all()
    )
    return [r for r in rows if isinstance(r, str)]


@router.patch("/orders/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrderRead:
    """Advance an order through fulfillment. Staff: any order. Customers:
    cancel their own org's orders only."""
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if payload.status not in ORDER_STATUS_VALUES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown status: {payload.status}")
    if not is_staff(user):
        if payload.status != "cancelled":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff can change order status")
        if order.organization_id not in await _own_org_ids(db, user):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if not buyer_may_cancel(order.status, False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too late to cancel online — contact support@modit.in for help with this order.",
            )
    if payload.status == "cancelled" and order.status != "cancelled":
        await _restore_inventory_for_order(db, order.id)
    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    return OrderRead.model_validate(order)


@router.get("/purchase-orders", response_model=list[PurchaseOrderRead])
async def list_purchase_orders(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[PurchaseOrder]:
    """List purchase orders."""
    stmt = select(PurchaseOrder)
    if organization_id:
        stmt = stmt.where(PurchaseOrder.organization_id == organization_id)
    result = await db.execute(stmt.order_by(PurchaseOrder.created_at.desc()))
    return result.scalars().all()


@router.post("/purchase-orders", response_model=PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(payload: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)) -> PurchaseOrder:
    """Create a purchase order."""
    from backend.app.services.modit import make_modit_reference
    
    po = PurchaseOrder(
        organization_id=payload.organization_id,
        project_id=payload.project_id,
        rfq_id=payload.rfq_id,
        order_number=make_modit_reference("PO"),
        status="draft",
        order_date=datetime.now(timezone.utc).date(),
        expected_delivery_date=payload.expected_delivery_date,
        total_amount=0,
    )
    db.add(po)
    await db.commit()
    await db.refresh(po)
    return PurchaseOrderRead.model_validate(po)


@router.get("/invoices", response_model=list[InvoiceRead])
async def list_invoices(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Invoice]:
    """List invoices."""
    stmt = select(Invoice)
    if organization_id:
        stmt = stmt.where(Invoice.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Invoice.created_at.desc()))
    return result.scalars().all()


@router.post("/invoices", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)) -> Invoice:
    """Create an invoice."""
    from backend.app.services.modit import make_modit_reference
    
    invoice = Invoice(
        organization_id=payload.organization_id,
        order_id=payload.order_id,
        invoice_number=make_modit_reference("INV"),
        status="draft",
        invoice_date=datetime.now(timezone.utc).date(),
        due_date=payload.due_date,
        subtotal=0,
        gst_total=0,
        grand_total=0,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return InvoiceRead.model_validate(invoice)


@router.post("/returns", response_model=ReturnRead, status_code=status.HTTP_201_CREATED)
async def create_return(payload: ReturnCreate, db: AsyncSession = Depends(get_db)) -> Return:
    """Create a return request."""
    from backend.app.services.modit import make_modit_reference
    
    ret = Return(
        purchase_order_id=payload.purchase_order_id,
        return_number=make_modit_reference("RET"),
        status="requested",
        requested_at=datetime.now(timezone.utc),
        reason=payload.reason,
    )
    db.add(ret)
    await db.commit()
    await db.refresh(ret)
    return ReturnRead.model_validate(ret)


RETURN_STATUS_VALUES = frozenset({"requested", "approved", "received", "rejected"})


@router.get("/returns", response_model=list[ReturnRead])
async def list_returns(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[ReturnRead]:
    """List returns. Staff see all; customers see returns on their own orgs' orders."""
    from backend.app.models.modit import PurchaseOrder

    stmt = select(Return)
    if not is_staff(user):
        own_orgs = await _own_org_ids(db, user)
        if not own_orgs:
            return []
        po_ids = (
            (await db.execute(select(PurchaseOrder.id).where(PurchaseOrder.organization_id.in_(own_orgs))))
            .scalars()
            .all()
        )
        if not po_ids:
            return []
        stmt = stmt.where(Return.purchase_order_id.in_(po_ids))
    result = await db.execute(stmt.order_by(Return.created_at.desc()))
    return [ReturnRead.model_validate(item) for item in result.scalars().all()]


@router.patch("/returns/{return_id}/status", response_model=ReturnRead)
async def update_return_status(
    return_id: str,
    payload: ReturnStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReturnRead:
    """Approve/reject/receive a return. Staff only."""
    if not is_staff(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff can update returns")
    ret = await db.get(Return, return_id)
    if ret is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")
    if payload.status not in RETURN_STATUS_VALUES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown status: {payload.status}")
    ret.status = payload.status
    if payload.status in ("approved", "received"):
        ret.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ret)
    return ReturnRead.model_validate(ret)


# =====================================================
# 5. Inventory
# =====================================================

@router.get("/inventory", response_model=list[InventoryRead])
async def list_inventory(
    warehouse_id: str | None = None,
    product_id: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[Inventory]:
    """List inventory."""
    stmt = select(Inventory)
    if warehouse_id:
        stmt = stmt.where(Inventory.warehouse_id == warehouse_id)
    if product_id:
        stmt = stmt.where(Inventory.product_id == product_id)
    result = await db.execute(stmt.order_by(Inventory.product_id.asc()))
    return result.scalars().all()


@router.post("/inventory", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
async def create_inventory(payload: InventoryCreate, db: AsyncSession = Depends(get_db)) -> Inventory:
    """Create inventory record."""
    inventory = Inventory(**payload.model_dump())
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return InventoryRead.model_validate(inventory)


@router.patch("/inventory/{inventory_id}", response_model=InventoryRead)
async def update_inventory(inventory_id: str, payload: InventoryUpdate, db: AsyncSession = Depends(get_db)) -> Inventory:
    """Update inventory."""
    inventory = await db.get(Inventory, inventory_id)
    if inventory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(inventory, key, value)
    await db.commit()
    await db.refresh(inventory)
    return InventoryRead.model_validate(inventory)


@router.get("/inventory/alerts", response_model=list[InventoryAlert])
async def get_low_stock_alerts(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[InventoryAlert]:
    """Get low stock alerts."""
    return await get_inventory_alerts(db, organization_id)


@router.get("/inventory/analytics", response_model=InventoryAnalytics)
async def get_inventory_stats(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> InventoryAnalytics:
    """Get inventory analytics."""
    return await get_inventory_analytics(db, organization_id)


# =====================================================
# 6. Delivery
# =====================================================

@router.get("/deliveries", response_model=list[DeliveryRead])
async def list_deliveries(purchase_order_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Delivery]:
    """List deliveries."""
    stmt = select(Delivery)
    if purchase_order_id:
        stmt = stmt.where(Delivery.purchase_order_id == purchase_order_id)
    result = await db.execute(stmt.order_by(Delivery.created_at.desc()))
    return result.scalars().all()


@router.post("/deliveries", response_model=DeliveryRead, status_code=status.HTTP_201_CREATED)
async def create_delivery(payload: DeliveryCreate, db: AsyncSession = Depends(get_db)) -> Delivery:
    """Create a delivery."""
    from backend.app.services.modit import make_modit_reference
    
    delivery = Delivery(
        purchase_order_id=payload.purchase_order_id,
        delivery_number=make_modit_reference("DEL"),
        status="pending",
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        dest_lat=payload.dest_lat,
        dest_lng=payload.dest_lng,
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return DeliveryRead.model_validate(delivery)


@router.post(
    "/deliveries/{delivery_id}/pings", response_model=DeliveryPingRead, status_code=status.HTTP_201_CREATED
)
async def create_delivery_ping(
    delivery_id: str,
    payload: DeliveryPingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeliveryPingRead:
    """Rider location heartbeat (driver app). First ping auto-dispatches."""
    ping = await record_delivery_ping(db, delivery_id, payload.latitude, payload.longitude)
    return DeliveryPingRead.model_validate(ping)


@router.get("/deliveries/{delivery_id}/track", response_model=DeliveryTrackRead)
async def track_delivery(delivery_id: str, db: AsyncSession = Depends(get_db)) -> DeliveryTrackRead:
    """Public live-tracking payload (unguessable UUID deep links from SMS/push)."""
    return DeliveryTrackRead.model_validate(await get_delivery_track(db, delivery_id))


@router.get("/drivers", response_model=list[DriverRead])
async def list_drivers(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Driver]:
    """List drivers."""
    stmt = select(Driver).where(Driver.is_active.is_(True), Driver.deleted_at.is_(None))
    if organization_id:
        stmt = stmt.where(Driver.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Driver.full_name.asc()))
    return result.scalars().all()


@router.post("/drivers", response_model=DriverRead, status_code=status.HTTP_201_CREATED)
async def create_driver(payload: DriverCreate, db: AsyncSession = Depends(get_db)) -> Driver:
    """Create a driver."""
    driver = Driver(**payload.model_dump())
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return DriverRead.model_validate(driver)


@router.get("/vehicles", response_model=list[VehicleRead])
async def list_vehicles(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Vehicle]:
    """List vehicles."""
    stmt = select(Vehicle).where(Vehicle.is_active.is_(True), Vehicle.deleted_at.is_(None))
    if organization_id:
        stmt = stmt.where(Vehicle.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Vehicle.registration_number.asc()))
    return result.scalars().all()


@router.post("/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(payload: VehicleCreate, db: AsyncSession = Depends(get_db)) -> Vehicle:
    """Create a vehicle."""
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return VehicleRead.model_validate(vehicle)


# =====================================================
# 7. Projects
# =====================================================

@router.get("/projects", response_model=list[ProjectRead])
async def list_projects(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Project]:
    """List projects."""
    stmt = select(Project)
    if organization_id:
        stmt = stmt.where(Project.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Project.created_at.desc()))
    return result.scalars().all()


@router.post("/projects", response_model=ProjectDetailRead, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(payload: ProjectCreate, db: AsyncSession = Depends(get_db)) -> ProjectDetailRead:
    """Create a project."""
    data = payload.model_dump()
    org_id = data.pop("organization_id", None)
    data.pop("project_code", None)
    project = await create_project(db, org_id, **data)
    await db.commit()
    await db.refresh(project)
    return await project_to_detail(db, project)


@router.get("/projects/{project_id}", response_model=ProjectDetailRead)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)) -> ProjectDetailRead:
    """Get project details."""
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await project_to_detail(db, project)


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def update_project(project_id: str, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)) -> Project:
    """Update project."""
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    await db.commit()
    await db.refresh(project)
    return ProjectRead.model_validate(project)


@router.post("/projects/{project_id}/sites", response_model=ConstructionSiteRead, status_code=status.HTTP_201_CREATED)
async def create_construction_site(project_id: str, payload: ConstructionSiteCreate, db: AsyncSession = Depends(get_db)) -> ConstructionSite:
    """Create a construction site."""
    from backend.app.services.modit import make_modit_reference
    
    site = ConstructionSite(
        project_id=project_id,
        site_code=make_modit_reference("SITE"),
        **payload.model_dump()
    )
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return ConstructionSiteRead.model_validate(site)


@router.get("/projects/{project_id}/material-requests", response_model=list[MaterialRequestRead])
async def list_material_requests(project_id: str, db: AsyncSession = Depends(get_db)) -> list[MaterialRequest]:
    """List material requests for a project."""
    result = await db.execute(
        select(MaterialRequest).where(MaterialRequest.project_id == project_id, MaterialRequest.deleted_at.is_(None)).order_by(MaterialRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/material-requests", response_model=MaterialRequestRead, status_code=status.HTTP_201_CREATED)
async def create_material_request(payload: MaterialRequestCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> MaterialRequest:
    """Create a material request."""
    from backend.app.services.modit import make_modit_reference
    
    mr = MaterialRequest(
        project_id=payload.project_id,
        requested_by_user_id=user.id,
        request_number=make_modit_reference("MR"),
        status="draft",
        required_by_date=payload.required_by_date,
        notes=payload.notes,
    )
    db.add(mr)
    await db.commit()
    await db.refresh(mr)
    return MaterialRequestRead.model_validate(mr)


@router.post("/boq", response_model=BOQRead, status_code=status.HTTP_201_CREATED)
async def create_boq(payload: dict, db: AsyncSession = Depends(get_db)) -> BOQ:
    """Create a BOQ."""
    boq = BOQ(**payload)
    db.add(boq)
    await db.commit()
    await db.refresh(boq)
    return BOQRead.model_validate(boq)


@router.post("/boq/{boq_id}/items", response_model=BOQItemRead, status_code=status.HTTP_201_CREATED)
async def create_boq_item(boq_id: str, payload: BOQItemCreate, db: AsyncSession = Depends(get_db)) -> BOQItem:
    """Add item to BOQ."""
    item = BOQItem(boq_id=boq_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return BOQItemRead.model_validate(item)


# =====================================================
# 8. AI Features
# =====================================================

@router.post("/ai/material-recommendation", response_model=AIMaterialRecommendationResponse)
async def ai_material_recommendation_endpoint(payload: AIMaterialRecommendationRequest, db: AsyncSession = Depends(get_db)) -> AIMaterialRecommendationResponse:
    """AI-powered material recommendation."""
    return await ai_material_recommendation(db, payload.model_dump())


@router.post("/ai/boq-reader", response_model=BOQReaderResponse)
async def ai_boq_reader_endpoint(payload: BOQReaderRequest, db: AsyncSession = Depends(get_db)) -> BOQReaderResponse:
    """AI-powered BOQ document reader."""
    return await ai_boq_reader(db, payload.file_url, payload.project_id)


@router.post("/ai/quote-comparison", response_model=AIQuoteComparisonResponse)
async def ai_quote_comparison_endpoint(rfq_id: str, db: AsyncSession = Depends(get_db)) -> AIQuoteComparisonResponse:
    """AI-powered quotation comparison."""
    return await ai_quote_comparison(db, rfq_id)


@router.post("/ai/vendor-matching", response_model=AIVendorMatchingResponse)
async def ai_vendor_matching_endpoint(payload: AIVendorMatchingRequest, db: AsyncSession = Depends(get_db)) -> AIVendorMatchingResponse:
    """AI-powered vendor matching."""
    return await ai_vendor_matching(db, payload.model_dump())


@router.post("/ai/procurement-assistant", response_model=AIProcurementAssistantResponse)
async def ai_procurement_assistant_endpoint(payload: AIProcurementAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIProcurementAssistantResponse:
    """AI-powered procurement assistant."""
    return await ai_procurement_assistant(db, payload.message, payload.context)


@router.post("/ai/voice-order", response_model=VoiceOrderResponse)
async def ai_voice_order_endpoint(payload: VoiceOrderRequest, db: AsyncSession = Depends(get_db)) -> VoiceOrderResponse:
    """AI-powered voice ordering."""
    return await voice_order_processing(db, payload.transcript, payload.organization_id)


@router.post("/ai/smart-reorder", response_model=SmartReorderResponse)
async def ai_smart_reorder_endpoint(payload: SmartReorderRequest, db: AsyncSession = Depends(get_db)) -> SmartReorderResponse:
    """AI-powered smart reorder suggestions."""
    return await smart_reorder_suggestions(db, payload.organization_id, payload.warehouse_id)


# =====================================================
# 9. Analytics
# =====================================================

@router.get("/analytics/summary", response_model=ModitAnalyticsSummary, dependencies=[admin_dependency])
async def read_modit_analytics_summary(db: AsyncSession = Depends(get_db)) -> ModitAnalyticsSummary:
    """Get MODIT analytics summary."""
    return await analytics_summary(db)


@router.post("/analytics/events", response_model=StandardResponse[str])
async def track_modit_event(
    event_name: str,
    properties: dict | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    """Track an analytics event."""
    event = await track_analytics_event(db, user.id, event_name, properties)
    await db.commit()
    return StandardResponse(message="Event tracked", data=event.event_name)


# =====================================================
# 10. Notifications
# =====================================================

@router.get("/notifications", response_model=list[ModitNotificationRead])
async def list_modit_notifications(
    organization_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[ModitNotification]:
    """List MODIT notifications."""
    result = await db.execute(
        select(ModitNotification)
        .where(ModitNotification.organization_id == organization_id, ModitNotification.deleted_at.is_(None))
        .order_by(ModitNotification.created_at.desc())
    )
    return result.scalars().all()


@router.post("/notifications", response_model=ModitNotificationRead, status_code=status.HTTP_201_CREATED)
async def create_modit_notification_endpoint(
    organization_id: str,
    title: str,
    body: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ModitNotification:
    """Create a MODIT notification."""
    notification = await create_modit_notification(db, organization_id, user.id, title, body)
    await db.commit()
    await db.refresh(notification)
    return notification


# =====================================================
# 11. Support Chat
# =====================================================

@router.post("/support/conversations", response_model=SupportConversationRead, status_code=status.HTTP_201_CREATED)
async def create_support_conversation(
    payload: SupportConversationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SupportConversationRead:
    """Open a support thread, optionally linked to an order for live context."""
    conversation = await create_conversation(db, user.id, payload.subject, payload.order_id)
    return SupportConversationRead.model_validate(conversation)


@router.get("/support/conversations", response_model=list[SupportConversationRead])
async def list_support_conversations(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[SupportConversationRead]:
    """List my support threads."""
    conversations = await list_conversations(db, user.id)
    return [SupportConversationRead.model_validate(c) for c in conversations]


@router.get("/support/conversations/{conversation_id}", response_model=SupportConversationDetailRead)
async def get_support_conversation(
    conversation_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> SupportConversationDetailRead:
    """Thread with messages."""
    conversation, messages = await get_conversation_detail(db, user.id, conversation_id)
    return SupportConversationDetailRead(
        **SupportConversationRead.model_validate(conversation).model_dump(),
        messages=[SupportMessageRead.model_validate(m) for m in messages],
    )


@router.post(
    "/support/conversations/{conversation_id}/messages",
    response_model=SupportMessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def post_support_message(
    conversation_id: str,
    payload: SupportMessageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SupportMessageRead:
    """Send a message; returns the instant bot reply (user msg stored too)."""
    _user_message, bot_message = await post_user_message(db, user.id, conversation_id, payload.body)
    return SupportMessageRead.model_validate(bot_message)


@router.post("/admin/seed-catalog", dependencies=[admin_dependency])
async def seed_catalog_endpoint(db: AsyncSession = Depends(get_db)) -> dict:
    """One-click catalog fill for staff: parses the bundled static catalog and
    upserts org/brands/categories/products/warehouse/inventory. Idempotent —
    safe to re-run; existing rows are updated, never duplicated."""
    from backend.app.seeders.catalog import parse_catalog, seed_catalog

    catalog_path = (
        pathlib.Path(__file__).resolve().parents[4]
        / "apps" / "modit" / "web" / "lib" / "product-data.ts"
    )
    if not catalog_path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bundled catalog not found on server.",
        )
    items = parse_catalog(catalog_path.read_text(encoding="utf-8"))
    stats = await seed_catalog(db, items)
    await db.commit()
    return {"seeded": True, **stats}


def _cart_variant_key(variant_key: str | None) -> str:
    return (variant_key or "").strip()[:100]


async def _get_cart_row(session: AsyncSession, user_id: str, product_id: str, variant_key: str):
    from backend.app.models.modit import CartItem

    stmt = (
        select(CartItem)
        .where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
            CartItem.variant_key == variant_key,
        )
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first()


async def _require_cart_product(session: AsyncSession, product_id: str):
    from backend.app.models.modit import Product

    product = (
        (
            await session.execute(
                select(Product).where(
                    Product.id == product_id,
                    Product.is_active.is_(True),
                    Product.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/cart/items", response_model=list[CartItemRead])
async def list_cart_items(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list:
    """Buyer server cart (cross-device). Guests keep using the local cart."""
    from backend.app.models.modit import CartItem

    rows = (
        (
            await db.execute(
                select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.created_at)
            )
        )
        .scalars()
        .all()
    )
    return [CartItemRead.model_validate(r) for r in rows]


@router.post("/cart/items", response_model=CartItemRead, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    payload: CartItemUpsert, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Add (or top up) one cart row. Quantities add up, never duplicate rows."""
    from backend.app.models.modit import CartItem

    await _require_cart_product(db, payload.product_id)
    key = _cart_variant_key(payload.variant_key)
    row = await _get_cart_row(db, user.id, payload.product_id, key)
    if row is None:
        row = CartItem(
            user_id=user.id,
            product_id=payload.product_id,
            variant_key=key,
            shade=(payload.shade or None),
            quantity=min(float(payload.quantity), 99999.0),
        )
        db.add(row)
    else:
        row.quantity = min(float(row.quantity or 0) + float(payload.quantity), 99999.0)
        if payload.shade:
            row.shade = payload.shade
    await db.commit()
    await db.refresh(row)
    return CartItemRead.model_validate(row)


@router.patch("/cart/items/{item_id}", response_model=CartItemRead)
async def update_cart_item(
    item_id: str, payload: CartQuantityUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Set quantity (use DELETE to remove). Users can only touch their own rows."""
    from backend.app.models.modit import CartItem

    row = await db.get(CartItem, item_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    row.quantity = min(float(payload.quantity), 99999.0)
    await db.commit()
    await db.refresh(row)
    return CartItemRead.model_validate(row)


@router.delete("/cart/items/{item_id}", response_model=StandardResponse[str])
async def delete_cart_item(
    item_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> StandardResponse[str]:
    from backend.app.models.modit import CartItem

    row = await db.get(CartItem, item_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    await db.delete(row)
    await db.commit()
    return StandardResponse(message="Cart item removed", data=item_id)


@router.delete("/cart", response_model=StandardResponse[str])
async def clear_cart(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> StandardResponse[str]:
    from backend.app.models.modit import CartItem

    rows = (
        (await db.execute(select(CartItem).where(CartItem.user_id == user.id))).scalars().all()
    )
    for row in rows:
        await db.delete(row)
    await db.commit()
    return StandardResponse(message="Cart cleared", data=user.id)


@router.post("/cart/merge", response_model=list[CartItemRead])
async def merge_cart(
    payload: CartMergeRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list:
    """Merge a guest/local cart into the server cart on login. Unknown
    products are skipped; quantities add up (capped). Returns the full cart."""
    from backend.app.models.modit import CartItem

    for item in payload.items[:100]:
        try:
            await _require_cart_product(db, item.product_id)
        except HTTPException:
            continue
        key = _cart_variant_key(item.variant_key)
        row = await _get_cart_row(db, user.id, item.product_id, key)
        if row is None:
            db.add(
                CartItem(
                    user_id=user.id,
                    product_id=item.product_id,
                    variant_key=key,
                    shade=(item.shade or None),
                    quantity=min(float(item.quantity), 99999.0),
                )
            )
        else:
            row.quantity = min(float(row.quantity or 0) + float(item.quantity), 99999.0)
    await db.commit()
    rows = (
        (
            await db.execute(
                select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.created_at)
            )
        )
        .scalars()
        .all()
    )
    return [CartItemRead.model_validate(r) for r in rows]
