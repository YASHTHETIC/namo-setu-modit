"""
Seed Runner - Loads comprehensive seed data into PostgreSQL.
Usage: cd backend && PYTHONPATH=".." python -m seeds.runner
"""

import sys
import os
import uuid
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from backend.app.core.config import get_settings
from backend.app.core.database import Base

# Import all models to register tables
from backend.app.models import *  # noqa
from backend.app.models.user import User
from backend.app.models.shared import Country, State, City
from backend.app.models.namo_setu import (
    Temple, Festival, Puja, Accommodation, Hotel, Room,
    TravelPackage, TourGuide, Pandit, Transportation, TempleReview,
    NearbyAttraction, TempleEvent,
)
from backend.app.models.modit import (
    Organization, Supplier, Vendor, Brand, Category, SubCategory, Unit, GST,
    Product, Warehouse, Inventory, Project, RFQ, RFQItem,
    Quotation, QuotationItem, PurchaseOrder, Order, OrderItem, Invoice,
    Driver, Vehicle, Delivery, ModitNotification,
)

from backend.seeds import namo_seeds as ns
from backend.seeds import modit_seeds as ms


def uid():
    return str(uuid.uuid4())


def get_sync_url(settings):
    url = settings.database_url
    if "asyncpg" in url:
        url = url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    elif "psycopg2" not in url:
        url = url.replace("postgresql", "postgresql+psycopg2")
    return url


def seed_namo(session: Session, country_id: str):
    """Seed Namo Setu data using ORM models."""
    print("[NAMO] Seeding countries, states, cities...")

    # Country
    existing = session.query(Country).filter_by(id=country_id).first()
    if not existing:
        session.add(Country(id=country_id, name="India", iso2="IN", iso3="IND",
                           calling_code="+91", is_active=True))

    # States
    for s in ns.STATES:
        existing = session.query(State).filter_by(id=s["id"]).first()
        if not existing:
            session.add(State(id=s["id"], country_id=country_id, name=s["name"],
                             state_code=s["code"], is_active=True))

    # Cities
    for c in ns.CITIES:
        existing = session.query(City).filter_by(id=c["id"]).first()
        if not existing:
            session.add(City(id=c["id"], state_id=c["state_id"], country_id=country_id,
                            name=c["name"], latitude=c["latitude"], longitude=c["longitude"],
                            is_active=True))

    session.flush()
    print(f"  -> {len(ns.STATES)} states, {len(ns.CITIES)} cities")

    # Users
    for u in ns.USERS:
        existing = session.query(User).filter_by(id=u["id"]).first()
        if not existing:
            session.add(User(
                id=u["id"], email=u["email"], full_name=u["full_name"],
                hashed_password="hashed_placeholder", is_active=u["is_active"],
                is_verified=True, mfa_enabled=False,
            ))

    session.flush()
    print(f"  -> {len(ns.USERS)} users")

    # Temples
    for t in ns.TEMPLES:
        existing = session.query(Temple).filter_by(id=t["id"]).first()
        if not existing:
            slug = t["name"].lower().replace(" ", "-").replace("'", "")
            session.add(Temple(
                id=t["id"], city_id=t["city_id"], state_id=t["state_id"],
                country_id=country_id, name=t["name"], slug=slug,
                temple_type="main",
                deity_name=t.get("deity", t.get("deity_name", "")),
                address_line1=t.get("address", t.get("address_line1", t["name"])),
                pincode=t.get("pincode", "000000"),
                latitude=t.get("latitude", 0), longitude=t.get("longitude", 0),
                description=t.get("description", ""),
                is_active=True,
            ))

    session.flush()
    print(f"  -> {len(ns.TEMPLES)} temples")

    temple_ids = [t["id"] for t in ns.TEMPLES]

    # Festivals - assign to temples (distribute across temples)
    festival_count = 0
    for i, f in enumerate(ns.FESTIVALS):
        tid = temple_ids[i % len(temple_ids)]
        session.add(Festival(
            id=uid(), temple_id=tid, name=f["name"],
            description=f.get("description", ""),
            starts_on=datetime.now() + timedelta(days=i * 15),
            ends_on=datetime.now() + timedelta(days=i * 15 + 1),
            annual_recurring=f.get("annual_recurring", True),
        ))
        festival_count += 1

    session.flush()
    print(f"  -> {festival_count} festivals")

    # Pujas - assign to temples
    puja_count = 0
    for i, p in enumerate(ns.PUJAS):
        tid = temple_ids[i % len(temple_ids)]
        session.add(Puja(
            id=uid(), temple_id=tid, title=p["title"],
            description=p.get("description", ""),
            status=p.get("status", "active"),
            base_price=p.get("base_price", 0),
        ))
        puja_count += 1

    session.flush()
    print(f"  -> {puja_count} pujas")

    # Accommodations (generator function)
    acc_count = 0
    room_count = 0
    for tid in temple_ids[:15]:  # 15 temples get accommodations
        accommodations = ns.generate_accommodations(tid, count=2)
        for acc in accommodations:
            existing = session.query(Accommodation).filter_by(id=acc["id"]).first()
            if not existing:
                session.add(Accommodation(
                    id=acc["id"], temple_id=acc.get("temple_id"),
                    name=acc["name"],
                    accommodation_type=acc.get("accommodation_type", "dharamshala"),
                    is_active=acc.get("is_active", True),
                ))
                acc_count += 1
            # Hotels
            hotel = acc.get("hotel", {})
            if hotel:
                existing_h = session.query(Hotel).filter_by(id=hotel["id"]).first()
                if not existing_h:
                    session.add(Hotel(
                        id=hotel["id"], accommodation_id=hotel["accommodation_id"],
                        star_rating=hotel.get("star_rating"),
                        check_in_time=hotel.get("check_in_time"),
                        check_out_time=hotel.get("check_out_time"),
                        contact_number=hotel.get("contact_number"),
                        is_active=hotel.get("is_active", True),
                    ))
            # Rooms
            for r in acc.get("rooms", []):
                existing_r = session.query(Room).filter_by(id=r["id"]).first()
                if not existing_r:
                    session.add(Room(
                        id=r["id"], hotel_id=r["hotel_id"],
                        room_type=r["room_type"], capacity=r["capacity"],
                        price_per_night=r["price_per_night"],
                        is_available=r.get("is_available", True),
                        is_active=r.get("is_active", True),
                    ))
                    room_count += 1

    session.flush()
    print(f"  -> {acc_count} accommodations, {room_count} rooms")

    # Travel Packages (generator function)
    tp_count = 0
    for tid in temple_ids[:20]:
        temple_name = next((t["name"] for t in ns.TEMPLES if t["id"] == tid), "Temple")
        packages = ns.generate_travel_packages(tid, temple_name)
        for tp in packages:
            existing = session.query(TravelPackage).filter_by(id=tp["id"]).first()
            if not existing:
                session.add(TravelPackage(
                    id=tp["id"], temple_id=tp.get("temple_id"),
                    title=tp["title"], description=tp.get("description", ""),
                    price=tp.get("price", 5000), is_active=tp.get("is_active", True),
                ))
                tp_count += 1

    session.flush()
    print(f"  -> {tp_count} travel packages")

    # Tour Guides
    city_ids = [c["id"] for c in ns.CITIES]
    tg_count = 0
    for i, tg in enumerate(ns.TOUR_GUIDES):
        session.add(TourGuide(
            id=uid(), city_id=city_ids[i % len(city_ids)],
            name=tg["name"],
            phone_number=tg.get("phone_number", ""),
            rating_avg=tg.get("rating_avg", 4.5),
            is_active=True,
        ))
        tg_count += 1

    session.flush()
    print(f"  -> {tg_count} tour guides")

    # Pandits
    pandit_count = 0
    for i, p in enumerate(ns.PANDITS):
        session.add(Pandit(
            id=uid(), temple_id=temple_ids[i % len(temple_ids)],
            name=p["name"], phone_number=p.get("phone_number", ""),
            is_active=True,
        ))
        pandit_count += 1

    session.flush()
    print(f"  -> {pandit_count} pandits")

    # Transportation
    trans_count = 0
    for t in ns.TRANSPORTATION:
        existing = session.query(Transportation).filter_by(provider_name=t["provider_name"]).first()
        if not existing:
            session.add(Transportation(
                id=uid(), temple_id=temple_ids[0],
                provider_name=t["provider_name"],
                transport_type=t["transport_type"],
                contact_number=t.get("contact_number", ""),
                is_active=True,
            ))
            trans_count += 1

    session.flush()
    print(f"  -> {trans_count} transportation providers")

    # Nearby Attractions
    attr_count = 0
    for tid in temple_ids[:20]:
        for i, attr in enumerate(ns.NEARBY_ATTRACTIONS):
            session.add(NearbyAttraction(
                id=uid(), temple_id=tid, name=attr["name"],
                category=attr.get("category", "landmark"),
                description=attr.get("description", ""),
                distance_km=attr.get("distance_km", 0.5),
                duration_minutes=attr.get("duration_minutes", 30),
                is_active=True,
            ))
            attr_count += 1

    session.flush()
    print(f"  -> {attr_count} nearby attractions")

    # Events
    event_count = 0
    for tid in temple_ids[:10]:
        events = ns.generate_events(tid)
        for e in events:
            session.add(TempleEvent(
                id=e["id"], temple_id=e["temple_id"],
                title=e["title"], description=e.get("description", ""),
                starts_on=e["starts_on"], is_public=e.get("is_public", True),
            ))
            event_count += 1

    session.flush()
    print(f"  -> {event_count} events")


def seed_modit(session: Session):
    """Seed MODIT data using ORM models."""
    print("[MODIT] Seeding organizations, suppliers, brands...")

    # Map MODIT city names to Namo Setu city IDs
    namo_cities = {c["name"]: c["id"] for c in ns.CITIES}
    # Add Delhi since Namo Setu doesn't have it
    if "Delhi" not in namo_cities:
        from backend.app.models.shared import City as CityModel
        delhi = session.query(CityModel).filter_by(name="Delhi").first()
        if delhi:
            namo_cities["Delhi"] = delhi.id
        else:
            namo_cities["Delhi"] = namo_cities.get("Mumbai", ns.CITIES[0]["id"])
    # Map warehouse city names to existing IDs
    wh_city_map = {
        "Mumbai": namo_cities.get("Mumbai", ns.CITIES[0]["id"]),
        "Pune": namo_cities.get("Pune", ns.CITIES[1]["id"]),
        "Delhi": namo_cities.get("Delhi", ns.CITIES[0]["id"]),
        "Bangalore": namo_cities.get("Bangalore", ns.CITIES[3]["id"]),
        "Chennai": namo_cities.get("Chennai", ns.CITIES[4]["id"]),
        "Hyderabad": namo_cities.get("Hyderabad", ns.CITIES[5]["id"]),
        "Ahmedabad": namo_cities.get("Ahmedabad", ns.CITIES[6]["id"]),
        "Kolkata": namo_cities.get("Kolkata", ns.CITIES[7]["id"]),
        "Jaipur": namo_cities.get("Jaipur", ns.CITIES[8]["id"]),
        "Lucknow": namo_cities.get("Lucknow", ns.CITIES[0]["id"]),
        "Nagpur": namo_cities.get("Nagpur", ns.CITIES[2]["id"]),
        "Indore": namo_cities.get("Indore", ns.CITIES[0]["id"]),
        "Coimbatore": namo_cities.get("Chennai", ns.CITIES[4]["id"]),
        "Surat": namo_cities.get("Ahmedabad", ns.CITIES[6]["id"]),
        "Visakhapatnam": namo_cities.get("Hyderabad", ns.CITIES[5]["id"]),
    }

    # Users
    for u in ms.USERS:
        existing = session.query(User).filter_by(id=u["id"]).first()
        if not existing:
            session.add(User(
                id=u["id"], email=u["email"], full_name=u["full_name"],
                hashed_password="hashed_placeholder", is_active=u["is_active"],
                is_verified=u.get("is_verified", True), mfa_enabled=False,
            ))

    session.flush()
    print(f"  -> {len(ms.USERS)} users")

    # Organizations
    for o in ms.ORGANIZATIONS:
        existing = session.query(Organization).filter_by(id=o["id"]).first()
        if not existing:
            session.add(Organization(
                id=o["id"], owner_user_id=o.get("owner_user_id"),
                name=o["name"], legal_name=o.get("legal_name"),
                organization_type=o["organization_type"],
                registration_number=o.get("registration_number"),
                gst_number=o.get("gst_number"), pan_number=o.get("pan_number"),
                is_active=o.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.ORGANIZATIONS)} organizations")

    # Brands
    for b in ms.BRANDS:
        existing = session.query(Brand).filter_by(id=b["id"]).first()
        if not existing:
            session.add(Brand(
                id=b["id"], name=b["name"], slug=b["slug"],
                description=b.get("description", ""), is_active=b.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.BRANDS)} brands")

    # Categories
    for c in ms.CATEGORIES:
        existing = session.query(Category).filter_by(id=c["id"]).first()
        if not existing:
            session.add(Category(
                id=c["id"], name=c["name"], slug=c["slug"],
                description=c.get("description", ""), is_active=c.get("is_active", True),
            ))

    session.flush()

    # Sub Categories
    for sc in ms.SUB_CATEGORIES:
        existing = session.query(SubCategory).filter_by(id=sc["id"]).first()
        if not existing:
            session.add(SubCategory(
                id=sc["id"], category_id=sc["category_id"], name=sc["name"],
                slug=sc["slug"], description=sc.get("description", ""),
                is_active=sc.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.CATEGORIES)} categories, {len(ms.SUB_CATEGORIES)} sub-categories")

    # Units
    for u in ms.UNITS:
        existing = session.query(Unit).filter_by(id=u["id"]).first()
        if not existing:
            session.add(Unit(
                id=u["id"], name=u["name"], code=u["code"],
                symbol=u.get("symbol"), is_active=u.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.UNITS)} units")

    # GST
    for g in ms.GST_RATES:
        existing = session.query(GST).filter_by(id=g["id"]).first()
        if not existing:
            session.add(GST(
                id=g["id"], code=g["code"], rate_percent=g["rate_percent"],
                description=g.get("description", ""), is_active=g.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.GST_RATES)} GST rates")

    # Suppliers
    for s in ms.SUPPLIERS:
        existing = session.query(Supplier).filter_by(id=s["id"]).first()
        if not existing:
            session.add(Supplier(
                id=s["id"], organization_id=s["organization_id"],
                supplier_code=s["supplier_code"], is_verified=s.get("is_verified", False),
            ))

    session.flush()
    print(f"  -> {len(ms.SUPPLIERS)} suppliers")

    # Vendors
    for v in ms.VENDORS:
        existing = session.query(Vendor).filter_by(id=v["id"]).first()
        if not existing:
            session.add(Vendor(
                id=v["id"], supplier_id=v["supplier_id"], vendor_code=v["vendor_code"],
                name=v["name"], contact_phone=v.get("contact_phone"),
                contact_email=v.get("contact_email"), is_active=v.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.VENDORS)} vendors")

    # Warehouses
    for w in ms.WAREHOUSES:
        existing = session.query(Warehouse).filter_by(id=w["id"]).first()
        if not existing:
            city_name = next((c["name"] for c in ms.CITIES if c["id"] == w["city_id"]), "Mumbai")
            city_id = wh_city_map.get(city_name, ns.CITIES[0]["id"])
            session.add(Warehouse(
                id=w["id"], organization_id=w["organization_id"],
                supplier_id=w.get("supplier_id"), city_id=city_id,
                warehouse_code=w["warehouse_code"], name=w["name"],
                address_line1=w["address_line1"], address_line2=w.get("address_line2"),
                pincode=w["pincode"], is_active=w.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.WAREHOUSES)} warehouses")

    # Products
    for p in ms.PRODUCTS:
        existing = session.query(Product).filter_by(id=p["id"]).first()
        if not existing:
            session.add(Product(
                id=p["id"], organization_id=p["organization_id"],
                supplier_id=p.get("supplier_id"), brand_id=p.get("brand_id"),
                category_id=p["category_id"], sub_category_id=p.get("sub_category_id"),
                unit_id=p["unit_id"], gst_id=p.get("gst_id"),
                sku=p["sku"], name=p["name"], slug=p["slug"],
                description=p.get("description", ""),
                mrp=p.get("mrp"), list_price=p["list_price"],
                approval_status="approved", is_active=p.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.PRODUCTS)} products")

    # Projects
    for pr in ms.PROJECTS:
        existing = session.query(Project).filter_by(id=pr["id"]).first()
        if not existing:
            session.add(Project(
                id=pr["id"], organization_id=pr["organization_id"],
                project_code=pr["project_code"], name=pr["name"],
                status=pr["status"], start_date=pr.get("start_date"),
                end_date=pr.get("end_date"), budget_amount=pr.get("budget_amount"),
                notes=pr.get("notes", ""),
            ))

    session.flush()
    print(f"  -> {len(ms.PROJECTS)} projects")

    # RFQs
    for rfq in ms.RFQS:
        existing = session.query(RFQ).filter_by(id=rfq["id"]).first()
        if not existing:
            session.add(RFQ(
                id=rfq["id"], organization_id=rfq["organization_id"],
                project_id=rfq.get("project_id"), rfq_number=rfq["rfq_number"],
                status=rfq["status"], requested_by_user_id=rfq["requested_by_user_id"],
                due_date=rfq.get("due_date"), notes=rfq.get("notes", ""),
            ))

    session.flush()
    print(f"  -> {len(ms.RFQS)} RFQs")

    # RFQ Items
    for ri in ms.RFQ_ITEMS:
        existing = session.query(RFQItem).filter_by(id=ri["id"]).first()
        if not existing:
            session.add(RFQItem(
                id=ri["id"], rfq_id=ri["rfq_id"], product_id=ri["product_id"],
                requested_quantity=ri["requested_quantity"],
                unit_price_hint=ri.get("unit_price_hint"),
                notes=ri.get("notes", ""),
            ))

    session.flush()
    print(f"  -> {len(ms.RFQ_ITEMS)} RFQ items")

    # Quotations
    for q in ms.QUOTATIONS:
        existing = session.query(Quotation).filter_by(id=q["id"]).first()
        if not existing:
            session.add(Quotation(
                id=q["id"], rfq_id=q["rfq_id"], supplier_id=q["supplier_id"],
                quotation_number=q["quotation_number"], status=q["status"],
                valid_until=q.get("valid_until"), subtotal=q["subtotal"],
                gst_total=q["gst_total"], grand_total=q["grand_total"],
                terms_and_conditions=q.get("terms_and_conditions", ""),
            ))

    session.flush()
    print(f"  -> {len(ms.QUOTATIONS)} quotations")

    # Quotation Items
    for qi in ms.QUOTATION_ITEMS:
        existing = session.query(QuotationItem).filter_by(id=qi["id"]).first()
        if not existing:
            session.add(QuotationItem(
                id=qi["id"], quotation_id=qi["quotation_id"],
                product_id=qi["product_id"], quantity=qi["quantity"],
                unit_price=qi["unit_price"], gst_amount=qi["gst_amount"],
                line_total=qi["line_total"],
            ))

    session.flush()
    print(f"  -> {len(ms.QUOTATION_ITEMS)} quotation items")

    # Purchase Orders
    for po in ms.PURCHASE_ORDERS:
        existing = session.query(PurchaseOrder).filter_by(id=po["id"]).first()
        if not existing:
            session.add(PurchaseOrder(
                id=po["id"], organization_id=po["organization_id"],
                project_id=po.get("project_id"), rfq_id=po.get("rfq_id"),
                order_number=po["order_number"], status=po["status"],
                order_date=po["order_date"],
                expected_delivery_date=po.get("expected_delivery_date"),
                total_amount=po["total_amount"],
            ))

    session.flush()
    print(f"  -> {len(ms.PURCHASE_ORDERS)} purchase orders")

    # Orders
    for o in ms.ORDERS:
        existing = session.query(Order).filter_by(id=o["id"]).first()
        if not existing:
            session.add(Order(
                id=o["id"], organization_id=o["organization_id"],
                purchase_order_id=o.get("purchase_order_id"),
                order_number=o["order_number"], status=o["status"],
                placed_at=o["placed_at"], notes=o.get("notes", ""),
            ))

    session.flush()
    print(f"  -> {len(ms.ORDERS)} orders")

    # Order Items
    for oi in ms.ORDER_ITEMS:
        existing = session.query(OrderItem).filter_by(id=oi["id"]).first()
        if not existing:
            session.add(OrderItem(
                id=oi["id"], order_id=oi["order_id"], product_id=oi["product_id"],
                quantity=oi["quantity"], unit_price=oi["unit_price"],
                gst_amount=oi["gst_amount"], line_total=oi["line_total"],
            ))

    session.flush()
    print(f"  -> {len(ms.ORDER_ITEMS)} order items")

    # Invoices
    for inv in ms.INVOICES:
        existing = session.query(Invoice).filter_by(id=inv["id"]).first()
        if not existing:
            session.add(Invoice(
                id=inv["id"], organization_id=inv["organization_id"],
                order_id=inv.get("order_id"),
                invoice_number=inv["invoice_number"], status=inv["status"],
                invoice_date=inv["invoice_date"], due_date=inv.get("due_date"),
                subtotal=inv["subtotal"], gst_total=inv["gst_total"],
                grand_total=inv["grand_total"],
            ))

    session.flush()
    print(f"  -> {len(ms.INVOICES)} invoices")

    # Drivers
    for d in ms.DRIVERS:
        existing = session.query(Driver).filter_by(id=d["id"]).first()
        if not existing:
            session.add(Driver(
                id=d["id"], organization_id=d["organization_id"],
                full_name=d["full_name"], phone_number=d["phone_number"],
                license_number=d.get("license_number"), is_active=d.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.DRIVERS)} drivers")

    # Vehicles
    for v in ms.VEHICLES:
        existing = session.query(Vehicle).filter_by(id=v["id"]).first()
        if not existing:
            session.add(Vehicle(
                id=v["id"], organization_id=v["organization_id"],
                registration_number=v["registration_number"],
                vehicle_type=v["vehicle_type"],
                capacity_kg=v.get("capacity_kg"), is_active=v.get("is_active", True),
            ))

    session.flush()
    print(f"  -> {len(ms.VEHICLES)} vehicles")

    # Deliveries
    for d in ms.DELIVERIES:
        existing = session.query(Delivery).filter_by(id=d["id"]).first()
        if not existing:
            session.add(Delivery(
                id=d["id"], purchase_order_id=d["purchase_order_id"],
                delivery_number=d["delivery_number"], status=d["status"],
                driver_id=d.get("driver_id"), vehicle_id=d.get("vehicle_id"),
                dispatched_at=d.get("dispatched_at"),
                delivered_at=d.get("delivered_at"),
            ))

    session.flush()
    print(f"  -> {len(ms.DELIVERIES)} deliveries")

    # Inventory
    inventory = ms.generate_inventory()
    for inv in inventory:
        existing = session.query(Inventory).filter_by(id=inv["id"]).first()
        if not existing:
            session.add(Inventory(
                id=inv["id"], warehouse_id=inv["warehouse_id"],
                product_id=inv["product_id"],
                quantity_on_hand=inv["quantity_on_hand"],
                reserved_quantity=inv["reserved_quantity"],
                reorder_level=inv["reorder_level"],
                status=inv["status"],
                last_restocked_at=inv.get("last_restocked_at"),
            ))

    session.flush()
    print(f"  -> {len(inventory)} inventory records")

    # Notifications
    for n in ms.MODIT_NOTIFICATIONS:
        nid = uid()
        existing = session.query(ModitNotification).filter_by(title=n["title"]).first()
        if not existing:
            session.add(ModitNotification(
                id=nid, organization_id=ms.ORGANIZATIONS[0]["id"],
                channel=n["channel"], title=n["title"], body=n["body"],
                status="queued",
            ))

    session.flush()
    print(f"  -> {len(ms.MODIT_NOTIFICATIONS)} notifications")


def run():
    settings = get_settings()
    db_url = get_sync_url(settings)
    print(f"Connecting to: {db_url}")
    print("=" * 60)

    engine = create_engine(db_url)

    with Session(engine) as session:
        country_id = ns.COUNTRY_ID
        seed_namo(session, country_id)
        seed_modit(session)
        session.commit()
        print("=" * 60)
        print("All seed data loaded successfully!")


if __name__ == "__main__":
    run()
