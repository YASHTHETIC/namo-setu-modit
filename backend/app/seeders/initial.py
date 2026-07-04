from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models import *  # noqa: F401,F403


def _get_or_create(session: Session, model, lookup: dict, defaults: dict | None = None):
    instance = session.execute(select(model).filter_by(**lookup)).scalar_one_or_none()
    if instance is not None:
        return instance
    payload = dict(lookup)
    if defaults:
        payload.update(defaults)
    instance = model(**payload)
    session.add(instance)
    session.flush()
    return instance


def seed_sample_data(session: Session) -> None:
    country = _get_or_create(
        session,
        Country,
        {"iso2": "IN"},
        {"name": "India", "iso3": "IND", "calling_code": "+91", "is_active": True},
    )
    state = _get_or_create(
        session,
        State,
        {"country_id": country.id, "name": "Gujarat"},
        {"state_code": "GJ", "is_active": True},
    )
    city = _get_or_create(
        session,
        City,
        {"state_id": state.id, "name": "Ahmedabad"},
        {"country_id": country.id, "postal_code": "380001", "latitude": 23.0225, "longitude": 72.5714, "is_active": True},
    )
    language = _get_or_create(
        session,
        Language,
        {"iso_code": "en"},
        {"name": "English", "script": "Latin", "is_active": True},
    )

    role_admin = _get_or_create(session, Role, {"name": "Admin"}, {"description": "Platform administrator"})
    role_manager = _get_or_create(session, Role, {"name": "Manager"}, {"description": "Operational manager"})
    permission_manage_users = _get_or_create(session, Permission, {"name": "users.manage"}, {"description": "Manage users"})
    permission_manage_bookings = _get_or_create(session, Permission, {"name": "bookings.manage"}, {"description": "Manage temple bookings"})
    permission_manage_inventory = _get_or_create(session, Permission, {"name": "inventory.manage"}, {"description": "Manage MODIT inventory"})

    if permission_manage_users not in role_admin.permissions:
        role_admin.permissions.append(permission_manage_users)
    if permission_manage_bookings not in role_admin.permissions:
        role_admin.permissions.append(permission_manage_bookings)
    if permission_manage_inventory not in role_admin.permissions:
        role_admin.permissions.append(permission_manage_inventory)
    if permission_manage_bookings not in role_manager.permissions:
        role_manager.permissions.append(permission_manage_bookings)
    if permission_manage_inventory not in role_manager.permissions:
        role_manager.permissions.append(permission_manage_inventory)

    user = session.execute(select(User).filter_by(email="admin@example.com")).scalar_one_or_none()
    if user is None:
        user = User(email="admin@example.com", full_name="System Admin", hashed_password="sample-hash")
        user.roles.append(role_admin)
        session.add(user)
        session.flush()

    profile = session.execute(select(UserProfile).filter_by(user_id=user.id)).scalar_one_or_none()
    if profile is None:
        session.add(
            UserProfile(
                user_id=user.id,
                phone_number="9999999999",
                language_id=language.id,
                status="active",
                date_of_birth=datetime(1990, 1, 1),
            )
        )
        session.flush()

    address = session.execute(select(Address).filter_by(user_id=user.id, address_line1="12 Sample Road")).scalar_one_or_none()
    if address is None:
        address = Address(
            user_id=user.id,
            country_id=country.id,
            state_id=state.id,
            city_id=city.id,
            address_line1="12 Sample Road",
            address_line2="Old City",
            pincode="380001",
            address_type="home",
            owner_type="user",
            is_primary=True,
        )
        session.add(address)
        session.flush()

    temple = session.execute(select(Temple).filter_by(slug="somnath-darshan")).scalar_one_or_none()
    if temple is None:
        temple = Temple(
            city_id=city.id,
            state_id=state.id,
            country_id=country.id,
            address_id=address.id,
            name="Somnath Darshan Center",
            slug="somnath-darshan",
            temple_type=TempleType.MAIN.value,
            deity_name="Shiva",
            address_line1="12 Sample Road",
            pincode="380001",
            description="Sample temple record for initial database verification.",
            history="Seeded sample temple for Namo Setu.",
            is_active=True,
        )
        session.add(temple)
        session.flush()

    if session.execute(select(TempleTiming).filter_by(temple_id=temple.id, day_of_week=0)).scalar_one_or_none() is None:
        session.add(TempleTiming(temple_id=temple.id, day_of_week=0, opens_at="06:00", closes_at="21:00", is_closed=False))
    if session.execute(select(DarshanSlot).filter_by(temple_id=temple.id, slot_date=date.today())).scalar_one_or_none() is None:
        session.add(
            DarshanSlot(
                temple_id=temple.id,
                slot_date=date.today(),
                start_time="08:00",
                end_time="09:00",
                capacity=50,
                booked_count=0,
                slot_status=DarshanSlotStatus.AVAILABLE.value,
            )
        )
    session.flush()

    organization = session.execute(select(Organization).filter_by(name="MODIT Core Supplies")).scalar_one_or_none()
    if organization is None:
        organization = Organization(name="MODIT Core Supplies", organization_type=OrganizationType.SUPPLIER.value if hasattr(OrganizationType, "SUPPLIER") else "supplier", is_active=True)
        session.add(organization)
        session.flush()

    org_address = session.execute(select(Address).filter_by(organization_id=organization.id, address_line1="45 Industrial Estate")).scalar_one_or_none()
    if org_address is None:
        session.add(
            Address(
                organization_id=organization.id,
                country_id=country.id,
                state_id=state.id,
                city_id=city.id,
                address_line1="45 Industrial Estate",
                pincode="380015",
                address_type="work",
                owner_type="organization",
                is_primary=True,
            )
        )

    warehouse = session.execute(select(Warehouse).filter_by(warehouse_code="wh-ahm-01")).scalar_one_or_none()
    if warehouse is None:
        warehouse = Warehouse(
            organization_id=organization.id,
            city_id=city.id,
            warehouse_code="wh-ahm-01",
            name="Ahmedabad Central Warehouse",
            address_line1="45 Industrial Estate",
            pincode="380015",
            is_active=True,
        )
        session.add(warehouse)

    brand = _get_or_create(session, Brand, {"slug": "namobuild"}, {"name": "NamoBuild", "description": "Sample brand", "is_active": True})
    category = _get_or_create(session, Category, {"slug": "construction-materials"}, {"name": "Construction Materials", "description": "Sample category", "is_active": True})
    sub_category = _get_or_create(session, SubCategory, {"category_id": category.id, "slug": "electrical"}, {"name": "Electrical", "description": "Sample subcategory", "is_active": True})
    unit = _get_or_create(session, Unit, {"code": "pcs"}, {"name": "Pieces", "symbol": "pcs", "is_active": True})
    gst = _get_or_create(session, GST, {"code": "gst18"}, {"rate_percent": 18, "description": "Standard 18% GST", "is_active": True})

    product = session.execute(select(Product).filter_by(sku="MODIT-001")).scalar_one_or_none()
    if product is None:
        session.add(
            Product(
                organization_id=organization.id,
                brand_id=brand.id,
                category_id=category.id,
                sub_category_id=sub_category.id,
                unit_id=unit.id,
                gst_id=gst.id,
                sku="MODIT-001",
                name="LED Work Light",
                slug="led-work-light",
                description="Sample MODIT catalog item.",
                list_price=2499.00,
                approval_status="approved",
                is_active=True,
            )
        )

    if session.execute(select(OrganizationUser).filter_by(organization_id=organization.id, user_id=user.id)).scalar_one_or_none() is None:
        session.add(OrganizationUser(organization_id=organization.id, user_id=user.id, role_name="admin", is_primary=True))

    session.flush()


def bootstrap_sample_data(session: Session) -> None:
    seed_sample_data(session)
    session.commit()


if __name__ == "__main__":
    import asyncio
    from sqlalchemy.ext.asyncio import AsyncSession

    from backend.app.core.database import AsyncSessionLocal

    async def _run() -> None:
        async with AsyncSessionLocal() as session:
            await session.run_sync(seed_sample_data)
            await session.commit()

    asyncio.run(_run())
