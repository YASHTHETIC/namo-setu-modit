"""ORM relationship helpers that are safe under async SQLAlchemy.

Appending to a relationship collection on a *persistent* object whose
collection is not loaded fires a synchronous lazy load, which raises
MissingGreenlet inside async endpoints (500 on every call). Test fakes, on
the other hand, expose plain lists and DO need the in-memory append so
responses reflect what was just added. `safe_collection_append` does the
right thing in both worlds.
"""

from __future__ import annotations

from sqlalchemy import inspect as sa_inspect


def safe_collection_append(owner: object, attr: str, value: object) -> None:
    """Append `value` to `owner.<attr>` only when that cannot trigger IO.

    - Non-ORM objects (test fakes): always append (plain attribute).
    - Transient/pending ORM objects (not flushed yet): safe — collections
      initialize in memory without a lazy load.
    - Persistent ORM objects with the collection unloaded: skip — the FK
      linkage persists it; eager-load via session.refresh when needed.
    """
    state = None
    try:
        state = sa_inspect(owner)
    except Exception:  # NoInspectionAvailable — not an ORM object (test fake)
        state = None
    if state is None or state.transient or state.pending or attr not in state.unloaded:
        getattr(owner, attr).append(value)
