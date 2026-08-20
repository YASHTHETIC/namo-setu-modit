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

    category_items = [
        CategoryItem(
            id=str(cat.id),
            name=cat.name,
            slug=cat.slug,
            image_url=f"https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop" if cat.slug == "cement"
            else f"https://images.unsplash.com/photo-1562825642-4afada44b540?w=200&h=200&fit=crop" if cat.slug == "tiles-ceramics"
            else f"https://images.unsplash.com/photo-1550002233-59d811d29b95?w=200&h=200&fit=crop" if cat.slug == "paint"
            else f"https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop" if cat.slug == "electrical"
            else f"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
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
        ("Cement", "cement", "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop"),
        ("Tiling", "tiles-ceramics", "https://images.unsplash.com/photo-1562825642-4afada44b540?w=200&h=200&fit=crop"),
        ("Painting", "paint", "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=200&h=200&fit=crop"),
        ("Water Proofing", "waterproofing", "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop"),
        ("Plywood, MDF & HDHMR", "plywood-boards", "https://images.unsplash.com/photo-1611600700192-d87eaeed4f81?w=200&h=200&fit=crop"),
        ("Fevicol", "fevicol", "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop"),
        ("Wires", "electrical", "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop"),
        ("Switches & Sockets", "switches", "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop"),
        ("Hinges & Handles", "hardware", "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop"),
        ("Kitchen Systems", "kitchen", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop"),
        ("Wardrobe Fittings", "bedroom", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=200&fit=crop"),
        ("Door Locks", "door-locks", "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop"),
    ]
    return [
        CategoryItem(id=f"cat_{i}", name=n, slug=s, image_url=img, product_count=0)
        for i, (n, s, img) in enumerate(cats)
    ]


def _get_fallback_products() -> list[ProductSummary]:
    """Static fallback when DB has no products."""
    products = [
        ProductSummary(id="cement-1", name="UltraTech Cement OPC 53 Grade 50kg", brand="UltraTech", price=385, mrp=410, discount=6, rating=4.7, review_count=2340, image_url="https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge="Bestseller", delivery_text="Tomorrow"),
        ProductSummary(id="steel-1", name="Tata Tiscon TMT 500D 12mm Bars", brand="Tata", price=58500, mrp=67000, discount=13, rating=4.8, review_count=1890, image_url="https://images.unsplash.com/photo-1745909247906-123b53b70e06?w=400&h=400&fit=crop", badge="Top Rated", delivery_text="2 days"),
        ProductSummary(id="paint-1", name="Asian Paints Apex 20L Exterior", brand="Asian Paints", price=2400, mrp=3100, discount=23, rating=4.6, review_count=4230, image_url="https://images.unsplash.com/photo-1550002233-59d811d29b95?w=400&h=400&fit=crop", badge="Popular", delivery_text="Tomorrow"),
        ProductSummary(id="tiles-1", name="Kajaria Wall Tiles 2x2ft Glossy", brand="Kajaria", price=42, mrp=55, discount=24, rating=4.5, review_count=3120, image_url="https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge="New", delivery_text="3 days"),
        ProductSummary(id="electrical-1", name="Havells LifeLine Plus 2.5sqmm Wire", brand="Havells", price=2520, mrp=2800, discount=10, rating=4.8, review_count=534, image_url="https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge="Trusted", delivery_text="Tomorrow"),
        ProductSummary(id="plumbing-1", name="Jaquar CP Valve 1/2 Inch", brand="Jaquar", price=890, mrp=1200, discount=26, rating=4.4, review_count=876, image_url="https://images.unsplash.com/photo-1737505599025-836fce14b071?w=400&h=400&fit=crop", badge="Deal", delivery_text="2 days"),
    ]
    return products
