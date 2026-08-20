from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Annotated, Union

from pydantic import BaseModel, Field


# ── Section Type Enum ──────────────────────────────────────────────

class SectionType(str, Enum):
    DELIVERY_BAR = "DeliveryBar"
    DISPATCH_BANNER = "DispatchBanner"
    PROMO_BANNER = "PromoBanner"
    ASSURED_STRIP = "AssuredStrip"
    CATEGORY_GRID = "CategoryGrid"
    FEATURE_BAR = "FeatureBar"
    PRODUCT_CAROUSEL = "ProductCarousel"
    PRODUCT_GRID = "ProductGrid"


# ── Action Model (what happens when a widget is tapped) ────────────

class WidgetAction(BaseModel):
    type: str  # "navigate", "deeplink", "external_url"
    target: str | None = None  # route path or URL
    params: dict[str, Any] = Field(default_factory=dict)


# ── Individual Section Data Models ─────────────────────────────────

class DeliveryBarData(BaseModel):
    eta_minutes: int = 60
    pincode: str = "201301"
    city: str = "New Delhi"
    is_serviceable: bool = True


class DispatchBannerData(BaseModel):
    dispatch_time: str = "8 AM"
    dispatch_date: str = "13 July 2026"
    icon_url: str | None = None


class PromoBannerData(BaseModel):
    title: str
    subtitle: str | None = None
    badge_text: str | None = None
    badge_color: str = "#E91E63"
    image_url: str | None = None
    bg_gradient: str = "from-[#2D1B69] to-[#4A2D8A]"
    action: WidgetAction | None = None
    valid_till: str | None = None


class AssuredFeature(BaseModel):
    title: str
    description: str
    icon: str  # lucide icon name
    color: str = "#7CB518"


class AssuredStripData(BaseModel):
    title: str = "Modit Assured"
    features: list[AssuredFeature]


class CategoryItem(BaseModel):
    id: str
    name: str
    slug: str
    image_url: str
    product_count: int = 0
    action: WidgetAction | None = None


class CategoryGridData(BaseModel):
    categories: list[CategoryItem]
    columns: int = 4


class FeatureItem(BaseModel):
    title: str
    description: str
    icon: str  # lucide icon name
    color: str = "#7CB518"


class FeatureBarData(BaseModel):
    features: list[FeatureItem]
    bg_gradient: str = "from-[#150726] to-[#2D1B69]"


class ProductSummary(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    mrp: float
    discount: int
    rating: float
    review_count: int
    image_url: str
    badge: str | None = None
    delivery_text: str = "Tomorrow"
    action: WidgetAction | None = None


class ProductCarouselData(BaseModel):
    title: str
    products: list[ProductSummary]
    see_all_action: WidgetAction | None = None


class ProductGridData(BaseModel):
    title: str | None = None
    products: list[ProductSummary]
    columns: int = 2


# ── Section Wrapper (type discriminator) ───────────────────────────

class Section(BaseModel):
    type: SectionType
    id: str
    data: dict[str, Any]
    order: int = 0
    visible: bool = True


# ── Layout Response ────────────────────────────────────────────────

class LayoutMeta(BaseModel):
    pincode: str
    city: str = "New Delhi"
    eta: str = "60 mins"
    store_id: str | None = None
    is_serviceable: bool = True
    user_segment: str = "all"


class LayoutResponse(BaseModel):
    version: str = "1.0"
    screen: str = "home"
    meta: LayoutMeta
    sections: list[Section]
