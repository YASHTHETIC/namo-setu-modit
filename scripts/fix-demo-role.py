"""Demote demo@modit.in from super_admin back to plain buyer in whatever DB
DATABASE_URL points at (local runs use a Postgres fallback set in env).
Run from repo root with the same DATABASE_URL as the server."""
import asyncio
import sys

sys.path.insert(0, ".")


async def main() -> None:
    from sqlalchemy import delete, select
    from backend.app.core.database import AsyncSessionLocal
    from backend.app.models.user import Role, User, user_roles

    async with AsyncSessionLocal() as session:
        demo = (
            await session.execute(select(User).where(User.email == "demo@modit.in"))
        ).scalars().first()
        if demo is None:
            print("demo@modit.in not found")
            return
        await session.refresh(demo, ["roles"])
        names = [r.name for r in demo.roles]
        print("roles before:", names)
        if "super_admin" in names:
            sa = (
                await session.execute(select(Role).where(Role.name == "super_admin"))
            ).scalars().first()
            await session.execute(
                delete(user_roles).where(
                    user_roles.c.user_id == demo.id, user_roles.c.role_id == sa.id
                )
            )
            # also clear org memberships that could grant implicit staff views —
            # keep buyer org only
            await session.commit()
            await session.refresh(demo, ["roles"])
            print("roles after:", [r.name for r in demo.roles])
        else:
            print("already a plain buyer — nothing to do")


asyncio.run(main())
