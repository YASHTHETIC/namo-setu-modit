from __future__ import annotations

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.enums import ProductCode
from backend.app.models.shared import AuditLog


async def create_audit_log(
    session: AsyncSession,
    *,
    product_code: ProductCode | str,
    actor_user_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    request_id: str | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        product_code=product_code.value if isinstance(product_code, ProductCode) else product_code,
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=None if before is None else json.dumps(before, default=str),
        after_json=None if after is None else json.dumps(after, default=str),
        request_id=request_id,
        ip_address=ip_address,
    )
    session.add(entry)
    await session.flush()
    return entry
