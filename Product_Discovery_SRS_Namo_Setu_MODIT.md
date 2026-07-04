# Product Discovery and Software Requirements Specification

## Purpose
This document defines two independent startup products in sufficient depth for an engineering organization of approximately 100 people to plan, design, build, and validate the first production-grade version.

The document intentionally avoids code, UI mockups, and API definitions. It focuses on product understanding, scope, requirements, roles, journeys, platform capabilities, AI opportunities, security, scale, and operational guidance.

# Product 1: Namo Setu

## 1. Product Vision
Namo Setu will become India's most trusted pilgrimage ecosystem, helping devotees discover sacred destinations, plan journeys, book darshan and puja, arrange travel and stay, manage family/group pilgrimages, receive intelligent spiritual guidance, and access local support throughout the yatra.

The platform will unify pilgrimage discovery, devotional services, logistics, route intelligence, temple operations, multilingual assistance, emergency support, and personalized spiritual journey planning into one seamless experience.

## 2. Business Goals
- Create a high-trust digital pilgrimage marketplace with strong utility for devotees and temple partners.
- Increase conversion across temple discovery, darshan booking, puja booking, donation, stay, travel, and local services.
- Build a recurring user base through trip planning, reminders, saved temples, family plans, and spiritual personalization.
- Establish temple-side and partner-side tools that improve operations, inventory visibility, visitor flow, and service fulfillment.
- Offer AI-based assistance that materially improves planning, accessibility, and decision-making for pilgrims.
- Build a scalable national platform that can expand city by city, temple by temple, and region by region.

## 3. User Personas
- Devotee Traveler: Individual user planning a temple visit or pilgrimage trip.
- Elderly Devotee: Requires voice-first, low-friction, multilingual, and guided support.
- Family Organizer: Plans pilgrimage for multiple family members, often across ages and locations.
- Group Coordinator: Manages a group yatra with bookings, timings, transport, and reminders.
- Temple Administrator: Publishes temple details, services, crowd timings, puja schedules, and donation options.
- Temple Priest or Service Manager: Manages puja requests, offerings, slots, and fulfillment.
- Travel Partner: Handles transport, cab, bus, taxi, and route support.
- Accommodation Partner: Handles rooms, dharamshala, guest house, and stay availability.
- Local Guide Partner: Provides temple assistance, language support, and destination context.
- Support Agent: Helps users with issues related to booking, payments, travel, and fulfillment.
- Platform Admin: Oversees moderation, partner onboarding, risk controls, and operations.
- Emergency Service Partner: Responds to medical, safety, or lost-person scenarios.

## 4. Customer Journey
- Discovery: A user hears about a temple, searches it, and views spiritual significance, best time to visit, crowd intensity, nearby attractions, and available services.
- Planning: The user creates a travel plan, adds family members, compares routes, selects dates, and receives an AI-generated yatra suggestion.
- Booking: The user books darshan, puja, accommodation, and local transport in one flow.
- Preparation: The user receives packing guidance, prayer reminders, weather alerts, festival alerts, and route guidance.
- During Travel: The user accesses navigation, nearby services, temple timing changes, and emergency support.
- At Temple: The user checks queue status, receives walkthrough guidance, and manages darshan or puja fulfillment.
- Post Visit: The user saves memories, receives follow-up recommendations, donates, or plans the next spiritual destination.

## 5. User Journey
1. Open app or website.
2. Search temple, city, deity, festival, or route.
3. Review recommendations, travel plan, temple details, and crowd data.
4. Add temple or destination to a trip plan.
5. Book relevant services.
6. Receive confirmations, alerts, and reminders.
7. Navigate, check live support, and complete pilgrimage.
8. Rate experience and retain future recommendations.

## 6. User Stories
- As a devotee, I want to search temples by deity, city, state, rituals, and accessibility so that I can plan my visit faster.
- As an elderly pilgrim, I want voice guidance in my language so that I can use the service without technical difficulty.
- As a family organizer, I want to manage multiple travelers under one itinerary so that the pilgrimage is coordinated.
- As a user, I want to book darshan and puja in advance so that I can avoid uncertainty and long waits.
- As a user, I want to see nearby transport, food, medical, and stay options so that I can travel safely.
- As a temple admin, I want to publish timings, queue updates, rituals, and availability so that users receive accurate information.
- As a guide partner, I want to receive assignments and route details so that I can assist pilgrims efficiently.
- As a support agent, I want a unified view of bookings and trip status so that I can resolve issues quickly.

## 7. Product Scope
### In Scope
- Temple discovery and destination intelligence.
- Darshan, puja, chadhava, and donation booking workflows.
- Travel planning, route planning, accommodation discovery, and local transport support.
- Multilingual AI assistant for chat and voice.
- Personalized pilgrimage planner.
- Family and group yatra planning.
- Temple and partner onboarding tools.
- Notifications, reminders, support, and emergency assistance.
- Search, recommendations, analytics, and reporting.

### Out of Scope for First Version
- Full custom ERP for temples.
- Large-scale marketplace for general e-commerce beyond pilgrimage-related services.
- Deep social network features.
- Complex insurance products.
- Real-time computer vision crowd analytics unless data access is available.

## 8. Functional Requirements
- FR1: Users must be able to search temples, pilgrimage destinations, regions, deities, rituals, and festivals.
- FR2: Users must be able to view temple profiles with history, significance, timings, location, offerings, crowd pattern, accessibility, and nearby services.
- FR3: Users must be able to plan a trip across one or more sacred destinations.
- FR4: Users must be able to book darshan, puja, special rituals, and chadhava services.
- FR5: Users must be able to donate online to temples and causes supported by temples.
- FR6: Users must be able to book accommodation and transport through partner inventory or external partners.
- FR7: Users must receive route planning with nearby temples, food, lodging, fuel, medical, and emergency support.
- FR8: Users must have multilingual chat and voice support.
- FR9: Users must receive recommendations based on religion, deity preference, route, travel dates, crowd level, family profile, budget, and accessibility needs.
- FR10: Temple administrators must be able to manage temple details, slots, offerings, inventory, timings, and announcements.
- FR11: Support agents must be able to manage disputes, refunds, rescheduling, and booking changes.
- FR12: Admins must be able to review content, partners, and safety flags.
- FR13: The system must send notifications for bookings, reminders, weather, crowd changes, and schedule changes.
- FR14: The system must support offline-friendly reference data for critical pilgrimage information.
- FR15: The system must log events for analytics, auditing, and compliance.

## 9. Non Functional Requirements
- High availability during festival spikes.
- Low latency for search, maps, and itinerary generation.
- Graceful degradation when third-party booking or map services are unavailable.
- Strong consistency for bookings, payments, and confirmations.
- Idempotent booking and payment flows.
- Observability across search, booking, AI, and notification systems.
- Privacy controls for devotional preferences and family data.
- High reliability for emergency and support pathways.

## 10. Complete Feature List
- Temple discovery.
- Temple detail pages.
- Sacred route planning.
- AI pilgrimage itinerary planner.
- Darshan booking.
- Puja booking.
- Chadhava/offerings booking.
- Donation support.
- Accommodation booking.
- Transport booking.
- Local guide discovery.
- Nearby services and emergency help.
- Crowd and schedule intelligence.
- Personalized recommendations.
- Family/group pilgrimage planning.
- Multilingual voice assistant.
- Ritual guidance.
- Saved temples and future trip reminders.
- Temple partner dashboard.
- Content moderation and trust scoring.
- Payment and refund flows.
- Notification and reminder system.
- Analytics and reports.

## 11. Future Roadmap
- Phase 1: Discovery, trip planning, bookings, and AI assistant.
- Phase 2: Temple partner operations, queue intelligence, and live support.
- Phase 3: Community trust layer, travel bundles, and elder-friendly assistive workflows.
- Phase 4: Predictive pilgrimage planning, smart crowd routing, and personalized spiritual graphs.
- Phase 5: Cross-state sacred circuit planning and ecosystem partnerships.

## 12. AI Opportunities
- AI pilgrimage itinerary builder that optimizes route, time, budget, weather, and crowd.
- AI temple recommender based on deity, purpose, family profile, and location.
- AI assistant for darshan, puja, and chadhava guidance.
- Multilingual elderly voice assistant.
- AI travel concierge for route changes, delays, and live support.
- AI-generated devotional preparation checklist.
- AI safety assistant for medical, missing-person, and emergency guidance.
- AI support copilot for booking resolution and refund handling.

## 13. Security Requirements
- Secure authentication and session management.
- Strong payment security and PCI-aligned processing through trusted providers.
- Role-based access control with least privilege.
- Audit logs for booking, refund, content changes, and temple updates.
- Data protection for personal identity, family profiles, and payment records.
- Fraud controls for fake temple listings, duplicate bookings, and payment abuse.
- Content moderation for misinformation and unsafe recommendations.
- Abuse detection for bots, spam, and partner fraud.

## 14. Scalability Requirements
- Support traffic spikes around festivals and peak pilgrimage seasons.
- Scale search and map services independently from booking workflows.
- Cache static temple content and route metadata.
- Separate transactional workloads from AI inference workloads.
- Support multi-region delivery for performance and resilience.
- Queue-heavy operations like notifications, booking confirmations, and partner syncs.

## 15. Accessibility Requirements
- Full screen-reader support.
- Large text modes and high-contrast compatibility.
- Voice-first flows for elderly users.
- Minimal-step booking experience.
- Clear status indicators for payment, booking, and queue changes.
- Support for low-bandwidth and intermittent network scenarios.
- Simple language mode in major Indian languages.

## 16. Localization
- Must support multiple Indian languages.
- Must support transliteration and romanized search.
- Must support local date, time, and festival formats.
- Must handle region-specific temple customs and terminology.
- Must support vernacular voice prompts and AI responses.

## 17. Monetization Strategy
- Commission on travel, accommodation, and guide bookings.
- Service fee on puja, chadhava, and premium support flows.
- Temple partner SaaS or onboarding fees for advanced tools.
- Sponsored pilgrimage packages and featured temple placements with policy controls.
- Premium AI concierge for advanced planning and family coordination.
- Transaction and convenience fees where permitted.

## 18. Risk Analysis
- Risk of inaccurate temple or ritual information.
- Risk of over-dependence on third-party partners.
- Risk of crowd spikes causing booking failures.
- Risk of fraud in donations, listings, and travel services.
- Risk of language and cultural inaccuracies in AI responses.
- Risk of low trust if support or refund handling is weak.
- Risk of regulatory or temple-policy restrictions.

## 19. Product Differentiation
- Combines pilgrimage discovery, services, logistics, and spiritual planning in one ecosystem.
- Uses agentic AI instead of a simple chatbot.
- Offers route-aware recommendations that include temple, stay, food, and emergency support together.
- Supports family and elderly pilgrims with voice-first assistance.
- Integrates temple-side operations and traveler-side convenience.
- Goes beyond booking to provide spiritual journey continuity before, during, and after travel.

## 20. Success Metrics
- Search-to-plan conversion rate.
- Plan-to-book conversion rate.
- Booking completion rate.
- Repeat pilgrimage planning rate.
- AI assistant engagement and task completion rate.
- Temple partner onboarding and active listing count.
- Refund resolution time.
- Support satisfaction score.
- Language coverage and voice adoption.
- Festival-season system availability.

## 21. Complete User Roles
- Devotee.
- Elderly Devotee.
- Family Organizer.
- Group Coordinator.
- Temple Visitor.
- Temple Administrator.
- Priest or Ritual Manager.
- Travel Partner.
- Accommodation Partner.
- Transport Partner.
- Guide Partner.
- Support Agent.
- Content Moderator.
- Platform Admin.
- Super Admin.
- Emergency Partner.

## 22. Admin Roles
- Super Admin: global configuration, governance, escalations, and trust rules.
- Operations Admin: booking health, support queues, partner verification, and incident handling.
- Content Admin: temple content, metadata, translations, and curated recommendations.
- Finance Admin: refunds, settlement tracking, payment reconciliation, and commissions.
- Compliance Admin: audit review, policy enforcement, and partner verification.

## 23. Vendor Roles
- Temple Vendor.
- Puja Service Vendor.
- Chadhava Fulfillment Vendor.
- Transport Vendor.
- Accommodation Vendor.
- Guide Vendor.
- Food Partner.
- Emergency Support Partner.

## 24. Customer Roles
- Solo Devotee.
- Family Customer.
- Group Customer.
- Senior Citizen Customer.
- International Pilgrim Customer.
- Returning Pilgrim Customer.

## 25. Temple Roles
- Temple Trust Admin.
- Temple Operations Manager.
- Priest.
- Ritual Scheduler.
- Donation Manager.
- Crowd and Queue Manager.
- Content Publisher.

## 26. Supplier Roles
- Hotel or Dharamshala Supplier.
- Transport Supplier.
- Local Guide Supplier.
- Food and Prasad Supplier.
- Offerings and Ritual Material Supplier.

## 27. Contractor Roles
- Field Support Contractor.
- Event or Festival Contractor.
- Local Operations Contractor.
- On-ground Verification Contractor.
- Content Collection Contractor.

## 28. Permission Matrix
| Capability | Devotee | Family Organizer | Temple Admin | Priest | Travel Partner | Accommodation Partner | Guide | Support Agent | Platform Admin |
|---|---|---|---|---|---|---|---|---|---|
| Search temples | Yes | Yes | Yes | Yes | No | No | Yes | Yes | Yes |
| Create itinerary | Yes | Yes | No | No | No | No | No | No | Yes |
| Book darshan/puja | Yes | Yes | View | Manage | No | No | No | Assist | Yes |
| Manage temple content | No | No | Yes | Limited | No | No | No | No | Yes |
| Manage accommodation inventory | No | No | No | No | View own | Manage own | No | No | Yes |
| Issue refunds | No | No | No | No | No | No | No | Partial | Yes |
| Support conversations | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Access analytics | Limited | Limited | Limited | No | Limited | Limited | Limited | Limited | Yes |
| Manage users/roles | No | No | No | No | No | No | No | No | Yes |

## 29. Complete Screen List
- Home.
- Search results.
- Temple details.
- Route planner.
- Itinerary planner.
- Booking checkout.
- Darshan booking details.
- Puja booking details.
- Donation flow.
- Accommodation listing.
- Transport booking.
- Maps and nearby services.
- AI assistant chat.
- Voice assistant mode.
- Family trip planner.
- Booking history.
- Saved places.
- Notifications center.
- Support center.
- Temple partner dashboard.
- Ritual management screen.
- Queue and crowd management screen.
- Admin console.
- Content moderation screen.
- Reports and analytics.
- Profile and preferences.
- Language and accessibility settings.
- Emergency assistance screen.

## 30. Dashboard Modules
- User dashboard.
- Trip dashboard.
- Saved temples module.
- Upcoming bookings module.
- AI recommendations module.
- Alerts and reminders module.
- Family coordination module.
- Payment and receipts module.
- Temple admin dashboard.
- Service fulfillment dashboard.
- Support dashboard.
- Admin operations dashboard.
- Analytics dashboard.

## 31. AI Features
- Multimodal pilgrimage assistant.
- Trip optimization engine.
- Spiritual recommendation engine.
- Queue and timing prediction assistant.
- Elderly-friendly voice interaction.
- Ritual guidance assistant.
- Emergency and safety assistant.
- Support resolution copilot.
- Content summarization and translation assistant.

## 32. AI Agents
- Pilgrimage Planner Agent: builds route, schedule, and budget.
- Temple Discovery Agent: recommends relevant temples.
- Booking Agent: coordinates darshan, puja, stay, and transport.
- Elder Companion Agent: voice-first helper for elderly users.
- Family Coordinator Agent: manages multiple travelers and shared plans.
- Support Agent: resolves booking and fulfillment issues.
- Temple Operations Agent: assists temple admins with updates and demand management.
- Safety Agent: surfaces weather, crowd, health, and emergency actions.

## 33. Notifications
- Booking confirmations.
- Schedule reminders.
- Route change alerts.
- Weather alerts.
- Crowd alerts.
- Festival alerts.
- Puja and darshan reminders.
- Payment and refund updates.
- Support updates.
- Emergency advisories.

## 34. Search
- Search by temple name.
- Search by deity.
- Search by city, district, state, and circuit.
- Search by ritual type.
- Search by accessibility support.
- Search by crowd level and date.
- Search by budget or travel type.
- Search by language using transliteration and synonyms.

## 35. Recommendation Engine
- Recommend temples based on intent, season, and prior visits.
- Recommend routes based on budget, duration, mobility, and festival timing.
- Recommend puja and chadhava options based on temple and devotion context.
- Recommend stay and transport based on distance, convenience, and reliability.
- Recommend family-friendly or elderly-friendly travel plans.
- Recommend follow-up sacred destinations after a completed trip.

## 36. Analytics
- User behavior funnels.
- Search performance.
- Booking funnel analytics.
- Temple popularity and conversion.
- AI usage and completion rates.
- Partner performance.
- Support resolution metrics.
- Cancellation and refund analytics.
- Region and season demand patterns.

## 37. Reports
- Daily booking report.
- Temple performance report.
- Financial settlement report.
- Refund and dispute report.
- AI assistant usage report.
- Crowd and demand report.
- Content moderation report.
- Accessibility usage report.
- Emergency incident report.

## 38. Chat
- Text chat with multilingual support.
- Shared trip chat for family/group planning.
- Support chat with booking context.
- Temple help chat for venue-specific questions.
- Contextual chat around nearby services and route changes.

## 39. Voice Assistant
- Multilingual voice input and output.
- Elder-friendly guided prompts.
- Hands-free trip planning.
- Spoken confirmations for bookings and reminders.
- Voice summaries for itinerary, temple timings, and route changes.

## 40. Maps
- Temple pins and circuits.
- Nearby services layer.
- Route planning with travel modes.
- Walkability and accessibility hints.
- Landmark and local guidance.
- Emergency location sharing.

## 41. Payments
- Booking payments.
- Donations.
- Puja and chadhava payments.
- Refunds and partial refunds.
- Multi-user payment splits for family trips if allowed.
- Receipts and transaction history.

## 42. Booking Engine
- Time-slot booking.
- Confirmation and hold windows.
- Cancellation and rescheduling rules.
- Waitlist or request-based fulfillment where needed.
- Partner availability synchronization.
- Booking reference and verification.

## 43. Inventory
- Puja material inventory.
- Prasad or offerings inventory.
- Accommodation inventory.
- Transport availability.
- Guide availability.
- Support capacity inventory for operations.

## 44. Procurement
- Temple-side procurement for puja and ritual materials.
- Travel partner procurement for service fulfillment.
- Accommodation allocation procurement.
- Local service partner allocation.
- Event and festival supply planning.

## 45. OCR
- Scan ID proofs where legally required.
- Capture receipts and invoices.
- Read booking confirmations from external sources.
- Digitize temple notices and handwritten schedules if supported.
- Parse partner documents during onboarding.

## 46. RAG Opportunities
- Temple knowledge base with history, customs, dress code, and rituals.
- Region and festival knowledge base.
- Travel policy and cancellation rules retrieval.
- Support knowledge base for common booking issues.
- Safety and emergency knowledge base.
- Local language glossary for devotional terms.

## 47. Multi-Agent Opportunities
- Planner agent coordinates route and budget.
- Booking agent converts plan into confirmed reservations.
- Reminder agent handles alerts and schedule changes.
- Elder companion agent simplifies communication.
- Temple ops agent updates availability and queue data.
- Support agent handles exceptions and escalations.

## 48. Performance Goals
- Search results should feel near-instant for cached and indexed data.
- Itinerary generation should complete within a short conversational turnaround.
- Booking confirmation should be reliable and transactional.
- Voice assistant responses should be low-latency enough for natural interaction.
- Critical alerts should be delivered quickly and consistently.
- The platform should remain usable during festival peaks and regional surges.

## 49. Tech Stack Recommendation
- Frontend: modern web and mobile stack with multilingual support, offline-capable content, and accessibility-first components.
- Backend: service-oriented architecture with booking, search, identity, notifications, AI orchestration, and partner management separated by domain.
- Data: transactional database for bookings and profiles, search index for discovery, object storage for media and documents, cache for hot content, and event streaming for notifications and analytics.
- AI: retrieval-augmented assistant, intent routing, orchestration layer, and safe response guardrails.
- Infra: cloud-native deployment with autoscaling, observability, queues, and geo-aware caching.
- Integration: maps, payments, messaging, travel partners, temple systems, and emergency support providers.

## 50. Final Product Summary
Namo Setu is not just a temple listing app. It is a pilgrimage operating system for devotees, temples, and service partners. Its strategic advantage comes from combining discovery, bookings, route intelligence, spiritual guidance, family coordination, multilingual AI, and emergency support into one trusted journey platform.

---

# Product 2: MODIT

## 1. Product Vision
MODIT will become India's smartest B2B building material procurement ecosystem, enabling builders, contractors, architects, retailers, suppliers, engineers, and customers to discover materials, compare prices, request quotes, manage inventory, place orders, coordinate deliveries, and use AI to simplify procurement and project execution.

The platform will unify search, quotations, procurement, inventory, logistics, catalog intelligence, account-based pricing, and decision support for construction commerce.

## 2. Business Goals
- Create a trusted B2B marketplace for building materials and construction procurement.
- Reduce procurement friction, price discovery problems, and supply delays.
- Improve order accuracy, quote management, and fulfillment visibility.
- Provide role-based experiences for buyers, sellers, and project stakeholders.
- Use AI to help users identify products, estimate needs, compare alternatives, and automate repetitive procurement tasks.
- Build network effects through supply density, repeat procurement, and account relationships.

## 3. User Personas
- Builder: Manages multiple projects and bulk procurement.
- Contractor: Purchases materials against project timelines and budgets.
- Architect: Recommends materials, tracks specifications, and coordinates with suppliers.
- Engineer: Verifies technical suitability and compliance.
- Retailer: Sells materials through catalog and local supply operations.
- Supplier: Manages inventory, quotations, pricing, and fulfillment.
- Project Owner or Customer: Wants visibility into material cost and selection.
- Procurement Manager: Handles sourcing, vendor comparison, and approvals.
- Logistics Coordinator: Manages dispatch and last-mile delivery.
- Platform Admin: Handles trust, catalog quality, and dispute resolution.
- Finance Manager: Handles billing, credit, settlements, and invoice visibility.

## 4. Customer Journey
- Discovery: User searches for materials, categories, brands, or project needs.
- Comparison: User compares products, prices, availability, and supplier credibility.
- Quotation: User requests and receives multiple quotes.
- Approval: Internal team or customer approves materials and budget.
- Procurement: User places order, schedules delivery, and tracks fulfillment.
- Execution: Project team receives materials, resolves exceptions, and updates inventory or site consumption.
- Repeat Purchase: User reorders based on project stage, reminders, or replenishment signals.

## 5. User Journey
1. Sign in and select role or project context.
2. Search materials or upload requirement.
3. Compare options, pricing, and supplier ratings.
4. Request quote or place order.
5. Review approvals, invoices, and delivery schedule.
6. Track delivery and exceptions.
7. Reorder, audit, and report.

## 6. User Stories
- As a contractor, I want to request quotes from multiple suppliers so that I can compare prices quickly.
- As a builder, I want project-based procurement tracking so that I can manage budgets and timelines.
- As an architect, I want to search by specification and brand so that I can recommend appropriate materials.
- As a supplier, I want to manage inventory, pricing, and order status so that I can fulfill efficiently.
- As a retailer, I want to promote stock availability so that I can increase conversion.
- As a project owner, I want to view procurement visibility so that I can understand spend.
- As a procurement manager, I want approval workflows so that ordering stays controlled.
- As a logistics coordinator, I want dispatch and delivery tracking so that I can reduce failure rates.

## 7. Product Scope
### In Scope
- B2B marketplace for building materials.
- Product search, discovery, and comparison.
- RFQ and quotation workflows.
- Order placement and tracking.
- Inventory visibility and replenishment.
- Credit, invoice, and settlement support.
- Project-based procurement planning.
- AI assistants for search, estimation, and procurement support.
- Vendor, supplier, retailer, and customer dashboards.
- Analytics, reports, and notifications.

### Out of Scope for First Version
- Full manufacturing ERP.
- Deep financing or lending products unless integrated later.
- Complex auction markets.
- Consumer home renovation social network features.
- On-site labor marketplace as a primary focus.

## 8. Functional Requirements
- FR1: Users must be able to search materials by category, specification, brand, use case, and project type.
- FR2: Users must be able to compare prices, lead times, ratings, and fulfillment options.
- FR3: Users must be able to request quotations from multiple suppliers.
- FR4: Users must be able to place orders and track them through fulfillment.
- FR5: Users must be able to manage project-level procurement lists and budgets.
- FR6: Users must be able to upload requirements via text, file, image, or voice.
- FR7: Suppliers must be able to manage catalog, inventory, pricing, and availability.
- FR8: Retailers must be able to list stock and respond to demand signals.
- FR9: Users must be able to review invoices, deliveries, returns, and settlements.
- FR10: Approval workflows must be supported for enterprise procurement.
- FR11: Notifications must cover quote responses, order status, delays, and reorders.
- FR12: AI must assist with estimation, specification matching, and supplier selection.
- FR13: The system must support analytics for demand, conversion, fill rate, and repeat purchases.

## 9. Non Functional Requirements
- Fast search and comparison even on large catalogs.
- Accurate, transaction-safe order and quotation processing.
- High availability for procurement and dispatch operations.
- Strong auditability for pricing, approvals, and settlements.
- Support for large catalogs with normalized attribute structures.
- Clear separation between read-heavy catalog traffic and transactional workflows.
- Secure handling of commercial terms and customer data.

## 10. Complete Feature List
- Material discovery.
- Category browsing.
- Spec-based search.
- RFQ workflows.
- Quote comparison.
- Order management.
- Delivery tracking.
- Inventory management.
- Project procurement plans.
- Budget tracking.
- Credit and invoice workflows.
- Vendor dashboards.
- Retailer dashboards.
- Supplier dashboards.
- Approval workflows.
- Returns and dispute handling.
- AI requirement parsing.
- Price intelligence.
- Reorder suggestions.
- Reporting and analytics.
- Notifications and messaging.

## 11. Future Roadmap
- Phase 1: Search, RFQ, pricing, and order tracking.
- Phase 2: Inventory, delivery intelligence, and procurement workflows.
- Phase 3: AI estimation, alternative matching, and project planning.
- Phase 4: Credit, settlement automation, and predictive procurement.
- Phase 5: Construction operating system integration across sites and vendors.

## 12. AI Opportunities
- AI material recommendation based on project type and specification.
- AI quote summarizer and comparison assistant.
- AI requirement parser from images, voice, and documents.
- AI reorder and replenishment prediction.
- AI procurement copilot for approval-ready lists.
- AI price intelligence and negotiation insights.
- AI catalog enrichment and normalization.
- AI support copilot for disputes and order exceptions.

## 13. Security Requirements
- Role-based access control.
- Vendor verification and trust scoring.
- Secure pricing and contract visibility.
- Audit logs for quotations, approvals, and invoice actions.
- Fraud detection for fake catalogs, duplicate invoices, and manipulated pricing.
- Identity and document verification where required.
- Secure payment and settlement handling.
- Data privacy for project spend and customer information.

## 14. Scalability Requirements
- Catalog search must scale to large item counts and frequent updates.
- RFQ and order workflows must support high concurrency.
- Supplier update traffic must not affect buyer search performance.
- Event-driven architecture should absorb status changes and notifications.
- Multi-region support should be possible for national expansion.

## 15. Accessibility Requirements
- Responsive design for field and office use.
- Low-bandwidth browsing mode.
- Voice-assisted requirement capture for non-typing users.
- Clear contrast and readable typography.
- Keyboard navigation and screen-reader compatibility.
- Simple workflows for high-frequency operational tasks.

## 16. Localization
- Support multiple Indian languages.
- Support local units, pricing conventions, and region-specific material names.
- Support transliteration and vernacular search.
- Support regional tax, delivery, and billing rules where applicable.

## 17. Monetization Strategy
- Transaction commissions on orders.
- Supplier subscription plans for premium catalog and analytics tools.
- Featured listings with trust and policy controls.
- SaaS fees for enterprise procurement workflows.
- Logistics and value-added service margins.
- AI premium features for advanced estimation and procurement automation.

## 18. Risk Analysis
- Incorrect material matching due to inconsistent catalog data.
- Supplier stock mismatch versus live availability.
- Quote manipulation or price drift.
- Delivery failures and delay disputes.
- Trust issues from low-quality or fake supplier listings.
- AI estimation errors causing procurement waste.
- Credit and settlement risk if payment terms are expanded later.

## 19. Product Differentiation
- Designed around real procurement workflows, not just listing and checkout.
- Supports project context, approvals, and reorder intelligence.
- Uses AI to reduce specification mismatch and repetitive sourcing work.
- Gives suppliers, retailers, contractors, and architects distinct workflows.
- Balances discovery, RFQ, order tracking, and fulfillment visibility in one system.

## 20. Success Metrics
- Search-to-RFQ conversion.
- RFQ-to-order conversion.
- Order fulfillment rate.
- Repeat procurement rate.
- Quote response time.
- Catalog completeness and freshness.
- Supplier active participation.
- Dispute resolution time.
- Reorder prediction accuracy.
- Gross transaction value and retention.

## 21. Complete User Roles
- Builder.
- Contractor.
- Architect.
- Engineer.
- Retailer.
- Supplier.
- Procurement Manager.
- Project Owner.
- Logistics Coordinator.
- Finance Manager.
- Support Agent.
- Platform Admin.
- Super Admin.

## 22. Admin Roles
- Super Admin: governance, abuse prevention, platform policies, critical escalations.
- Operations Admin: orders, dispatch, catalog issues, and partner health.
- Catalog Admin: product normalization, attributes, and category quality.
- Finance Admin: billing, settlements, refunds, and credit oversight.
- Trust Admin: supplier verification, content moderation, and fraud review.

## 23. Vendor Roles
- Supplier Vendor.
- Retail Vendor.
- Logistics Vendor.
- Service Vendor.
- Catalog Content Vendor.
- Promotional Partner Vendor.

## 24. Customer Roles
- Builder Customer.
- Contractor Customer.
- Architect Customer.
- Engineer Customer.
- Project Owner Customer.
- Retail Buying Customer.

## 25. Temple Roles
Not applicable to MODIT. This section is intentionally reserved in the master SRS structure to keep parity with the requested template and to make the document easy to compare across products. For MODIT, equivalent partner-side operational roles are Supplier Admin, Retail Admin, and Logistics Admin.

## 26. Supplier Roles
- Stock Manager.
- Price Manager.
- Catalog Manager.
- Order Fulfillment Manager.
- Dispatch Manager.
- Settlement Manager.

## 27. Contractor Roles
- Site Contractor.
- Procurement Contractor.
- Installation Contractor.
- Logistics Contractor.
- Inspection Contractor.

## 28. Permission Matrix
| Capability | Buyer | Builder | Contractor | Architect | Supplier | Retailer | Logistics | Finance | Admin |
|---|---|---|---|---|---|---|---|---|---|
| Search catalog | Yes | Yes | Yes | Yes | Yes | Yes | Limited | Limited | Yes |
| Request quote | Yes | Yes | Yes | Yes | No | No | No | No | Yes |
| Respond to quote | No | No | No | No | Yes | Yes | No | No | Yes |
| Place order | Yes | Yes | Yes | Yes | No | No | No | No | Yes |
| Manage inventory | No | No | No | No | Yes | Yes | No | No | Yes |
| Update dispatch | No | No | No | No | Yes | Yes | Yes | No | Yes |
| Manage pricing | No | No | No | No | Yes | Yes | No | No | Yes |
| View analytics | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Yes |
| Manage roles | No | No | No | No | No | No | No | No | Yes |

## 29. Complete Screen List
- Home.
- Search results.
- Product details.
- Quote request flow.
- Quote comparison.
- Order checkout.
- Project dashboard.
- Inventory dashboard.
- Supplier dashboard.
- Retailer dashboard.
- Logistics dashboard.
- Invoice and billing screen.
- Approval workflow screen.
- AI assistant chat.
- Voice assistant mode.
- Saved lists and reorder screen.
- Notifications center.
- Reports and analytics.
- Support and dispute screen.
- Catalog admin screen.
- Trust and verification screen.
- Admin console.
- User profile and company settings.
- Language and accessibility settings.

## 30. Dashboard Modules
- Buyer dashboard.
- Project dashboard.
- RFQ module.
- Quote comparison module.
- Order tracking module.
- Inventory module.
- Supplier dashboard.
- Retailer dashboard.
- Logistics dashboard.
- Finance dashboard.
- Admin dashboard.
- Analytics dashboard.
- AI recommendation module.
- Reorder module.

## 31. AI Features
- Requirement-to-cart assistant.
- Material substitution recommendations.
- Project cost estimator.
- Quote summarization assistant.
- Reorder prediction assistant.
- Supplier matching assistant.
- Voice and document ingestion assistant.
- Support copilot.
- Catalog normalization assistant.

## 32. AI Agents
- Procurement Agent: creates and manages sourcing tasks.
- Estimation Agent: estimates quantity and budget.
- Quote Agent: requests and compares quotes.
- Supplier Matching Agent: finds best-fit suppliers.
- Reorder Agent: predicts replenishment needs.
- Catalog Agent: normalizes product metadata.
- Finance Agent: assists with invoicing and settlement visibility.
- Support Agent: resolves order and delivery exceptions.

## 33. Notifications
- Quote received.
- Quote expiration reminder.
- Approval needed.
- Order confirmed.
- Dispatch update.
- Delivery delay alert.
- Invoice available.
- Reorder suggestion.
- Inventory low alert.
- Support update.

## 34. Search
- Search by product name.
- Search by category.
- Search by technical specification.
- Search by brand.
- Search by price band.
- Search by supplier location.
- Search by delivery speed.
- Search by project use case.
- Search by synonyms and local terminology.

## 35. Recommendation Engine
- Recommend products based on project type, usage, and budget.
- Recommend substitutes when stock is unavailable.
- Recommend suppliers based on reliability, location, and pricing.
- Recommend reorder quantities based on consumption patterns.
- Recommend bundles for common construction stages.
- Recommend seasonal or availability-sensitive alternatives.

## 36. Analytics
- Funnel analytics for search, quote, and order.
- Supplier response analytics.
- Dispatch and delivery performance.
- Catalog search and conversion analytics.
- Price trend analytics.
- Customer retention and repeat rate.
- Inventory health analytics.
- Operational SLA analytics.

## 37. Reports
- Purchase order report.
- Quote summary report.
- Supplier performance report.
- Inventory report.
- Delivery exception report.
- Financial settlement report.
- Project procurement report.
- Catalog quality report.
- AI usage report.

## 38. Chat
- Buyer-supplier chat.
- Procurement team chat.
- Support chat.
- AI assistant chat.
- Order-specific thread with context.
- Document-sharing chat for quotes and invoices.

## 39. Voice Assistant
- Voice-based material search.
- Voice requirement capture.
- Voice quote requests.
- Voice order status checks.
- Voice support interaction for field users.
- Hands-free confirmation for urgent procurement.

## 40. Maps
- Supplier proximity view.
- Delivery coverage map.
- Warehouse or stock location map.
- Project site map.
- Last-mile delivery tracking.
- Route suggestions for logistics.

## 41. Payments
- Online payment for orders.
- Partial payments where commercial policy allows.
- Invoice settlement.
- Refunds and adjustments.
- Credit term visibility.
- Payment ledger and reconciliation.

## 42. Booking Engine
For MODIT, booking is interpreted as order reservation and dispatch scheduling rather than consumer booking.
- Reserve stock.
- Hold inventory for a time window.
- Schedule delivery slots.
- Confirm pickup or dispatch.
- Manage backorder and substitution options.

## 43. Inventory
- Live stock counts.
- Reserved stock.
- Warehouse stock.
- Store stock.
- Transit stock.
- Reorder thresholds.
- Fast-moving item detection.
- Product lifecycle and obsolescence tracking.

## 44. Procurement
- RFQ management.
- Vendor shortlist management.
- Price negotiation support.
- Purchase order generation.
- Approval-based procurement.
- Contract pricing support.
- Consumption-based replenishment.

## 45. OCR
- Parse invoices.
- Read quotes from images or PDFs.
- Capture delivery challans.
- Extract material lists from site notes.
- Read handwritten or scanned procurement requests.

## 46. RAG Opportunities
- Material specification knowledge base.
- Brand and product compatibility knowledge base.
- Construction stage procurement knowledge base.
- Supplier policy and commercial terms knowledge base.
- Tax, invoice, and settlement knowledge base.
- Site safety and compliance knowledge base.

## 47. Multi-Agent Opportunities
- Requirement agent converts messy user input into structured procurement needs.
- Quote agent coordinates supplier outreach.
- Comparison agent ranks offers.
- Reorder agent watches consumption and site progress.
- Support agent handles exceptions and coordination.
- Catalog agent keeps data normalized and searchable.

## 48. Performance Goals
- Search should support fast catalog lookup and filtering.
- RFQ creation should be low-friction and reliable.
- Supplier quote turnaround should be visible in near real time.
- Order status updates should propagate quickly.
- AI assistance should be responsive enough for operational use.
- Platform should sustain heavy catalog writes without degrading buyer search performance.

## 49. Tech Stack Recommendation
- Frontend: responsive web and mobile experiences optimized for field, office, and vendor usage.
- Backend: domain-separated services for catalog, RFQ, orders, inventory, pricing, payments, logistics, and AI orchestration.
- Data: transactional store, search index, analytics store, cache, object storage, and event stream.
- AI: retrieval-augmented procurement assistant, normalization pipeline, and estimation models.
- Infra: scalable cloud deployment with queues, observability, and role-based access.
- Integration: payment providers, messaging, logistics, document processing, and ERP/accounting systems later.

## 50. Final Product Summary
MODIT is a procurement and supply ecosystem for the construction industry, not just a catalog or order app. Its strongest value comes from combining discovery, quote management, inventory visibility, approvals, logistics, and AI-driven procurement assistance into a system that reduces friction across the full construction buying cycle.

---

# Cross-Product Strategic Notes

## Shared Product Principles
- Both products should prioritize trust, identity, and accurate fulfillment.
- Both products benefit from AI that is grounded in real operational context, not generic chat.
- Both products should support multilingual, low-friction experiences.
- Both products require strong search, recommendations, notifications, and analytics.
- Both products need domain-specific partner dashboards and support workflows.

## Key Architectural Differentiators
- Namo Setu is experience-heavy, location-aware, spiritual, seasonal, and support-sensitive.
- MODIT is transaction-heavy, catalog-heavy, quote-heavy, and operationally tied to supply chains.
- Namo Setu requires culturally accurate guidance and temple-side workflow support.
- MODIT requires procurement precision, pricing integrity, and inventory accuracy.

## Recommended Delivery Approach
- Build both products as separate platforms with shared design principles, identity patterns, notification infrastructure, analytics conventions, and AI orchestration patterns where practical.
- Keep product-domain data models separate.
- Reuse platform-level services only where it improves speed and reduces operational overhead without mixing business logic.

## Closing Statement
This SRS defines the product scope, user groups, workflows, and non-functional expectations needed to move into architecture, planning, and execution. It is intentionally framed so that a large engineering team can break it into domain ownership, roadmap phases, and delivery milestones without losing the product intent.
