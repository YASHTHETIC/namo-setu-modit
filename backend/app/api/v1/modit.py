from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
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
    CartRead,
    CategoryRead,
    ConstructionSiteCreate,
    ConstructionSiteRead,
    DeliveryCreate,
    DeliveryRead,
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
    OrderCreate,
    OrderDetailRead,
    OrderItemCreate,
    OrderRead,
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
    SmartReorderResponse,
    SmartReorderRequest,
    SubCategoryCreate,
    SubCategoryRead,
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
    track_analytics_event,
    voice_order_processing,
)

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
    db: AsyncSession = Depends(get_db),
) -> ProductSearchResponse:
    """List products with search and filters."""
    items, total, suggestions = await search_products(
        db, query=search, category_id=category_id, brand_id=brand_id, page=page, page_size=page_size
    )
    return ProductSearchResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        pages=_pages(total, page_size),
        filters={"category": [], "brand": []},
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


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(product_id: str, payload: ProductUpdate, db: AsyncSession = Depends(get_db)) -> ProductRead:
    """Update product."""
    product = await get_product_or_404(db, product_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return await product_to_read(db, product)


@router.delete("/products/{product_id}", response_model=StandardResponse[str])
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
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[Category]:
    """List all categories."""
    result = await db.execute(select(Category).where(Category.is_active.is_(True), Category.deleted_at.is_(None)).order_by(Category.name.asc()))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_category(payload: dict, db: AsyncSession = Depends(get_db)) -> Category:
    """Create a category."""
    category = Category(**payload)
    db.add(category)
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

    for item in payload.items:
        product = await db.get(Product, item.product_id)
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


@router.get("/orders", response_model=list[OrderRead])
async def list_orders(organization_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[OrderRead]:
    """List orders."""
    stmt = select(Order)
    if organization_id:
        stmt = stmt.where(Order.organization_id == organization_id)
    result = await db.execute(stmt.order_by(Order.created_at.desc()))
    return [OrderRead.model_validate(item) for item in result.scalars().all()]


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
    """Get order details."""
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    await db.refresh(order, ["items"])
    return OrderDetailRead(
        **OrderRead.model_validate(order).model_dump(),
        items=[OrderItemRead.model_validate(item) for item in order.items],
    )


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


# =====================================================
# 5. Inventory
# =====================================================

@router.get("/inventory", response_model=list[InventoryRead])
async def list_inventory(warehouse_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[Inventory]:
    """List inventory."""
    stmt = select(Inventory)
    if warehouse_id:
        stmt = stmt.where(Inventory.warehouse_id == warehouse_id)
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
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return DeliveryRead.model_validate(delivery)


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
