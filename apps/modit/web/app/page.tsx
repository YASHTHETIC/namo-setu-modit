"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, User, ChevronRight, Star, Zap, Shield, Truck,
  ArrowRight, Package, BarChart3, Brain, Layers, Sparkles, MapPin, Clock
} from "lucide-react";

const PRODUCTS = [
  { id: "cement-1", name: "UltraTech Cement OPC 43", brand: "UltraTech", price: 370, mrp: 490, discount: 24, rating: 4.7, reviews: 2340, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", category: "Cement" },
  { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, reviews: 1890, img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=400&h=400&fit=crop", badge: "Top Rated", category: "Steel" },
  { id: "paint-1", name: "Asian Paints Apex 20L", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, reviews: 4230, img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop", badge: "Popular", category: "Paint" },
  { id: "tile-1", name: "Kajaria Wall Tiles 2x2ft", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, reviews: 3120, img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400&h=400&fit=crop", badge: "New", category: "Tiles" },
  { id: "electrical-1", name: "Havells LifeLine 2.5sqmm", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, reviews: 534, img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", category: "Electrical" },
  { id: "plumbing-1", name: "Jaquar CP Valve 1/2\"", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, reviews: 876, img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop", badge: "Deal", category: "Plumbing" },
];

const CATEGORIES = [
  { name: "Cement", icon: "🏗️", slug: "cement" },
  { name: "Steel", icon: "🔩", slug: "steel" },
  { name: "Paint", icon: "🎨", slug: "paint" },
  { name: "Tiles", icon: "🔲", slug: "tiles" },
  { name: "Electrical", icon: "⚡", slug: "electrical" },
  { name: "Plumbing", icon: "🔧", slug: "plumbing" },
  { name: "Sand", icon: "🪨", slug: "sand" },
  { name: "Wood", icon: "🪵", slug: "wood" },
];

const LIVE_ORDERS = [
  { name: "Rajesh K.", item: "500 bags UltraTech Cement", city: "Noida", time: "2m ago" },
  { name: "Priya S.", item: "2 tons Tata TMT bars", city: "Gurgaon", time: "5m ago" },
  { name: "Amit P.", item: "200L Asian Paints Apex", city: "Delhi", time: "8m ago" },
];

const HERO_SLIDES = [
  { badge: "MEGA DEAL", title: "Monsoon\nMega Sale", sub: "Up to 25% off on Cement, Steel & building materials", cta: "Shop Now", link: "/products", img1: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop", img2: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=200&h=200&fit=crop", img3: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=200&h=200&fit=crop", brand1: "ULTRATECH", brand2: "TATA", brand3: "ASIAN PAINTS", price1: "₹370", price2: "₹58,500", price3: "₹2,400", disc1: "24% OFF", disc2: "13% OFF", disc3: "23% OFF" },
  { badge: "B2B EXCLUSIVE", title: "Bulk Order\nPricing", sub: "Extra 10% off on orders above 50 units", cta: "Get Quote", link: "/rfq", img1: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=200&h=200&fit=crop", img2: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop", img3: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop", brand1: "STEEL BARS", brand2: "PVC PIPES", brand3: "ELECTRICAL", price1: "₹58,500", price2: "₹450", price3: "₹1,200", disc1: "10% OFF", disc2: "8% OFF", disc3: "12% OFF" },
  { badge: "NEW ARRIVAL", title: "Premium\nTiles", sub: "Explore 500+ designs from top brands", cta: "Explore", link: "/products?category=tiles", img1: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop", img2: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop", img3: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop", brand1: "KAJARIA", brand2: "GRANITE", brand3: "PORCELAIN", price1: "₹42/sqft", price2: "₹120/sqft", price3: "₹85/sqft", disc1: "24% OFF", disc2: "18% OFF", disc3: "15% OFF" },
];

export default function ModitHomePage() {
  const [slide, setSlide] = useState(0);
  const [liveIdx, setLiveIdx] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const t1 = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    const t2 = setInterval(() => setLiveIdx(l => (l + 1) % LIVE_ORDERS.length), 3500);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const s = HERO_SLIDES[slide];
  const products = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Announcement Bar ── */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white text-center py-2 px-4 text-[11px] font-semibold tracking-wide">
        <span className="inline-block mr-1.5">🚀</span>
        MONSOON MEGA SALE — Up to 25% OFF on Cement, Steel & More!
        <span className="mx-2 text-white/20">|</span>
        Use code <span className="bg-white/15 px-2 py-0.5 rounded-full font-bold ml-1">FUTURE25</span>
      </div>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex h-[60px] items-center gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#0F172A] flex items-center justify-center">
              <span className="text-sm font-black text-white">M</span>
            </div>
            <span className="text-lg font-black text-[#0F172A] tracking-tight hidden sm:block">MODIT</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-2">
            {["Products", "Suppliers", "Get Quote", "Orders", "Inventory"].map(item => (
              <Link key={item} href={item === "Get Quote" ? "/rfq" : item === "Products" ? "/products" : "#"}
                className="px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-[var(--brand)] hover:bg-blue-50 rounded-lg transition-all">
                {item}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search cement, steel, tiles, paint..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <Link href="/cart" className="relative p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
            </Link>
            <Link href="/auth" className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)] transition-all shadow-sm shadow-blue-500/20">
              <User className="h-3.5 w-3.5" /> Sign In
            </Link>
          </div>
        </div>

        {/* Category Strip */}
        <div className="border-t border-gray-50 bg-gray-50/60">
          <div className="max-w-[1400px] mx-auto flex items-center overflow-x-auto px-4 sm:px-6 scrollbar-hide py-1">
            {["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Plumbing", "Sand & Aggregate", "Hardware"].map(cat => (
              <Link key={cat} href={`/products?category=${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="shrink-0 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-[var(--brand)] hover:bg-white rounded-md transition-colors">
                {cat}
              </Link>
            ))}
            <Link href="/products" className="shrink-0 px-3 py-1.5 text-[11px] font-bold text-[var(--brand)] hover:bg-white rounded-md transition-colors">View All →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* ── Hero Section ── */}
        <section className="pt-5 pb-3">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#065F46] via-[#047857] to-[#059669] min-h-[360px]">
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

              <div className="relative h-full flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <motion.span key={s.badge} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase w-fit mb-4">
                  <Zap className="h-3 w-3" /> {s.badge}
                </motion.span>

                <motion.h1 key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-white leading-[1.05] tracking-tight whitespace-pre-line mb-3">
                  {s.title}
                </motion.h1>

                <motion.p key={s.sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="text-white/70 text-[15px] mb-6 max-w-md">
                  {s.sub}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link href={s.link} className="btn-accent">
                    {s.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                {/* Floating Cards */}
                <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
                  {[{ img: s.img1, brand: s.brand1, price: s.price1, disc: s.disc1 },
                    { img: s.img2, brand: s.brand2, price: s.price2, disc: s.disc2 },
                    { img: s.img3, brand: s.brand3, price: s.price3, disc: s.disc3 }].map((p, i) => (
                    <motion.div key={`${slide}-${i}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                      className="animate-float w-36 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 hover:bg-white/20 transition-all cursor-pointer"
                      style={{ animationDelay: `${i * 0.6}s`, transform: `translateY(${i % 2 === 0 ? -6 : 6}px)` }}>
                      <div className="h-20 rounded-lg overflow-hidden mb-2 bg-white/10">
                        <img src={p.img} alt={p.brand} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest">{p.brand}</p>
                      <p className="text-[13px] font-black text-white">{p.price}</p>
                      <span className="inline-block mt-1 bg-emerald-400/20 text-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded">{p.disc}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {HERO_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Quick Links */}
              <div className="card-3d p-4 flex-1">
                <h3 className="text-[13px] font-bold text-[var(--text)] mb-3 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[var(--brand)]" /> Quick Links
                </h3>
                <div className="space-y-0.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map(item => (
                    <Link key={item} href="#" className="flex items-center justify-between px-2.5 py-2 text-[12px] font-medium text-gray-500 hover:text-[var(--brand)] hover:bg-blue-50 rounded-lg transition-all group">
                      {item} <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[var(--brand)]" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Download App */}
              <div className="rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[#1D4ED8] p-4 text-white">
                <h3 className="text-[13px] font-bold mb-0.5">Download App</h3>
                <p className="text-[10px] text-white/60 mb-3">Get exclusive app-only deals</p>
                <div className="flex gap-2">
                  <span className="flex-1 rounded-lg bg-white/15 px-2 py-2 text-[10px] font-bold text-center cursor-pointer hover:bg-white/25 transition-all">Google Play</span>
                  <span className="flex-1 rounded-lg bg-white/15 px-2 py-2 text-[10px] font-bold text-center cursor-pointer hover:bg-white/25 transition-all">App Store</span>
                </div>
              </div>

              {/* Live Orders */}
              <div className="card-3d p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live Orders</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={liveIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="text-[12px]">
                    <p className="text-gray-700 font-medium">{LIVE_ORDERS[liveIdx].name} ordered {LIVE_ORDERS[liveIdx].item}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{LIVE_ORDERS[liveIdx].city} — {LIVE_ORDERS[liveIdx].time}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Search ── */}
        <section className="py-4">
          <div className="card-3d p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[var(--text)]">AI Material Search</h2>
                <p className="text-[11px] text-gray-400">Describe what you need — AI finds the best options</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder='e.g. "I need 200 bags of OPC 43 cement for a 3-floor building"'
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              <button className="btn-primary px-5">
                <Sparkles className="h-3.5 w-3.5" /> Search
              </button>
            </div>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {["Cement for house", "TMT bars wholesale", "Best exterior paint", "Plumbing supplies"].map(tag => (
                <span key={tag} className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 hover:text-[var(--brand)] hover:border-blue-200 transition-all cursor-pointer">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--text)]">Shop by Category</h2>
            <Link href="/products" className="text-[12px] font-bold text-[var(--brand)] hover:underline flex items-center gap-0.5">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <Link href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-3.5 hover:border-blue-200 hover:bg-blue-50/50 hover:-translate-y-0.5 transition-all group shadow-sm">
                  <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-600 group-hover:text-[var(--brand)] transition-colors">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Featured Products</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Handpicked deals with the best prices</p>
            </div>
            <div className="flex gap-1.5">
              {[{ label: "All", value: "all" }, { label: "Cement", value: "Cement" }, { label: "Steel", value: "Steel" }, { label: "Paint", value: "Paint" }].map(f => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f.value ? "bg-[var(--brand)] text-white shadow-sm shadow-blue-500/20" : "border border-gray-200 text-gray-400 hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06 }}
                className="card-3d group cursor-pointer">
                <Link href={`/products/${p.id}`}>
                  <div className="relative overflow-hidden rounded-t-xl bg-gray-50 p-3">
                    <img src={p.img} alt={p.name} className="w-full h-36 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute top-2 left-2 badge badge-accent">{p.badge}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-[var(--brand)] uppercase tracking-wider">{p.brand}</p>
                    <h3 className="text-[12px] font-semibold text-[var(--text)] line-clamp-2 leading-snug mt-0.5">{p.name}</h3>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-2.5 w-2.5 ${j < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-[9px] text-gray-400 ml-0.5">({p.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-[15px] font-black text-[var(--text)]">₹{p.price.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 line-through">₹{p.mrp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="badge-discount">{p.discount}% OFF</span>
                      <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5"><Truck className="h-2.5 w-2.5" /> Free</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Products", value: "10,000+", icon: Package, color: "#2563EB" },
              { label: "Verified Suppliers", value: "500+", icon: Shield, color: "#16A34A" },
              { label: "Orders Delivered", value: "2M+", icon: Truck, color: "#F59E0B" },
              { label: "Average Rating", value: "4.8★", icon: Star, color: "#8B5CF6" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="card-3d p-4 text-center">
                <stat.icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                <p className="text-lg font-black text-[var(--text)]">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-5">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--brand)] to-[#1D4ED8] p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-10" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Ready to Transform Your Procurement?</h2>
              <p className="text-[13px] text-white/70 mb-5 max-w-md mx-auto">Join 5,000+ contractors and builders who save an average of 42% on material costs</p>
              <div className="flex gap-3 justify-center">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-[var(--brand)] hover:bg-gray-50 transition-all shadow-lg">
                  <Package className="h-4 w-4" /> Start Ordering
                </Link>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-white/10 transition-all">
                  Get Quote
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0F172A] mt-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[11px] font-black text-[#0F172A]">M</div>
                <span className="text-base font-black text-white">MODIT</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">India&apos;s B2B marketplace for building materials.</p>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel", "Tiles", "Paint", "Electrical"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Press"] },
              { title: "Support", items: ["Help Center", "Contact", "API Docs", "Status"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[11px] font-bold text-white/60 mb-2.5 uppercase tracking-wider">{col.title}</h4>
                <div className="space-y-1.5">
                  {col.items.map(item => (
                    <Link key={item} href="#" className="block text-[11px] text-white/30 hover:text-white/60 transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-6 pt-5 text-center text-[10px] text-white/20">
            2026 MODIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
