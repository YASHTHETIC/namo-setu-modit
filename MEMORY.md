# MODIT - Memory File
# Last updated: 31 Aug 2025
# Status: PAUSED - resume from Week 2

---

## WHAT IS MODIT
- Construction materials delivery platform ("Blinkit for construction")
- Cement, paint, lighting, tiling - delivered to site
- Website: modit-web-prod.vercel.app
- GitHub: YASHTHETIC/namo-setu-modit

## TECH STACK
- Frontend: Next.js 15, React, Tailwind CSS
- Backend: FastAPI (Python), PostgreSQL
- State: Zustand, React Query
- Payments: Razorpay (test key: rzp_test_demo)
- Deploy: Vercel (auto-deploy from main branch)
- Monorepo: apps/modit/web, packages/ui, packages/database

## BRAND COLORS
- Deep purple: #2D1B69
- Lime green: #7CB518
- Hot pink: #E91E63
- Cyan: #00BCD4
- Base navy: #150726
- Background: #F8F6FC

## IMPORTANT RULES FROM USER
- "dont change modit i want enhancement and functionality only"
- 28 Aug is a holiday
- Truck branding color palette
- Two logo files: modit-logo.png (dark), modit-logo-light.png (white)
- CSS body color overrides Tailwind (globals.css:91)
- Market container: width: min(1320px, calc(100vw - 2rem))
- Auth pages bypass shell (modit-shell returns <>{children}</> for isHome/isAuth)
- BottomNav visible on ALL screen sizes
- Pincode context: getStock returns -1 for unknown pincodes

## 4-WEEK PLAN (started 24 Aug)
- Week 1: Frontend + Backend Integration - DONE
- Week 2: Checkout + Orders - STARTED THEN PAUSED (31 Aug)
- Week 3: Admin + Mobile + Advanced - NOT STARTED
- Week 4: Testing + Production - NOT STARTED

---

## WHAT IS DONE (Week 1 - COMPLETE)

### Core Pages Built (12 consumer + auth)
1. Homepage - hero, categories, 5 product rails, feature bar, recently viewed, trusted brands
2. Products listing - grid/list, 8 filters, 6 sorts, brand filter working
3. Product detail - variant selector, shade picker (200+ shades), delivery promise
4. Cart - variant-aware, quantity stepper, save for later
5. Checkout - 3-step (Address -> Delivery -> Payment), validation, toast notifications
6. Orders - real API + fallback, status badges, progress bars
7. Order detail - live tracking placeholder, delivery rating
8. Calculator - room presets, material estimates, product recommendations
9. Compare - side-by-side product comparison
10. Wishlist - add to cart, buy now
11. Dashboard - recent orders, RFQs, projects, suppliers
12. Auth pages (5) - login, register, forgot/reset password, verify email

### API Connection (DONE)
- Created api-hooks.ts bridge layer (API-first with static fallback)
- Products, categories, search all use API hooks
- 55+ React Query hooks in modit-api.ts
- All consumer pages API-ready

### Backend (DONE)
- 74 DB tables, 207 API endpoints, 74 tests
- DB pooling, rate limiting, GZip, caching, N+1 fixes

### Features Built
- Flash deals with countdown timers
- Smart search with trending + autocomplete
- Pincode stock availability
- Out-of-stock substitutes
- Referral program modal
- Push notification prompt
- Quick reorder on delivered orders
- Live tracking bar + delivery rating
- Subscription store (weekly/biweekly/monthly)
- Comparison store (max 4 products)
- Coupon system (7 codes)
- Wallet with points and transactions
- Address management (CRUD, default)

---

## WHAT WAS STARTED THEN PAUSED (Week 2 - 31 Aug)

### Done on 31 Aug (before pause)
- Razorpay script loaded in layout.tsx (was never loaded)
- UPI payment now sends upiId to API
- Payment error handling with user-facing messages
- Toast notifications for payment, coupon, address
- Address form validation (pincode 6 digits, phone 10 digits)
- Delivery slot cutoff enforcement
- Coupon usage limits (usedCount incremented)
- Coupon cleared after order placement
- Brand filter fixed (labels had no onClick)
- Trusted Brands now clickable
- Deals/flash deals See All links fixed
- Products page reads sort=discount from URL

### NOT Done (carried over)
- GST invoice generation
- Return/refund flow
- Email/OTP order notifications
- Wallet top-up page
- Address edit UI
- Subscription scheduler (no backend trigger)

---

## WHAT IS NOT STARTED

### Week 3 - Admin + Mobile + Advanced
- Connect admin dashboard with real backend data
- Inventory, orders, supplier management
- Order tracking with real-time updates
- PWA/mobile functionality
- Push notifications
- Google OAuth, 2FA
- Search optimization
- Real-time inventory via WebSocket

### Week 4 - Testing + Production
- Security improvements
- Performance optimization
- Staging + production setup
- Load testing
- Bug fixing and QA
- Final deployment

---

## KNOWN ISSUES / TODO
- Razorpay key is test (rzp_test_demo) - needs real keys in Vercel
- PWA icons are SVG placeholders - need real PNG icons
- No error boundaries on pages
- Dual API systems (hybrid-api.ts and modit-api.ts) - inconsistent
- Cart page has its own coupon system separate from checkout coupon store
- No backend sync for address, wallet, wishlist (all localStorage)
- Simulated map placeholder in order tracking
- No authentication guard on checkout, orders, wishlist pages

---

## FILES TO KNOW
- apps/modit/web/lib/api-hooks.ts - API bridge layer
- apps/modit/web/lib/modit-api.ts - 55+ API hooks
- apps/modit/web/lib/product-data.ts - 75 products (fallback)
- apps/modit/web/lib/cart-store.ts - cart state
- apps/modit/web/lib/address-store.ts - address CRUD
- apps/modit/web/lib/delivery-store.ts - delivery slots
- apps/modit/web/lib/coupon-store.ts - coupon system
- apps/modit/web/lib/wallet-store.ts - wallet/points
- apps/modit/web/lib/subscription-store.ts - subscriptions
- apps/modit/web/lib/comparison-store.ts - product comparison
- apps/modit/web/lib/pincode-context.tsx - pincode state
- apps/modit/web/components/payment-checkout.tsx - Razorpay/COD/UPI
- apps/modit/web/components/modit-shell.tsx - main layout shell
- apps/modit/web/app/checkout/page.tsx - 3-step checkout
- apps/modit/web/app/layout.tsx - root layout with Razorpay script
- apps/modit/web/app/page.tsx - homepage

---

## DAILY WORK LOG
- DAILY_WORK_LOG.txt - 37 entries, Aug 24-31
- WEEKLY_REPORT.txt - Week 1 done, Week 2 paused
- WEEKLY_CHART.txt - progress visual
- WEEKLY_REPORT.html - HTML version for PDF

---

## HOW TO RESUME
When user returns and says "continue" or "resume":
1. First read this MEMORY.md file
2. Check git log for latest commits
3. Check what's deployed on Vercel
4. Continue from Week 2 remaining tasks (GST, returns, emails)
5. Then Week 3, then Week 4

## CHAT HISTORY SUMMARIES
- See CHAT_1.md through CHAT_4.md for detailed conversation logs
