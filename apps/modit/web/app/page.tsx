"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, User, ChevronRight, ChevronLeft, Star, Zap, Shield, Truck,
  ArrowRight, Package, BarChart3, Brain, Layers, Sparkles, MapPin, Clock,
  Heart, GitCompare, Bell, Eye, Award, TrendingUp, CheckCircle, Phone,
  Calculator, Download, PlayCircle, Headphones, Tag, Percent, Users,
  Building2, HardHat, TruckIcon, Timer, Flame, ThumbsUp, MessageCircle
} from "lucide-react";

/* ── DATA ── */
const PRODUCTS = [
  { id: "cement-1", name: "UltraTech Cement OPC 43 Grade 50kg", brand: "UltraTech", price: 370, mrp: 490, discount: 24, rating: 4.7, reviews: 2340, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", category: "Cement", supplier: "BuildMart India", gst: "Incl. 18% GST", delivery: "Delivery by Tomorrow", stock: "In Stock" },
  { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm Bars", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, reviews: 1890, img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=400&h=400&fit=crop", badge: "Top Rated", category: "Steel", supplier: "SteelSupply Co.", gst: "Incl. 18% GST", delivery: "Delivery in 2 days", stock: "In Stock" },
  { id: "paint-1", name: "Asian Paints Apex 20L Exterior", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, reviews: 4230, img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop", badge: "Popular", category: "Paint", supplier: "PaintWorld", gst: "Incl. 18% GST", delivery: "Delivery by Tomorrow", stock: "In Stock" },
  { id: "tile-1", name: "Kajaria Wall Tiles 2x2ft Glossy", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, reviews: 3120, img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400&h=400&fit=crop", badge: "New", category: "Tiles", supplier: "TileHub", gst: "Incl. 18% GST", delivery: "Delivery in 3 days", stock: "In Stock" },
  { id: "electrical-1", name: "Havells LifeLine Plus 2.5sqmm 90m", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, reviews: 534, img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", category: "Electrical", supplier: "ElectroBazaar", gst: "Incl. 18% GST", delivery: "Delivery by Tomorrow", stock: "In Stock" },
  { id: "plumbing-1", name: "Jaquar CP Valve 1/2 Inch", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, reviews: 876, img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop", badge: "Deal", category: "Plumbing", supplier: "PlumbPro", gst: "Incl. 18% GST", delivery: "Delivery in 2 days", stock: "Only 5 left" },
  { id: "cement-2", name: "ACC Cement 2X Strong 50kg", brand: "ACC", price: 365, mrp: 475, discount: 23, rating: 4.6, reviews: 1890, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Value Pick", category: "Cement", supplier: "BuildMart India", gst: "Incl. 18% GST", delivery: "Delivery by Tomorrow", stock: "In Stock" },
  { id: "steel-2", name: "JSW Neosteel TMT 500D 10mm", brand: "JSW", price: 54200, mrp: 62000, discount: 12, rating: 4.7, reviews: 1245, img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=400&h=400&fit=crop", badge: "Premium", category: "Steel", supplier: "SteelSupply Co.", gst: "Incl. 18% GST", delivery: "Delivery in 2 days", stock: "In Stock" },
];

const CATEGORIES = [
  { name: "Cement", icon: "🏗️", slug: "cement", count: "500+ Products" },
  { name: "Steel & TMT", icon: "🔩", slug: "steel", count: "300+ Products" },
  { name: "Tiles", icon: "🔲", slug: "tiles", count: "1200+ Products" },
  { name: "Paint", icon: "🎨", slug: "paint", count: "800+ Products" },
  { name: "Electrical", icon: "⚡", slug: "electrical", count: "600+ Products" },
  { name: "Plumbing", icon: "🔧", slug: "plumbing", count: "400+ Products" },
  { name: "Sand & Aggregate", icon: "🪨", slug: "sand", count: "150+ Products" },
  { name: "Bricks & Blocks", icon: "🧱", slug: "bricks", count: "200+ Products" },
  { name: "Wood & Plywood", icon: "🪵", slug: "wood", count: "350+ Products" },
  { name: "Hardware", icon: "🔩", slug: "hardware", count: "1000+ Products" },
  { name: "Bathroom", icon: "🚿", slug: "bathroom", count: "250+ Products" },
  { name: "Doors & Windows", icon: "🚪", slug: "doors", count: "180+ Products" },
];

const BRANDS = [
  { name: "UltraTech", img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=120&h=60&fit=crop" },
  { name: "Tata Tiscon", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=120&h=60&fit=crop" },
  { name: "Asian Paints", img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=120&h=60&fit=crop" },
  { name: "Havells", img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=120&h=60&fit=crop" },
  { name: "Kajaria", img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=120&h=60&fit=crop" },
  { name: "Jaquar", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=120&h=60&fit=crop" },
];

const FLASH_DEALS = PRODUCTS.slice(0, 4);

const TESTIMONIALS = [
  { name: "Rajesh Kumar", company: "Kumar Constructions, Noida", text: "MODIT saved us 18% on material costs last quarter. The AI price comparison is incredible.", rating: 5, orders: 47 },
  { name: "Priya Sharma", company: "Sharma Builders, Gurgaon", text: "Same-day delivery for urgent projects has been a game changer. Highly recommend!", rating: 5, orders: 32 },
  { name: "Amit Patel", company: "Patel Infrastructure, Delhi", text: "The bulk ordering feature with verified suppliers gives us confidence in every purchase.", rating: 5, orders: 65 },
  { name: "Suresh Reddy", company: "Reddy Constructions, Hyderabad", text: "Best B2B platform for construction materials. Prices are genuinely lower than local dealers.", rating: 4, orders: 28 },
];

const FAQS = [
  { q: "How does MODIT pricing work?", a: "MODIT connects you directly with verified suppliers, eliminating middlemen. Our AI compares prices across 500+ suppliers in real-time to ensure you get the best deal." },
  { q: "What is the minimum order quantity?", a: "Minimum order quantities vary by product. Most cement orders start from 10 bags, steel from 1 ton. Contact suppliers for bulk pricing." },
  { q: "Do you offer GST invoices?", a: "Yes, all orders on MODIT come with proper GST invoices for input tax credit. You can download invoices from your dashboard." },
  { q: "What areas do you deliver to?", a: "We currently deliver across Delhi NCR, Mumbai, Bangalore, Hyderabad, Chennai, Pune, and 50+ tier-2 cities across India." },
];

const LIVE_ORDERS = [
  { name: "Rajesh K.", item: "500 bags UltraTech Cement", city: "Noida", time: "2m ago" },
  { name: "Priya S.", item: "2 tons Tata TMT bars", city: "Gurgaon", time: "5m ago" },
  { name: "Amit P.", item: "200L Asian Paints Apex", city: "Delhi", time: "8m ago" },
  { name: "Vikram M.", item: "100 sqft Kajaria Tiles", city: "Mumbai", time: "12m ago" },
];

const HERO_SLIDES = [
  { badge: "MEGA DEAL", badgeColor: "#D93025", title: "Monsoon Mega Sale", sub: "Up to 25% off on Cement, Steel & building materials. Limited time offer.", cta: "Shop Now", ctaStyle: "amazon", link: "/products" },
  { badge: "B2B EXCLUSIVE", badgeColor: "#2874F0", title: "Bulk Order Pricing", sub: "Extra 10% off on orders above 50 units. Best prices for contractors.", cta: "Get Quote", ctaStyle: "blue", link: "/rfq" },
  { badge: "NEW ARRIVAL", badgeColor: "#00875A", title: "Premium Tiles Collection", sub: "Explore 500+ designs from Kajaria, Somany, Johnson. Starting ₹42/sqft.", cta: "Explore", ctaStyle: "green", link: "/products?category=tiles" },
];

/* ── COMPONENTS ── */
function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`fill-current ${i < Math.floor(rating) ? "text-[#FF9900]" : i < rating ? "text-[#FFD814]" : "text-gray-200"}`}
          style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

function ProductCard({ p }: { p: typeof PRODUCTS[0] }) {
  return (
    <div className="product-card">
      <div className="product-img">
        <img src={p.img} alt={p.name} loading="lazy" />
        <div className="product-actions">
          <button><Heart className="h-4 w-4" /></button>
          <button><GitCompare className="h-4 w-4" /></button>
          <button><Eye className="h-4 w-4" /></button>
        </div>
        {p.discount >= 20 && <span className="badge-discount absolute top-2 left-2">{p.discount}% off</span>}
      </div>
      <div className="product-info">
        <p className="product-brand">{p.brand}</p>
        <h3 className="product-name">{p.name}</h3>
        <div className="product-rating">
          <span className="inline-flex items-center gap-1 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {p.rating} <Star className="h-2.5 w-2.5 fill-white" />
          </span>
          <span className="rating-text">{p.rating}</span>
          <span className="review-count">({p.reviews.toLocaleString()})</span>
        </div>
        <div className="product-price">
          <span className="current">₹{p.price.toLocaleString()}</span>
          <span className="mrp">₹{p.mrp.toLocaleString()}</span>
          <span className="discount">{p.discount}% off</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">{p.gst}</p>
        <p className="product-delivery">
          <Truck className="h-3 w-3 inline mr-1" />
          <span className="free">Free delivery</span> · {p.delivery.replace("Delivery ", "")}
        </p>
        <p className="product-supplier">
          <Building2 className="h-3 w-3" /> {p.supplier}
          <span className="badge-verified ml-1"><CheckCircle className="h-2.5 w-2.5" /> Verified</span>
        </p>
        <div className="flex gap-2 mt-3">
          <button className="btn-amazon flex-1 text-[11px] py-1.5 px-3">Add to Cart</button>
          <button className="btn-orange flex-1 text-[11px] py-1.5 px-3">Buy Now</button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function ModitHomePage() {
  const [slide, setSlide] = useState(0);
  const [liveIdx, setLiveIdx] = useState(0);
  const [flashTimer, setFlashTimer] = useState({ h: 5, m: 23, s: 47 });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const t1 = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    const t2 = setInterval(() => setLiveIdx(l => (l + 1) % LIVE_ORDERS.length), 4000);
    const t3 = setInterval(() => {
      setFlashTimer(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const s = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ── Announcement Bar ── */}
      <div className="bg-[#232F3E] text-white text-center py-1.5 px-4 text-[11px]">
        <span className="hidden sm:inline">Free delivery on first order </span>
        <span className="mx-2 text-white/20">|</span>
        <span>MONSOON MEGA SALE — Up to 25% OFF</span>
        <span className="mx-2 text-white/20">|</span>
        <span className="font-bold text-[var(--brand)]">Use code FUTURE25</span>
      </div>

      {/* ── Main Header ── */}
      <header className="sticky top-0 z-50 bg-[#131921]">
        <div className="max-w-[1440px] mx-auto flex h-[60px] items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-1">
            <span className="text-[22px] font-black text-white tracking-tight">MODIT</span>
            <span className="text-[9px] text-[var(--brand)] font-bold hidden sm:block mt-1">BUILDING MATERIALS</span>
          </Link>

          {/* Deliver to */}
          <button className="hidden md:flex items-center gap-1.5 text-white/80 hover:text-white text-[12px] px-2 py-1 rounded hover:border hover:border-white/20 transition-all">
            <MapPin className="h-3.5 w-3.5" />
            <div className="text-left">
              <p className="text-[9px] text-white/50 leading-none">Deliver to</p>
              <p className="text-[12px] font-bold leading-tight">New Delhi 110001</p>
            </div>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-3xl">
            <div className="flex">
              <select className="h-[40px] rounded-l-md bg-gray-100 border-0 text-[12px] text-gray-700 px-2 cursor-pointer focus:outline-none hidden sm:block">
                <option>All</option>
                {CATEGORIES.slice(0, 6).map(c => <option key={c.slug}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Search cement, steel, tiles, paint, electrical..."
                className="flex-1 h-[40px] bg-white px-4 text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none border-0" />
              <button className="h-[40px] w-[48px] bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-r-md flex items-center justify-center transition-colors">
                <Search className="h-5 w-5 text-[#111]" />
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link href="#" className="hidden lg:flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <GitCompare className="h-5 w-5" />
              <span className="text-[9px] font-medium">Compare</span>
            </Link>
            <Link href="#" className="hidden lg:flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <Bell className="h-5 w-5" />
              <span className="text-[9px] font-medium">Alerts</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-[9px] font-medium">Cart</span>
              <span className="absolute -top-0.5 right-0 h-[18px] min-w-[18px] rounded-full bg-[var(--brand)] text-[10px] font-bold text-[#111] flex items-center justify-center px-1">3</span>
            </Link>
            <Link href="/auth" className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold px-3 py-2 rounded transition-all ml-1">
              <User className="h-4 w-4" /> Sign In
            </Link>
          </div>
        </div>

        {/* Category Nav */}
        <div className="bg-[#232F3E] border-t border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center overflow-x-auto px-4 sm:px-6 scrollbar-hide">
            {["Today's Deals", "Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Plumbing", "Bulk Orders", "New Arrivals", "All Categories"].map(item => (
              <Link key={item} href={item === "Today's Deals" ? "/products?sort=deals" : item === "All Categories" ? "/products" : `/products?category=${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="shrink-0 px-3 py-2.5 text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all border-b-2 border-transparent hover:border-[var(--brand)]">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* ── Hero Section ── */}
        <section className="pt-4 pb-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-lg bg-white border border-[var(--border)] min-h-[340px]">
              <div className="relative h-full flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <motion.span key={s.badge} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-3 py-1 rounded w-fit mb-4"
                  style={{ background: s.badgeColor }}>
                  <Zap className="h-3 w-3" /> {s.badge}
                </motion.span>

                <motion.h1 key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-[var(--text)] leading-tight mb-3">
                  {s.title}
                </motion.h1>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="text-[var(--text-secondary)] text-[14px] mb-5 max-w-md leading-relaxed">
                  {s.sub}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link href={s.link}
                    className={s.ctaStyle === "amazon" ? "btn-amazon" : s.ctaStyle === "blue" ? "btn-blue" : "btn-orange"}>
                    {s.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {HERO_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-[var(--brand)]" : "w-1.5 bg-gray-300"}`} />
                ))}
              </div>

              {/* Side Product Cards */}
              <div className="hidden lg:flex absolute right-0 top-0 h-full w-[280px] flex-col justify-center gap-2 p-3">
                {PRODUCTS.slice(0, 3).map((p, i) => (
                  <motion.div key={`hero-${i}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white rounded-lg border border-[var(--border)] p-2.5 flex gap-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-16 h-16 rounded bg-gray-50 overflow-hidden shrink-0">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-[var(--blue)] uppercase">{p.brand}</p>
                      <p className="text-[11px] font-medium text-[var(--text)] truncate">{p.name}</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[14px] font-black text-[var(--text)]">₹{p.price.toLocaleString()}</span>
                        <span className="text-[10px] text-[var(--text-muted)] line-through">₹{p.mrp.toLocaleString()}</span>
                      </div>
                      <span className="badge-discount text-[9px] mt-0.5">{p.discount}% OFF</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-3">
              {/* Quick Links */}
              <div className="card p-3">
                <h3 className="text-[12px] font-bold text-[var(--text)] mb-2">Quick Links</h3>
                <div className="space-y-0.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map(item => (
                    <Link key={item} href="#" className="flex items-center justify-between px-2 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] rounded transition-all">
                      {item} <ChevronRight className="h-3 w-3 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Download App */}
              <div className="rounded-lg bg-[#232F3E] p-3 text-white">
                <h3 className="text-[12px] font-bold mb-0.5">Download App</h3>
                <p className="text-[10px] text-white/50 mb-2">Get exclusive app-only deals</p>
                <div className="flex gap-2">
                  <span className="flex-1 rounded bg-white/10 px-2 py-1.5 text-[10px] font-bold text-center cursor-pointer hover:bg-white/20 transition-all">Google Play</span>
                  <span className="flex-1 rounded bg-white/10 px-2 py-1.5 text-[10px] font-bold text-center cursor-pointer hover:bg-white/20 transition-all">App Store</span>
                </div>
              </div>

              {/* Live Orders */}
              <div className="card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
                  <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider">Live Orders</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={liveIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="text-[11px]">
                    <p className="text-[var(--text)] font-medium">{LIVE_ORDERS[liveIdx].name} ordered {LIVE_ORDERS[liveIdx].item}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{LIVE_ORDERS[liveIdx].city} — {LIVE_ORDERS[liveIdx].time}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ── Categories Grid ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">Shop by Category</h2>
            <Link href="/products" className="text-[12px] font-bold text-[var(--blue)] hover:underline flex items-center gap-0.5">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 + i * 0.03 }}>
                <Link href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center bg-white rounded-lg border border-[var(--border)] p-3 hover:shadow-md hover:border-[var(--brand)] transition-all group">
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-[11px] font-semibold text-[var(--text)] text-center group-hover:text-[var(--brand)] transition-colors">{cat.name}</span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{cat.count}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Flash Deals ── */}
        <section className="py-4">
          <div className="bg-white rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-[var(--text)] flex items-center gap-2">
                  <Flame className="h-5 w-5 text-[var(--danger)]" /> Flash Deals
                </h2>
                <div className="flex items-center gap-1 bg-[var(--danger)] text-white text-[11px] font-bold px-2 py-1 rounded">
                  <Timer className="h-3 w-3" />
                  {String(flashTimer.h).padStart(2, '0')}:{String(flashTimer.m).padStart(2, '0')}:{String(flashTimer.s).padStart(2, '0')}
                </div>
              </div>
              <Link href="/products?sort=deals" className="text-[12px] font-bold text-[var(--blue)] hover:underline flex items-center gap-0.5">View All <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FLASH_DEALS.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                  <ProductCard p={p} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">Featured Products</h2>
            <Link href="/products" className="text-[12px] font-bold text-[var(--blue)] hover:underline flex items-center gap-0.5">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PRODUCTS.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <ProductCard p={p} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Top Brands ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">Top Brands</h2>
            <Link href="/products" className="text-[12px] font-bold text-[var(--blue)] hover:underline flex items-center gap-0.5">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BRANDS.map((b, i) => (
              <motion.div key={b.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                <Link href={`/products?brand=${b.name.toLowerCase().replace(/ /g, '-')}`}
                  className="flex flex-col items-center bg-white rounded-lg border border-[var(--border)] p-4 hover:shadow-md hover:border-[var(--brand)] transition-all">
                  <div className="w-full h-12 rounded overflow-hidden mb-2 bg-gray-50">
                    <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text)]">{b.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Why Choose MODIT ── */}
        <section className="py-4">
          <h2 className="text-[16px] font-bold text-[var(--text)] mb-3">Why Choose MODIT</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Shield, title: "Verified Suppliers", desc: "Every supplier KYC-verified", color: "#00875A" },
              { icon: Truck, title: "Same-Day Delivery", desc: "Deliver within hours", color: "#2874F0" },
              { icon: Brain, title: "AI Price Intelligence", desc: "Real-time market prices", color: "#7C3AED" },
              { icon: Award, title: "Best Prices", desc: "Compare 500+ suppliers", color: "#FF9900" },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="card p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-[var(--text)]">{f.title}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Products", value: "10,000+", icon: Package, color: "#FF9900" },
              { label: "Verified Suppliers", value: "500+", icon: Users, color: "#00875A" },
              { label: "Orders Delivered", value: "2M+", icon: Truck, color: "#2874F0" },
              { label: "Customer Rating", value: "4.8★", icon: Star, color: "#7C3AED" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="card p-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-1.5" style={{ color: stat.color }} />
                <p className="text-xl font-black text-[var(--text)]">{stat.value}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-4">
          <h2 className="text-[16px] font-bold text-[var(--text)] mb-3">What Our Customers Say</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="card p-4">
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-[var(--brand)] text-[var(--brand)]" />
                  ))}
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-3 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[12px] font-bold text-[var(--brand)]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--text)]">{t.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{t.company}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-light)] flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <CheckCircle className="h-3 w-3 text-[var(--success)]" /> {t.orders} orders placed
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQs ── */}
        <section className="py-4">
          <h2 className="text-[16px] font-bold text-[var(--text)] mb-3">Frequently Asked Questions</h2>
          <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border-light)]">
            {FAQS.map((faq, i) => (
              <div key={i} className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[var(--text)]">{faq.q}</h3>
                  <ChevronRight className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${expandedFaq === i ? "rotate-90" : ""}`} />
                </div>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="text-[12px] text-[var(--text-secondary)] mt-2 leading-relaxed overflow-hidden">
                      {faq.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-4">
          <div className="rounded-lg bg-gradient-to-r from-[#232F3E] to-[#37475A] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Ready to Start Building?</h2>
              <p className="text-[13px] text-white/60">Join 5,000+ contractors saving 42% on material costs</p>
            </div>
            <div className="flex gap-2">
              <Link href="/products" className="btn-amazon">Start Ordering</Link>
              <Link href="/rfq" className="btn-outline border-white/20 text-white hover:bg-white/10 hover:border-white/40">Get Quote</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#232F3E] mt-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-[16px] font-black text-white mb-2">MODIT</h3>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">India&apos;s B2B marketplace for construction materials. Compare prices from 500+ verified suppliers.</p>
              <div className="flex gap-2">
                <span className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/20 transition-all">Google Play</span>
                <span className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/20 transition-all">App Store</span>
              </div>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Plumbing"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Press", "Contact Us"] },
              { title: "Support", items: ["Help Center", "Track Order", "Returns", "FAQs", "API Docs"] },
              { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Refund Policy", "GST Info"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[12px] font-bold text-white/60 mb-2.5 uppercase tracking-wider">{col.title}</h4>
                <div className="space-y-1.5">
                  {col.items.map(item => (
                    <Link key={item} href="#" className="block text-[11px] text-white/40 hover:text-white/70 transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-white/30">2026 MODIT. All rights reserved. Made with ❤️ in India.</p>
            <div className="flex gap-4 text-[10px] text-white/30">
              <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white/60 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
