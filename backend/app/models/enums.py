from enum import StrEnum


class ProductCode(StrEnum):
    NAMO_SETU = "namo_setu"
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


class ReviewTargetType(StrEnum):
    TEMPLE = "temple"
    PRODUCT = "product"
    ORGANIZATION = "organization"
    HOTEL = "hotel"
    GUIDE = "guide"


class SearchSource(StrEnum):
    NAMO = "namo"
    MODIT = "modit"


class AnalyticsEventType(StrEnum):
    PAGE_VIEW = "page_view"
    SEARCH = "search"
    BOOKING = "booking"
    ORDER = "order"
    PAYMENT = "payment"
    AI_INTERACTION = "ai_interaction"


class TempleType(StrEnum):
    MAIN = "main"
    SUB = "sub"
    SHRINE = "shrine"
    ASHRAM = "ashram"


class BookingStatus(StrEnum):
    DRAFT = "draft"
    RESERVED = "reserved"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    FAILED = "failed"


class DarshanSlotStatus(StrEnum):
    AVAILABLE = "available"
    HOLD = "hold"
    FULL = "full"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class RefundStatus(StrEnum):
    REQUESTED = "requested"
    APPROVED = "approved"
    PROCESSED = "processed"
    REJECTED = "rejected"


class AccommodationType(StrEnum):
    HOTEL = "hotel"
    DHARAMSHALA = "dharamshala"
    GUEST_HOUSE = "guest_house"


class TransportType(StrEnum):
    CAB = "cab"
    BUS = "bus"
    TEMPO = "tempo"
    SHUTTLE = "shuttle"


class PujaStatus(StrEnum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


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


