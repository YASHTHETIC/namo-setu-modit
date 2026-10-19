"""Seed the retail catalog + inventory from the frontend static catalog.

The storefront's curated price list lives in apps/modit/web/lib/product-data.ts
(single source of truth). This script mirrors it into Postgres so checkout can
validate prices server-side, decrement real inventory, and list via the API.

Idempotent: re-running updates prices/stock, never duplicates (get-or-create
on the same unique keys the API enforces).

Run on the server AFTER migrations:
    cd /opt/modit/backend && PYTHONPATH=".." ../.venv/bin/python -m backend.app.seeders.catalog
Requires DATABASE_URL in the environment (reads /opt/modit/.env pattern).
"""

from __future__ import annotations

import asyncio
import pathlib
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.security import hash_password
from backend.app.models.enums import InventoryStatus, OrganizationType
from backend.app.models.modit import (
    Brand,
    Category,
    GST,
    Inventory,
    Organization,
    Product,
    SubCategory,
    Supplier,
    Unit,
    Warehouse,
)
from backend.app.models.shared import City, Country, State
from backend.app.models.user import Role, User, user_roles

RETAIL_ORG_NAME = "MODIT Retail"
WAREHOUSE_CODE = "WH-NOIDA-01"


def _str(block: str, key: str) -> str | None:
    m = re.search(rf"{re.escape(key)}:\s*\"((?:[^\"\\]|\\.)*)\"", block)
    return m.group(1) if m else None


def _num(block: str, key: str) -> float | None:
    m = re.search(rf"{re.escape(key)}:\s*(-?[\d.]+|null)", block)
    if not m or m.group(1) == "null":
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _bool(block: str, key: str, default: bool = True) -> bool:
    m = re.search(rf"{re.escape(key)}:\s*(true|false)", block)
    return m.group(1) == "true" if m else default


def parse_catalog(text: str) -> list[dict]:
    """Parse product objects out of product-data.ts (stdlib only)."""
    parts = re.split(r"\{\s*\n\s*id:\s*\"", text)
    items: list[dict] = []
    for part in parts[1:]:
        block = 'id: "' + part
        end = block.find("\n  },")
        block = block[:end] if end != -1 else block
        name = _str(block, "name")
        sku = _str(block, "sku")
        slug = _str(block, "slug")
        price = _num(block, "price")
        brand = _str(block, "brand")
        brand_slug = _str(block, "brandSlug")
        category = _str(block, "category")
        category_slug = _str(block, "categorySlug")
        unit = _str(block, "unit")
        unit_code = _str(block, "unitCode")
        if not all([name, sku, slug, brand, brand_slug, category, category_slug, unit, unit_code]) or price is None:
            continue
        items.append(
            {
                "name": name,
                "sku": sku,
                "slug": slug,
                "description": _str(block, "description"),
                "brand": brand,
                "brand_slug": brand_slug,
                "category": category,
                "category_slug": category_slug,
                "sub_category": _str(block, "subCategory"),
                "sub_category_slug": _str(block, "subCategorySlug"),
                "unit": unit,
                "unit_code": unit_code,
                "price": price,
                "mrp": _num(block, "mrp") or price,
                "gst_rate": _num(block, "gstRate") or 18.0,
                "gst_code": _str(block, "gstCode") or "GST 18%",
                "stock": int(_num(block, "stockLevel") or 0),
                "in_stock": _bool(block, "inStock", True),
                "moq": int(_num(block, "moq") or 1),
            }
        )
    return items


async def _get_or_create(session: AsyncSession, model, lookup: dict, defaults: dict | None = None):
    instance = (
        (await session.execute(select(model).filter_by(**lookup))).scalars().first()
    )
    if instance is not None:
        return instance, False
    payload = dict(lookup)
    if defaults:
        payload.update(defaults)
    instance = model(**payload)
    session.add(instance)
    await session.flush()
    return instance, True


async def seed_catalog(session: AsyncSession, items: list[dict]) -> dict:
    stats = {"products_created": 0, "products_updated": 0, "products_deactivated": 0, "skipped": 0}

    country, _ = await _get_or_create(
        session, Country, {"iso2": "IN"},
        {"name": "India", "iso3": "IND", "calling_code": "+91", "is_active": True},
    )
    state, _ = await _get_or_create(
        session, State, {"country_id": country.id, "name": "Uttar Pradesh"},
        {"state_code": "UP", "is_active": True},
    )
    city, _ = await _get_or_create(
        session, City, {"state_id": state.id, "name": "Noida"},
        {"country_id": country.id, "postal_code": "201301",
         "latitude": 28.5355, "longitude": 77.3910, "is_active": True},
    )
    org, _ = await _get_or_create(
        session, Organization, {"name": RETAIL_ORG_NAME},
        {"organization_type": OrganizationType.RETAILER.value, "is_active": True},
    )
    # One-click testing login (plain buyer, no roles — claim staff separately).
    # Credentials: demo@modit.in / Demo@1234
    await _get_or_create(
        session, User, {"email": "demo@modit.in"},
        {"full_name": "Demo Buyer", "hashed_password": hash_password("Demo@1234"),
         "is_active": True, "is_verified": True},
    )
    warehouse, _ = await _get_or_create(
        session, Warehouse,
        {"organization_id": org.id, "warehouse_code": WAREHOUSE_CODE},
        {"supplier_id": None, "city_id": city.id, "name": "Noida Main Hub",
         "address_line1": "MODIT Fulfillment Center", "pincode": "201301",
         "latitude": 28.5355, "longitude": 77.3910, "is_active": True},
    )

    for item in items:
        gst, _ = await _get_or_create(
            session, GST, {"code": item["gst_code"]},
            {"rate_percent": item["gst_rate"], "is_active": True},
        )
        unit, _ = await _get_or_create(
            session, Unit, {"code": item["unit_code"]},
            {"name": item["unit"], "is_active": True},
        )
        brand, _ = await _get_or_create(
            session, Brand, {"name": item["brand"]},
            {"slug": item["brand_slug"], "is_active": True},
        )
        category, _ = await _get_or_create(
            session, Category, {"slug": item["category_slug"]},
            {"name": item["category"], "is_active": True},
        )
        sub_category_id = None
        if item["sub_category"] and item["sub_category_slug"]:
            sub, _ = await _get_or_create(
                session, SubCategory,
                {"category_id": category.id, "slug": item["sub_category_slug"]},
                {"name": item["sub_category"], "is_active": True},
            )
            sub_category_id = sub.id

        product, created = await _get_or_create(
            session, Product,
            {"organization_id": org.id, "sku": item["sku"]},
            {
                "supplier_id": None,
                "brand_id": brand.id,
                "category_id": category.id,
                "sub_category_id": sub_category_id,
                "unit_id": unit.id,
                "gst_id": gst.id,
                "name": item["name"],
                "slug": item["slug"],
                "description": item["description"],
                "mrp": item["mrp"],
                "list_price": item["price"],
                "approval_status": "approved",
                "is_active": True,
            },
        )
        if created:
            stats["products_created"] += 1
        else:
            product.name = item["name"]
            product.slug = item["slug"]
            product.description = item["description"]
            product.mrp = item["mrp"]
            product.list_price = item["price"]
            product.brand_id = brand.id
            product.category_id = category.id
            product.sub_category_id = sub_category_id
            product.unit_id = unit.id
            product.gst_id = gst.id
            product.is_active = True
            stats["products_updated"] += 1

        qty = item["stock"] if item["in_stock"] else 0
        inv, inv_created = await _get_or_create(
            session, Inventory,
            {"warehouse_id": warehouse.id, "product_id": product.id},
            {"quantity_on_hand": qty, "reserved_quantity": 0,
             "reorder_level": item["moq"], "status": InventoryStatus.IN_STOCK.value},
        )
        if not inv_created:
            inv.quantity_on_hand = max(inv.quantity_on_hand, qty)

    # product-data.ts is the source of truth: deactivate MODIT-org products
    # whose SKU was removed from the file (deleted duplicate/junk rows).
    keep_skus = {i["sku"] for i in items}
    stale = await session.execute(
        select(Product).where(
            Product.organization_id == org.id,
            Product.is_active.is_(True),
            Product.sku.notin_(keep_skus),
        )
    )
    for product in stale.scalars():
        product.is_active = False
        stats["products_deactivated"] += 1

    await _seed_demo_supplier(session, org)
    await _seed_demo_personas(session)

    return stats


async def _seed_demo_supplier(session: AsyncSession, org: Organization) -> None:
    """Blinkit-style seller login: supplier@modit.in owns the first catalog
    slice, so the /supplier surface is demonstrable after one seed run.
    Credentials: supplier@modit.in / Supplier@1234"""
    role = (
        (await session.execute(select(Role).where(Role.name == "supplier")))
        .scalars()
        .first()
    )
    if role is None:
        role = Role(name="supplier", description="Supplier (own catalog only)")
        session.add(role)
        await session.flush()

    user, _ = await _get_or_create(
        session, User, {"email": "supplier@modit.in"},
        {"full_name": "Demo Supplier", "hashed_password": hash_password("Supplier@1234"),
         "is_active": True, "is_verified": True},
    )
    # Async-safe role attach (never touches the lazy user.roles collection).
    linked = (
        await session.execute(
            select(Role.id).join(user_roles, user_roles.c.role_id == Role.id).where(
                user_roles.c.user_id == user.id, Role.id == role.id
            )
        )
    ).first()
    if linked is None:
        await session.execute(
            user_roles.insert().values(user_id=user.id, role_id=role.id)
        )

    sup, _ = await _get_or_create(
        session, Supplier, {"supplier_code": "SUP-DEMO"},
        {"organization_id": org.id, "is_verified": True, "user_id": user.id},
    )
    sup.user_id = user.id
    sup.is_verified = True

    result = await session.execute(
        select(Product)
        .where(Product.organization_id == org.id, Product.supplier_id.is_(None))
        .order_by(Product.sku.asc())
        .limit(30)
    )
    for product in result.scalars().all():
        product.supplier_id = sup.id


async def _seed_demo_personas(session: AsyncSession) -> None:
    """Delivery-day logins for every persona: buyer, contractor, architect,
    rider (all / Demo@1234).

    Idempotent (get-or-create by email): existing accounts, passwords and
    roles are never touched.
    """
    role = (
        (await session.execute(select(Role).where(Role.name == "user")))
        .scalars()
        .first()
    )
    if role is None:
        role = Role(name="user", description="Buyer account")
        session.add(role)
        await session.flush()
    personas = [
        ("demo@modit.in", "Demo Buyer"),
        ("contractor@modit.in", "Demo Contractor"),
        ("architect@modit.in", "Demo Architect"),
        ("rider@modit.in", "Demo Delivery Partner"),
    ]
    for email, full_name in personas:
        user, _ = await _get_or_create(
            session, User, {"email": email},
            {"full_name": full_name, "hashed_password": hash_password("Demo@1234"),
             "is_active": True, "is_verified": True},
        )
        linked = (
            await session.execute(
                select(Role.id).join(user_roles, user_roles.c.role_id == Role.id).where(
                    user_roles.c.user_id == user.id, Role.id == role.id
                )
            )
        ).first()
        if linked is None:
            await session.execute(
                user_roles.insert().values(user_id=user.id, role_id=role.id)
            )


async def main() -> None:
    catalog_path = (
        pathlib.Path(__file__).resolve().parents[3]
        / "apps" / "modit" / "web" / "lib" / "product-data.ts"
    )
    items = parse_catalog(catalog_path.read_text(encoding="utf-8"))
    print(f"Parsed {len(items)} products from static catalog")
    async with AsyncSessionLocal() as session:
        stats = await seed_catalog(session, items)
        await session.commit()
    print(f"Done: {stats}")


if __name__ == "__main__":
    asyncio.run(main())
