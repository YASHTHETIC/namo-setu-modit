"""
MODIT - Comprehensive Construction Material Procurement Seed Data
Covers: Organizations, Suppliers, Vendors, Brands, Categories, SubCategories,
        Units, GST, Products, Warehouses, Inventory, Projects, RFQs,
        Quotations, Orders, PurchaseOrders, Invoices, Drivers, Vehicles
"""

import uuid
from datetime import datetime, date, timedelta

def uid():
    return str(uuid.uuid4())

# ═══════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════

USERS = [
    {"id": uid(), "email": "admin@modit.in", "full_name": "MODIT Admin", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "rahul@buildcorp.in", "full_name": "Rahul Mehta", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "priya@steeltraders.in", "full_name": "Priya Agarwal", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "amit@cementmart.in", "full_name": "Amit Gupta", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "sunita@infraprojects.in", "full_name": "Sunita Sharma", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "vikram@constructpro.in", "full_name": "Vikram Singh", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "neha@materialhub.in", "full_name": "Neha Kapoor", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "rajan@supplychain.in", "full_name": "Rajan Patel", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "deepak@builderfirst.in", "full_name": "Deepak Verma", "is_active": True, "is_verified": True},
    {"id": uid(), "email": "meera@qualitybuild.in", "full_name": "Meera Iyer", "is_active": True, "is_verified": True},
]

# ═══════════════════════════════════════════════════════════════════
# ORGANIZATIONS
# ═══════════════════════════════════════════════════════════════════

ORGANIZATIONS = [
    {"id": uid(), "owner_user_id": USERS[0]["id"], "name": "MODIT Platform", "legal_name": "MODIT Technologies Pvt Ltd", "organization_type": "customer", "registration_number": "MODIT-REG-001", "gst_number": "27AABCM1234F1Z5", "pan_number": "AABCM1234F", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[1]["id"], "name": "BuildCorp India", "legal_name": "BuildCorp Construction Pvt Ltd", "organization_type": "builder", "registration_number": "BC-REG-001", "gst_number": "27AADCB5678G1Z8", "pan_number": "AADCB5678G", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[2]["id"], "name": "Steel Traders Mumbai", "legal_name": "Steel Traders and Suppliers Pvt Ltd", "organization_type": "supplier", "registration_number": "ST-REG-001", "gst_number": "27AABCS9012H1Z2", "pan_number": "AABCS9012H", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[3]["id"], "name": "Cement Mart", "legal_name": "Cement Mart Distributors Pvt Ltd", "organization_type": "supplier", "registration_number": "CM-REG-001", "gst_number": "27AABCC3456J1Z4", "pan_number": "AABCC3456J", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[4]["id"], "name": "InfraProjects Ltd", "legal_name": "InfraProjects Construction Ltd", "organization_type": "contractor", "registration_number": "IP-REG-001", "gst_number": "27AABCI7890K1Z6", "pan_number": "AABCI7890K", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[5]["id"], "name": "ConstructPro", "legal_name": "ConstructPro Building Solutions", "organization_type": "builder", "registration_number": "CP-REG-001", "gst_number": "27AABCP1234L1Z8", "pan_number": "AABCP1234L", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[6]["id"], "name": "MaterialHub India", "legal_name": "MaterialHub Trading Pvt Ltd", "organization_type": "retailer", "registration_number": "MH-REG-001", "gst_number": "27AABCM5678M1Z0", "pan_number": "AABCM5678M", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[7]["id"], "name": "SupplyChain Solutions", "legal_name": "SupplyChain Logistics Pvt Ltd", "organization_type": "vendor", "registration_number": "SC-REG-001", "gst_number": "27AABCS9012N1Z2", "pan_number": "AABCS9012N", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[8]["id"], "name": "BuilderFirst Materials", "legal_name": "BuilderFirst Trading Co", "organization_type": "supplier", "registration_number": "BF-REG-001", "gst_number": "27AABCB3456P1Z4", "pan_number": "AABCB3456P", "is_active": True},
    {"id": uid(), "owner_user_id": USERS[9]["id"], "name": "QualityBuild Suppliers", "legal_name": "QualityBuild Materials Pvt Ltd", "organization_type": "architect", "registration_number": "QB-REG-001", "gst_number": "27AABCQ7890R1Z6", "pan_number": "AABCQ7890R", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# CITIES (referencing namo_seeds CITIES)
# ═══════════════════════════════════════════════════════════════════

CITIES = [
    {"id": uid(), "name": "Mumbai", "latitude": 19.0760, "longitude": 72.8777},
    {"id": uid(), "name": "Pune", "latitude": 18.5204, "longitude": 73.8567},
    {"id": uid(), "name": "Delhi", "latitude": 28.7041, "longitude": 77.1025},
    {"id": uid(), "name": "Bangalore", "latitude": 12.9716, "longitude": 77.5946},
    {"id": uid(), "name": "Chennai", "latitude": 13.0827, "longitude": 80.2707},
    {"id": uid(), "name": "Hyderabad", "latitude": 17.3850, "longitude": 78.4867},
    {"id": uid(), "name": "Ahmedabad", "latitude": 23.0225, "longitude": 72.5714},
    {"id": uid(), "name": "Kolkata", "latitude": 22.5726, "longitude": 88.3639},
    {"id": uid(), "name": "Jaipur", "latitude": 26.9124, "longitude": 75.7873},
    {"id": uid(), "name": "Lucknow", "latitude": 26.8467, "longitude": 80.9462},
    {"id": uid(), "name": "Nagpur", "latitude": 21.1458, "longitude": 79.0882},
    {"id": uid(), "name": "Indore", "latitude": 22.7196, "longitude": 75.8577},
    {"id": uid(), "name": "Coimbatore", "latitude": 11.0168, "longitude": 76.9558},
    {"id": uid(), "name": "Surat", "latitude": 21.1702, "longitude": 72.8311},
    {"id": uid(), "name": "Visakhapatnam", "latitude": 17.6868, "longitude": 83.2185},
]

# ═══════════════════════════════════════════════════════════════════
# BRANDS - 20 Construction Material Brands
# ═══════════════════════════════════════════════════════════════════

BRANDS = [
    {"id": uid(), "name": "UltraTech Cement", "slug": "ultratech-cement", "description": "India's largest cement manufacturer", "is_active": True},
    {"id": uid(), "name": "ACC Cement", "slug": "acc-cement", "description": "Trusted cement brand since 1936", "is_active": True},
    {"id": uid(), "name": "Ambuja Cements", "slug": "ambuja-cements", "description": "Leading cement company in India", "is_active": True},
    {"id": uid(), "name": "Tata Tiscon", "slug": "tata-tiscon", "description": "Tata Steel's rebar brand", "is_active": True},
    {"id": uid(), "name": "JSW Neosteel", "slug": "jsw-neosteel", "description": "JSW Steel's premium rebar", "is_active": True},
    {"id": uid(), "name": "SAIL TMT", "slug": "sail-tmt", "description": "Steel Authority of India TMT bars", "is_active": True},
    {"id": uid(), "name": "Hindware", "slug": "hindware", "description": "Premium sanitaryware and tiles", "is_active": True},
    {"id": uid(), "name": "Kajaria Ceramics", "slug": "kajaria-ceramics", "description": "India's largest tile manufacturer", "is_active": True},
    {"id": uid(), "name": "Somany Ceramics", "slug": "somany-ceramics", "description": "Leading tiles and sanitaryware brand", "is_active": True},
    {"id": uid(), "name": "Asian Paints", "slug": "asian-paints", "description": "India's largest paint company", "is_active": True},
    {"id": uid(), "name": "Berger Paints", "slug": "berger-paints", "description": "Leading paint manufacturer", "is_active": True},
    {"id": uid(), "name": "Pidilite Industries", "slug": "pidilite-industries", "description": "Adhesives and construction chemicals", "is_active": True},
    {"id": uid(), "name": "Fosroc India", "slug": "fosroc-india", "description": "Construction chemicals specialist", "is_active": True},
    {"id": uid(), "name": "Saint-Gobain", "slug": "saint-gobain", "description": "Glass and building materials", "is_active": True},
    {"id": uid(), "name": "Simpolo Ceramics", "slug": "simpolo-ceramics", "description": "Premium ceramic tiles", "is_active": True},
    {"id": uid(), "name": "RCF Pipes", "slug": "rcf-pipes", "description": "PVC and CPVC pipes", "is_active": True},
    {"id": uid(), "name": "Supreme Industries", "slug": "supreme-industries", "description": "Pipes and plastic products", "is_active": True},
    {"id": uid(), "name": "Finolex Cables", "slug": "finolex-cables", "description": "Electrical wires and cables", "is_active": True},
    {"id": uid(), "name": "Polycab India", "slug": "polycab-india", "description": "Wires, cables, and FMEG", "is_active": True},
    {"id": uid(), "name": "Cera Sanitaryware", "slug": "cera-sanitaryware", "description": "Premium bathroom solutions", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# CATEGORIES - 12 Construction Material Categories
# ═══════════════════════════════════════════════════════════════════

CATEGORIES = [
    {"id": uid(), "name": "Cement", "slug": "cement", "description": "All types of cement", "is_active": True},
    {"id": uid(), "name": "Steel & Rebar", "slug": "steel-rebar", "description": "TMT bars, structural steel", "is_active": True},
    {"id": uid(), "name": "Tiles & Ceramics", "slug": "tiles-ceramics", "description": "Floor tiles, wall tiles, ceramic items", "is_active": True},
    {"id": uid(), "name": "Sanitaryware", "slug": "sanitaryware", "description": "Bathroom fittings and fixtures", "is_active": True},
    {"id": uid(), "name": "Paints & Coatings", "slug": "paints-coatings", "description": "Interior, exterior, primers", "is_active": True},
    {"id": uid(), "name": "Pipes & Fittings", "slug": "pipes-fittings", "description": "PVC, CPVC, GI pipes", "is_active": True},
    {"id": uid(), "name": "Electrical", "slug": "electrical", "description": "Wires, cables, switchgear", "is_active": True},
    {"id": uid(), "name": "Adhesives & Chemicals", "slug": "adhesives-chemicals", "description": "Construction chemicals, adhesives", "is_active": True},
    {"id": uid(), "name": "Glass & Windows", "slug": "glass-windows", "description": "Float glass, toughened glass, frames", "is_active": True},
    {"id": uid(), "name": "Wood & Plywood", "slug": "wood-plywood", "description": "Plywood, blockboard, laminates", "is_active": True},
    {"id": uid(), "name": "Aggregates", "slug": "aggregates", "description": "Sand, gravel, crushed stone", "is_active": True},
    {"id": uid(), "name": "Hardware", "slug": "hardware", "description": "Door handles, hinges, locks", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# SUB CATEGORIES
# ═══════════════════════════════════════════════════════════════════

SUB_CATEGORIES = [
    # Cement
    {"id": uid(), "category_id": CATEGORIES[0]["id"], "name": "OPC Cement", "slug": "opc-cement", "description": "Ordinary Portland Cement", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[0]["id"], "name": "PPC Cement", "slug": "ppc-cement", "description": "Portland Pozzolana Cement", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[0]["id"], "name": "White Cement", "slug": "white-cement", "description": "White cement for decorative work", "is_active": True},
    # Steel
    {"id": uid(), "category_id": CATEGORIES[1]["id"], "name": "TMT Bars", "slug": "tmt-bars", "description": "Thermo-Mechanically Treated bars", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[1]["id"], "name": "Structural Steel", "slug": "structural-steel", "description": "I-beams, channels, angles", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[1]["id"], "name": "Binding Wire", "slug": "binding-wire", "description": "GI binding wire for rebar tying", "is_active": True},
    # Tiles
    {"id": uid(), "category_id": CATEGORIES[2]["id"], "name": "Floor Tiles", "slug": "floor-tiles", "description": "Vitrified and ceramic floor tiles", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[2]["id"], "name": "Wall Tiles", "slug": "wall-tiles", "description": "Ceramic and porcelain wall tiles", "is_active": True},
    # Sanitaryware
    {"id": uid(), "category_id": CATEGORIES[3]["id"], "name": "Toilets", "slug": "toilets", "description": "Western and Indian style toilets", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[3]["id"], "name": "Wash Basins", "slug": "wash-basins", "description": "Pedestal and wall-mounted basins", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[3]["id"], "name": "Faucets", "slug": "faucets", "description": "Taps and mixers", "is_active": True},
    # Paints
    {"id": uid(), "category_id": CATEGORIES[4]["id"], "name": "Interior Paint", "slug": "interior-paint", "description": "Emulsions and distempers", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[4]["id"], "name": "Exterior Paint", "slug": "exterior-paint", "description": "Weather-proof exterior coatings", "is_active": True},
    # Pipes
    {"id": uid(), "category_id": CATEGORIES[5]["id"], "name": "PVC Pipes", "slug": "pvc-pipes", "description": "Unplasticized PVC pipes", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[5]["id"], "name": "CPVC Pipes", "slug": "cpvc-pipes", "description": "Chlorinated PVC for hot water", "is_active": True},
    # Electrical
    {"id": uid(), "category_id": CATEGORIES[6]["id"], "name": "Wires", "slug": "wires", "description": "Single and multi-core wires", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[6]["id"], "name": "Cables", "slug": "cables", "description": "Power and control cables", "is_active": True},
    # Adhesives
    {"id": uid(), "category_id": CATEGORIES[7]["id"], "name": "Tile Adhesive", "slug": "tile-adhesive", "description": "Cement-based tile adhesives", "is_active": True},
    {"id": uid(), "category_id": CATEGORIES[7]["id"], "name": "Waterproofing", "slug": "waterproofing", "description": "Waterproofing compounds", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# UNITS - 15 Measurement Units
# ═══════════════════════════════════════════════════════════════════

UNITS = [
    {"id": uid(), "name": "Kilogram", "code": "KG", "symbol": "kg", "is_active": True},
    {"id": uid(), "name": "Metric Ton", "code": "MT", "symbol": "t", "is_active": True},
    {"id": uid(), "name": "Quintal", "code": "QQ", "symbol": "q", "is_active": True},
    {"id": uid(), "name": "Piece", "code": "PCS", "symbol": "pc", "is_active": True},
    {"id": uid(), "name": "Bag", "code": "BAG", "symbol": "bag", "is_active": True},
    {"id": uid(), "name": "Bundle", "code": "BND", "symbol": "bnd", "is_active": True},
    {"id": uid(), "name": "Cubic Meter", "code": "CUM", "symbol": "m\u00b3", "is_active": True},
    {"id": uid(), "name": "Square Meter", "code": "SQM", "symbol": "m\u00b2", "is_active": True},
    {"id": uid(), "name": "Square Feet", "code": "SQFT", "symbol": "sqft", "is_active": True},
    {"id": uid(), "name": "Running Feet", "code": "RFT", "symbol": "rft", "is_active": True},
    {"id": uid(), "name": "Litres", "code": "L", "symbol": "L", "is_active": True},
    {"id": uid(), "name": "Number", "code": "NO", "symbol": "no", "is_active": True},
    {"id": uid(), "name": "Set", "code": "SET", "symbol": "set", "is_active": True},
    {"id": uid(), "name": "Roll", "code": "ROLL", "symbol": "roll", "is_active": True},
    {"id": uid(), "name": "Box", "code": "BOX", "symbol": "box", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# GST RATES
# ═══════════════════════════════════════════════════════════════════

GST_RATES = [
    {"id": uid(), "code": "GST-0", "rate_percent": 0.0, "description": "Nil rate", "is_active": True},
    {"id": uid(), "code": "GST-5", "rate_percent": 5.0, "description": "5% GST", "is_active": True},
    {"id": uid(), "code": "GST-12", "rate_percent": 12.0, "description": "12% GST", "is_active": True},
    {"id": uid(), "code": "GST-18", "rate_percent": 18.0, "description": "18% GST", "is_active": True},
    {"id": uid(), "code": "GST-28", "rate_percent": 28.0, "description": "28% GST", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# SUPPLIERS & VENDORS
# ═══════════════════════════════════════════════════════════════════

SUPPLIERS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_code": "SUP-001", "is_verified": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_code": "SUP-002", "is_verified": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[8]["id"], "supplier_code": "SUP-003", "is_verified": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_code": "SUP-004", "is_verified": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "supplier_code": "SUP-005", "is_verified": False},
]

VENDORS = [
    {"id": uid(), "supplier_id": SUPPLIERS[0]["id"], "vendor_code": "VEN-001", "name": "Mumbai Steel Traders", "contact_phone": "+91-9876543401", "contact_email": "mumbai@steeltraders.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[0]["id"], "vendor_code": "VEN-002", "name": "Pune Steel Mart", "contact_phone": "+91-9876543402", "contact_email": "pune@steeltraders.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[1]["id"], "vendor_code": "VEN-003", "name": "Cement Hub Delhi", "contact_phone": "+91-9876543403", "contact_email": "delhi@cementmart.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[1]["id"], "vendor_code": "VEN-004", "name": "Cement Express Bangalore", "contact_phone": "+91-9876543404", "contact_email": "bangalore@cementmart.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[2]["id"], "vendor_code": "VEN-005", "name": "BuilderFirst Mumbai", "contact_phone": "+91-9876543405", "contact_email": "mumbai@builderfirst.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[3]["id"], "vendor_code": "VEN-006", "name": "MaterialHub Warehouse", "contact_phone": "+91-9876543406", "contact_email": "warehouse@materialhub.in", "is_active": True},
    {"id": uid(), "supplier_id": SUPPLIERS[4]["id"], "vendor_code": "VEN-007", "name": "SupplyChain Logistics", "contact_phone": "+91-9876543407", "contact_email": "ops@supplychain.in", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# WAREHOUSES
# ═══════════════════════════════════════════════════════════════════

WAREHOUSES = [
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "city_id": CITIES[0]["id"], "warehouse_code": "WH-001", "name": "Mumbai Central Warehouse", "address_line1": "Plot 45, MIDC Industrial Area", "address_line2": "Andheri East", "pincode": "400093", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "city_id": CITIES[1]["id"], "warehouse_code": "WH-002", "name": "Pune Distribution Center", "address_line1": "Unit 12, Pimpri Industrial Estate", "address_line2": None, "pincode": "411018", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "city_id": CITIES[2]["id"], "warehouse_code": "WH-003", "name": "Delhi Cement Depot", "address_line1": "Sector 15, IMT Manesar", "address_line2": None, "pincode": "122051", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "city_id": CITIES[3]["id"], "warehouse_code": "WH-004", "name": "Bangalore Cement Hub", "address_line1": "Peenya Industrial Area Phase 2", "address_line2": None, "pincode": "560058", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[8]["id"], "supplier_id": SUPPLIERS[2]["id"], "city_id": CITIES[0]["id"], "warehouse_code": "WH-005", "name": "Navi Mumbai Storage", "address_line1": "Plot 78, Taloja MIDC", "address_line2": None, "pincode": "410208", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "city_id": CITIES[4]["id"], "warehouse_code": "WH-006", "name": "Chennai Material Hub", "address_line1": "Guindy Industrial Estate", "address_line2": None, "pincode": "600032", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "city_id": CITIES[5]["id"], "warehouse_code": "WH-007", "name": "Hyderabad Warehouse", "address_line1": "Kukatpally Industrial Area", "address_line2": None, "pincode": "500072", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "supplier_id": SUPPLIERS[4]["id"], "city_id": CITIES[8]["id"], "warehouse_code": "WH-008", "name": "Jaipur Logistics Center", "address_line1": "Sitapura Industrial Area", "address_line2": None, "pincode": "302022", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# PRODUCTS - 50 Construction Materials
# ═══════════════════════════════════════════════════════════════════

PRODUCTS = [
    # Cement Products (0-6)
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[0]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[0]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-UT-OPC43-50KG", "name": "UltraTech OPC 43 Grade Cement 50kg", "slug": "ultratech-opc-43-grade-50kg", "description": "Standard OPC 43 grade cement for general construction", "list_price": 375.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[0]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[1]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-UT-PPC-50KG", "name": "UltraTech PPC Cement 50kg", "slug": "ultratech-ppc-50kg", "description": "Portland Pozzolana cement for durability", "list_price": 385.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[1]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[0]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-ACC-OPC43-50KG", "name": "ACC Cement OPC 43 Grade 50kg", "slug": "acc-opc-43-50kg", "description": "Trusted quality OPC cement", "list_price": 370.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[2]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[1]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-AMB-PPC-50KG", "name": "Ambuja Cement PPC 50kg", "slug": "ambuja-ppc-50kg", "description": "Eco-friendly PPC cement", "list_price": 365.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[0]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[2]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-UT-WHT-50KG", "name": "UltraTech White Cement 50kg", "slug": "ultratech-white-cement-50kg", "description": "White cement for decorative and repair work", "list_price": 850.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[1]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[1]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-ACC-PPC-50KG-BULK", "name": "ACC PPC Cement 50kg (Bulk)", "slug": "acc-ppc-bulk", "description": "Bulk pack ACC PPC cement", "list_price": 360.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[3]["id"], "supplier_id": SUPPLIERS[1]["id"], "brand_id": BRANDS[2]["id"], "category_id": CATEGORIES[0]["id"], "sub_category_id": SUB_CATEGORIES[0]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "CEM-AMB-OPC53-50KG", "name": "Ambuja Cement OPC 53 Grade 50kg", "slug": "ambuja-opc-53-50kg", "description": "High strength OPC 53 grade cement", "list_price": 390.0, "approval_status": "approved", "is_active": True},

    # Steel & Rebar (7-13)
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[3]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-TATA-TMT-12MM", "name": "Tata Tiscon TMT Bar 12mm", "slug": "tata-tiscon-tmt-12mm", "description": "Fe 500D TMT bar 12mm diameter", "list_price": 58500.0, "mrp": 62000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[3]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-TATA-TMT-16MM", "name": "Tata Tiscon TMT Bar 16mm", "slug": "tata-tiscon-tmt-16mm", "description": "Fe 500D TMT bar 16mm diameter", "list_price": 57800.0, "mrp": 61500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[3]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-TATA-TMT-20MM", "name": "Tata Tiscon TMT Bar 20mm", "slug": "tata-tiscon-tmt-20mm", "description": "Fe 500D TMT bar 20mm diameter", "list_price": 57500.0, "mrp": 61000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[4]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-JSW-TMT-12MM", "name": "JSW Neosteel TMT Bar 12mm", "slug": "jsw-neosteel-tmt-12mm", "description": "TMT bar with higher yield strength", "list_price": 59000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[4]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-JSW-TMT-16MM", "name": "JSW Neosteel TMT Bar 16mm", "slug": "jsw-neosteel-tmt-16mm", "description": "TMT bar with higher yield strength", "list_price": 58500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[5]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[3]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-SAIL-TMT-12MM", "name": "SAIL TMT Bar 12mm", "slug": "sail-tmt-12mm", "description": "SAIL brand Fe 500D TMT bar", "list_price": 56500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": BRANDS[5]["id"], "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[4]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-SAIL-I-BEAM", "name": "SAIL Structural Steel I-Beam", "slug": "sail-structural-i-beam", "description": "ISMB 300 structural I-beam", "list_price": 55000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "supplier_id": SUPPLIERS[0]["id"], "brand_id": None, "category_id": CATEGORIES[1]["id"], "sub_category_id": SUB_CATEGORIES[5]["id"], "unit_id": UNITS[1]["id"], "gst_id": GST_RATES[3]["id"], "sku": "STL-BW-GI-1KG", "name": "GI Binding Wire 1kg Roll", "slug": "gi-binding-wire-1kg", "description": "Galvanized iron binding wire", "list_price": 120.0, "approval_status": "approved", "is_active": True},

    # Tiles & Ceramics (14-19)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[7]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[6]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-KAJ-VF-600X600", "name": "Kajaria Vitrified Floor Tile 600x600mm", "slug": "kajaria-vitrified-600x600", "description": "Premium vitrified tile for flooring", "list_price": 85.0, "mrp": 110.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[7]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[6]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-KAJ-GT-800X800", "name": "Kajaria Galileo Tile 800x800mm", "slug": "kajaria-galileo-800x800", "description": "Large format vitrified tile", "list_price": 125.0, "mrp": 155.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[8]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[7]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-SOM-WT-300X450", "name": "Somany Wall Tile 300x450mm", "slug": "somany-wall-tile-300x450", "description": "Ceramic wall tile for kitchen/bathroom", "list_price": 42.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[14]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[6]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-SIM-GF-600X600", "name": "Simpolo Grand Fino Tile 600x600mm", "slug": "simpolo-grand-fino-600x600", "description": "Polished vitrified tile", "list_price": 78.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[7]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[7]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-KAJ-DB-300X600", "name": "Kajaria Dazzle Batch 300x600mm", "slug": "kajaria-dazzle-batch-300x600", "description": "Designer bathroom wall tile", "list_price": 48.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[8]["id"], "category_id": CATEGORIES[2]["id"], "sub_category_id": SUB_CATEGORIES[6]["id"], "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "TIL-SOM-AF-600X600", "name": "Somany Archello Floor Tile 600x600mm", "slug": "somany-archello-600x600", "description": "Anti-skid vitrified floor tile", "list_price": 82.0, "approval_status": "approved", "is_active": True},

    # Sanitaryware (20-25)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[6]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[8]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-HWD-EWC-01", "name": "Hindware Western Commode", "slug": "hindware-western-commode", "description": "Premium western style toilet with flush", "list_price": 8500.0, "mrp": 12000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[19]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[8]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-CERA-IWC-01", "name": "Cera Indian Style Toilet", "slug": "cera-indian-style-toilet", "description": "Durable Indian style WC", "list_price": 3200.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[6]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[9]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-HWD-WB-01", "name": "Hindware Pedestal Wash Basin", "slug": "hindware-pedestal-basin", "description": "Classic pedestal wash basin", "list_price": 5200.0, "mrp": 6800.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[19]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[9]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-CERA-WB-02", "name": "Cera Wall-Mounted Basin", "slug": "cera-wall-mounted-basin", "description": "Contemporary wall-mounted basin", "list_price": 4500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[6]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[10]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-HWD-FC-01", "name": "Hindware Chrome Faucet Set", "slug": "hindware-chrome-faucet", "description": "Premium bathroom faucet set", "list_price": 2800.0, "mrp": 3500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[19]["id"], "category_id": CATEGORIES[3]["id"], "sub_category_id": SUB_CATEGORIES[10]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "SAN-CERA-MX-01", "name": "Cera Mixer Tap Single Lever", "slug": "cera-mixer-tap", "description": "Single lever bath mixer", "list_price": 3500.0, "approval_status": "approved", "is_active": True},

    # Paints (26-31)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[9]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[11]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-AP-EM-20L", "name": "Asian Paints Apex Emulsion 20L", "slug": "asian-paints-apex-emulsion-20l", "description": "Premium interior emulsion paint", "list_price": 4200.0, "mrp": 5100.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[9]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[12]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-AP-ACE-20L", "name": "Asian Paints Ace Exterior Emulsion 20L", "slug": "asian-paints-ace-exterior-20l", "description": "Weather-proof exterior paint", "list_price": 3800.0, "mrp": 4600.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[10]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[11]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-BRG-WF-20L", "name": "Berger WeatherCoat All Guard 20L", "slug": "berger-weathercoat-20l", "description": "Premium exterior emulsion", "list_price": 3600.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[9]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[11]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-AP-BL-20L", "name": "Asian Paints Breeze Interior 20L", "slug": "asian-paints-breeze-20l", "description": "Economy interior emulsion", "list_price": 2100.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[10]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[12]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-BRG-SC-20L", "name": "Berger Silk Shield Exterior 20L", "slug": "berger-silk-shield-20l", "description": "Premium silk-finish exterior paint", "list_price": 4500.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[9]["id"], "category_id": CATEGORIES[4]["id"], "sub_category_id": SUB_CATEGORIES[11]["id"], "unit_id": UNITS[3]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PNT-AP-PR-1L", "name": "Asian Paintsprimer 1L", "slug": "asian-paints-primer-1l", "description": "Wall primer for interior use", "list_price": 180.0, "approval_status": "approved", "is_active": True},

    # Pipes (32-36)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[15]["id"], "category_id": CATEGORIES[5]["id"], "sub_category_id": SUB_CATEGORIES[13]["id"], "unit_id": UNITS[5]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PIP-RCF-PVC-110MM", "name": "RCF PVC Pipe 110mm x 6m", "slug": "rcf-pvc-110mm-6m", "description": "Heavy duty PVC pipe for drainage", "list_price": 520.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[16]["id"], "category_id": CATEGORIES[5]["id"], "sub_category_id": SUB_CATEGORIES[13]["id"], "unit_id": UNITS[5]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PIP-SUP-PVC-75MM", "name": "Supreme PVC Pipe 75mm x 6m", "slug": "supreme-pvc-75mm-6m", "description": "PVC conduit pipe", "list_price": 380.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[15]["id"], "category_id": CATEGORIES[5]["id"], "sub_category_id": SUB_CATEGORIES[14]["id"], "unit_id": UNITS[5]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PIP-RCF-CPVC-25MM", "name": "RCF CPVC Pipe 25mm x 3m", "slug": "rcf-cpvc-25mm-3m", "description": "Hot and cold water CPVC pipe", "list_price": 290.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[16]["id"], "category_id": CATEGORIES[5]["id"], "sub_category_id": SUB_CATEGORIES[14]["id"], "unit_id": UNITS[5]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PIP-SUP-CPVC-20MM", "name": "Supreme CPVC Pipe 20mm x 3m", "slug": "supreme-cpvc-20mm-3m", "description": "CPVC pipe for hot water supply", "list_price": 240.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[15]["id"], "category_id": CATEGORIES[5]["id"], "sub_category_id": SUB_CATEGORIES[13]["id"], "unit_id": UNITS[5]["id"], "gst_id": GST_RATES[3]["id"], "sku": "PIP-RCF-PVC-160MM", "name": "RCF PVC Pipe 160mm x 6m", "slug": "rcf-pvc-160mm-6m", "description": "Large diameter PVC pipe", "list_price": 980.0, "approval_status": "approved", "is_active": True},

    # Electrical (37-40)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[17]["id"], "category_id": CATEGORIES[6]["id"], "sub_category_id": SUB_CATEGORIES[15]["id"], "unit_id": UNITS[13]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ELE-FIN-1.5SQMM-90M", "name": "Finolex 1.5 sq mm Wire 90m Roll", "slug": "finolex-1-5sqmm-90m", "description": "FRLS copper wire 1.5 sq mm", "list_price": 3200.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[18]["id"], "category_id": CATEGORIES[6]["id"], "sub_category_id": SUB_CATEGORIES[15]["id"], "unit_id": UNITS[13]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ELE-POL-2.5SQMM-90M", "name": "Polycab 2.5 sq mm Wire 90m Roll", "slug": "polycab-2-5sqmm-90m", "description": "FRLS copper wire 2.5 sq mm", "list_price": 4800.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[17]["id"], "category_id": CATEGORIES[6]["id"], "sub_category_id": SUB_CATEGORIES[16]["id"], "unit_id": UNITS[13]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ELE-FIN-3C10SQMM-100M", "name": "Finolex 3 Core 10 sq mm Cable 100m", "slug": "finolex-3c10sqmm-100m", "description": "Armoured power cable", "list_price": 28000.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[18]["id"], "category_id": CATEGORIES[6]["id"], "sub_category_id": SUB_CATEGORIES[16]["id"], "unit_id": UNITS[13]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ELE-POL-4C6SQMM-100M", "name": "Polycab 4 Core 6 sq mm Cable 100m", "slug": "polycab-4c6sqmm-100m", "description": "Flexible power cable", "list_price": 22000.0, "approval_status": "approved", "is_active": True},

    # Adhesives & Chemicals (41-44)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[11]["id"], "category_id": CATEGORIES[7]["id"], "sub_category_id": SUB_CATEGORIES[17]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ADH-FIX-TILE-20KG", "name": "Pidilite Fixobond Tile Adhesive 20kg", "slug": "pidilite-fixobond-20kg", "description": "Cement-based tile adhesive for wall and floor", "list_price": 420.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[12]["id"], "category_id": CATEGORIES[7]["id"], "sub_category_id": SUB_CATEGORIES[17]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ADH-FOS-WS-20KG", "name": "Fosroc Weber Tile Adhesive 20kg", "slug": "fosroc-weber-tile-adhesive-20kg", "description": "High-performance tile adhesive", "list_price": 480.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[11]["id"], "category_id": CATEGORIES[7]["id"], "sub_category_id": SUB_CATEGORIES[18]["id"], "unit_id": UNITS[4]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ADH-PID-WP-5KG", "name": "Pidilite Dr. Fixit Waterproofing 5kg", "slug": "pidilite-dr-fixit-wp-5kg", "description": "Cementitious waterproofing compound", "list_price": 650.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[12]["id"], "category_id": CATEGORIES[7]["id"], "sub_category_id": SUB_CATEGORIES[18]["id"], "unit_id": UNITS[10]["id"], "gst_id": GST_RATES[3]["id"], "sku": "ADH-FOS-SW-10L", "name": "Fosroc Renderoc Waterproofing 10L", "slug": "fosroc-renderoc-wp-10l", "description": "Liquid waterproofing membrane", "list_price": 1800.0, "approval_status": "approved", "is_active": True},

    # Glass & Windows (45-46)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[13]["id"], "category_id": CATEGORIES[8]["id"], "sub_category_id": None, "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "GLS-SG-6MM-TEMP", "name": "Saint-Gobain Toughened Glass 6mm", "slug": "saint-gobain-toughened-6mm", "description": "6mm toughened safety glass", "list_price": 450.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": BRANDS[13]["id"], "category_id": CATEGORIES[8]["id"], "sub_category_id": None, "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "GLS-SG-12MM-FLOAT", "name": "Saint-Gobain Float Glass 12mm", "slug": "saint-gobain-float-12mm", "description": "12mm float glass sheet", "list_price": 680.0, "approval_status": "approved", "is_active": True},

    # Wood & Plywood (47-48)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": None, "category_id": CATEGORIES[9]["id"], "sub_category_id": None, "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "WD-PLY-BWR-19MM", "name": "BWR Grade Plywood 19mm 8x4", "slug": "bwr-plywood-19mm-8x4", "description": "Marine grade plywood 8x4 feet", "list_price": 2200.0, "approval_status": "approved", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": None, "category_id": CATEGORIES[9]["id"], "sub_category_id": None, "unit_id": UNITS[7]["id"], "gst_id": GST_RATES[3]["id"], "sku": "WD-PLY-MR-12MM", "name": "MR Grade Plywood 12mm 8x4", "slug": "mr-plywood-12mm-8x4", "description": "Moisture resistant plywood", "list_price": 1200.0, "approval_status": "approved", "is_active": True},

    # Aggregates (49)
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "supplier_id": SUPPLIERS[3]["id"], "brand_id": None, "category_id": CATEGORIES[10]["id"], "sub_category_id": None, "unit_id": UNITS[6]["id"], "gst_id": GST_RATES[3]["id"], "sku": "AGG-SND-RIVER-1CUM", "name": "River Sand 1 Cubic Meter", "slug": "river-sand-1cum", "description": "Clean river sand for construction", "list_price": 1800.0, "approval_status": "approved", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# INVENTORY - Stock at Warehouses
# ═══════════════════════════════════════════════════════════════════

def generate_inventory():
    import random
    inventory = []
    for wh in WAREHOUSES:
        for prod in PRODUCTS[:20]:
            qty = random.randint(50, 500)
            reserved = random.randint(0, min(qty // 4, 50))
            inv = {
                "id": uid(),
                "warehouse_id": wh["id"],
                "product_id": prod["id"],
                "quantity_on_hand": qty,
                "reserved_quantity": reserved,
                "reorder_level": 20,
                "status": "in_stock" if qty > 50 else ("low_stock" if qty > 10 else "out_of_stock"),
                "last_restocked_at": datetime.now() - timedelta(days=random.randint(1, 30)),
            }
            inventory.append(inv)
    return inventory

# ═══════════════════════════════════════════════════════════════════
# PROJECTS
# ═══════════════════════════════════════════════════════════════════

PROJECTS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_code": "PRJ-001", "name": "Skyline Residency Tower A", "status": "active", "start_date": date(2025, 1, 15), "end_date": date(2026, 6, 30), "budget_amount": 45000000.0, "notes": "20-story residential tower in Andheri West"},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_code": "PRJ-002", "name": "Green Valley Villas Phase 2", "status": "active", "start_date": date(2025, 3, 1), "end_date": date(2026, 3, 31), "budget_amount": 28000000.0, "notes": "12 premium villas in Pune"},
    {"id": uid(), "organization_id": ORGANIZATIONS[4]["id"], "project_code": "PRJ-003", "name": "Metro Station Extension", "status": "active", "start_date": date(2025, 6, 1), "end_date": date(2026, 12, 31), "budget_amount": 120000000.0, "notes": "Underground metro station extension in Delhi"},
    {"id": uid(), "organization_id": ORGANIZATIONS[5]["id"], "project_code": "PRJ-004", "name": "Orchid Commercial Complex", "status": "planned", "start_date": date(2026, 1, 1), "end_date": date(2027, 6, 30), "budget_amount": 65000000.0, "notes": "Commercial office complex in Whitefield Bangalore"},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_code": "PRJ-005", "name": "Heritage Hotel Renovation", "status": "on_hold", "start_date": date(2025, 4, 1), "end_date": date(2026, 1, 31), "budget_amount": 18000000.0, "notes": "Heritage hotel renovation in Jaipur"},
]

# ═══════════════════════════════════════════════════════════════════
# RFQs (Request for Quotations)
# ═══════════════════════════════════════════════════════════════════

RFQS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_id": PROJECTS[0]["id"], "rfq_number": "RFQ-2025-001", "status": "open", "requested_by_user_id": USERS[1]["id"], "due_date": date(2025, 7, 15), "notes": "Cement requirement for Skyline Residency Tower A"},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_id": PROJECTS[0]["id"], "rfq_number": "RFQ-2025-002", "status": "quoted", "requested_by_user_id": USERS[1]["id"], "due_date": date(2025, 7, 20), "notes": "TMT bars and steel for Tower A"},
    {"id": uid(), "organization_id": ORGANIZATIONS[4]["id"], "project_id": PROJECTS[2]["id"], "rfq_number": "RFQ-2025-003", "status": "open", "requested_by_user_id": USERS[4]["id"], "due_date": date(2025, 8, 1), "notes": "Electrical cables for metro station"},
    {"id": uid(), "organization_id": ORGANIZATIONS[5]["id"], "project_id": PROJECTS[3]["id"], "rfq_number": "RFQ-2025-004", "status": "awarded", "requested_by_user_id": USERS[5]["id"], "due_date": date(2025, 7, 10), "notes": "Tiles and sanitaryware for commercial complex"},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_id": PROJECTS[1]["id"], "rfq_number": "RFQ-2025-005", "status": "closed", "requested_by_user_id": USERS[1]["id"], "due_date": date(2025, 6, 30), "notes": "Paints and waterproofing for villas"},
]

# ═══════════════════════════════════════════════════════════════════
# RFQ ITEMS
# ═══════════════════════════════════════════════════════════════════

RFQ_ITEMS = [
    {"id": uid(), "rfq_id": RFQS[0]["id"], "product_id": PRODUCTS[0]["id"], "requested_quantity": 500, "unit_price_hint": 370.0, "notes": "OPC 43 grade for foundation"},
    {"id": uid(), "rfq_id": RFQS[0]["id"], "product_id": PRODUCTS[1]["id"], "requested_quantity": 300, "unit_price_hint": 380.0, "notes": "PPC for plastering work"},
    {"id": uid(), "rfq_id": RFQS[1]["id"], "product_id": PRODUCTS[7]["id"], "requested_quantity": 50, "unit_price_hint": 58000.0, "notes": "12mm TMT for columns"},
    {"id": uid(), "rfq_id": RFQS[1]["id"], "product_id": PRODUCTS[8]["id"], "requested_quantity": 40, "unit_price_hint": 57500.0, "notes": "16mm TMT for beams"},
    {"id": uid(), "rfq_id": RFQS[2]["id"], "product_id": PRODUCTS[37]["id"], "requested_quantity": 20, "unit_price_hint": 27500.0, "notes": "Power cable for main supply"},
    {"id": uid(), "rfq_id": RFQS[3]["id"], "product_id": PRODUCTS[14]["id"], "requested_quantity": 200, "unit_price_hint": 82.0, "notes": "Floor tiles for lobby"},
    {"id": uid(), "rfq_id": RFQS[3]["id"], "product_id": PRODUCTS[20]["id"], "requested_quantity": 50, "unit_price_hint": 8200.0, "notes": "Western commode for offices"},
    {"id": uid(), "rfq_id": RFQS[4]["id"], "product_id": PRODUCTS[26]["id"], "requested_quantity": 30, "unit_price_hint": 4100.0, "notes": "Interior paint for villas"},
    {"id": uid(), "rfq_id": RFQS[4]["id"], "product_id": PRODUCTS[43]["id"], "requested_quantity": 20, "unit_price_hint": 630.0, "notes": "Waterproofing compound"},
]

# ═══════════════════════════════════════════════════════════════════
# QUOTATIONS
# ═══════════════════════════════════════════════════════════════════

QUOTATIONS = [
    {"id": uid(), "rfq_id": RFQS[1]["id"], "supplier_id": SUPPLIERS[0]["id"], "quotation_number": "QUO-2025-001", "status": "accepted", "valid_until": date(2025, 8, 15), "subtotal": 3870000.0, "gst_total": 696600.0, "grand_total": 4566600.0, "terms_and_conditions": "Payment within 30 days of delivery"},
    {"id": uid(), "rfq_id": RFQS[3]["id"], "supplier_id": SUPPLIERS[3]["id"], "quotation_number": "QUO-2025-002", "status": "accepted", "valid_until": date(2025, 8, 20), "subtotal": 572600.0, "gst_total": 103068.0, "grand_total": 675668.0, "terms_and_conditions": "Delivery within 7 working days"},
    {"id": uid(), "rfq_id": RFQS[0]["id"], "supplier_id": SUPPLIERS[1]["id"], "quotation_number": "QUO-2025-003", "status": "draft", "valid_until": date(2025, 8, 10), "subtotal": 299500.0, "gst_total": 53910.0, "grand_total": 353410.0, "terms_and_conditions": "Bulk order discount applicable"},
]

# ═══════════════════════════════════════════════════════════════════
# QUOTATION ITEMS
# ═══════════════════════════════════════════════════════════════════

QUOTATION_ITEMS = [
    {"id": uid(), "quotation_id": QUOTATIONS[0]["id"], "product_id": PRODUCTS[7]["id"], "quantity": 50, "unit_price": 58500.0, "gst_amount": 105300.0, "line_total": 3978000.0},
    {"id": uid(), "quotation_id": QUOTATIONS[0]["id"], "product_id": PRODUCTS[8]["id"], "quantity": 40, "unit_price": 57800.0, "gst_amount": 104040.0, "line_total": 3163200.0},
    {"id": uid(), "quotation_id": QUOTATIONS[1]["id"], "product_id": PRODUCTS[14]["id"], "quantity": 200, "unit_price": 85.0, "gst_amount": 3060.0, "line_total": 17000.0},
    {"id": uid(), "quotation_id": QUOTATIONS[1]["id"], "product_id": PRODUCTS[20]["id"], "quantity": 50, "unit_price": 8500.0, "gst_amount": 76500.0, "line_total": 501500.0},
    {"id": uid(), "quotation_id": QUOTATIONS[2]["id"], "product_id": PRODUCTS[0]["id"], "quantity": 500, "unit_price": 375.0, "gst_amount": 33750.0, "line_total": 221250.0},
    {"id": uid(), "quotation_id": QUOTATIONS[2]["id"], "product_id": PRODUCTS[1]["id"], "quantity": 300, "unit_price": 385.0, "gst_amount": 20790.0, "line_total": 135990.0},
]

# ═══════════════════════════════════════════════════════════════════
# PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════════════

PURCHASE_ORDERS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_id": PROJECTS[0]["id"], "rfq_id": RFQS[1]["id"], "order_number": "PO-2025-001", "status": "accepted", "order_date": date(2025, 7, 1), "expected_delivery_date": date(2025, 7, 20), "total_amount": 4566600.0},
    {"id": uid(), "organization_id": ORGANIZATIONS[5]["id"], "project_id": PROJECTS[3]["id"], "rfq_id": RFQS[3]["id"], "order_number": "PO-2025-002", "status": "dispatched", "order_date": date(2025, 6, 15), "expected_delivery_date": date(2025, 7, 10), "total_amount": 675668.0},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "project_id": PROJECTS[1]["id"], "rfq_id": RFQS[4]["id"], "order_number": "PO-2025-003", "status": "delivered", "order_date": date(2025, 6, 1), "expected_delivery_date": date(2025, 6, 20), "total_amount": 234500.0},
]

# ═══════════════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════════════

ORDERS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "purchase_order_id": PURCHASE_ORDERS[0]["id"], "order_number": "ORD-2025-001", "status": "placed", "placed_at": datetime(2025, 7, 1, 10, 30), "notes": "Urgent delivery needed for tower foundation"},
    {"id": uid(), "organization_id": ORGANIZATIONS[5]["id"], "purchase_order_id": PURCHASE_ORDERS[1]["id"], "order_number": "ORD-2025-002", "status": "dispatched", "placed_at": datetime(2025, 6, 15, 14, 0), "notes": "Commercial complex materials"},
    {"id": uid(), "organization_id": ORGANIZATIONS[1]["id"], "purchase_order_id": PURCHASE_ORDERS[2]["id"], "order_number": "ORD-2025-003", "status": "delivered", "placed_at": datetime(2025, 6, 1, 9, 0), "notes": "Villas project materials"},
]

# ═══════════════════════════════════════════════════════════════════
# ORDER ITEMS
# ═══════════════════════════════════════════════════════════════════

ORDER_ITEMS = [
    {"id": uid(), "order_id": ORDERS[0]["id"], "product_id": PRODUCTS[7]["id"], "quantity": 50, "unit_price": 58500.0, "gst_amount": 105300.0, "line_total": 3978000.0},
    {"id": uid(), "order_id": ORDERS[0]["id"], "product_id": PRODUCTS[8]["id"], "quantity": 40, "unit_price": 57800.0, "gst_amount": 104040.0, "line_total": 3163200.0},
    {"id": uid(), "order_id": ORDERS[1]["id"], "product_id": PRODUCTS[14]["id"], "quantity": 200, "unit_price": 85.0, "gst_amount": 3060.0, "line_total": 17000.0},
    {"id": uid(), "order_id": ORDERS[1]["id"], "product_id": PRODUCTS[20]["id"], "quantity": 50, "unit_price": 8500.0, "gst_amount": 76500.0, "line_total": 501500.0},
    {"id": uid(), "order_id": ORDERS[2]["id"], "product_id": PRODUCTS[26]["id"], "quantity": 30, "unit_price": 4200.0, "gst_amount": 22680.0, "line_total": 148680.0},
    {"id": uid(), "order_id": ORDERS[2]["id"], "product_id": PRODUCTS[43]["id"], "quantity": 20, "unit_price": 650.0, "gst_amount": 2340.0, "line_total": 15240.0},
]

# ═══════════════════════════════════════════════════════════════════
# INVOICES
# ═══════════════════════════════════════════════════════════════════

INVOICES = [
    {"id": uid(), "organization_id": ORGANIZATIONS[2]["id"], "order_id": ORDERS[0]["id"], "invoice_number": "INV-2025-001", "status": "paid", "invoice_date": date(2025, 7, 5), "due_date": date(2025, 8, 4), "subtotal": 3870000.0, "gst_total": 696600.0, "grand_total": 4566600.0},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "order_id": ORDERS[1]["id"], "invoice_number": "INV-2025-002", "status": "pending", "invoice_date": date(2025, 6, 20), "due_date": date(2025, 7, 20), "subtotal": 572600.0, "gst_total": 103068.0, "grand_total": 675668.0},
    {"id": uid(), "organization_id": ORGANIZATIONS[6]["id"], "order_id": ORDERS[2]["id"], "invoice_number": "INV-2025-003", "status": "paid", "invoice_date": date(2025, 6, 10), "due_date": date(2025, 7, 10), "subtotal": 220000.0, "gst_total": 39600.0, "grand_total": 259600.0},
]

# ═══════════════════════════════════════════════════════════════════
# DRIVERS & VEHICLES
# ═══════════════════════════════════════════════════════════════════

DRIVERS = [
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "full_name": "Rajesh Kumar", "phone_number": "+91-9876543501", "license_number": "MH-12-2020-12345", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "full_name": "Suresh Patel", "phone_number": "+91-9876543502", "license_number": "DL-08-2019-67890", "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "full_name": "Mohammed Khan", "phone_number": "+91-9876543503", "license_number": "KA-01-2021-11111", "is_active": True},
]

VEHICLES = [
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "registration_number": "MH-04-AB-1234", "vehicle_type": "Truck 10 Ton", "capacity_kg": 10000.0, "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "registration_number": "DL-09-CD-5678", "vehicle_type": "Truck 15 Ton", "capacity_kg": 15000.0, "is_active": True},
    {"id": uid(), "organization_id": ORGANIZATIONS[7]["id"], "registration_number": "KA-05-EF-9012", "vehicle_type": "Mini Truck 3 Ton", "capacity_kg": 3000.0, "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# DELIVERIES
# ═══════════════════════════════════════════════════════════════════

DELIVERIES = [
    {"id": uid(), "purchase_order_id": PURCHASE_ORDERS[2]["id"], "delivery_number": "DEL-2025-001", "status": "delivered", "driver_id": DRIVERS[0]["id"], "vehicle_id": VEHICLES[0]["id"], "dispatched_at": datetime(2025, 6, 15, 8, 0), "delivered_at": datetime(2025, 6, 18, 14, 30)},
    {"id": uid(), "purchase_order_id": PURCHASE_ORDERS[1]["id"], "delivery_number": "DEL-2025-002", "status": "in_transit", "driver_id": DRIVERS[1]["id"], "vehicle_id": VEHICLES[1]["id"], "dispatched_at": datetime(2025, 7, 5, 6, 0), "delivered_at": None},
]

# ═══════════════════════════════════════════════════════════════════
# MODIT NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════

MODIT_NOTIFICATIONS = [
    {"title": "Welcome to MODIT", "body": "Your account has been created. Start exploring construction materials.", "channel": "in_app"},
    {"title": "RFQ Received", "body": "You have received a new Request for Quotation. Respond before the due date.", "channel": "email"},
    {"title": "Order Confirmed", "body": "Your purchase order PO-2025-001 has been confirmed by the supplier.", "channel": "in_app"},
    {"title": "Delivery Update", "body": "Your order ORD-2025-002 has been dispatched. Track delivery status.", "channel": "push"},
    {"title": "Invoice Reminder", "body": "Invoice INV-2025-002 is due for payment in 5 days.", "channel": "email"},
    {"title": "Low Stock Alert", "body": "Inventory for TMT Bar 12mm is below reorder level at Mumbai warehouse.", "channel": "in_app"},
    {"title": "New Quotation", "body": "A new quotation QUO-2025-003 has been submitted for your review.", "channel": "email"},
    {"title": "Project Milestone", "body": "Skyline Residency Tower A has reached 40% completion milestone.", "channel": "in_app"},
    {"title": "Price Update", "body": "Cement prices have changed. Review your pending quotations.", "channel": "push"},
    {"title": "Team Invitation", "body": "You have been invited to join BuildCorp India's MODIT team.", "channel": "email"},
]

# ═══════════════════════════════════════════════════════════════════
# MODIT REVIEWS
# ═══════════════════════════════════════════════════════════════════

MODIT_REVIEW_TEMPLATES = [
    {"rating": 5, "title": "Excellent material quality", "body": "The cement quality was consistent and delivery was on time. Highly recommended supplier."},
    {"rating": 4, "title": "Good product range", "body": "Wide range of construction materials available. Pricing is competitive."},
    {"rating": 5, "title": "Reliable supplier", "body": "Always delivers on time. Product quality meets specifications. Will order again."},
    {"rating": 4, "title": "Fast delivery", "body": "Quick delivery and good packaging. Some minor issues with documentation."},
    {"rating": 5, "title": "Best prices in market", "body": "Competitive pricing and bulk discounts. Very satisfied with the deal."},
    {"rating": 4, "title": "Professional service", "body": "Professional team and good customer support. Products as described."},
    {"rating": 5, "title": "Quality assured", "body": "All materials came with proper quality certificates. No issues with inspection."},
    {"rating": 3, "title": "Average experience", "body": "Product was okay but delivery was delayed by 3 days. Communication could be better."},
    {"rating": 5, "title": "One-stop solution", "body": "Found everything I needed for my construction project. Great platform."},
    {"rating": 4, "title": "Good for bulk orders", "body": "Bulk pricing is very attractive. Minimum order quantity could be lower for small projects."},
]
