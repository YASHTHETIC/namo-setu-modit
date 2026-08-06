# MODIT Amazon/Flipkart-Grade Overhaul Plan

## Overview
Complete rebuild of the MODIT frontend to match Amazon/Flipkart-level e-commerce architecture. The current codebase is functional (7.5/10) but lacks the polish, interactivity, and UX patterns of major Indian e-commerce platforms.

## Architecture Changes

### 1. Zustand Cart Store (Persistent)
- `lib/cart-store.ts` — Zustand store with localStorage persistence
- Actions: addToCart, removeFromCart, updateQuantity, saveForLater, moveToCart, clearCart
- Cart badge count in header
- Cart sidebar/drawer on add-to-cart

### 2. Mega Menu Navigation
- Replace current flat nav with Amazon-style mega menu
- Category columns with subcategories on hover
- "Shop by Category" mega dropdown
- Mobile: slide-in drawer with category tree

### 3. Search Autocomplete
- Debounced search input with dropdown suggestions
- Recent searches, trending searches, category suggestions
- Product suggestions with thumbnail + price
- Keyboard navigation (arrow keys + Enter)

### 4. Product Listing Page (Amazon-style)
- Left sidebar with collapsible filter sections:
  - Price range slider
  - Brand checkboxes
  - Rating stars filter
  - Availability (In Stock / Out of Stock)
  - Discount percentage
  - GST rate
- Top bar: Sort (Relevance, Price Low-High, Price High-Low, Rating, Newest), Grid/List toggle, Results count
- Product cards: Image, title, rating stars + count, price with MRP strikethrough + discount %, delivery estimate, "Add to Cart" + "Buy Now" buttons, prime/verified badge
- Pagination or infinite scroll
- "Did you mean?" suggestions
- "Customers also bought" sections between results

### 5. Product Detail Page (Amazon-style)
- Left: Image gallery with thumbnails + zoom on hover
- Right: Buy box (price, delivery, seller, quantity, Add to Cart + Buy Now)
- Below: Product details table, specifications, description
- Customer reviews section with rating histogram
- "Frequently Bought Together" bundle
- "Similar Products" carousel
- "Compare with similar items" table
- EMI options calculator
- Delivery pincode check with date estimate
- Share/Wishlist buttons

### 6. Cart Page (Amazon-style)
- Left: Cart items with image, title, seller, price, quantity selector, save for later, remove
- Right: Price details (subtotal, discount, delivery, total), coupon input, place order button
- "Saved for later" section below
- " Customers who bought this also bought" recommendations
- Delivery estimates per item based on pincode

### 7. Checkout Page (Amazon-style)
- Step indicator (Address → Payment → Review)
- Address selection with radio buttons + add new
- Delivery options (Standard/Express/Same-day)
- Payment methods (UPI, Cards, Net Banking, COD, Credit Terms)
- Order summary sidebar
- Place order CTA

### 8. Product Images
- Use Unsplash source URLs for realistic product photos
- Categories: cement bags, steel bars, bricks, tiles, pipes, paint buckets, wires, sanitary ware, sand, plywood
- Each product gets a relevant image URL

### 9. Realistic Data (30+ products)
- 12 categories with 2-3 products each
- Real Indian brands (UltraTech, Tata Tiscon, JSW Steel, Asian Paints, Havells, Cera, etc.)
- Realistic pricing with MRP vs sale price
- Rating distributions
- Delivery estimates

### 10. Loading States
- Product listing: skeleton grid
- Product detail: skeleton gallery + details
- Cart: skeleton items
- Checkout: skeleton steps

## Implementation Phases

### Phase 1: Foundation (Cart Store + Data + Images)
Files to create/modify:
- `lib/cart-store.ts` — Zustand persistent cart store
- `lib/product-data.ts` — Centralized realistic product catalog (30+ products)
- `lib/modit-ui.tsx` — Add StarRating, PriceDisplay, DeliveryBadge components

### Phase 2: Navigation Overhaul
Files to create/modify:
- `components/modit-shell.tsx` — Mega menu, search bar with autocomplete, cart badge, location selector

### Phase 3: Product Listing
Files to create/modify:
- `app/products/page.tsx` — Complete rewrite with sidebar filters, sort, grid/list view

### Phase 4: Product Detail
Files to create/modify:
- `app/products/[id]/page.tsx` — Complete rewrite with image gallery, buy box, reviews, similar products

### Phase 5: Cart + Checkout
Files to create/modify:
- `app/cart/page.tsx` — Complete rewrite with persistent cart, saved-for-later
- `app/checkout/page.tsx` — Complete rewrite with step indicator, address book, payment

### Phase 6: Polish
- Loading skeletons for all pages
- Cart drawer/sidebar component
- Mobile responsive mega menu
- Final build verification

## Key Data: Product Catalog (30+ items)

### Cement (3)
1. UltraTech Cement OPC 53 Grade 50kg — ₹385 (MRP ₹410)
2. ACC Cement PPC 43 Grade 50kg — ₹360 (MRP ₹395)
3. Ambuja Cement Strong 50kg — ₹370 (MRP ₹400)

### Steel & TMT (3)
4. Tata Tiscon TMT Bar 12mm Fe-500D — ₹64/kg (MRP ₹68)
5. JSW Steel TMT Bar 16mm Fe-500D — ₹62/kg (MRP ₹66)
6. SAIL TMT Bar 10mm Fe-500D — ₹66/kg (MRP ₹70)

### Bricks & Blocks (3)
7. Red Clay Bricks First Class 9x4x3 — ₹8.5/pc (MRP ₹10)
8. AAC Blocks 600x200x100mm — ₹45/pc (MRP ₹55)
9. Fly Ash Bricks 230x110x75mm — ₹6/pc (MRP ₹8)

### Tiles & Ceramics (3)
10. Kajaria Ceramic Floor Tiles 2x2ft — ₹85/sqft (MRP ₹100)
11. Johnson Porcelain Wall Tiles 10x15 — ₹45/sqft (MRP ₹55)
12. Somany Digital Wall Tiles 2x2ft — ₹95/sqft (MRP ₹110)

### Paint (3)
13. Asian Paints Apex Ultima 20L — ₹2,890 (MRP ₹3,200)
14. Berger Paints WeatherCoat 20L — ₹2,450 (MRP ₹2,800)
15. Nerolac Impressions 20L — ₹2,650 (MRP ₹2,950)

### Electrical (3)
16. Havells LifeLine 2.5sqmm Wire 90m — ₹2,520 (MRP ₹2,800)
17. Finolex FR Cable 2.5sqmm 90m — ₹2,880 (MRP ₹3,200)
18. Polycab Optima Plus 1.5sqmm 90m — ₹1,850 (MRP ₹2,100)

### Plumbing (3)
19. Supreme PVC Pipes 4 inch 6m — ₹650 (MRP ₹750)
20. Astral CPVC Pipes 1/2 inch 3m — ₹180 (MRP ₹220)
21. Prince SS Pipes 2 inch 6m — ₹850 (MRP ₹950)

### Sanitary & Bath (3)
22. Cera EWC Sanitary Ware — ₹7,650 (MRP ₹8,500)
23. Hindware Rimless EWC — ₹6,200 (MRP ₹7,000)
24. Jaquar Basin Mixer Tap — ₹3,500 (MRP ₹4,200)

### Sand & Aggregate (2)
25. River Sand 0-20mm — ₹2,800/MT (MRP ₹3,200)
26. M-Sand 0-4.75mm — ₹2,200/MT (MRP ₹2,600)

### Pipes & Fittings (2)
27. Surya Roshni MS Pipe ERW 2inch 6m — ₹1,250 (MRP ₹1,400)
28. Tata Steel ERW Pipe 1.5inch 6m — ₹980 (MRP ₹1,100)

### Plywood & Boards (2)
29. Greenply BWR Plywood 19mm 8x4ft — ₹3,200 (MRP ₹3,800)
30. Century Plyboards Marine 12mm 8x4ft — ₹2,800 (MRP ₹3,400)

### Hardware (2)
31. Hettich Concealed Hinges (Set of 2) — ₹280 (MRP ₹350)
32. Godrej Mortise Lock — ₹1,800 (MRP ₹2,200)
