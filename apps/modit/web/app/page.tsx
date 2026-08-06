"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, User, ChevronRight, ChevronLeft, Star, Zap, Shield, Truck,
  Clock, TrendingUp, Award, Heart, ArrowRight, Package, FileText, BarChart3,
  MapPin, Bell, ChevronDown, Eye, Flame, Target, Sparkles, Brain, Layers,
  Box, Grid3x3, Percent, CircleDot, TruckIcon, Timer, AlertCircle
} from "lucide-react";

const PRODUCTS = [
  { id: "cement-1", name: "UltraTech Cement OPC 43", brand: "UltraTech", price: 370, mrp: 490, discount: 24, rating: 4.7, reviews: 2340, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", category: "Cement" },
  { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, reviews: 1890, img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=400&h=400&fit=crop", badge: "Top Rated", category: "Steel" },
  { id: "paint-1", name: "Asian Paints Apex 20L", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, reviews: 4230, img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop", badge: "Popular", category: "Paint" },
  { id: "tile-1", name: "Kajaria Wall Tiles 2x2ft", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, reviews: 3120, img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400&h=400&fit=crop", badge: "New", category: "Tiles" },
  { id: "electrical-1", name: "Havells LifeLine 2.5sqmm 90m", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, reviews: 534, img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", category: "Electrical" },
  { id: "plumbing-1", name: "Jaquar CP Valve 1/2\"", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, reviews: 876, img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop", badge: "Deal", category: "Plumbing" },
];

const CATEGORIES = [
  { name: "Cement", icon: "🏗️", slug: "cement", color: "#00F0FF" },
  { name: "Steel", icon: "⚙️", slug: "steel", color: "#A855F7" },
  { name: "Paint", icon: "🎨", slug: "paint", color: "#F472B6" },
  { name: "Tiles", icon: "🧱", slug: "tiles", color: "#34D399" },
  { name: "Electrical", icon: "⚡", slug: "electrical", color: "#FBBF24" },
  { name: "Plumbing", icon: "🔧", slug: "plumbing", color: "#60A5FA" },
  { name: "Sand", icon: "🏖️", slug: "sand", color: "#FB923C" },
  { name: "Wood", icon: "🪵", slug: "wood", color: "#A78BFA" },
];

const FEATURES = [
  { icon: Brain, title: "AI Price Intelligence", desc: "Real-time market prices across 500+ suppliers", color: "var(--cyan)" },
  { icon: Shield, title: "Verified Suppliers", desc: "Every supplier KYC-verified & quality audited", color: "var(--purple)" },
  { icon: Truck, title: "Same-Day Delivery", desc: "Deliver across Delhi NCR within hours", color: "var(--green)" },
  { icon: Zap, title: "Instant RFQ", desc: "Get quotes from 10+ suppliers in minutes", color: "var(--orange)" },
  { icon: BarChart3, title: "Smart Analytics", desc: "Track your procurement spend & savings", color: "var(--magenta)" },
  { icon: Layers, title: "Bulk Ordering", desc: "Best prices for bulk quantities", color: "#60A5FA" },
];

const TESTIMONIALS = [
  { name: "Rajesh Kumar", company: "Kumar Constructions", text: "MODIT saved us 18% on material costs last quarter. The AI price comparison is incredible.", rating: 5, avatar: "R" },
  { name: "Priya Sharma", company: "Sharma Builders", text: "Same-day delivery for urgent projects has been a game changer. Highly recommend!", rating: 5, avatar: "P" },
  { name: "Amit Patel", company: "Patel Infrastructure", text: "The bulk ordering feature with verified suppliers gives us confidence in every purchase.", rating: 5, avatar: "A" },
];

const LIVE_ORDERS = [
  { text: "Rajesh K. ordered 500 bags of UltraTech Cement", time: "2m ago", city: "Noida" },
  { text: "Priya S. ordered 2 tons of Tata TMT bars", time: "5m ago", city: "Gurgaon" },
  { text: "Amit P. ordered 200L Asian Paints Apex", time: "8m ago", city: "Delhi" },
];

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          '--duration': `${6 + Math.random() * 8}s`,
          '--delay': `${Math.random() * 5}s`,
          '--tx': `${(Math.random() - 0.5) * 200}px`,
          '--ty': `${-100 - Math.random() * 200}px`,
          opacity: 0.3 + Math.random() * 0.4,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          background: i % 3 === 0 ? 'var(--cyan)' : i % 3 === 1 ? 'var(--purple)' : 'var(--magenta)',
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

function ProductCard3D({ p, index }: { p: typeof PRODUCTS[0]; index: number }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      className="card-3d group cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateY(${mousePos.x * 8}deg) rotateX(${-mousePos.y * 8}deg)`,
      }}
    >
      <Link href={`/products/${p.id}`}>
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#0A0A20] to-[#0D0D25] p-4">
          <img src={p.img} alt={p.name} className="w-full h-44 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute top-3 left-3">
            <span className="badge-neon">{p.badge}</span>
          </div>
          <div className="absolute top-3 right-3">
            <button className="h-8 w-8 rounded-full glass flex items-center justify-center text-[#6060A0] hover:text-[var(--cyan)] transition-colors">
              <Heart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-[10px] font-bold text-[var(--cyan)] tracking-widest uppercase">{p.brand}</p>
          <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug">{p.name}</h3>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
            ))}
            <span className="text-[10px] text-[var(--text-muted)] ml-1">({p.reviews})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-[var(--cyan)]">₹{p.price.toLocaleString()}</span>
            <span className="text-xs text-[var(--text-muted)] line-through">₹{p.mrp.toLocaleString()}</span>
            <span className="badge-orange text-[9px]">{p.discount}% OFF</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--green)]">
            <Truck className="h-3 w-3" /> Free delivery tomorrow
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ModitHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveOrderIdx, setLiveOrderIdx] = useState(0);
  const [count, setCount] = useState({ orders: 12847, suppliers: 2150, savings: 42, delivery: 98 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(c => (c + 1) % 3), 5000);
    const liveTimer = setInterval(() => setLiveOrderIdx(i => (i + 1) % LIVE_ORDERS.length), 4000);
    return () => { clearInterval(timer); clearInterval(liveTimer); };
  }, []);

  const filteredProducts = activeCategory === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen grid-bg relative">
      <Particles />

      {/* Announcement Bar */}
      <div className="relative z-10 bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] text-[#050510] text-center py-2 px-4 text-[11px] font-black tracking-wider">
        <span className="animate-pulse inline-block mr-2">🚀</span>
        MONSOON MEGA SALE — Up to 25% OFF on Cement, Steel & More!
        <span className="mx-3 text-[#050510]/30">|</span>
        <span>Use code <span className="bg-[#050510]/20 px-2 py-0.5 rounded-full font-black">FUTURE25</span></span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-strong border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)]">
              <span className="text-sm font-black text-[#050510]">M</span>
            </div>
            <span className="text-xl font-black tracking-tight text-glow-cyan font-display">MODIT</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-0.5">
            {["Products", "Suppliers", "Get Quote", "Orders", "Inventory"].map(item => (
              <Link key={item} href={item === "Get Quote" ? "/rfq" : item === "Products" ? "/products" : "#"}
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:bg-[rgba(0,240,255,0.05)] transition-all">
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Search cement, steel, tiles..."
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--cyan)] focus:ring-2 focus:ring-[rgba(0,240,255,0.1)] outline-none transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cart" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-all relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--cyan)] text-[#050510] text-[9px] font-black flex items-center justify-center">3</span>
            </Link>
            <Link href="/auth" className="btn-solid text-xs py-2 px-4">
              <User className="h-3.5 w-3.5" /> Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero Section */}
        <section className="pt-6 pb-4">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            {/* Main Hero Banner */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-2xl border border-[rgba(0,240,255,0.1)]" style={{ minHeight: 380 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#08081A] via-[#0A0A20] to-[#100820]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,240,255,0.08)] via-transparent to-[rgba(168,85,247,0.08)]" />
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[var(--cyan)] blur-[150px] opacity-10" />
              <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-[var(--purple)] blur-[120px] opacity-10" />

              <div className="relative h-full flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="badge-neon w-fit mb-4 text-[10px]">
                  <Zap className="h-3 w-3" /> MEGA DEAL
                </motion.span>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight font-display mb-4">
                  Monsoon<br />Mega Sale
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="text-[var(--text-secondary)] text-lg mb-6 max-w-md">
                  Up to 25% off on Cement, Steel & building materials
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Link href="/products" className="btn-solid inline-flex items-center gap-2">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                {/* Floating Product Cards */}
                <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 gap-3">
                  {PRODUCTS.slice(0, 3).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: 40, rotateY: 20 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.7 }}
                      className="animate-float w-36 rounded-2xl glass border border-[rgba(0,240,255,0.1)] p-3 hover:border-[rgba(0,240,255,0.3)] transition-all cursor-pointer"
                      style={{ animationDelay: `${i * 0.8}s`, transform: `translateY(${i % 2 === 0 ? -10 : 10}px)` }}>
                      <div className="h-24 rounded-xl overflow-hidden mb-2 bg-[var(--bg-subtle)]">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] font-bold text-[var(--cyan)] uppercase tracking-wider">{p.brand}</p>
                      <p className="text-xs font-bold text-white mt-0.5">₹{p.price.toLocaleString()}</p>
                      <span className="badge-orange text-[8px] mt-1">{p.discount}% OFF</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Quick Links */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="card-3d p-4 flex-1">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[var(--cyan)]" /> Quick Links
                </h3>
                <div className="space-y-1">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map((item, i) => (
                    <Link key={item} href="#" className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:bg-[rgba(0,240,255,0.05)] transition-all group">
                      {item} <ChevronRight className="h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--cyan)] transition-colors" />
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Download App */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="rounded-2xl border border-[rgba(168,85,247,0.2)] p-4 bg-gradient-to-br from-[rgba(168,85,247,0.1)] to-[rgba(0,240,255,0.05)]">
                <h3 className="text-sm font-bold text-white mb-1">Download App</h3>
                <p className="text-[10px] text-[var(--text-muted)] mb-3">Get exclusive app-only deals</p>
                <div className="flex gap-2">
                  <span className="flex-1 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[var(--border)] px-3 py-2 text-[10px] font-bold text-center text-[var(--text-secondary)] cursor-pointer hover:border-[var(--cyan)] transition-all">Google Play</span>
                  <span className="flex-1 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[var(--border)] px-3 py-2 text-[10px] font-bold text-center text-[var(--text-secondary)] cursor-pointer hover:border-[var(--purple)] transition-all">App Store</span>
                </div>
              </motion.div>

              {/* Live Order Ticker */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                className="card-3d p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--green)] animate-pulse" />
                  <span className="text-[10px] font-bold text-[var(--green)] tracking-wider uppercase">Live Orders</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p key={liveOrderIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-[var(--text-secondary)]">
                    {LIVE_ORDERS[liveOrderIdx].text}
                    <span className="block text-[10px] text-[var(--text-muted)] mt-1">
                      {LIVE_ORDERS[liveOrderIdx].city} — {LIVE_ORDERS[liveOrderIdx].time}
                    </span>
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        {/* AI Material Search */}
        <section className="py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card-3d p-6 border-glow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] flex items-center justify-center shrink-0">
                <Brain className="h-6 w-6 text-[#050510]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">AI Material Search</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Describe what you need — AI finds the best options</p>
                <div className="flex gap-2">
                  <input type="text" placeholder='e.g. "I need 200 bags of OPC 43 cement for a 3-floor building in Noida"'
                    className="flex-1 h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--cyan)] focus:ring-2 focus:ring-[rgba(0,240,255,0.1)] outline-none transition-all" />
                  <button className="btn-solid px-6 shrink-0">
                    <Sparkles className="h-4 w-4" /> Search
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["Cement for house", "TMT bars wholesale", "Best exterior paint", "Plumbing supplies"].map(tag => (
                    <span key={tag} className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--cyan)] hover:border-[rgba(0,240,255,0.2)] transition-all cursor-pointer">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Categories */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-white font-display">Shop by Category</h2>
            <Link href="/products" className="text-xs font-bold text-[var(--cyan)] hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Link href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[rgba(0,240,255,0.3)] hover:bg-[rgba(0,240,255,0.05)] hover:-translate-y-1 group">
                  <span className="text-2xl mb-2 transition-transform group-hover:scale-110">{cat.icon}</span>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--cyan)] transition-colors">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products with 3D Cards */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white font-display">Featured Products</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">Handpicked deals with the best prices</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveCategory("all")} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${activeCategory === "all" ? "bg-[var(--cyan)] text-[#050510] shadow-[0_0_20px_rgba(0,240,255,0.3)]" : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]"}`}>All</button>
              {["Cement", "Steel", "Paint", "Tiles"].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${activeCategory === cat ? "bg-[var(--cyan)] text-[#050510] shadow-[0_0_20px_rgba(0,240,255,0.3)]" : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]"}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="perspective-container">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, i) => (
                  <ProductCard3D key={p.id} p={p} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: "12,847+", icon: Package, color: "var(--cyan)" },
              { label: "Verified Suppliers", value: "2,150+", icon: Shield, color: "var(--purple)" },
              { label: "Average Savings", value: "42%", icon: TrendingUp, color: "var(--green)" },
              { label: "On-Time Delivery", value: "98.5%", icon: Truck, color: "var(--orange)" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                className="card-3d p-5 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-2xl font-black text-white font-display">{stat.value}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Features */}
        <section className="py-8">
          <div className="text-center mb-8">
            <span className="badge-purple mb-3 inline-flex"><Sparkles className="h-3 w-3" /> AI-POWERED</span>
            <h2 className="text-2xl font-black text-white font-display">Smart Features for Smarter Procurement</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-lg mx-auto">Built-in AI helps you find the best prices, compare products, and optimize orders</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                className="card-3d p-6 group">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `linear-gradient(135deg, ${f.color}20, ${f.color}10)`, border: `1px solid ${f.color}30` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white font-display">Trusted by Builders Across India</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                className="card-3d p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] flex items-center justify-center text-xs font-black text-[#050510]">{t.avatar}</div>
                  <div>
                    <p className="text-xs font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-[rgba(0,240,255,0.15)] p-8 sm:p-12 text-center"
            style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(168,85,247,0.08))" }}>
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[var(--cyan)] blur-[120px] opacity-10" />
            <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-[var(--purple)] blur-[100px] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display mb-3">Ready to Transform Your Procurement?</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">Join 5,000+ contractors and builders who save an average of 42% on material costs with MODIT</p>
              <div className="flex gap-3 justify-center">
                <Link href="/products" className="btn-solid"><Package className="h-4 w-4" /> Start Ordering</Link>
                <Link href="/rfq" className="btn-neon"><FileText className="h-4 w-4" /> <span>Get Quote</span></Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)] mt-8 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)] flex items-center justify-center text-xs font-black text-[#050510]">M</div>
                <span className="text-lg font-black text-glow-cyan font-display">MODIT</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">India&apos;s AI-powered B2B marketplace for building materials</p>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel", "Paint", "Tiles", "Electrical"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Press"] },
              { title: "Support", items: ["Help Center", "Contact", "API Docs", "Status"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-3 tracking-wider uppercase">{col.title}</h4>
                <div className="space-y-2">
                  {col.items.map(item => (
                    <Link key={item} href="#" className="block text-xs text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-[var(--text-muted)]">2024 MODIT. All rights reserved.</p>
            <div className="flex gap-4 text-[10px] text-[var(--text-muted)]">
              <Link href="#" className="hover:text-[var(--cyan)] transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-[var(--cyan)] transition-colors">Terms</Link>
              <Link href="#" className="hover:text-[var(--cyan)] transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
