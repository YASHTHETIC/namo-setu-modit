from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from backend.app.models.base import BaseModel
from backend.app.models.enums import (
    DeliveryStatus,
    InventoryStatus,
    OrganizationType,
    OrderStatus,
    ProductCode,
    ProjectStatus,
    QuotationStatus,
    RFQStatus,
    ReturnStatus,
    TransactionType,
)


class Organization(BaseModel):
    __tablename__ = "modit_organizations"
    __table_args__ = (
        UniqueConstraint("registration_number", name="uq_modit_org_registration_number"),
        Index("ix_modit_org_type_status", "organization_type", "is_active"),
    )

    owner_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    organization_type: Mapped[str] = mapped_column(String(30), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    gst_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    billing_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    settings_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner = relationship("User", back_populates="owned_organizations")
    users = relationship("OrganizationUser", back_populates="organization", cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="organization")
    warehouses = relationship("Warehouse", back_populates="organization", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="organization", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="organization")
    orders = relationship("Order", back_populates="organization")
    rfqs = relationship("RFQ", back_populates="organization")
    projects = relationship("Project", back_populates="organization")
    wallets = relationship("Wallet", back_populates="organization", cascade="all, delete-orphan")
    credit_accounts = relationship("CreditAccount", back_populates="organization", cascade="all, delete-orphan")
    notifications = relationship("ModitNotification", back_populates="organization")
    teams = relationship("OrganizationTeam", back_populates="organization", cascade="all, delete-orphan")
    invitations = relationship("OrganizationInvitation", back_populates="organization", cascade="all, delete-orphan")


class OrganizationUser(BaseModel):
    __tablename__ = "modit_organization_users"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_modit_org_user"),
        Index("ix_modit_org_users_org_role", "organization_id", "role_name"),
    )

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization", back_populates="users")
    user = relationship("User", back_populates="organization_memberships")


class OrganizationTeam(BaseModel):
    __tablename__ = "organization_teams"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_organization_teams_code"),
        Index("ix_organization_teams_org_active", "organization_id", "is_active"),
    )

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="teams")
    created_by = relationship("User")
    members = relationship("OrganizationTeamMember", back_populates="team", cascade="all, delete-orphan")


class OrganizationTeamMember(BaseModel):
    __tablename__ = "organization_team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_membership"),)

    team_id: Mapped[str] = mapped_column(ForeignKey("organization_teams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    team = relationship("OrganizationTeam", back_populates="members")
    user = relationship("User")


class OrganizationInvitation(BaseModel):
    __tablename__ = "organization_invitations"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_org_invitation_email"),
        Index("ix_org_invitations_org_status", "organization_id", "status"),
    )

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[str | None] = mapped_column(ForeignKey("organization_teams.id", ondelete="SET NULL"), nullable=True)
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="invitations")
    team = relationship("OrganizationTeam")
    invited_by = relationship("User")


class Builder(BaseModel):
    __tablename__ = "builders"
    __table_args__ = (UniqueConstraint("organization_id", name="uq_builders_org"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    builder_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    accreditation_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")


class Contractor(BaseModel):
    __tablename__ = "contractors"
    __table_args__ = (UniqueConstraint("organization_id", name="uq_contractors_org"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    contractor_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")


class Architect(BaseModel):
    __tablename__ = "architects"
    __table_args__ = (UniqueConstraint("organization_id", name="uq_architects_org"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    architect_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    council_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")


class Retailer(BaseModel):
    __tablename__ = "retailers"
    __table_args__ = (UniqueConstraint("organization_id", name="uq_retailers_org"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    retailer_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")


class Supplier(BaseModel):
    __tablename__ = "suppliers"
    __table_args__ = (UniqueConstraint("organization_id", name="uq_suppliers_org"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    supplier_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")
    vendors = relationship("Vendor", back_populates="supplier", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="supplier")


class Vendor(BaseModel):
    __tablename__ = "vendors"
    __table_args__ = (Index("ix_vendors_supplier_active", "supplier_id", "is_active"),)

    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    vendor_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    supplier = relationship("Supplier", back_populates="vendors")


class Warehouse(BaseModel):
    __tablename__ = "warehouses"
    __table_args__ = (Index("ix_warehouses_org_city", "organization_id", "city_id"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    warehouse_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="warehouses")
    supplier = relationship("Supplier", back_populates="warehouses")
    inventory = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")


class Brand(BaseModel):
    __tablename__ = "brands"
    __table_args__ = (UniqueConstraint("name", name="uq_brands_name"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="brand")


class Category(BaseModel):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("slug", name="uq_categories_slug"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    parent_category = relationship("Category", remote_side="Category.id", back_populates="child_categories")
    child_categories = relationship("Category", back_populates="parent_category")
    sub_categories = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="category")


class SubCategory(BaseModel):
    __tablename__ = "sub_categories"
    __table_args__ = (UniqueConstraint("category_id", "slug", name="uq_sub_categories_category_slug"),)

    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("Category", back_populates="sub_categories")


class Unit(BaseModel):
    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("code", name="uq_units_code"),)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    symbol: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class GST(BaseModel):
    __tablename__ = "gst"
    __table_args__ = (UniqueConstraint("code", name="uq_gst_code"),)

    code: Mapped[str] = mapped_column(String(20), nullable=False)
    rate_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Product(BaseModel):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("organization_id", "sku", name="uq_products_org_sku"),
        Index("ix_products_category_brand", "category_id", "brand_id"),
        Index("ix_products_status", "is_active", "approval_status"),
    )

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    brand_id: Mapped[str | None] = mapped_column(ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    sub_category_id: Mapped[str | None] = mapped_column(ForeignKey("sub_categories.id", ondelete="SET NULL"), nullable=True)
    unit_id: Mapped[str] = mapped_column(ForeignKey("units.id", ondelete="RESTRICT"), nullable=False)
    gst_id: Mapped[str | None] = mapped_column(ForeignKey("gst.id", ondelete="SET NULL"), nullable=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    specification_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    mrp: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    list_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    approval_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="products")
    supplier = relationship("Supplier")
    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    sub_category = relationship("SubCategory")
    unit = relationship("Unit")
    gst = relationship("GST")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    quotation_items = relationship("QuotationItem", back_populates="product")
    material_requests = relationship("MaterialRequestItem", back_populates="product")
    boq_items = relationship("BOQItem", back_populates="product")

    @validates("sku", "name", "slug")
    def validate_required(self, key: str, value: str) -> str:
        if not value or not value.strip():
            raise ValueError(f"{key} cannot be empty")
        return value.strip()


class ProductImage(BaseModel):
    __tablename__ = "product_images"
    __table_args__ = (Index("ix_product_images_product_primary", "product_id", "is_primary"),)

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    media_id: Mapped[str] = mapped_column(ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    product = relationship("Product", back_populates="images")
    media = relationship("MediaAsset")


class Inventory(BaseModel):
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_id", name="uq_inventory_warehouse_product"),
        Index("ix_inventory_product_status", "product_id", "status"),
        CheckConstraint("quantity_on_hand >= 0", name="ck_inventory_quantity_on_hand_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="ck_inventory_reserved_quantity_non_negative"),
    )

    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=InventoryStatus.IN_STOCK.value, nullable=False)
    last_restocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    warehouse = relationship("Warehouse", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")


class RFQ(BaseModel):
    __tablename__ = "rfq"
    __table_args__ = (Index("ix_rfq_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    rfq_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=RFQStatus.OPEN.value, nullable=False)
    requested_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization = relationship("Organization", back_populates="rfqs")
    project = relationship("Project", back_populates="rfqs")
    requested_by = relationship("User")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")
    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete-orphan")


class RFQItem(BaseModel):
    __tablename__ = "rfq_items"
    __table_args__ = (Index("ix_rfq_items_rfq_product", "rfq_id", "product_id"),)

    rfq_id: Mapped[str] = mapped_column(ForeignKey("rfq.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    requested_quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price_hint: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    rfq = relationship("RFQ", back_populates="items")
    product = relationship("Product")


class Quotation(BaseModel):
    __tablename__ = "quotation"
    __table_args__ = (Index("ix_quotation_rfq_status", "rfq_id", "status"),)

    rfq_id: Mapped[str] = mapped_column(ForeignKey("rfq.id", ondelete="CASCADE"), nullable=False)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    quotation_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=QuotationStatus.DRAFT.value, nullable=False)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    gst_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    terms_and_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)

    rfq = relationship("RFQ", back_populates="quotations")
    supplier = relationship("Supplier")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")


class QuotationItem(BaseModel):
    __tablename__ = "quotation_items"
    __table_args__ = (Index("ix_quotation_items_quotation_product", "quotation_id", "product_id"),)

    quotation_id: Mapped[str] = mapped_column(ForeignKey("quotation.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    gst_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product", back_populates="quotation_items")


class Project(BaseModel):
    __tablename__ = "projects"
    __table_args__ = (Index("ix_projects_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    project_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.PLANNED.value, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization = relationship("Organization", back_populates="projects")
    construction_sites = relationship("ConstructionSite", back_populates="project", cascade="all, delete-orphan")
    material_requests = relationship("MaterialRequest", back_populates="project", cascade="all, delete-orphan")
    rfqs = relationship("RFQ", back_populates="project")
    purchase_orders = relationship("PurchaseOrder", back_populates="project")
    boq = relationship("BOQ", back_populates="project", cascade="all, delete-orphan")


class ConstructionSite(BaseModel):
    __tablename__ = "construction_sites"
    __table_args__ = (Index("ix_sites_project_city", "project_id", "city_id"),)

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    site_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.PLANNED.value, nullable=False)

    project = relationship("Project", back_populates="construction_sites")


class MaterialRequest(BaseModel):
    __tablename__ = "material_requests"
    __table_args__ = (Index("ix_material_requests_project_status", "project_id", "status"),)

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    requested_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    request_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    required_by_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    project = relationship("Project", back_populates="material_requests")
    requested_by = relationship("User")
    items = relationship("MaterialRequestItem", back_populates="request", cascade="all, delete-orphan")


class MaterialRequestItem(BaseModel):
    __tablename__ = "material_request_items"
    __table_args__ = (Index("ix_material_request_items_request_product", "material_request_id", "product_id"),)

    material_request_id: Mapped[str] = mapped_column(ForeignKey("material_requests.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_id: Mapped[str] = mapped_column(ForeignKey("units.id", ondelete="RESTRICT"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    request = relationship("MaterialRequest", back_populates="items")
    product = relationship("Product", back_populates="material_requests")
    unit = relationship("Unit")


class BOQ(BaseModel):
    __tablename__ = "boq"
    __table_args__ = (Index("ix_boq_project_version", "project_id", "version_number"),)

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.PLANNED.value, nullable=False)

    project = relationship("Project", back_populates="boq")
    items = relationship("BOQItem", back_populates="boq", cascade="all, delete-orphan")


class BOQItem(BaseModel):
    __tablename__ = "boq_items"
    __table_args__ = (Index("ix_boq_items_boq_product", "boq_id", "product_id"),)

    boq_id: Mapped[str] = mapped_column(ForeignKey("boq.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_id: Mapped[str] = mapped_column(ForeignKey("units.id", ondelete="RESTRICT"), nullable=False)
    rate: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    boq = relationship("BOQ", back_populates="items")
    product = relationship("Product", back_populates="boq_items")
    unit = relationship("Unit")


class PurchaseOrder(BaseModel):
    __tablename__ = "purchase_orders"
    __table_args__ = (Index("ix_purchase_orders_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    rfq_id: Mapped[str | None] = mapped_column(ForeignKey("rfq.id", ondelete="SET NULL"), nullable=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=OrderStatus.DRAFT.value, nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)

    organization = relationship("Organization")
    project = relationship("Project", back_populates="purchase_orders")
    rfq = relationship("RFQ")
    items = relationship("OrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    payments = relationship("ModitPayment", back_populates="purchase_order", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="purchase_order", cascade="all, delete-orphan")
    returns = relationship("Return", back_populates="purchase_order", cascade="all, delete-orphan")


class Order(BaseModel):
    __tablename__ = "orders"
    __table_args__ = (Index("ix_orders_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    purchase_order_id: Mapped[str | None] = mapped_column(ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=OrderStatus.PLACED.value, nullable=False)
    placed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization = relationship("Organization", back_populates="orders")
    purchase_order = relationship("PurchaseOrder")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(BaseModel):
    __tablename__ = "order_items"
    __table_args__ = (Index("ix_order_items_order_product", "order_id", "product_id"),)

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    purchase_order_id: Mapped[str | None] = mapped_column(ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    gst_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Invoice(BaseModel):
    __tablename__ = "invoices"
    __table_args__ = (Index("ix_invoices_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    gst_total: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)

    organization = relationship("Organization", back_populates="invoices")
    order = relationship("Order")
    payments = relationship("ModitPayment", back_populates="invoice")


class ModitPayment(BaseModel):
    __tablename__ = "modit_payments"
    __table_args__ = (Index("ix_modit_payments_org_status", "organization_id", "payment_status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    purchase_order_id: Mapped[str | None] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=True)
    invoice_id: Mapped[str | None] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=True)
    payment_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), default=TransactionType.DEBIT.value, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization")
    purchase_order = relationship("PurchaseOrder", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    transactions = relationship("Transaction", back_populates="payment", cascade="all, delete-orphan")


class Transaction(BaseModel):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_payment_type", "payment_id", "transaction_type"),)

    payment_id: Mapped[str] = mapped_column(ForeignKey("modit_payments.id", ondelete="CASCADE"), nullable=False)
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    provider_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    payment = relationship("ModitPayment", back_populates="transactions")


class Delivery(BaseModel):
    __tablename__ = "delivery"
    __table_args__ = (Index("ix_delivery_order_status", "purchase_order_id", "status"),)

    purchase_order_id: Mapped[str] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    delivery_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=DeliveryStatus.PENDING.value, nullable=False)
    driver_id: Mapped[str | None] = mapped_column(ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    vehicle_id: Mapped[str | None] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="deliveries")
    driver = relationship("Driver", back_populates="deliveries")
    vehicle = relationship("Vehicle", back_populates="deliveries")


class Driver(BaseModel):
    __tablename__ = "drivers"
    __table_args__ = (Index("ix_drivers_org_active", "organization_id", "is_active"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    deliveries = relationship("Delivery", back_populates="driver")


class Vehicle(BaseModel):
    __tablename__ = "vehicles"
    __table_args__ = (Index("ix_vehicles_org_active", "organization_id", "is_active"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity_kg: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    deliveries = relationship("Delivery", back_populates="vehicle")


class Return(BaseModel):
    __tablename__ = "returns"
    __table_args__ = (Index("ix_returns_order_status", "purchase_order_id", "status"),)

    purchase_order_id: Mapped[str] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    return_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ReturnStatus.REQUESTED.value, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="returns")


class CreditAccount(BaseModel):
    __tablename__ = "credit_accounts"
    __table_args__ = (Index("ix_credit_accounts_org_status", "organization_id", "is_active"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    credit_limit: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    available_credit: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    due_days: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="credit_accounts")


class Wallet(BaseModel):
    __tablename__ = "wallets"
    __table_args__ = (Index("ix_wallets_org_currency", "organization_id", "currency"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    reserved_balance: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="wallets")


class ModitNotification(BaseModel):
    __tablename__ = "modit_notifications"
    __table_args__ = (Index("ix_modit_notifications_org_status", "organization_id", "status"),)

    organization_id: Mapped[str] = mapped_column(ForeignKey("modit_organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="queued", nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="notifications")
    user = relationship("User")


class ModitReview(BaseModel):
    __tablename__ = "modit_reviews"
    __table_args__ = (Index("ix_modit_reviews_target", "target_type", "target_id"),)

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
