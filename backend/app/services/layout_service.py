from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.modit import Category, Product
from backend.app.schemas.layout import (
    AssuredFeature,
    AssuredStripData,
    CategoryGridData,
    CategoryItem,
    DeliveryBarData,
    DispatchBannerData,
    FeatureBarData,
    FeatureItem,
    LayoutMeta,
    LayoutResponse,
    ProductCarouselData,
    ProductGridData,
    ProductSummary,
    PromoBannerData,
    Section,
    SectionType,
)


# ── Static Widget Data (CMS-managed in production) ─────────────────

ASSURED_FEATURES = [
    AssuredFeature(title="7 Day Replacement", description="Over & Above Brand Warranty", icon="RotateCcw", color="#E91E63"),
    AssuredFeature(title="4 Hour Resolution", description="On Any Quality Issues", icon="Clock", color="#7CB518"),
    AssuredFeature(title="100% Genuine Guarantee", description="QR Code & Batch Number Verified", icon="CircleCheck", color="#7CB518"),
    AssuredFeature(title="Easy Returns", description="No Questions Asked", icon="Package", color="#E91E63"),
]

FEATURE_BAR_ITEMS = [
    FeatureItem(title="LOWEST PRICES", description="Best quality at best prices", icon="TrendingUp", color="#E91E63"),
    FeatureItem(title="60 MINS DELIVERY", description="Superfast delivery at your site", icon="Timer", color="#00BCD4"),
    FeatureItem(title="SECURE PAYMENTS", description="100% safe & secure", icon="Lock", color="#7CB518"),
]


# ── Layout Builder ─────────────────────────────────────────────────

async def build_home_layout(
    db: AsyncSession,
    pincode: str = "201301",
    user_segment: str = "all",
) -> LayoutResponse:
    """Build the homepage layout JSON from database + CMS config."""

    now = datetime.now(timezone.utc)
    sections: list[Section] = []
    order = 0

    # ── 1. Delivery Bar ────────────────────────────────────────────
    sections.append(Section(
        type=SectionType.DELIVERY_BAR,
        id="delivery_bar_001",
        order=order,
        data=DeliveryBarData(
            eta_minutes=60,
            pincode=pincode,
            city="New Delhi",
            is_serviceable=True,
        ).model_dump(),
    ))
    order += 1

    # ── 2. Dispatch Banner ─────────────────────────────────────────
    sections.append(Section(
        type=SectionType.DISPATCH_BANNER,
        id="dispatch_banner_001",
        order=order,
        data=DispatchBannerData(
            dispatch_time="8 AM",
            dispatch_date=now.strftime("%d %B %Y"),
        ).model_dump(),
    ))
    order += 1

    # ── 3. Promo Banner (Free Delivery) ────────────────────────────
    sections.append(Section(
        type=SectionType.PROMO_BANNER,
        id="promo_banner_001",
        order=order,
        data=PromoBannerData(
            title="FREE DELIVERY",
            subtitle="Free Delivery on next 5 orders",
            badge_text="(Valid till 31-Jul)",
            badge_color="#E91E63",
            bg_gradient="from-[#2D1B69] to-[#4A2D8A]",
            valid_till="2026-07-31",
        ).model_dump(),
    ))
    order += 1

    # ── 4. Assured Strip ───────────────────────────────────────────
    sections.append(Section(
        type=SectionType.ASSURED_STRIP,
        id="assured_strip_001",
        order=order,
        data=AssuredStripData(
            title="Modit Assured",
            features=ASSURED_FEATURES,
        ).model_dump(),
    ))
    order += 1

    # ── 5. Category Grid (from database) ───────────────────────────
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)  # noqa: E712
        .order_by(Category.name)
        .limit(12)
    )
    db_categories = result.scalars().all()

    _CATEGORY_IMAGES = {
        "cement": "/products/cement/Ambuja Cement.png",
        "tiles-ceramics": "/products/tiling/Kajaria Adhesives Tiling.png",
        "paint": "/products/painting/Asian Paint.png",
        "waterproofing": "/products/tiling/Dr Fixit.png",
        "plywood-boards": "/products/painting/Asian Paints Tractor Emulsion, Base White 20 L.png",
        "fevicol": "/products/tiling/Bostik.png",
        "electrical": "/products/lighting/download-Photoroom (1).png",
        "switches": "/products/lighting/Philips EvenGlow LED Strip Light, 5m.webp",
        "lighting": "/products/lighting/Philips Ultra Glow 3-in-1 LED Downlight, Round.webp",
        "hardware": "/products/tiling/Roff T1.png",
    }
    category_items = [
        CategoryItem(
            id=str(cat.id),
            name=cat.name,
            slug=cat.slug,
            image_url=_CATEGORY_IMAGES.get(cat.slug, "/products/cement/Ambuja Cement.png"),
            product_count=0,
        )
        for cat in db_categories
    ]

    # Fallback to static categories if DB is empty
    if not category_items:
        category_items = _get_fallback_categories()

    sections.append(Section(
        type=SectionType.CATEGORY_GRID,
        id="category_grid_001",
        order=order,
        data=CategoryGridData(
            categories=category_items,
            columns=4,
        ).model_dump(),
    ))
    order += 1

    # ── 6. Feature Bar ─────────────────────────────────────────────
    sections.append(Section(
        type=SectionType.FEATURE_BAR,
        id="feature_bar_001",
        order=order,
        data=FeatureBarData(
            features=FEATURE_BAR_ITEMS,
            bg_gradient="from-[#150726] to-[#2D1B69]",
        ).model_dump(),
    ))
    order += 1

    # ── 7. Product Carousel (Trending Now) ─────────────────────────
    result = await db.execute(
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(Product.rating.desc().nullslast())
        .limit(10)
    )
    db_products = result.scalars().all()

    carousel_products = [_product_to_summary(p) for p in db_products]

    if not carousel_products:
        carousel_products = _get_fallback_products()

    sections.append(Section(
        type=SectionType.PRODUCT_CAROUSEL,
        id="product_carousel_001",
        order=order,
        data=ProductCarouselData(
            title="Trending Now",
            products=carousel_products,
        ).model_dump(),
    ))
    order += 1

    # ── 8. Product Grid (All Products) ─────────────────────────────
    result = await db.execute(
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(Product.created_at.desc())
        .limit(20)
    )
    all_products = result.scalars().all()
    grid_products = [_product_to_summary(p) for p in all_products]

    if not grid_products:
        grid_products = _get_fallback_products()

    sections.append(Section(
        type=SectionType.PRODUCT_GRID,
        id="product_grid_001",
        order=order,
        data=ProductGridData(
            title="Featured Products",
            products=grid_products,
            columns=2,
        ).model_dump(),
    ))

    return LayoutResponse(
        version="1.0",
        screen="home",
        meta=LayoutMeta(
            pincode=pincode,
            city="New Delhi",
            eta="60 mins",
            store_id=None,
            is_serviceable=True,
            user_segment=user_segment,
        ),
        sections=sections,
    )


# ── Helpers ────────────────────────────────────────────────────────

def _product_to_summary(p: Product) -> ProductSummary:
    price = float(p.list_price) if p.list_price else 0.0
    mrp = float(p.mrp) if p.mrp else price
    discount = int(((mrp - price) / mrp * 100)) if mrp > 0 else 0

    # Get primary image URL
    image_url = ""
    if p.images:
        primary = next((img for img in p.images if img.is_primary), p.images[0])
        if primary.media:
            image_url = primary.media.url or ""

    # Get brand name from relationship
    brand_name = ""
    if p.brand:
        brand_name = p.brand.name or ""

    return ProductSummary(
        id=str(p.id),
        name=p.name,
        brand=brand_name,
        price=price,
        mrp=mrp,
        discount=discount,
        rating=0.0,  # Reviews would need separate query
        review_count=0,
        image_url=image_url,
        badge=None,
        delivery_text="Tomorrow",
    )


def _get_fallback_categories() -> list[CategoryItem]:
    """Static fallback when DB has no categories."""
    cats = [
        ("Cement", "cement", "/products/cement/Ambuja Cement.png"),
        ("Tiling", "tiles-ceramics", "/products/tiling/Kajaria Adhesives Tiling.png"),
        ("Painting", "paint", "/products/painting/Asian Paint.png"),
        ("Water Proofing", "waterproofing", "/products/tiling/Dr Fixit.png"),
        ("Plywood, MDF & HDHMR", "plywood-boards", "/products/painting/Asian Paints Tractor Emulsion, Base White 20 L.png"),
        ("Fevicol", "fevicol", "/products/tiling/Bostik.png"),
        ("Wires & Cables", "electrical", "/products/lighting/download-Photoroom (1).png"),
        ("Switches & Sockets", "switches", "/products/lighting/Philips EvenGlow LED Strip Light, 5m.webp"),
        ("Lighting", "lighting", "/products/lighting/Philips Ultra Glow 3-in-1 LED Downlight, Round.webp"),
        ("Hardware", "hardware", "/products/tiling/Roff T1.png"),
    ]
    return [
        CategoryItem(id=f"cat_{i}", name=n, slug=s, image_url=img, product_count=0)
        for i, (n, s, img) in enumerate(cats)
    ]


def _get_fallback_products() -> list[ProductSummary]:
    """Static fallback when DB has no products."""
    products = [
        ProductSummary(id="cement-ambuja", name="Ambuja Cement 50kg", brand="Ambuja", price=365, mrp=395, discount=8, rating=4.5, review_count=1800, image_url="/products/cement/Ambuja Cement.png", badge="Trusted", delivery_text="Tomorrow"),
        ProductSummary(id="cement-acc", name="ACC Cement 50kg", brand="ACC", price=370, mrp=400, discount=8, rating=4.6, review_count=2100, image_url="/products/cement/ACC Cement.png", badge="Popular", delivery_text="Tomorrow"),
        ProductSummary(id="paint-asian-apex", name="Asian Paints Apex, Base White", brand="Asian Paints", price=2400, mrp=3100, discount=23, rating=4.6, review_count=4230, image_url="/products/painting/Asian Paints Apex, Base White.png", badge="Bestseller", delivery_text="Tomorrow"),
        ProductSummary(id="paint-asian-royale", name="Asian Paints Royale Luxury Emulsion", brand="Asian Paints", price=3200, mrp=4000, discount=20, rating=4.7, review_count=3100, image_url="/products/painting/Asian Paints Royale Luxury Emulsion, Base White.png", badge="Premium", delivery_text="Tomorrow"),
        ProductSummary(id="tile-drfixit", name="Dr Fixit Waterproofing", brand="Dr Fixit", price=850, mrp=1100, discount=23, rating=4.6, review_count=2200, image_url="/products/tiling/Dr Fixit.png", badge="Bestseller", delivery_text="Tomorrow"),
        ProductSummary(id="lighting-philips", name="Philips Ultra Glow LED Downlight", brand="Philips", price=1200, mrp=1500, discount=20, rating=4.5, review_count=1500, image_url="/products/lighting/Philips Ultra Glow 3-in-1 LED Downlight, Round.webp", badge="New", delivery_text="Tomorrow"),
    ]
    return products
