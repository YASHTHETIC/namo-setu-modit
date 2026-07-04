# Enterprise System Architecture

## Scope
This document defines a production-ready enterprise architecture for two independent startup products:

1. Namo Setu, a pilgrimage tourism and devotee assistance platform.
2. MODIT, a B2B building material marketplace and procurement platform.

The document is written for senior engineers before implementation. It focuses on system boundaries, scalability, resilience, security, platform choices, operational model, and future evolution. It intentionally avoids code and implementation snippets.

## Architecture Principles
- Separate product domains completely. Namo Setu and MODIT must have isolated business logic, data models, deployments, and release cadence.
- Standardize shared platform capabilities where they do not blur domain ownership, such as identity, observability, CI/CD, feature flags, and notification infrastructure.
- Optimize each product for its dominant workload. Namo Setu is discovery, booking, and assistance heavy. MODIT is catalog, RFQ, pricing, inventory, and transaction heavy.
- Design for trust first. Both products depend on accurate data, clear permissions, auditable transactions, and strong abuse prevention.
- Prefer incremental adoption. Begin with a modular monolith or well-bounded modular services if that improves delivery speed, then evolve selectively into services where scale and ownership justify it.

# SECTION 1: Overall Architecture

## 1.1 Why This Architecture Is Chosen
The recommended architecture is a domain-first, cloud-native, service-oriented architecture with a strong modular core, platform shared services, and independent product deployments.

This choice is driven by the following constraints and goals:

- Millions of users require independent scaling of search, bookings, recommendations, notifications, media, and AI workloads.
- The products have fundamentally different operational characteristics. Namo Setu has seasonal spikes, geospatial browsing, booking flows, temple partner workflows, and voice-first assistance. MODIT has high-cardinality catalogs, quoting, inventory, approvals, logistics, and commercial workflows.
- The businesses will likely evolve at different speeds. Independent product roadmaps prevent coupling and reduce organizational drag.
- Compliance, partner trust, and auditability are central to both products. Strong domain boundaries make security and audit controls easier to enforce.
- AI features should be layered as services or orchestrated capabilities, not embedded tightly into core transactional logic.

The architecture is therefore optimized for:

- Product independence.
- Scaling to millions of users.
- Domain clarity.
- Operational reliability.
- Safe AI integration.
- Strong observability and governance.

## 1.2 High Level Architecture
At a high level, each product follows the same architectural pattern:

- Client layer: web app, mobile app, admin consoles, and partner portals.
- Edge layer: CDN, WAF, API gateway, rate limiting, and request routing.
- Application layer: domain services or modular domains for search, catalog/discovery, booking/order, payments, notifications, profiles, AI orchestration, and support.
- Data layer: PostgreSQL for transactional state, Redis for caching and ephemeral coordination, object storage for media and documents, search index for discovery, and vector database for semantic retrieval.
- Asynchronous layer: message queues and background workers for notifications, indexing, document processing, AI tasks, and report generation.
- Integration layer: maps, payment providers, messaging providers, OCR services, identity providers, logistics, and external partner APIs.
- Observability layer: logs, metrics, traces, audit trails, alerting, and analytics pipelines.

The two products should not share a single production database or core transactional backend. They may share platform libraries, infrastructure templates, and operational standards, but production workloads remain isolated.

## 1.3 Clean Architecture
Each product should be organized around Clean Architecture principles:

- Domain layer: pure business rules, entities, value objects, and policy logic.
- Application layer: use cases, orchestration, command and query handling, workflow coordination.
- Interface layer: REST or GraphQL controllers, event consumers, cron triggers, webhooks, and admin entry points.
- Infrastructure layer: databases, queues, caches, external APIs, object storage, and third-party integrations.

This arrangement helps maintain testability and long-term maintainability.

Benefits:

- Business logic remains independent of frameworks and vendors.
- Domain rules can be tested without infrastructure dependencies.
- UI, API, and worker entry points can evolve without rewriting core use cases.
- Shared cross-cutting concerns can be implemented cleanly and consistently.

Recommended dependency direction:

- Interfaces depend on application.
- Application depends on domain.
- Infrastructure depends on application and domain contracts.
- Domain depends on nothing external.

## 1.4 Domain Driven Design
Domain Driven Design should guide both products, but each has different bounded contexts.

### Namo Setu bounded contexts
- Discovery and temple content.
- Yatra planning and itinerary optimization.
- Darshan and puja booking.
- Donation and chadhava fulfillment.
- Travel and accommodation coordination.
- Guide and local support.
- Temple partner operations.
- Notifications and reminders.
- AI pilgrimage assistant.
- Safety and emergency support.

### MODIT bounded contexts
- Catalog and product normalization.
- Search and comparison.
- RFQ and quotation management.
- Order and fulfillment.
- Inventory and availability.
- Pricing and contract terms.
- Project procurement and approvals.
- Supplier and retailer operations.
- Logistics and dispatch.
- Credit, invoice, and settlement.
- AI procurement assistant.

DDD recommendations:

- Define aggregate roots for transaction boundaries, such as booking, order, quote, inventory item, temple service slot, or procurement request.
- Use value objects for money, location, date ranges, language preferences, identity references, and product specifications.
- Use domain events for state transitions such as booking confirmed, quote received, inventory reserved, payment captured, or notification dispatched.
- Keep terminology precise and product-specific. Avoid shared naming that blurs domain meaning.

## 1.5 Microservices vs Modular Monolith
The best approach is a staged architecture, not a dogmatic one.

### Recommended starting point
For each product, begin with a well-structured modular monolith or a small number of domain services if the team is still forming.

Reasons:

- Faster delivery for first production release.
- Easier end-to-end testing and debugging.
- Lower operational overhead at the start.
- Stronger consistency across transactional workflows.

### When to split into services
Split a module into an independent service when one or more of these is true:

- The module scales independently from the rest of the product.
- The module has a distinct ownership team.
- The module has a different storage or latency profile.
- The module is integration-heavy and benefits from isolation.
- The module is an AI-heavy workload or background processing workload.

### Suggested service boundaries
For Namo Setu:
- Discovery and content.
- Search and recommendations.
- Booking and fulfillment.
- Payments and donations.
- Notifications.
- AI orchestration.
- Temple partner operations.
- Support and escalation.

For MODIT:
- Catalog and indexing.
- Search and comparison.
- RFQ and quotations.
- Orders and fulfillment.
- Inventory and availability.
- Pricing and contracts.
- Payments and settlement.
- AI procurement orchestration.

### Why not a distributed microservices sprawl from day one
- Too much operational complexity.
- Harder debugging and testing.
- Risk of inconsistent domain boundaries.
- Slower iteration for startup product-market fit.

## 1.6 Future Migration Strategy
The architecture should be designed for controlled evolution.

### Phase 1: Modular foundation
- Single deployable per product or a small set of deployables.
- Strong internal module boundaries.
- Shared platform services for identity, observability, and notifications.

### Phase 2: Service extraction
- Extract hot paths such as search, AI orchestration, notifications, and partner ingestion.
- Keep transactional workflows tightly controlled.
- Introduce async event flows for indexing, messaging, and analytics.

### Phase 3: Product-scale specialization
- Split scaling-critical domains independently.
- Adopt read replicas, materialized read models, and dedicated search infrastructure.
- Introduce geographically aware caching and edge optimizations.

### Phase 4: Multi-region and autonomy
- Use region-aware deployment for resilience and compliance.
- Separate global metadata from regional operational data.
- Establish clear contracts between product core and platform shared services.

### Migration safeguards
- Version APIs and internal contracts.
- Use backward-compatible events.
- Avoid distributed transaction dependence.
- Prefer outbox and inbox patterns for reliable event delivery.

# SECTION 2: Monorepo Structure

## 2.1 Repository Strategy
Use a single monorepo for governance, consistency, and developer productivity, but keep the two products isolated inside clearly separated directories.

Reasons:

- Shared engineering standards can be enforced centrally.
- CI/CD, linting, security scanning, and observability conventions stay consistent.
- Shared packages can be maintained carefully without coupling the product domains.
- Separate deployment pipelines can still be derived from the same repository.

## 2.2 Top Level Monorepo Hierarchy
The monorepo should be organized as follows:

- /apps
  - /namo-setu
    - /web
    - /mobile
    - /admin
    - /partner-portal
  - /modit
    - /web
    - /mobile
    - /admin
    - /supplier-portal
- /backend
  - /namo-setu
    - /api-gateway-adapter
    - /discovery-service
    - /booking-service
    - /payments-service
    - /support-service
    - /notifications-service
    - /ai-orchestrator
    - /partner-services
  - /modit
    - /api-gateway-adapter
    - /catalog-service
    - /search-service
    - /rfq-service
    - /order-service
    - /inventory-service
    - /pricing-service
    - /payments-service
    - /ai-orchestrator
    - /partner-services
- /packages
  - /ui-components
  - /design-system
  - /domain-shared-kernels
  - /auth-client
  - /analytics-sdk
  - /logging-sdk
  - /config-sdk
  - /maps-sdk
  - /payments-sdk
  - /notification-sdk
  - /ai-client
  - /validation-utils
- /ai-services
  - /namo-setu
    - /retrieval
    - /recommendation
    - /voice-assistant
    - /journey-planner
    - /support-copilot
  - /modit
    - /retrieval
    - /recommendation
    - /document-understanding
    - /procurement-copilot
    - /catalog-normalization
- /infra
  - /terraform or /bicep
  - /environments
    - /dev
    - /staging
    - /prod
  - /kubernetes
  - /networking
  - /security
  - /observability
  - /data-platform
- /devops
  - /github-actions
  - /scripts
  - /release-notes
  - /runbooks
  - /quality-gates
- /docs
  - /architecture
  - /domain-models
  - /api-contracts
  - /security
  - /ops
  - /ai-governance
  - /product-requirements

## 2.3 Product-Specific Isolation Rules
- Namo Setu directories must not import MODIT domain packages.
- MODIT directories must not import Namo Setu domain packages.
- Shared packages must only contain platform abstractions and generic utilities, never business rules.
- Each product must have its own deployable artifacts, secrets, environments, and data stores.

## 2.4 Recommended Internal Folder Pattern Per Service
Each backend service or modular domain should follow a consistent internal structure:

- /domain
- /application
- /interfaces
- /infrastructure
- /tests
- /contracts
- /migrations
- /fixtures

This keeps feature ownership clear and reduces entropy as the codebase grows.

# SECTION 3: Technology Stack

## 3.1 Frontend
Recommended stack:

- Web: React with a modern server-capable framework such as Next.js for SSR, SEO, and edge delivery.
- Mobile: React Native or Flutter depending on team preference and performance requirements.
- Admin dashboards: React-based SPA or app-router style architecture with strong table, filter, and workflow support.
- Styling: a tokenized design system with accessible component primitives.
- State management: server-state-oriented patterns with minimal client-side complexity.
- Forms and workflow handling: robust form validation and step-based flow management.

Frontend priorities:

- Fast search and content rendering.
- Accessibility and multilingual support.
- Low-bandwidth optimization.
- SEO for public discovery pages.
- Offline-friendly caching for key travel or catalog information.

## 3.2 Backend
Recommended stack:

- Language: TypeScript, Java, Go, or Kotlin for core services, depending on team expertise.
- Framework: a production-grade service framework that supports dependency injection, validation, observability, and structured testing.
- Architecture style: modular monolith initially, service-oriented extraction over time.
- API style: REST for external APIs, internal events for async workflows, and GraphQL only if a strong client aggregation need exists.

Backend must support:

- High-integrity transactions.
- Async background processing.
- Search indexing.
- AI orchestration.
- Strong audit trails.

## 3.3 Database
Primary transactional database:

- PostgreSQL for relational transactional data, booking state, orders, quotes, user profiles, permissions, audit references, and operational records.

Supporting data stores:

- Redis for caching, session coordination, rate limiting, queue coordination, temporary holds, and computed state.
- Object storage for media, documents, invoices, ID proofs, temple assets, product images, and AI artifacts.
- Search index for full-text and faceted discovery.
- Vector database for semantic retrieval, embeddings, and AI memory retrieval.

## 3.4 Caching
Use Redis and edge caching for:

- Frequently accessed public temple pages.
- Popular products and catalog listings.
- Session state.
- Temporary booking or quote holds.
- Rate limiting counters.
- Feature flags and localized content fragments.

## 3.5 Authentication
Recommended stack:

- OAuth 2.0 / OpenID Connect for identity federation.
- JWT access tokens with short lifetimes.
- Refresh tokens with rotation and revocation support.
- Social login support for Google and other high-value identity providers.
- Password-based auth only where needed, with strong reset and verification flows.

## 3.6 Authorization
Use role-based access control combined with scoped permissions and resource-level checks.

Principles:

- Roles define job function.
- Permissions define actions.
- Policies define object-level constraints such as temple ownership, supplier account scope, or project membership.

## 3.7 AI
Recommended AI stack:

- LLM orchestration layer for conversation, routing, and tool selection.
- Retrieval-augmented generation over curated product and operational knowledge.
- Embeddings store for semantic search and context recall.
- Guardrails for policy, privacy, safety, and factual correctness.
- Specialized agents for planning, recommendation, support, and document understanding.

## 3.8 Search
Search stack should include:

- Full-text search.
- Faceted filtering.
- Synonym and transliteration support.
- Geo-aware search where applicable.
- Ranking tuned per product.

For Namo Setu:
- Temple, route, ritual, festival, and nearby service discovery.

For MODIT:
- Product, category, specification, brand, supplier, and quote discovery.

## 3.9 Vector Database
Use a vector store for:

- AI memory.
- Semantic matching.
- Natural language to structured intent mapping.
- Knowledge retrieval for support and guidance.
- Product or temple recommendation features.

## 3.10 OCR
Use OCR for:

- Temple notice extraction.
- Booking confirmations and receipts.
- Identity documents where legally allowed.
- Material invoices and quotations.
- Procurement notes and handwritten requirements.

## 3.11 Maps
Use maps services for:

- Geospatial discovery.
- Route planning.
- Nearby service layers.
- Delivery or travel tracking.
- Emergency location context.

## 3.12 Notifications
Use a dedicated notification stack supporting:

- Email.
- SMS.
- Push notifications.
- WhatsApp or regional messaging where compliant.
- In-app notifications.

## 3.13 Payments
Use a PCI-compliant payment provider and keep payment logic isolated from business logic.

Supported flows:

- Booking and donation payments for Namo Setu.
- Order, invoice, and settlement flows for MODIT.

## 3.14 Analytics
Use a combination of operational analytics and product analytics:

- Event collection.
- Near-real-time dashboards.
- Batch reporting.
- Funnel analytics.
- Partner performance analytics.

## 3.15 Logging
Standardize on structured logs with correlation IDs, request IDs, user IDs, and domain event IDs.

## 3.16 Monitoring
Monitor:

- Availability.
- Latency.
- Error rate.
- Saturation.
- Queue depth.
- AI response latency.
- Booking or order success rate.

## 3.17 Deployment
Deploy containers onto a managed cloud platform with autoscaling and strong isolation between environments.

## 3.18 CI/CD
Use a pipeline that enforces:

- Build.
- Unit tests.
- Integration tests.
- Security scans.
- Dependency scans.
- Infrastructure validation.
- Controlled release and rollback.

## 3.19 Cloud
The architecture should be cloud-native and vendor-flexible, but the implementation should favor managed services for:

- Compute.
- Database.
- Cache.
- Messaging.
- Storage.
- Monitoring.
- Search.

# SECTION 4: System Diagram

## 4.1 Component Explanation

### Client
The client layer includes public web, mobile applications, admin dashboards, partner portals, and support consoles.

Responsibilities:

- Capture user intent.
- Render search, discovery, and transactional experiences.
- Support accessibility and localization.
- Manage offline-friendly and low-bandwidth behavior.

### Gateway
The gateway is the single entry point for API requests.

Responsibilities:

- Authentication enforcement.
- Routing.
- Rate limiting.
- Request validation.
- Protocol translation.
- API versioning.

### Backend
Backend services own business logic and orchestration.

Responsibilities:

- Domain workflows.
- Transaction management.
- Notifications orchestration.
- Partner integrations.
- Audit logging.

### Database
PostgreSQL stores authoritative transactional data.

Responsibilities:

- Bookings, orders, quotes, profiles, roles, permissions, settlements, and operational records.

### Redis
Redis acts as a low-latency data and coordination layer.

Responsibilities:

- Cache.
- Rate limiting.
- Session support.
- Temporary reservation holds.
- Queued coordination state.

### Queue
Message queues decouple synchronous user interaction from asynchronous work.

Responsibilities:

- Notification dispatch.
- Search indexing.
- AI background tasks.
- Webhook processing.
- Report generation.

### Worker
Workers process background jobs independently of user traffic.

Responsibilities:

- Send notifications.
- Generate embeddings.
- Process OCR.
- Refresh indexes.
- Execute scheduled tasks.

### AI Services
AI services handle retrieval, reasoning, and agent workflows.

Responsibilities:

- Recommendation.
- Planning.
- Support assistance.
- Document understanding.
- RAG retrieval.

### Notification Services
Notification services decide channel, template, priority, and delivery retry logic.

Responsibilities:

- Template rendering.
- User preference handling.
- Multi-channel dispatch.
- Delivery tracking.

### Search Engine
The search engine handles fast discovery queries and faceted filtering.

Responsibilities:

- Full-text search.
- Ranking.
- Filtering.
- Synonyms.
- Geospatial lookup where needed.

### Admin Dashboard
The admin dashboard is the operational control plane for moderation, support, governance, and analytics.

Responsibilities:

- Review operations.
- Partner management.
- Escalations.
- Policy enforcement.

### Analytics
Analytics collects events and produces dashboards, reports, and decision support.

Responsibilities:

- Funnel analysis.
- Partner performance.
- Product usage.
- Revenue insights.

### Storage
Object storage holds documents, images, media, invoices, identity documents, and AI-generated artifacts.

### Monitoring
Monitoring covers logs, metrics, traces, alerts, and incident response.

## 4.2 Product-Specific Component Emphasis

### Namo Setu component emphasis
- Search engine prioritizes temple, route, ritual, and nearby service discovery.
- AI services prioritize itinerary planning, spiritual guidance, voice interaction, and family coordination.
- Notification services prioritize booking reminders, route alerts, weather, and crowd updates.

### MODIT component emphasis
- Search engine prioritizes catalog, specifications, brand, supplier, and quote discovery.
- AI services prioritize procurement assistance, estimation, document extraction, and product matching.
- Notification services prioritize RFQ responses, dispatch, invoice, and reorder alerts.

# SECTION 5: Database Strategy

## 5.1 PostgreSQL
PostgreSQL is the source of truth for transactional data.

Use it for:

- Users and organizations.
- Roles and permissions.
- Bookings, orders, and quotes.
- Payments and settlements.
- Partner records.
- Notifications metadata.
- Audit references.

Design principles:

- Normalize high-integrity entities.
- Use transaction boundaries carefully.
- Avoid large, unbounded records.
- Maintain clear foreign key relationships where they help integrity.

## 5.2 Redis
Redis should be used for ephemeral or derived data.

Use it for:

- Caching search results.
- Session-related state.
- Temporary reservation holds.
- Rate limiting.
- Distributed locks where absolutely needed and well understood.
- Queue-adjacent coordination.

Avoid using Redis as the sole source of truth for critical business records.

## 5.3 Object Storage
Object storage is the default home for large or immutable assets.

Use it for:

- Temple images, product images, brochures.
- Invoices, receipts, ID scans.
- Voice or document uploads.
- OCR source files.
- Export files and archive artifacts.

Properties:

- Durable.
- Cheap for large files.
- Strongly integrated with CDN and analytics pipelines.

## 5.4 Search Index
Use a dedicated search index for discovery workloads.

Use it for:

- Temple discovery.
- Product search.
- Quotes and supplier discovery.
- Faceted filters.
- Regional language search.
- Ranking and boosting.

The search index should be treated as a read model, not a source of truth.

## 5.5 Vector Database
Use the vector database for semantic retrieval and AI memory.

Use it for:

- Similar temple recommendations.
- Similar product recommendations.
- Support knowledge retrieval.
- Multilingual intent matching.
- Conversational memory.

## 5.6 Backups
Backup strategy should include:

- Automated daily backups.
- Point-in-time recovery for PostgreSQL.
- Versioned object storage policies.
- Search index rebuild capability.
- Periodic restore testing.

Backups must be tested regularly, not only stored.

## 5.7 Replication
Use replication to improve availability and read scaling.

Recommended approach:

- Primary-write database.
- Read replicas for heavy read workloads.
- Geo-aware read routing if global expansion demands it.

## 5.8 Partitioning
Partition data where scale and retention require it.

Potential candidates:

- Large event tables.
- Notification history.
- Audit logs.
- Analytics fact tables.
- Time-series operational records.

Partitioning must be justified by size, retention, or query performance. It should not be introduced prematurely.

# SECTION 6: Authentication

## 6.1 JWT
JWT access tokens should be short-lived and used for API access.

Requirements:

- Signed tokens.
- Short expiration.
- Audience and issuer validation.
- Scopes or claims for role and permission context.

## 6.2 OAuth
OAuth 2.0 should be the standard for delegated login and third-party identity integration.

Use cases:

- Social login.
- Enterprise identity federation.
- Admin or partner SSO where needed.

## 6.3 Google Login
Google login should be supported as an identity option for convenience and trust.

Use cases:

- Fast sign-in.
- User verification convenience.
- Reduced account creation friction.

## 6.4 Role Based Access Control
RBAC should govern access across both products.

Examples:

- Devotee vs temple admin in Namo Setu.
- Buyer vs supplier vs finance admin in MODIT.

## 6.5 Permissions
Permissions should be resource-scoped and action-scoped.

Examples:

- View temple analytics only for temples owned by the account.
- Approve quotes only within assigned project scope.
- Issue refunds only for users with finance authority.

## 6.6 Session Management
Session management should support:

- Secure login.
- Device tracking.
- Token revocation.
- Concurrent device visibility.
- Idle and absolute session expiration.

## 6.7 Refresh Tokens
Use refresh tokens with rotation.

Requirements:

- Rotation on use.
- Detection of reuse.
- Revocation support.
- Secure storage on client devices.

## 6.8 Password Reset
Password reset must be secure and time-bound.

Requirements:

- Single-use reset links or OTP flow.
- Expiration windows.
- Risk checks.
- Audit logging.

## 6.9 Email Verification
Email verification is required for trusted notifications and recovery.

Requirements:

- Verification before sensitive workflows.
- Clear resend flow.
- Audit trail for confirmation.

# SECTION 7: Security

## 7.1 OWASP
Both products should be built to mitigate OWASP Top 10 risks from the start.

Must address:

- Broken access control.
- Cryptographic failures.
- Injection.
- Insecure design.
- Security misconfiguration.
- Vulnerable dependencies.
- Identification and authentication failures.
- Software and data integrity failures.
- Logging and monitoring failures.
- Server-side request forgery where applicable.

## 7.2 Rate Limiting
Apply rate limits at the gateway and service layer.

Protect:

- Login.
- Search.
- OTP.
- AI prompts.
- Booking and quote creation.
- Public APIs.

## 7.3 CORS
Use strict CORS policies.

Principles:

- Explicit allowed origins.
- No wildcard in sensitive environments.
- Separate policies per environment and product.

## 7.4 CSRF
Use CSRF protection where cookie-based sessions are used.

## 7.5 XSS
Prevent XSS through:

- Output encoding.
- Input sanitization.
- Content security policies.
- Safe rendering in rich text or CMS content.

## 7.6 SQL Injection
Prevent SQL injection through:

- Parameterized queries.
- ORM or query builder discipline.
- Input validation.
- Security testing.

## 7.7 Secrets Management
Secrets must be stored in a managed secret store.

Secrets include:

- Database credentials.
- API keys.
- Payment credentials.
- OAuth client secrets.
- Signer keys.

## 7.8 Encryption
Encryption must be used in transit and at rest.

Requirements:

- TLS everywhere.
- Encrypted databases and object storage.
- Sensitive field-level protection where needed.

## 7.9 Audit Logs
Audit logs are mandatory for sensitive actions.

Examples:

- Booking changes.
- Refunds.
- Price updates.
- Partner verification.
- Role changes.
- Content moderation.
- Temple or supplier approvals.

## 7.10 Additional Security Controls
- Device and session risk detection.
- Fraud detection for booking and procurement abuse.
- Malware-safe document scanning for uploads.
- Principle of least privilege for service identities.
- Separate production secrets from non-production.

# SECTION 8: Scalability

## 8.1 Horizontal Scaling
Horizontal scaling should be the primary scaling strategy.

Scale out:

- Gateway.
- API services.
- Search workers.
- AI inference services.
- Notification workers.
- Background jobs.

## 8.2 Vertical Scaling
Vertical scaling may be used temporarily for:

- Database performance.
- Search cluster nodes.
- AI workloads in transition.

But it must not be the long-term resilience plan.

## 8.3 Caching Strategy
Cache the right things:

- Public content.
- Search results.
- Recommendation fragments.
- Configuration.
- Session-adjacent data.

Do not cache:

- Critical transactional source of truth.
- Sensitive personalized data without clear invalidation rules.

## 8.4 Load Balancer
Use load balancing at the edge and service levels.

Responsibilities:

- Distribute traffic.
- Improve availability.
- Enable blue-green and canary deployment.

## 8.5 Auto Scaling
Autoscaling should react to:

- CPU.
- Memory.
- Request latency.
- Queue depth.
- Concurrent sessions.
- AI request rate.

## 8.6 Queue Workers
Queue workers should handle asynchronous tasks so core user flows remain fast.

Examples:

- Notification dispatch.
- OCR processing.
- Index updates.
- Report generation.
- AI enrichment.

## 8.7 Background Jobs
Use background jobs for:

- Reminder delivery.
- Daily report generation.
- Reindexing.
- Cache warming.
- Data synchronization.

# SECTION 9: DevOps

## 9.1 Docker
All services should be containerized for consistent local and production execution.

Benefits:

- Repeatable environments.
- Portable deployment.
- Clear dependency isolation.

## 9.2 Docker Compose
Use Docker Compose for local development where a full platform simulation is needed.

Should include:

- Frontend.
- Backend.
- Database.
- Redis.
- Queue.
- Search.
- AI service stubs.

## 9.3 GitHub Actions
Use GitHub Actions for automated CI/CD.

Pipelines should cover:

- Build.
- Unit tests.
- Integration tests.
- Security scanning.
- Dependency scanning.
- Container image creation.
- Deployment promotion.

## 9.4 Testing
Testing should include:

- Unit tests.
- Contract tests.
- Integration tests.
- End-to-end tests.
- Load tests.
- Security tests.

Product-specific emphasis:

- Namo Setu: booking flows, multilingual assistant, map and support paths.
- MODIT: search, RFQ, quote comparison, inventory, and order workflows.

## 9.5 Deployment
Deploy using controlled environments:

- Development.
- Staging.
- Production.

Use progressive delivery:

- Canary.
- Blue-green.
- Feature flags.

## 9.6 Monitoring
Monitor both technical and business health:

- API latency.
- Error rates.
- AI latency.
- Search health.
- Booking or order completion.
- Notification delivery.
- Queue lag.
- Payment success.

## 9.7 Rollback
Rollback must be a first-class operational capability.

Requirements:

- Previous container image retained.
- Database migrations are backward compatible where possible.
- Feature flags can disable unsafe features quickly.
- Rollback runbooks exist and are tested.

# SECTION 10: Final Folder Structure

## 10.1 Complete Folder Hierarchy for Namo Setu

- /products
  - /namo-setu
    - /apps
      - /web
      - /mobile
      - /admin
      - /partner-portal
    - /backend
      - /services
        - /discovery
        - /booking
        - /payments
        - /support
        - /notifications
        - /ai-orchestrator
        - /temple-operations
        - /content-management
        - /route-planning
      - /modules
        - /identity
        - /profiles
        - /permissions
        - /audit
        - /shared-domain
      - /workers
        - /notification-worker
        - /indexing-worker
        - /ocr-worker
        - /ai-worker
        - /report-worker
      - /contracts
      - /migrations
      - /tests
    - /ai-services
      - /journey-planner
      - /recommendation
      - /voice-assistant
      - /support-copilot
      - /retrieval
    - /data
      - /schemas
      - /seed-data
      - /reference-content
      - /templates
    - /infra
      - /terraform or /bicep
      - /kubernetes
      - /networking
      - /security
      - /observability
      - /environments
    - /devops
      - /github-actions
      - /release
      - /runbooks
      - /quality-gates
    - /docs
      - /architecture
      - /api-contracts
      - /domain-models
      - /ops
      - /security
      - /ai-governance
      - /product

## 10.2 Complete Folder Hierarchy for MODIT

- /products
  - /modit
    - /apps
      - /web
      - /mobile
      - /admin
      - /supplier-portal
    - /backend
      - /services
        - /catalog
        - /search
        - /rfq
        - /orders
        - /inventory
        - /pricing
        - /payments
        - /logistics
        - /ai-orchestrator
        - /approvals
      - /modules
        - /identity
        - /organizations
        - /projects
        - /permissions
        - /audit
        - /shared-domain
      - /workers
        - /notification-worker
        - /indexing-worker
        - /ocr-worker
        - /ai-worker
        - /report-worker
        - /inventory-sync-worker
      - /contracts
      - /migrations
      - /tests
    - /ai-services
      - /procurement-copilot
      - /estimate-assistant
      - /document-understanding
      - /catalog-normalization
      - /retrieval
    - /data
      - /schemas
      - /seed-data
      - /catalog-data
      - /pricing-rules
      - /templates
    - /infra
      - /terraform or /bicep
      - /kubernetes
      - /networking
      - /security
      - /observability
      - /environments
    - /devops
      - /github-actions
      - /release
      - /runbooks
      - /quality-gates
    - /docs
      - /architecture
      - /api-contracts
      - /domain-models
      - /ops
      - /security
      - /ai-governance
      - /product

## 10.3 Final Architectural Position
The right architecture for these two products is not a single shared application and not a premature microservices explosion. It is two independent product systems with shared platform standards, strong domain boundaries, cloud-native execution, and deliberate service extraction over time.

That approach gives the team:

- Speed to first release.
- Safety for production scale.
- Room for AI innovation.
- A path to millions of users.
- The operational discipline expected of enterprise software.