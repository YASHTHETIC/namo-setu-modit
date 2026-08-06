# MODIT — B2B Construction Materials E-Commerce Platform
## Complete Technical Specification

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Technology Stack
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 15.1.11 | React 19, App Router, Server Components |
| **Language** | TypeScript | 5.7.2 | Type-safe development |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS with design tokens |
| **Animation** | Framer Motion | 12.42.2 | Production-grade animations |
| **State** | TanStack Query | 5.62.11 | Server state management |
| **Forms** | React Hook Form | 7.54.2 | Performant forms with validation |
| **Validation** | Zod | 3.24.1 | Schema validation |
| **Icons** | Lucide React | 0.468.0 | Consistent icon system |
| **Backend** | FastAPI | 0.115.6 | High-performance async API |
| **Database** | PostgreSQL | 16+ (Neon) | Primary data store |
| **ORM** | SQLAlchemy | 2.0.36 | Async ORM with Alembic migrations |
| **Cache/Queue** | Redis | 7.2+ (Upstash) | Caching, sessions, Celery broker |
| **Auth** | JWT + PyJWT | 2.10.1 | Stateless authentication |
| **Payments** | Stripe + Razorpay | — | Multi-gateway payments |
| **AI/ML** | OpenAI + LangChain | — | AI features |
| **File Storage** | Cloudinary | — | Media management |
| **Maps** | Google Maps API | — | Location services |
| **Email** | SMTP (aiosmtplib) | — | Transactional emails |
| **Deployment** | Vercel (FE) + Railway (BE) | — | Production hosting |

### 1.2 Monorepo Structure
```
namo-setu-modit/
├── apps/
│   ├── modit/web/           # MODIT B2B frontend (Next.js)
│   └── namo-setu/web/       # Namo Setu frontend (pilgrimage)
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/v1/          # 20+ API routers, 297 endpoints
│   │   ├── core/            # Config, database, security, cache
│   │   ├── models/          # 99 SQLAlchemy models
│   │   ├── schemas/         # 15+ Pydantic schema modules
│   │   ├── services/        # 15+ business logic services
│   │   ├── deps/            # FastAPI dependencies
│   │   └── main.py          # App entry point
│   ├── alembic/             # Database migrations
│   ├── seeds/               # Seed data runners
│   └── tests/               # 80 passing tests
├── packages/
│   ├── api-client/          # Shared TypeScript API client
│   └── ui/                  # Shared React components
└── docker/                  # Docker configuration
```

---

## 2. DATABASE DESIGN (99 Tables)

### 2.1 Core Domain Models (MODIT)

#### Organizations & Users
| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `modit_organizations` | Companies (buyers, suppliers, builders) | 1:N users, warehouses, products, orders |
| `modit_organization_users` | User-org membership with roles | N:M user ↔ org |
| `organization_teams` | Team structure within org | 1:N members |
| `organization_team_members` | Team membership | N:M user ↔ team |
| `organization_invitations` | Invite flow with tokens | N:1 org, team |

#### User Types (Polymorphic via Organization)
| Table | Type | Verification |
|-------|------|--------------|
| `builders` | Construction companies | accreditation_number |
| `contractors` | Subcontractors | license_number |
| `architects` | Design professionals | council_number |
| `retailers` | Material retailers | store_name |
| `suppliers` | Material suppliers | supplier_code |

#### Supplier Network
| Table | Purpose |
|-------|---------|
| `suppliers` | Supplier entities (1:1 with organization) |
| `vendors` | Vendor contacts under supplier |
| `warehouses` | Physical locations with inventory |
| `inventory` | Stock per warehouse-product (with reservations) |

#### Product Catalog
| Table | Purpose |
|-------|---------|
| `categories` | Hierarchical (parent_category_id) |
| `sub_categories` | Sub-divisions |
| `brands` | Manufacturer brands |
| `units` | UOM (bag, ton, piece, meter, kg) |
| `gst` | Tax rates with HSN codes |
| `products` | Core product with pricing, specs, approval flow |
| `product_images` | Multiple images per product with primary flag |

#### Procurement Flow
| Table | Purpose | Status Flow |
|-------|---------|-------------|
| `rfq` | Request for Quotation | open → closed → cancelled |
| `rfq_items` | Line items with quantities | — |
| `quotation` | Supplier responses | draft → submitted → accepted/rejected |
| `quotation_items` | Pricing per item | — |
| `purchase_orders` | Confirmed orders | draft → placed → confirmed → completed |
| `order_items` | PO line items with pricing | — |
| `orders` | Buyer-facing orders | placed → confirmed → shipped → delivered |
| `invoices` | GST invoices | draft → issued → paid → cancelled |
| `modit_payments` | Payment records | pending → captured → refunded → failed |
| `transactions` | Gateway transaction log | — |

#### Project Management
| Table | Purpose |
|-------|---------|
| `projects` | Construction projects with budget |
| `construction_sites` | Site locations per project |
| `material_requests` | Internal procurement requests |
| `boq` | Bill of Quantities with versions |
| `boq_items` | Quantities per product |

#### Logistics & Delivery
| Table | Purpose |
|-------|---------|
| `delivery` | Shipment tracking |
| `drivers` | Driver profiles |
| `vehicles` | Fleet management |
| `returns` | Return/refund requests |

#### Finance
| Table | Purpose |
|-------|---------|
| `credit_accounts` | B2B credit limits |
| `wallets` | Digital wallet balances |
| `modit_notifications` | Multi-channel notifications |

#### Reviews & AI
| Table | Purpose |
|-------|---------|
| `modit_reviews` | Product/supplier reviews |
| `reviews` (shared) | Cross-platform reviews |
| `review_likes` | Helpful votes |
| `review_comments` | Discussion threads |
| `ai_sessions` / `ai_chats` / `ai_messages` | AI conversation history |

### 2.2 Shared Models
| Table | Purpose |
|-------|---------|
| `users` | Core user accounts |
| `profiles` | Extended user info |
| `addresses` | User/org addresses |
| `sessions` | JWT session management |
| `password_reset_tokens` | Secure reset flow |
| `email_verification_tokens` | Email verification |
| `audit_logs` | Immutable action trail |
| `analytics_events` | Event streaming |
| `search_history` | Search analytics |
| `recommendations` | AI-generated recommendations |

### 2.3 Enums (Critical for Type Safety)
```python
# Key enums defined in backend/app/models/enums.py
OrganizationType: BUILDER, CONTRACTOR, ARCHITECT, RETAILER, SUPPLIER, VENDOR
ProjectStatus: PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
RFQStatus: OPEN, CLOSED, CANCELLED, AWARDED
QuotationStatus: DRAFT, SUBMITTED, ACCEPTED, REJECTED, EXPIRED
OrderStatus: DRAFT, PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED
DeliveryStatus: PENDING, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
PaymentStatus: PENDING, CAPTURED, REFUNDED, FAILED, PARTIAL
ReturnStatus: REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED
InventoryStatus: IN_STOCK, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED
TransactionType: DEBIT, CREDIT, REFUND, ADJUSTMENT
```

### 2.4 Indexing Strategy
- **Composite indexes** on high-query columns: `(organization_id, status)`, `(product_id, warehouse_id)`
- **Partial indexes** for soft-deletes: `WHERE deleted_at IS NULL`
- **Full-text search** via `tsvector` on products (name, description, sku)
- **Geospatial** indexes on cities (lat/lon) for nearby search

---

## 3. API ARCHITECTURE (297 Endpoints)

### 3.1 API Structure
```
/api/v1/
├── auth/                    # Login, register, JWT, OAuth
├── auth-extended/           # Password reset, email verify, 2FA, sessions
├── payments/                # Stripe/Razorpay, webhooks, credit terms
├── identity/                # Current user, profile
├── organizations/           # Org CRUD, users, teams, invitations
├── media/                   # File upload (Cloudinary)
├── notifications/           # Multi-channel, preferences
├── audit/                   # Audit log query
├── admin/                   # Basic admin
├── admin-extended/          # RBAC, roles, users, system health
├── security/                # Rate limiting, CSRF, sanitization
├── ai/                      # 12 AI endpoints
├── analytics/               # Dashboards, exports
├── reviews/                 # Reviews, likes, comments
├── maps/                    # Geocoding, nearby, directions
├── search/                  # Full-text, autocomplete
├── security/                # Rate limits, validation
├── namo/                    # Namo Setu endpoints
├── modit/                   # MODIT core (70+ endpoints)
│   ├── products/            # Catalog, search, detail, images
│   ├── categories/          # Hierarchical categories
│   ├── brands/              # Brand management
│   ├── suppliers/           # Supplier directory
│   ├── rfq/                 # RFQ lifecycle
│   ├── quotations/          # Quote management
│   ├── purchase-orders/     # PO management
│   ├── orders/              # Order lifecycle
│   ├── invoices/            # GST invoices
│   ├── payments/            # Payment processing
│   ├── inventory/           # Stock management
│   ├── warehouses/          # Warehouse CRUD
│   ├── deliveries/          # Shipment tracking
│   ├── projects/            # Project management
│   ├── material-requests/   # Internal procurement
│   ├── boq/                 # Bill of Quantities
│   ├── drivers/vehicles/    # Fleet management
│   ├── returns/             # Returns/refunds
│   ├── credit-accounts/     # B2B credit
│   ├── wallets/             # Digital wallets
│   ├── analytics/           # Business intelligence
│   └── notifications/       # Notifications
└── health/                  # System health
```

### 3.2 API Design Principles
- **RESTful** with consistent naming
- **Pagination**: `page`, `page_size` (max 100)
- **Filtering**: Query params for all filterable fields
- **Sorting**: `sort_by`, `sort_order` (asc/desc)
- **Response envelope**: `{ items: [], total: 0, page: 1, page_size: 20, pages: 5 }`
- **Errors**: Standardized `{ detail, code, error_id }`
- **Idempotency**: `Idempotency-Key` header for mutations

---

## 4. USER ROLES & RBAC

### 4.1 Role Hierarchy
```
Super Admin (platform)
    ↓
Admin (tenant)
    ↓
Organization Owner
    ↓
Procurement Manager
    ↓
Project Manager / Builder / Contractor
    ↓
Warehouse Manager
    ↓
Finance Team
    ↓
Delivery Executive
    ↓
Customer Support
    ↓
Vendor / Supplier User
    ↓
Buyer (individual)
    ↓
Guest
```

### 4.2 Permissions (Resource:Action)
| Resource | Actions |
|----------|---------|
| `products` | `read`, `write`, `delete`, `manage`, `approve` |
| `orders` | `read`, `write`, `manage`, `cancel`, `refund` |
| `invoices` | `read`, `write`, `manage` |
| `payments` | `read`, `write`, `refund`, `reconcile` |
| `inventory` | `read`, `write`, `manage`, `adjust` |
| `warehouses` | `read`, `write`, `manage` |
| `suppliers` | `read`, `write`, `manage`, `verify` |
| `users` | `read`, `write`, `manage`, `invite`, `deactivate` |
| `roles` | `read`, `write`, `delete`, `assign` |
| `analytics` | `read`, `export` |
| `admin` | `read`, `write`, `manage` |
| `ai` | `read`, `write` |

---

## 5. BUYER JOURNEY (Complete Flow)

### 5.1 Guest → Buyer Conversion
```
1. Landing Page → Browse Categories
2. Search/Filter → Product Listing
3. Product Detail → Specs, Variants, Reviews
4. Add to Cart → Persistent (localStorage + sync)
5. Checkout → Address, Delivery, Payment
6. Order Confirmation → Timeline
7. Track → Receive → Review → Reorder
```

### 5.2 Key Buyer Features
| Feature | Implementation |
|---------|----------------|
| **Smart Search** | Full-text + filters + AI suggestions |
| **Product Compare** | Side-by-side specs, pricing, delivery |
| **Bulk Pricing** | Tiered discounts, MOQ handling |
| **Credit Terms** | Net 30/60/90, credit limit check |
| **GST Compliance** | Auto-calculation, HSN codes, invoice download |
| **Multi-supplier Cart** | Split by supplier, consolidated checkout |
| **Delivery Slots** | Express/Standard/Pickup with tracking |
| **Wishlist/Reorder** | Saved items, one-click reorder |

---

## 6. SUPPLIER PANEL

### 6.1 Supplier Dashboard
| Section | Metrics |
|---------|---------|
| **Overview** | Revenue, orders, conversion, rating |
| **Products** | Catalog management, approval status |
| **Inventory** | Stock levels, low-stock alerts, auto-reorder |
| **Orders** | New, processing, shipped, returns |
| **Quotations** | Pending, won, lost, conversion rate |
| **Analytics** | Sales trends, top products, buyer insights |
| **Payouts** | Settled, pending, failed |

### 6.2 Supplier Capabilities
- **Product Management**: Bulk upload, variants, specifications
- **Price Management**: Tiered pricing, promotions, bulk discounts
- **Inventory Sync**: Real-time stock, warehouse allocation
- **Order Fulfillment**: Dispatch, partial shipments, tracking
- **Returns Management**: Approve/reject, quality checks

---

## 7. WAREHOUSE MANAGEMENT SYSTEM

### 7.1 Core Features
| Module | Capabilities |
|--------|--------------|
| **Inventory** | Real-time stock, reservations, batch/lot tracking |
| **Receiving** | PO matching, quality inspection, putaway |
| **Picking** | Wave/batch/zone picking, barcode scanning |
| **Packing** | Box optimization, label printing |
| **Shipping** | Carrier integration, manifest generation |
| **Cycle Counts** | Scheduled, ABC analysis, discrepancy resolution |
| **Transfers** | Inter-warehouse, inter-org |
| **Analytics** | Turnover, aging, fill rate, accuracy |

### 7.2 Inventory Model
```python
# Per warehouse-product
quantity_on_hand      # Available + reserved
reserved_quantity     # Allocated to orders
reorder_level         # Auto-PO trigger
status                # IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISCONTINUED
last_restocked_at     # For aging analysis
```

---

## 8. DELIVERY SYSTEM

### 8.1 Delivery Flow
```
Order Confirmed → Warehouse Picks → Pack → Label
    ↓
Carrier Assigned → Driver Dispatch → Route Optimization
    ↓
Live GPS Tracking → OTP Verification → Signature/Photo
    ↓
Proof of Delivery → Status Update → Invoice Trigger
```

### 8.2 Delivery Features
- **Route Optimization**: Multi-stop, traffic-aware
- **Live Tracking**: Customer + admin visibility
- **OTP Verification**: Secure handoff
- **Proof of Delivery**: Photo + signature + GPS + timestamp
- **Delivery Slots**: Morning/Afternoon/Evening, express
- **Failed Delivery**: Auto-reattempt, locker/pickup options
- **Multi-warehouse**: Source from nearest stock

---

## 9. PAYMENT SYSTEM

### 9.1 Payment Methods
| Method | Gateway | Use Case |
|--------|---------|----------|
| **UPI** | Razorpay/Stripe | Instant, low-value |
| **Cards** | Stripe | Online checkout |
| **Net Banking** | Razorpay | B2B preferences |
| **Wallet** | Internal | Prepaid, cashback |
| **Credit Terms** | Offline | Net 30/60/90, credit limit |
| **Purchase Order** | Offline | Enterprise buyers |
| **EMI** | Partner | High-value orders |
| **Partial Payment** | All | Advance + balance |

### 9.2 GST Invoice Automation
- **Auto-generation** on delivery confirmation
- **HSN Codes** per product
- **GST Calculation**: CGST/SGST/IGST based on state
- **E-invoice** integration ready
- **Download**: PDF + JSON (Govt format)

### 9.3 Credit Management
- **Credit Limits**: Per organization, auto-enforced
- **Aging Reports**: 0-30, 31-60, 61-90, 90+
- **Auto-block** on limit breach
- **Payment Reconciliation**: Auto-match via reference

---

## 10. ORDER MANAGEMENT

### 10.1 Order Lifecycle
```
PLACED → CONFIRMED → PROCESSING → PICKED → PACKED
    → DISPATCHED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
    → COMPLETED (after 7 days)
```

### 10.2 Order Features
- **Split Shipments**: Multiple warehouses, partial fulfillment
- **Backorders**: Auto-notify when restocked
- **Cancellation**: Time-window based, restock logic
- **Returns**: Quality check, restock/refund decision
- **Replacements**: Cross-ship for defects
- **Order History**: Full timeline with audit trail

---

## 11. ADMIN PANEL

### 11.1 Enterprise Dashboard
| Widget | Data Source |
|--------|-------------|
| **Revenue** | Orders, payments (real-time) |
| **Orders** | Volume, conversion, AOV |
| **Users** | Active, new, churn |
| **Suppliers** | Active, pending verification |
| **Inventory** | Stock value, turnover, alerts |
| **Delivery** | On-time rate, exceptions |
| **Support** | Tickets, SLA, CSAT |

### 11.2 Admin Capabilities
| Module | Actions |
|--------|---------|
| **User Management** | Create, deactivate, impersonate, roles |
| **RBAC** | Role CRUD, permission matrix, assignment |
| **Audit Logs** | Filter, export, compliance |
| **System Health** | DB, Redis, API latency, error rates |
| **CMS** | Banners, categories, banners |
| **Marketing** | Coupons, campaigns, referrals |
| **Finance** | Tax config, payout schedules |
| **AI Monitoring** | Usage, costs, quality scores |

---

## 12. AI FEATURES (12 Domain Features)

### 12.1 Implemented AI Endpoints
| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Procurement Assistant** | `POST /ai/assistant` | Conversational procurement help |
| **Material Recommendation** | `POST /ai/material-recommendation` | Project-based material list |
| **BOQ Reader** | `POST /ai/boq-reader` | PDF/Excel → structured items |
| **Quote Comparison** | `POST /ai/quote-comparison` | Multi-quote analysis |
| **Vendor Matching** | `POST /ai/vendor-matching` | Best vendor for product/qty/location |
| **Voice Order** | `POST /ai/voice-order` | Speech → structured order |
| **Smart Reorder** | `POST /ai/smart-reorder` | Predictive restocking |
| **Price Prediction** | `POST /ai/price-prediction` | Future price trends |
| **Demand Forecasting** | `POST /ai/demand-forecast` | ML-based demand planning |
| **Inventory Forecast** | `POST /ai/inventory-forecast` | Stockout prediction |
| **Delivery Prediction** | `POST /ai/delivery-prediction` | ETA optimization |
| **Fraud Detection** | `POST /ai/fraud-detection` | Anomaly scoring |

### 12.2 AI Architecture
- **Provider**: OpenAI GPT-4o + LangChain
- **Context**: User org, project, history, catalog
- **Memory**: `ai_sessions` + `ai_chats` + `ai_messages`
- **Streaming**: Server-sent events for long responses
- **Fallback**: Rule-based when API unavailable

---

## 13. NOTIFICATION SYSTEM

### 13.1 Channels
| Channel | Provider | Use Case |
|---------|----------|----------|
| **Email** | SMTP (aiosmtplib) | Transactional, marketing |
| **SMS** | Twilio/Provider | OTP, delivery alerts |
| **WhatsApp** | Business API | Order updates, support |
| **Push** | Firebase/FCM | App notifications |
| **In-App** | WebSocket/Polling | Real-time dashboard |

### 13.2 Event-Driven Templates
| Event | Channels | Template |
|-------|----------|----------|
| Order placed | Email, WhatsApp, Push | Order confirmation |
| Payment received | Email, SMS | Payment receipt |
| Order shipped | Email, WhatsApp, Push | Tracking link |
| Out for delivery | SMS, Push | OTP + ETA |
| Delivered | Email, WhatsApp | Invoice + POD |
| Low stock | Email, In-App | Reorder suggestion |
| Payment failed | Email, SMS | Retry link |

---

## 14. SECURITY

### 14.1 Authentication
- **JWT**: Access (15min) + Refresh (30 days) tokens
- **Token Rotation**: Refresh token rotation with reuse detection
- **2FA**: TOTP with backup codes
- **OAuth**: Google, Microsoft (SSO for enterprise)

### 14.2 Authorization
- **RBAC**: Role-based with resource:action permissions
- **ABAC**: Organization-scoped data access
- **Field-level**: Sensitive data masking

### 14.3 Protection
- **Rate Limiting**: Redis-based (IP + user)
- **CSRF**: Double-submit cookie pattern
- **Input Sanitization**: XSS/SQL injection prevention
- **Encryption**: AES-256 for PII at rest
- **Audit Logs**: Immutable, tamper-evident

---

## 15. DATA SEEDING (Realistic Production Data)

### 15.1 Seed Categories
| Entity | Count | Realism |
|--------|-------|---------|
| Countries | 1 (India) | ISO codes, calling codes |
| States | 28 | All Indian states |
| Cities | 50+ | Major metros + tier-2 |
| Categories | 12 | Construction taxonomy |
| Sub-categories | 45 | Detailed breakdown |
| Brands | 25 | Real Indian brands (UltraTech, Tata, JSW, etc.) |
| Units | 15 | Bag, ton, piece, meter, kg, etc. |
| GST Rates | 8 | 0%, 5%, 12%, 18%, 28% |
| Products | 500+ | Real specs, pricing, images |
| Suppliers | 200+ | Pan-India with warehouses |
| Warehouses | 50+ | Multi-city, capacity |
| Inventory | 10,000+ | Real stock levels |
| Organizations | 100+ | Builders, contractors, retailers |
| Users | 500+ | All roles |
| Projects | 50+ | Active with sites |
| RFQs | 200+ | Various statuses |
| Quotations | 500+ | Full lifecycle |
| POs/Orders | 1000+ | Complete history |
| Invoices | 800+ | GST-compliant |
| Payments | 1500+ | Multiple methods |
| Deliveries | 600+ | With tracking |
| Reviews | 1000+ | Verified purchases |

---

## 16. FRONTEND PAGES (Complete Inventory)

### 16.1 MODIT Pages (22)
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Marketing Landing | ✅ Premium |
| `/auth` | Login | ✅ Premium |
| `/auth/register` | Registration | ✅ Premium |
| `/auth/forgot-password` | Password reset request | ✅ Premium |
| `/auth/reset-password` | Password reset | ✅ Premium |
| `/auth/verify-email` | Email verification | ✅ Premium |
| `/dashboard` | Buyer dashboard | ✅ Premium |
| `/dashboard/profile` | Profile (4 tabs) | ✅ Premium |
| `/products` | Product catalog | ✅ Premium |
| `/products/[id]` | Product detail | 🔄 Needs detail page |
| `/products/[id]/reviews` | Reviews | ✅ Premium |
| `/suppliers` | Supplier directory | ✅ Premium |
| `/rfq` | RFQ management | ✅ Premium |
| `/orders` | Order history | ✅ Premium |
| `/inventory` | Stock overview | ✅ Premium |
| `/projects` | Project dashboard | ✅ Premium |
| `/analytics` | Business intelligence | ✅ Premium |
| `/admin` | Admin landing | ✅ Premium |
| `/admin/users` | User management | ✅ Premium |
| `/admin/roles` | RBAC management | ✅ Premium |
| `/admin/audit` | Audit logs | ✅ Premium |
| `/notifications` | Notification center | ✅ Premium |
| `/payment/history` | Payment history | ✅ Premium |

### 16.2 Missing Critical Pages
| Page | Priority | Description |
|------|----------|-------------|
| `/products/[id]` | **Critical** | Full product detail with zoom, specs, variants |
| `/cart` | **Critical** | Shopping cart with multi-supplier split |
| `/checkout` | **Critical** | Complete checkout flow |
| `/orders/[id]` | **Critical** | Order detail with timeline, tracking |
| `/suppliers/[id]` | High | Supplier profile, catalog, ratings |
| `/warehouse` | High | Warehouse dashboard |
| `/delivery/[id]` | High | Live tracking, POD |
| `/rfq/[id]` | High | RFQ detail, quotation comparison |
| `/quotation/[id]` | High | Quote detail, accept/reject |
| `/purchase-order/[id]` | High | PO detail, dispatch |
| `/invoice/[id]` | High | GST invoice view/download |
| `/returns` | Medium | Return requests, status |
| `/credit-account` | Medium | Credit limit, statements |
| `/wallet` | Medium | Balance, transactions |
| `/settings` | Medium | Account, notifications, security |

---

## 17. IMPLEMENTATION ROADMAP

### Phase 1: Core Buyer Journey (Week 1-2)
- [ ] Product Detail Page (`/products/[id]`)
- [ ] Shopping Cart (`/cart`)
- [ ] Checkout Flow (`/checkout`)
- [ ] Order Detail (`/orders/[id]`)
- [ ] Payment Integration (Stripe + Razorpay)

### Phase 2: Supplier & Procurement (Week 2-3)
- [ ] RFQ Detail & Quotation Comparison
- [ ] Purchase Order Management
- [ ] Supplier Profile & Catalog
- [ ] Quotation Acceptance Flow

### Phase 3: Warehouse & Delivery (Week 3-4)
- [ ] Warehouse Dashboard
- [ ] Inventory Management
- [ ] Delivery Tracking with OTP/POD
- [ ] Driver App Interface

### Phase 4: Finance & Admin (Week 4-5)
- [ ] GST Invoice Generation/Download
- [ ] Credit Account Management
- [ ] Wallet & Payments
- [ ] Advanced Admin Reports

### Phase 5: AI & Intelligence (Week 5-6)
- [ ] AI Procurement Assistant Integration
- [ ] BOQ Reader Upload & Parse
- [ ] Smart Reorder Predictions
- [ ] Price/Demand Forecasting

### Phase 6: Polish & Production (Week 6-7)
- [ ] Realistic Data Population
- [ ] Performance Optimization
- [ ] Security Hardening
- [ ] E2E Testing
- [ ] Documentation

---

## 18. SUCCESS CRITERIA

### 18.1 Technical
- [ ] All 297 endpoints functional
- [ ] 80/80 tests passing
- [ ] TypeScript strict mode clean
- [ ] Next.js build < 30s
- [ ] API p95 < 200ms
- [ ] Zero critical vulnerabilities

### 18.2 Functional
- [ ] Guest → Order complete in < 5 min
- [ ] Multi-supplier cart works
- [ ] GST invoice auto-generates
- [ ] Delivery tracking real-time
- [ ] AI assistant responds < 3s
- [ ] All user roles functional

### 18.3 Production Ready
- [ ] Realistic data on every screen
- [ ] No placeholder text
- [ ] No empty dashboards
- [ ] Comprehensive error handling
- [ ] Audit trail on all mutations
- [ ] Monitoring/alerting configured

---

*This specification represents a production-grade B2B construction materials e-commerce platform equivalent to IndiaMART + Udaan + Infra.Market combined, with modern architecture and AI capabilities.*