from __future__ import annotations

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.modit import (
    Brand,
    Category,
    Product,
    ProductImage,
    SubCategory,
    Supplier,
)
from backend.app.models.shared import SearchHistory
from backend.app.services.cache_service import CacheKeys, cache


class SearchService:
    """Unified search layer with ILIKE matching, relevance scoring and cache integration."""

    # ── Products ──────────────────────────────────────────────────────────────

    async def search_products(
        self,
        session: AsyncSession,
        query: str | None = None,
        filters: dict[str, Any] | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        filters = filters or {}

        cache_key = CacheKeys.product_list(page, f"{query}:{filters}")
        cached_result = await cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        stmt = (
            select(Product)
            .options(selectinload(Product.brand), selectinload(Product.category), selectinload(Product.images))
            .where(Product.is_active.is_(True), Product.deleted_at.is_(None))
        )

        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Product.name.ilike(pattern),
                    Product.sku.ilike(pattern),
                    Product.description.ilike(pattern),
                )
            )

        if filters.get("category_id"):
            stmt = stmt.where(Product.category_id == filters["category_id"])
        if filters.get("brand_id"):
            stmt = stmt.where(Product.brand_id == filters["brand_id"])
        if filters.get("min_price") is not None:
            stmt = stmt.where(Product.list_price >= filters["min_price"])
        if filters.get("max_price") is not None:
            stmt = stmt.where(Product.list_price <= filters["max_price"])

        total = int((await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
        result = await session.execute(
            stmt.order_by(Product.name.asc()).offset((page - 1) * page_size).limit(page_size)
        )
        products = result.scalars().all()

        items: list[dict[str, Any]] = []
        for p in products:
            items.append({
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "list_price": float(p.list_price) if p.list_price else None,
                "mrp": float(p.mrp) if p.mrp else None,
                "approval_status": p.approval_status,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "brand": {"id": p.brand.id, "name": p.brand.name} if p.brand else None,
                "category": {"id": p.category.id, "name": p.category.name} if p.category else None,
            })

        response = {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size if total else 0,
            "suggestions": [i["name"] for i in items[:5]],
        }

        await cache.set(cache_key, response, ttl_seconds=120)

        if query:
            session.add(
                SearchHistory(
                    product_code="modit",
                    source="search",
                    query_text=query,
                    result_count=total,
                )
            )

        return response

    # ── Suppliers ─────────────────────────────────────────────────────────────

    async def search_suppliers(
        self,
        session: AsyncSession,
        query: str | None = None,
        filters: dict[str, Any] | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        filters = filters or {}

        stmt = (
            select(Supplier)
            .options(selectinload(Supplier.organization))
            .where(Supplier.deleted_at.is_(None))
        )

        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Supplier.supplier_code.ilike(pattern),
                    Supplier.organization.has(func.lower(Supplier.organization.property.mapper.c.name).ilike(pattern)),
                )
            )

        if filters.get("is_verified") is not None:
            stmt = stmt.where(Supplier.is_verified == filters["is_verified"])

        total = int((await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
        result = await session.execute(
            stmt.order_by(Supplier.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        suppliers = result.scalars().all()

        items: list[dict[str, Any]] = []
        for s in suppliers:
            org = s.organization
            items.append({
                "id": s.id,
                "supplier_code": s.supplier_code,
                "is_verified": s.is_verified,
                "organization": {
                    "id": org.id,
                    "name": org.name,
                    "organization_type": org.organization_type,
                } if org else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })

        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size if total else 0,
        }

    # ── Autocomplete ──────────────────────────────────────────────────────────

    async def autocomplete(
        self,
        session: AsyncSession,
        query: str,
        product_code: str | None = None,
    ) -> list[dict[str, Any]]:
        if not query or len(query) < 2:
            return []

        pattern = f"{query}%"
        results: list[dict[str, Any]] = []

        product_stmt = (
            select(Product.id, Product.name, Product.sku, Product.slug)
            .where(Product.is_active.is_(True), Product.deleted_at.is_(None))
            .where(
                or_(
                    Product.name.ilike(pattern),
                    Product.sku.ilike(pattern),
                )
            )
            .limit(8)
        )
        product_rows = (await session.execute(product_stmt)).all()
        for row in product_rows:
            results.append({
                "type": "product",
                "id": row.id,
                "name": row.name,
                "sku": row.sku,
                "slug": row.slug,
            })

        return results

    # ── Indexing helpers ──────────────────────────────────────────────────────

    async def index_entity(self, entity_type: str, entity_id: str, data: dict[str, Any]) -> bool:
        key = f"search:idx:{entity_type}:{entity_id}"
        await cache.set(key, data, ttl_seconds=3600)
        return True

    async def reindex_all(self, product_code: str | None = None) -> int:
        count = 0
        count += await cache.invalidate_pattern("products:list:*")
        count += await cache.invalidate_pattern("search:idx:*")
        return count


# ── Module-level singleton ───────────────────────────────────────────────────

search_service = SearchService()
