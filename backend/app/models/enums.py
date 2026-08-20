from enum import StrEnum


class ProductCode(StrEnum):
    MODIT = "modit"


class RecordStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class UserStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
    LOCKED = "locked"


class AddressType(StrEnum):
    HOME = "home"
    WORK = "work"
    BILLING = "billing"
    SHIPPING = "shipping"


class AddressOwnerType(StrEnum):
    USER = "user"
    ORGANIZATION = "organization"


class MediaType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"


class DocumentType(StrEnum):
    ID_PROOF = "id_proof"
    INVOICE = "invoice"
    RECEIPT = "receipt"
    LICENSE = "license"
    OTHER = "other"


class NotificationChannel(StrEnum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    PUSH = "push"


class NotificationStatus(StrEnum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class AIMessageRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class OrganizationType(StrEnum):
    BUILDER = "builder"
    CONTRACTOR = "contractor"
    ARCHITECT = "architect"
    RETAILER = "retailer"
    SUPPLIER = "supplier"
    VENDOR = "vendor"
    CUSTOMER = "customer"


class InventoryStatus(StrEnum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class OrderStatus(StrEnum):
    DRAFT = "draft"
    PLACED = "placed"
    ACCEPTED = "accepted"
    PACKED = "packed"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class RFQStatus(StrEnum):
    OPEN = "open"
    SENT = "sent"
    QUOTED = "quoted"
    AWARDED = "awarded"
    CLOSED = "closed"


class QuotationStatus(StrEnum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ProjectStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"


class DeliveryStatus(StrEnum):
    PENDING = "pending"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class ReturnStatus(StrEnum):
    REQUESTED = "requested"
    APPROVED = "approved"
    RECEIVED = "received"
    REJECTED = "rejected"


class TransactionType(StrEnum):
    DEBIT = "debit"
    CREDIT = "credit"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class AnalyticsEventType(StrEnum):
    PAGE_VIEW = "page_view"
    PRODUCT_VIEW = "product_view"
    SEARCH = "search"
    ADD_TO_CART = "add_to_cart"
    REMOVE_FROM_CART = "remove_from_cart"
    CHECKOUT_START = "checkout_start"
    CHECKOUT_COMPLETE = "checkout_complete"
    RFQ_SUBMIT = "rfq_submit"
    QUOTATION_REQUEST = "quotation_request"


class ReviewTargetType(StrEnum):
    PRODUCT = "product"
    SUPPLIER = "supplier"
    PROJECT = "project"


class SearchSource(StrEnum):
    MODIT = "modit"


