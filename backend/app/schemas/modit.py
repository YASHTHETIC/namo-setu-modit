from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class ModitPage(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int


class ModitListResponse(ModitPage):
    items: list[Any]


# Organization
class OrganizationBase(BaseModel):
    name: str
    legal_name: str | None = None
    organization_type: str
    registration_number: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    website_url: str | None = None
    billing_email: str | None = None
    settings_json: str | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationRead(ORMModel):
    id: str
    owner_user_id: str | None
    name: str
    legal_name: str | None
    organization_type: str
    registration_number: str | None
    gst_number: str | None
    pan_number: str | None
    website_url: str | None
    is_active: bool
    billing_email: str | None
    settings_json: str | None
    created_at: datetime


# Product Catalog
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    parent_category_id: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(ORMModel):
    id: str
    name: str
    slug: str
    description: str | None
    parent_category_id: str | None
    is_active: bool
    created_at: datetime


class SubCategoryBase(BaseModel):
    category_id: str
    name: str
    slug: str
    description: str | None = None


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategoryRead(ORMModel):
    id: str
    category_id: str
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime


class BrandBase(BaseModel):
    name: str
    slug: str
    description: str | None = None


class BrandCreate(BrandBase):
    pass


class BrandRead(ORMModel):
    id: str
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime


class UnitBase(BaseModel):
    name: str
    code: str
    symbol: str | None = None


class UnitCreate(UnitBase):
    pass


class UnitRead(ORMModel):
    id: str
    name: str
    code: str
    symbol: str | None
    is_active: bool
    created_at: datetime


class GSTBase(BaseModel):
    code: str
    rate_percent: float
    description: str | None = None


class GSTCreate(GSTBase):
    pass


class GSTRead(ORMModel):
    id: str
    code: str
    rate_percent: float
    description: str | None
    is_active: bool
    created_at: datetime


class ProductBase(BaseModel):
    organization_id: str
    supplier_id: str | None = None
    brand_id: str | None = None
    category_id: str
    sub_category_id: str | None = None
    unit_id: str
    gst_id: str | None = None
    sku: str
    name: str
    slug: str
    description: str | None = None
    specification_json: str | None = None
    mrp: float | None = None
    list_price: float
    approval_status: str = "pending"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    specification_json: str | None = None
    mrp: float | None = None
    list_price: float | None = None
    approval_status: str | None = None
    is_active: bool | None = None


class ProductRead(ORMModel):
    id: str
    organization_id: str
    supplier_id: str | None
    brand_id: str | None
    category_id: str
    sub_category_id: str | None
    unit_id: str
    gst_id: str | None
    sku: str
    name: str
    slug: str
    description: str | None
    specification_json: str | None
    mrp: float | None
    list_price: float
    approval_status: str
    is_active: bool
    created_at: datetime


class ProductDetailRead(ProductRead):
    brand: BrandRead | None
    category: CategoryRead
    sub_category: SubCategoryRead | None
    unit: UnitRead
    gst: GSTRead | None
    images: list[dict]


class ProductImageBase(BaseModel):
    product_id: str
    media_id: str
    caption: str | None = None
    sort_order: int = 0
    is_primary: bool = False


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageRead(ORMModel):
    id: str
    product_id: str
    media_id: str
    caption: str | None
    sort_order: int
    is_primary: bool
    created_at: datetime


class ProductSearchResponse(ModitListResponse):
    items: list[ProductRead]
    filters: dict[str, list[str]]


# Supplier
class SupplierBase(BaseModel):
    organization_id: str
    supplier_code: str


class SupplierCreate(SupplierBase):
    pass


class SupplierRead(ORMModel):
    id: str
    organization_id: str
    supplier_code: str
    is_verified: bool
    created_at: datetime


class VendorBase(BaseModel):
    supplier_id: str
    vendor_code: str
    name: str
    contact_phone: str | None = None
    contact_email: str | None = None


class VendorCreate(VendorBase):
    pass


class VendorRead(ORMModel):
    id: str
    supplier_id: str
    vendor_code: str
    name: str
    contact_phone: str | None
    contact_email: str | None
    is_active: bool
    created_at: datetime


class WarehouseBase(BaseModel):
    organization_id: str
    supplier_id: str | None = None
    city_id: str
    warehouse_code: str
    name: str
    address_line1: str
    address_line2: str | None = None
    pincode: str


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseRead(ORMModel):
    id: str
    organization_id: str
    supplier_id: str | None
    city_id: str
    warehouse_code: str
    name: str
    address_line1: str
    address_line2: str | None
    pincode: str
    is_active: bool
    created_at: datetime


# Inventory
class InventoryBase(BaseModel):
    warehouse_id: str
    product_id: str
    quantity_on_hand: int = 0
    reserved_quantity: int = 0
    reorder_level: int = 0
    status: str = "in_stock"


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity_on_hand: int | None = None
    reserved_quantity: int | None = None
    reorder_level: int | None = None
    status: str | None = None


class InventoryRead(ORMModel):
    id: str
    warehouse_id: str
    product_id: str
    quantity_on_hand: int
    reserved_quantity: int
    reorder_level: int
    status: str
    last_restocked_at: datetime | None
    created_at: datetime


class InventoryAlert(BaseModel):
    product_id: str
    product_name: str
    warehouse_id: str
    warehouse_name: str
    current_stock: int
    reorder_level: int
    alert_type: str


class InventoryAnalytics(BaseModel):
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    total_value: float
    warehouse_breakdown: list[dict]


# RFQ
class RFQBase(BaseModel):
    organization_id: str
    project_id: str | None = None
    due_date: date | None = None
    notes: str | None = None


class RFQCreate(RFQBase):
    pass


class RFQRead(ORMModel):
    id: str
    organization_id: str
    project_id: str | None
    rfq_number: str
    status: str
    requested_by_user_id: str
    due_date: date | None
    notes: str | None
    created_at: datetime


class RFQItemBase(BaseModel):
    rfq_id: str
    product_id: str
    requested_quantity: float
    unit_price_hint: float | None = None
    notes: str | None = None


class RFQItemCreate(RFQItemBase):
    pass


class RFQItemRead(ORMModel):
    id: str
    rfq_id: str
    product_id: str
    requested_quantity: float
    unit_price_hint: float | None
    notes: str | None
    created_at: datetime


class RFQDetailRead(RFQRead):
    items: list[RFQItemRead]
    quotations: list[dict]


# Quotation
class QuotationBase(BaseModel):
    rfq_id: str
    supplier_id: str
    valid_until: date | None = None
    terms_and_conditions: str | None = None


class QuotationCreate(QuotationBase):
    pass


class QuotationRead(ORMModel):
    id: str
    rfq_id: str
    supplier_id: str
    quotation_number: str
    status: str
    valid_until: date | None
    subtotal: float
    gst_total: float
    grand_total: float
    terms_and_conditions: str | None
    created_at: datetime


class QuotationItemBase(BaseModel):
    quotation_id: str
    product_id: str
    quantity: float
    unit_price: float
    gst_amount: float
    line_total: float


class QuotationItemCreate(QuotationItemBase):
    pass


class QuotationItemRead(ORMModel):
    id: str
    quotation_id: str
    product_id: str
    quantity: float
    unit_price: float
    gst_amount: float
    line_total: float
    created_at: datetime


class QuotationDetailRead(QuotationRead):
    items: list[QuotationItemRead]


# Orders
class OrderBase(BaseModel):
    organization_id: str
    purchase_order_id: str | None = None
    notes: str | None = None


class OrderCreate(OrderBase):
    pass


class OrderRead(ORMModel):
    id: str
    organization_id: str
    purchase_order_id: str | None
    order_number: str
    status: str
    placed_at: datetime
    notes: str | None
    created_at: datetime


class OrderItemBase(BaseModel):
    order_id: str
    purchase_order_id: str | None = None
    product_id: str
    quantity: float
    unit_price: float
    gst_amount: float
    line_total: float


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemRead(ORMModel):
    id: str
    order_id: str
    purchase_order_id: str | None
    product_id: str
    quantity: float
    unit_price: float
    gst_amount: float
    line_total: float
    created_at: datetime


class OrderDetailRead(OrderRead):
    items: list[OrderItemRead]


class PurchaseOrderBase(BaseModel):
    organization_id: str
    project_id: str | None = None
    rfq_id: str | None = None
    expected_delivery_date: date | None = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderRead(ORMModel):
    id: str
    organization_id: str
    project_id: str | None
    rfq_id: str | None
    order_number: str
    status: str
    order_date: date
    expected_delivery_date: date | None
    total_amount: float
    created_at: datetime


class CartItem(BaseModel):
    product_id: str
    quantity: float
    unit_price: float


class CartCreate(BaseModel):
    items: list[CartItem]
    organization_id: str
    project_id: str | None = None


class CartRead(BaseModel):
    items: list[dict]
    subtotal: float
    gst_total: float
    grand_total: float


# Invoice
class InvoiceBase(BaseModel):
    organization_id: str
    order_id: str | None = None
    due_date: date | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceRead(ORMModel):
    id: str
    organization_id: str
    order_id: str | None
    invoice_number: str
    status: str
    invoice_date: date
    due_date: date | None
    subtotal: float
    gst_total: float
    grand_total: float
    created_at: datetime


# Projects
class ProjectBase(BaseModel):
    organization_id: str
    project_code: str
    name: str
    start_date: date | None = None
    end_date: date | None = None
    budget_amount: float | None = None
    notes: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget_amount: float | None = None
    notes: str | None = None


class ProjectRead(ORMModel):
    id: str
    organization_id: str
    project_code: str
    name: str
    status: str
    start_date: date | None
    end_date: date | None
    budget_amount: float | None
    notes: str | None
    created_at: datetime


class ConstructionSiteBase(BaseModel):
    project_id: str
    city_id: str
    site_code: str
    name: str
    address_line1: str
    address_line2: str | None = None
    pincode: str


class ConstructionSiteCreate(ConstructionSiteBase):
    pass


class ConstructionSiteRead(ORMModel):
    id: str
    project_id: str
    city_id: str
    site_code: str
    name: str
    address_line1: str
    address_line2: str | None
    pincode: str
    status: str
    created_at: datetime


class MaterialRequestBase(BaseModel):
    project_id: str
    required_by_date: date | None = None
    notes: str | None = None


class MaterialRequestCreate(MaterialRequestBase):
    pass


class MaterialRequestRead(ORMModel):
    id: str
    project_id: str
    requested_by_user_id: str
    request_number: str
    status: str
    required_by_date: date | None
    notes: str | None
    created_at: datetime


class MaterialRequestItemBase(BaseModel):
    material_request_id: str
    product_id: str
    quantity: float
    unit_id: str
    notes: str | None = None


class MaterialRequestItemCreate(MaterialRequestItemBase):
    pass


class MaterialRequestItemRead(ORMModel):
    id: str
    material_request_id: str
    product_id: str
    quantity: float
    unit_id: str
    notes: str | None
    created_at: datetime


class BOQBase(BaseModel):
    project_id: str
    version_number: int
    title: str


class BOQCreate(BOQBase):
    pass


class BOQRead(ORMModel):
    id: str
    project_id: str
    version_number: int
    title: str
    status: str
    created_at: datetime


class BOQItemBase(BaseModel):
    boq_id: str
    product_id: str
    quantity: float
    unit_id: str
    rate: float | None = None


class BOQItemCreate(BOQItemBase):
    pass


class BOQItemRead(ORMModel):
    id: str
    boq_id: str
    product_id: str
    quantity: float
    unit_id: str
    rate: float | None
    created_at: datetime


class ProjectDetailRead(ProjectRead):
    construction_sites: list[ConstructionSiteRead]
    material_requests: list[MaterialRequestRead]
    boq: list[BOQRead]


# Delivery
class DeliveryBase(BaseModel):
    purchase_order_id: str
    driver_id: str | None = None
    vehicle_id: str | None = None


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryRead(ORMModel):
    id: str
    purchase_order_id: str
    delivery_number: str
    status: str
    driver_id: str | None
    vehicle_id: str | None
    dispatched_at: datetime | None
    delivered_at: datetime | None
    created_at: datetime


class DriverBase(BaseModel):
    organization_id: str
    full_name: str
    phone_number: str
    license_number: str | None = None


class DriverCreate(DriverBase):
    pass


class DriverRead(ORMModel):
    id: str
    organization_id: str
    full_name: str
    phone_number: str
    license_number: str | None
    is_active: bool
    created_at: datetime


class VehicleBase(BaseModel):
    organization_id: str
    registration_number: str
    vehicle_type: str
    capacity_kg: float | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleRead(ORMModel):
    id: str
    organization_id: str
    registration_number: str
    vehicle_type: str
    capacity_kg: float | None
    is_active: bool
    created_at: datetime


# Returns
class ReturnBase(BaseModel):
    purchase_order_id: str
    reason: str | None = None


class ReturnCreate(ReturnBase):
    pass


class ReturnRead(ORMModel):
    id: str
    purchase_order_id: str
    return_number: str
    status: str
    requested_at: datetime
    reason: str | None
    approved_at: datetime | None
    created_at: datetime


# AI Features
class AIMaterialRecommendationRequest(BaseModel):
    project_type: str
    budget: float | None = None
    location: str | None = None
    requirements: str


class AIMaterialRecommendationResponse(BaseModel):
    recommendations: list[dict]
    estimated_cost: float
    alternatives: list[dict]
    reasoning: str


class BOQReaderRequest(BaseModel):
    file_url: str
    project_id: str


class BOQReaderResponse(BaseModel):
    items: list[dict]
    total_estimated_cost: float
    confidence_score: float
    extracted_text: str


class AIQuoteComparisonRequest(BaseModel):
    rfq_id: str


class AIQuoteComparisonResponse(BaseModel):
    comparison: list[dict]
    best_value: dict
    recommendations: list[str]
    savings_potential: float


class AIVendorMatchingRequest(BaseModel):
    product_id: str
    quantity: float
    location: str
    required_by: date


class AIVendorMatchingResponse(BaseModel):
    matched_vendors: list[dict]
    ranking_criteria: list[str]
    top_recommendation: dict


class AIPricePredictionRequest(BaseModel):
    product_id: str
    quantity: float
    time_horizon_days: int = 30


class AIPricePredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    price_trend: str
    factors: list[str]


class AIProcurementAssistantRequest(BaseModel):
    message: str
    context: dict | None = None


class AIProcurementAssistantResponse(BaseModel):
    answer: str
    suggested_actions: list[str]
    relevant_data: list[dict]


class VoiceOrderRequest(BaseModel):
    transcript: str
    organization_id: str


class VoiceOrderResponse(BaseModel):
    order_items: list[dict]
    confidence: float
    confirmation_message: str


class SmartReorderRequest(BaseModel):
    organization_id: str
    warehouse_id: str | None = None


class SmartReorderResponse(BaseModel):
    reorder_suggestions: list[dict]
    total_estimated_cost: float
    urgency_levels: list[str]


class AIDemandForecastingRequest(BaseModel):
    product_id: str
    forecast_days: int = 90


class AIDemandForecastingResponse(BaseModel):
    forecast: list[dict]
    seasonality_factors: list[str]
    confidence_interval: dict


class AIInventoryForecastingRequest(BaseModel):
    warehouse_id: str
    forecast_days: int = 90


class AIInventoryForecastingResponse(BaseModel):
    inventory_projection: list[dict]
    stockout_risks: list[dict]
    optimization_suggestions: list[str]


# Analytics
class ModitAnalyticsSummary(BaseModel):
    total_organizations: int
    total_products: int
    total_suppliers: int
    total_orders: int
    total_revenue: float
    active_projects: int
    pending_rfqs: int
    low_stock_items: int


class RevenueAnalytics(BaseModel):
    period: str
    total_revenue: float
    revenue_by_category: list[dict]
    revenue_by_supplier: list[dict]
    growth_rate: float


class OrderAnalytics(BaseModel):
    total_orders: int
    orders_by_status: dict[str, int]
    average_order_value: float
    top_products: list[dict]


class SupplierAnalytics(BaseModel):
    total_suppliers: int
    active_suppliers: int
    supplier_performance: list[dict]
    top_suppliers: list[dict]


# Notifications
class ModitNotificationRead(ORMModel):
    id: str
    organization_id: str
    user_id: str | None = None
    channel: str
    title: str
    body: str
    status: str
    scheduled_at: datetime | None = None
    created_at: datetime
