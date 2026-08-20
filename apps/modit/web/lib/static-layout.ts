import type { LayoutResponse } from "@/lib/layout-types";

// ── Static Fallback Layout ──────────────────────────────────────────
// Used when the API is unreachable or during development.
// Same JSON structure as the backend response — same widgets render it.

export const STATIC_HOME_LAYOUT: LayoutResponse = {
  version: "1.0",
  screen: "home",
  meta: {
    pincode: "201301",
    city: "New Delhi",
    eta: "60 mins",
    is_serviceable: true,
    user_segment: "all",
  },
  sections: [
    {
      type: "DeliveryBar",
      id: "delivery_bar_001",
      order: 0,
      visible: true,
      data: { eta_minutes: 60, pincode: "201301", city: "New Delhi", is_serviceable: true },
    },
    {
      type: "DispatchBanner",
      id: "dispatch_banner_001",
      order: 1,
      visible: true,
      data: { dispatch_time: "8 AM", dispatch_date: "20 August 2026" },
    },
    {
      type: "PromoBanner",
      id: "promo_banner_001",
      order: 2,
      visible: true,
      data: {
        title: "FREE DELIVERY",
        subtitle: "Free Delivery on next 5 orders",
        badge_text: "(Valid till 31-Jul)",
        badge_color: "#E91E63",
        bg_gradient: "from-[#2D1B69] to-[#4A2D8A]",
        valid_till: "2026-07-31",
      },
    },
    {
      type: "AssuredStrip",
      id: "assured_strip_001",
      order: 3,
      visible: true,
      data: {
        title: "Modit Assured",
        features: [
          { title: "7 Day Replacement", description: "Over & Above Brand Warranty", icon: "RotateCcw", color: "#E91E63" },
          { title: "4 Hour Resolution", description: "On Any Quality Issues", icon: "Clock", color: "#7CB518" },
          { title: "100% Genuine Guarantee", description: "QR Code & Batch Number Verified", icon: "CircleCheck", color: "#7CB518" },
          { title: "Easy Returns", description: "No Questions Asked", icon: "Package", color: "#E91E63" },
        ],
      },
    },
    {
      type: "CategoryGrid",
      id: "category_grid_001",
      order: 4,
      visible: true,
      data: {
        columns: 4,
        categories: [
          { id: "1", name: "Cement", slug: "cement", image_url: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop", product_count: 500 },
          { id: "2", name: "Tiling", slug: "tiles-ceramics", image_url: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=200&h=200&fit=crop", product_count: 1200 },
          { id: "3", name: "Painting", slug: "paint", image_url: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=200&h=200&fit=crop", product_count: 800 },
          { id: "4", name: "Water Proofing", slug: "waterproofing", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop", product_count: 100 },
          { id: "5", name: "Plywood & MDF", slug: "plywood-boards", image_url: "https://images.unsplash.com/photo-1611600700192-d87eaeed4f81?w=200&h=200&fit=crop", product_count: 350 },
          { id: "6", name: "Fevicol", slug: "fevicol", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop", product_count: 50 },
          { id: "7", name: "Wires", slug: "electrical", image_url: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop", product_count: 600 },
          { id: "8", name: "Switches", slug: "switches", image_url: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop", product_count: 400 },
          { id: "9", name: "Hinges & Handles", slug: "hardware", image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop", product_count: 1000 },
          { id: "10", name: "Kitchen Systems", slug: "kitchen", image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", product_count: 200 },
          { id: "11", name: "Wardrobe Fittings", slug: "bedroom", image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=200&fit=crop", product_count: 150 },
          { id: "12", name: "Door Locks", slug: "door-locks", image_url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop", product_count: 300 },
        ],
      },
    },
    {
      type: "FeatureBar",
      id: "feature_bar_001",
      order: 5,
      visible: true,
      data: {
        bg_gradient: "from-[#150726] to-[#2D1B69]",
        features: [
          { title: "LOWEST PRICES", description: "Best quality at best prices", icon: "TrendingUp", color: "#E91E63" },
          { title: "60 MINS DELIVERY", description: "Superfast delivery at your site", icon: "Timer", color: "#00BCD4" },
          { title: "SECURE PAYMENTS", description: "100% safe & secure", icon: "Lock", color: "#7CB518" },
        ],
      },
    },
    {
      type: "ProductCarousel",
      id: "product_carousel_001",
      order: 6,
      visible: true,
      data: {
        title: "Trending Now",
        products: [
          { id: "cement-1", name: "UltraTech Cement OPC 53 Grade 50kg", brand: "UltraTech", price: 385, mrp: 410, discount: 6, rating: 4.7, review_count: 2340, image_url: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", delivery_text: "Tomorrow" },
          { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm Bars", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, review_count: 1890, image_url: "https://images.unsplash.com/photo-1745909247906-123b53b70e06?w=400&h=400&fit=crop", badge: "Top Rated", delivery_text: "2 days" },
          { id: "paint-1", name: "Asian Paints Apex 20L Exterior", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, review_count: 4230, image_url: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=400&h=400&fit=crop", badge: "Popular", delivery_text: "Tomorrow" },
          { id: "tiles-1", name: "Kajaria Wall Tiles 2x2ft Glossy", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, review_count: 3120, image_url: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "New", delivery_text: "3 days" },
          { id: "electrical-1", name: "Havells LifeLine Plus 2.5sqmm Wire", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, review_count: 534, image_url: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", delivery_text: "Tomorrow" },
          { id: "plumbing-1", name: "Jaquar CP Valve 1/2 Inch", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, review_count: 876, image_url: "https://images.unsplash.com/photo-1737505599025-836fce14b071?w=400&h=400&fit=crop", badge: "Deal", delivery_text: "2 days" },
        ],
      },
    },
    {
      type: "ProductGrid",
      id: "product_grid_001",
      order: 7,
      visible: true,
      data: {
        title: "Featured Products",
        columns: 2,
        products: [
          { id: "cement-1", name: "UltraTech Cement OPC 53 Grade 50kg", brand: "UltraTech", price: 385, mrp: 410, discount: 6, rating: 4.7, review_count: 2340, image_url: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", delivery_text: "Tomorrow" },
          { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm Bars", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, review_count: 1890, image_url: "https://images.unsplash.com/photo-1745909247906-123b53b70e06?w=400&h=400&fit=crop", badge: "Top Rated", delivery_text: "2 days" },
          { id: "paint-1", name: "Asian Paints Apex 20L Exterior", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, review_count: 4230, image_url: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=400&h=400&fit=crop", badge: "Popular", delivery_text: "Tomorrow" },
          { id: "tiles-1", name: "Kajaria Wall Tiles 2x2ft Glossy", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, review_count: 3120, image_url: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "New", delivery_text: "3 days" },
          { id: "electrical-1", name: "Havells LifeLine Plus 2.5sqmm Wire", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, review_count: 534, image_url: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", delivery_text: "Tomorrow" },
          { id: "plumbing-1", name: "Jaquar CP Valve 1/2 Inch", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, review_count: 876, image_url: "https://images.unsplash.com/photo-1737505599025-836fce14b071?w=400&h=400&fit=crop", badge: "Deal", delivery_text: "2 days" },
          { id: "cement-2", name: "ACC Cement PPC 43 Grade 50kg", brand: "ACC", price: 360, mrp: 395, discount: 9, rating: 4.6, review_count: 1890, image_url: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Value", delivery_text: "Tomorrow" },
        ],
      },
    },
  ],
};
