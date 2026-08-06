"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, Truck, Shield, Zap, Clock, TrendingUp, Award, Heart,
  ArrowRight, Package, FileText, BarChart3, MapPin, Brain, Layers,
  Box, ChevronRight, ChevronLeft, CheckCircle, Phone, Globe, Sparkles,
} from "lucide-react";

const PRODUCTS = [
  { id: "cement-1", name: "UltraTech Cement OPC 43 Grade", brand: "UltraTech", price: 370, mrp: 490, discount: 24, rating: 4.7, reviews: 2340, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", category: "Cement", delivery: "Tomorrow" },
  { id: "steel-1", name: "Tata Tiscon TMT Bar 500D 12mm", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, reviews: 1890, img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=400&h=400&fit=crop", badge: "Top Rated", category: "Steel", delivery: "2 Days" },
  { id: "paint-1", name: "Asian Paints Apex Ultima 20L", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, reviews: 4230, img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop", badge: "Popular", category: "Paint", delivery: "Tomorrow" },
  { id: "tile-1", name: "Kajaria Glossy Wall Tiles 2x2ft", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, reviews: 3120, img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400&h=400&fit=crop", badge: "New", category: "Tiles", delivery: "3 Days" },
  { id: "electrical-1", name: "Havells LifeLine Plus 2.5sqmm", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, reviews: 534, img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", category: "Electrical", delivery: "Tomorrow" },
  { id: "plumbing-1", name: "Jaquar CP Valve 1/2 inch", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, reviews: 876, img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop", badge: "Deal", category: "Plumbing", delivery: "2 Days" },
];

const CATEGORIES = [
  { name: "Cement", slug: "cement", count: "50+ Products" },
  { name: "Steel & TMT", slug: "steel", count: "40+ Products" },
  { name: "Paint", slug: "paint", count: "80+ Products" },
  { name: "Tiles", slug: "tiles", count: "100+ Products" },
  { name: "Electrical", slug: "electrical", count: "60+ Products" },
  { name: "Plumbing", slug: "plumbing", count: "45+ Products" },
  { name: "Sand & Aggregate", slug: "sand", count: "20+ Products" },
  { name: "Hardware", slug: "hardware", count: "150+ Products" },
];

const WHY_US = [
  { icon: Brain, title: "AI Price Intelligence", desc: "Compare real-time prices from 2,000+ verified suppliers across India" },
  { icon: Shield, title: "Verified Suppliers", desc: "Every supplier is KYC-verified, quality-audited, and trust-scored" },
  { icon: Truck, title: "Same-Day Delivery", desc: "Get materials delivered to your site within hours in Delhi NCR" },
  { icon: BarChart3, title: "Smart Procurement", desc: "AI-powered recommendations, bulk pricing, and spend analytics" },
  { icon: Layers, title: "Bulk Ordering", desc: "Best wholesale prices for contractors and large-volume buyers" },
  { icon: CheckCircle, title: "Quality Assured", desc: "ISI-marked, certified materials with easy returns" },
];

const TRUST_LOGOS = ["UltraTech", "Tata Tiscon", "JSW Steel", "Asian Paints", "Berger", "Havells", "Finolex", "Kajaria"];

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          width: `${2 + Math.random() * 2}px`,
          height: `${2 + Math.random() * 2}px`,
          opacity: 0.08 + Math.random() * 0.12,
          animation: `float ${5 + Math.random() * 6}s ${Math.random() * 4}s ease-in-out infinite`,
        }} />
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
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      className="card-3d group cursor-pointer"
      style={{
        transform: `perspective(800px) rotateY(${mousePos.x * 5}deg) rotateX(${-mousePos.y * 5}deg)`,
      }}
    >
      <Link href={`/products/${p.id}`}>
        <div className="relative overflow-hidden rounded-t-2xl bg-[var(--bg-subtle)] p-4">
          <img src={p.img} alt={p.name} className="w-full h-40 object-cover rounded-xl transition-transform duration-400 group-hover:scale-105" />
          <div className="absolute top-3 left-3">
            <span className="badge-discount">{p.discount}% OFF</span>
          </div>
          <button className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-all">
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-4 space-y-1.5">
          <p className="text-[10px] font-semibold text-[var(--brand)] uppercase tracking-wide">{p.brand}</p>
          <h3 className="text-sm font-semibold text-[var(--text-heading)] line-clamp-2 leading-snug">{p.name}</h3>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-[var(--success-light)] px-1.5 py-0.5 rounded">
              <span className="text-[10px] font-bold text-[var(--success)]">{p.rating}</span>
              <Star className="h-2.5 w-2.5 fill-[var(--success)] text-[var(--success)]" />
            </div>
            <span className="text-[9px] text-[var(--text-muted)]">({p.reviews.toLocaleString()})</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[var(--text-heading)]">₹{p.price.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--text-muted)] line-through">₹{p.mrp.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-[var(--brand)]" />
            <span className="text-[10px] font-medium text-[var(--brand)]">{p.delivery}</span>
            <span className="text-[10px] text-[var(--success)] font-medium ml-auto">FREE</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ModitHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(c => (c + 1) % 3), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white grid-bg relative">
      <Particles />

      {/* Announcement Bar */}
      <div className="relative z-10 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white text-center py-2 px-4 text-xs font-semibold tracking-wide">
        <span>Monsoon Mega Sale — Up to 25% OFF on Cement, Steel & Building Materials</span>
        <span className="mx-3 text-white/30">|</span>
        <span className="font-bold">Free delivery on orders above ₹5,000</span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-strong border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] shadow-sm">
              <span className="text-sm font-black text-white">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-[var(--text-heading)] tracking-tight">MODIT</span>
              <span className="ml-1.5 text-[10px] text-[var(--brand)] font-semibold uppercase tracking-wider hidden lg:inline">Building Materials</span>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl mx-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cement, steel, tiles, paint..."
                className="h-10 w-full rounded-lg border border-[var(--border-input)] bg-white pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-100)] outline-none transition-all" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-50)] transition-colors">
              <MapPin className="h-4 w-4 text-[var(--brand)]" />
              <div className="text-left">
                <p className="text-[9px] text-[var(--text-muted)] leading-tight">Deliver to</p>
                <p className="text-[11px] font-semibold text-[var(--text-heading)] leading-tight">New Delhi 110001</p>
              </div>
            </button>
          </div>

          <Link href="/cart" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-50)] transition-colors relative">
            <Package className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--brand)] text-white text-[9px] font-bold flex items-center justify-center">3</span>
          </Link>

          <Link href="/auth" className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-dark)] transition-colors shadow-sm">
            Sign In
          </Link>
        </div>

        {/* Category Nav */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="max-w-[1400px] mx-auto flex items-center gap-0 overflow-x-auto px-4 sm:px-6 scrollbar-hide">
            {CATEGORIES.slice(0, 8).map(cat => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                className="shrink-0 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-white transition-colors rounded-lg">
                {cat.name}
              </Link>
            ))}
            <Link href="/products" className="shrink-0 px-3.5 py-2 text-xs font-semibold text-[var(--brand)] hover:bg-white transition-colors rounded-lg">
              View All →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero Section */}
        <section className="pt-6 pb-2">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            {/* Main Banner */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-[var(--border)]" style={{ minHeight: 340 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand)] rounded-full blur-[200px] opacity-10" />
              <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[var(--accent-sky)] rounded-full blur-[150px] opacity-8" />

              <div className="relative h-full flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)]/20 border border-[var(--brand)]/30 px-3 py-1 text-[10px] font-bold text-[var(--accent-sky)] uppercase tracking-wider w-fit mb-4">
                  <Zap className="h-3 w-3" /> Monsoon Mega Sale
                </motion.span>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-white leading-[1.08] tracking-tight mb-3">
                  Building Materials,<br />Delivered Fast
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-white/50 text-base mb-6 max-w-md leading-relaxed">
                  Compare prices from 2,000+ verified suppliers. AI-powered procurement for contractors and builders.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex gap-3">
                  <Link href="/products" className="btn-primary px-6 py-3 text-sm">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/rfq" className="px-6 py-3 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                    <FileText className="h-4 w-4 inline mr-1.5" />Get a Quote
                  </Link>
                </motion.div>

                {/* Floating Product Cards */}
                <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3">
                  {PRODUCTS.slice(0, 3).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.12 }}
                      className="animate-float w-44 rounded-xl bg-white/10 backdrop-blur border border-white/10 p-3 hover:bg-white/15 transition-all cursor-pointer"
                      style={{ animationDelay: `${i * 0.6}s`, transform: `translateY(${i % 2 === 0 ? -6 : 6}px)` }}>
                      <div className="h-20 rounded-lg overflow-hidden mb-2 bg-white/5">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] font-semibold text-[var(--accent-sky)] uppercase tracking-wide">{p.brand}</p>
                      <p className="text-xs font-bold text-white mt-0.5">₹{p.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-[var(--success)]">{p.discount}% OFF</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="card-3d p-4 flex-1">
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-3">Quick Links</h3>
                <div className="space-y-0.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map(item => (
                    <Link key={item} href="#" className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand)] transition-colors group">
                      {item} <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--brand)]" />
                    </Link>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-[var(--brand)]" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Need Help?</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Talk to our procurement expert</p>
                <button className="w-full rounded-lg bg-[var(--brand)] text-white py-2 text-xs font-semibold hover:bg-[var(--brand-dark)] transition-colors shadow-sm">
                  Call 1800-123-4567
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                className="card-3d p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-[var(--brand)]" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Download App</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Get app-only deals & faster checkout</p>
                <div className="flex gap-2">
                  <span className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-center text-[var(--text-secondary)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">Google Play</span>
                  <span className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-center text-[var(--text-secondary)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">App Store</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* AI Search */}
        <section className="py-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card-3d p-5 border-glow">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--brand-50)] flex items-center justify-center">
                <Brain className="h-4 w-4 text-[var(--brand)]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-heading)]">AI Material Search</h2>
                <p className="text-xs text-[var(--text-muted)]">Describe what you need — AI finds the best options</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder='e.g. "I need 200 bags of OPC 43 cement for a 3-floor building in Noida"'
                className="flex-1 h-11 rounded-lg border border-[var(--border-input)] bg-white px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-100)] outline-none transition-all" />
              <button className="btn-primary px-5">
                <Sparkles className="h-4 w-4" /> Search
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Cement for house", "TMT bars wholesale", "Best exterior paint", "Plumbing supplies"].map(tag => (
                <span key={tag} className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand-200)] transition-all cursor-pointer">{tag}</span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Categories */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Shop by Category</h2>
            <Link href="/products" className="text-xs font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <Link href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-white p-4 transition-all hover:border-[var(--brand-200)] hover:shadow-md hover:-translate-y-0.5 group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center mb-2 group-hover:bg-[var(--brand-50)] transition-colors">
                    <Package className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--brand)]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--brand)] transition-colors">{cat.name}</span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{cat.count}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products — 3D Cards */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">Featured Products</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Handpicked deals with the best prices</p>
            </div>
            <Link href="/products" className="text-xs font-semibold text-[var(--brand)] hover:underline">View All →</Link>
          </div>
          <div className="perspective-container">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {PRODUCTS.map((p, i) => (
                <ProductCard3D key={p.id} p={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose MODIT */}
        <section className="py-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Why 5,000+ Builders Choose MODIT</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-lg mx-auto">India&apos;s most trusted platform for construction material procurement</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_US.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="card-3d p-6 group">
                <div className="h-10 w-10 rounded-xl bg-[var(--brand-50)] flex items-center justify-center mb-3 group-hover:bg-[var(--brand-100)] transition-colors">
                  <f.icon className="h-5 w-5 text-[var(--brand)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: "12,847+", icon: Package },
              { label: "Verified Suppliers", value: "2,150+", icon: Shield },
              { label: "Average Savings", value: "42%", icon: TrendingUp },
              { label: "On-Time Delivery", value: "98.5%", icon: Clock },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="card-3d p-5 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-[var(--brand)]" />
                <p className="text-xl font-bold text-[var(--text-heading)]">{stat.value}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Brand Logos */}
        <section className="py-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Trusted by Leading Brands</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUST_LOGOS.map(brand => (
              <div key={brand} className="px-6 py-3 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--brand-200)] hover:shadow-sm transition-all cursor-pointer">
                <span className="text-sm font-bold text-[var(--text-muted)] tracking-wide">{brand}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-10">
          <div className="rounded-2xl bg-[#0F172A] p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)] rounded-full blur-[180px] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Transform Your Procurement?</h2>
              <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">Join 5,000+ contractors who save an average of 42% on building materials with MODIT</p>
              <div className="flex gap-3 justify-center">
                <Link href="/products" className="btn-primary px-6 py-3"><Package className="h-4 w-4" /> Start Ordering</Link>
                <Link href="/rfq" className="px-6 py-3 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors"><FileText className="h-4 w-4 inline mr-1.5" />Get a Quote</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-darker)] border-t border-white/5 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--brand)] flex items-center justify-center text-xs font-black text-white">M</div>
                <span className="text-lg font-bold text-white">MODIT</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">India&apos;s AI-powered B2B marketplace for building materials.</p>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel & TMT", "Paint", "Tiles", "Electrical", "Plumbing"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Press", "Partners"] },
              { title: "Support", items: ["Help Center", "Contact Us", "API Docs", "Status"] },
              { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">{col.title}</h4>
                <div className="space-y-2">
                  {col.items.map(item => (
                    <Link key={item} href="#" className="block text-xs text-white/40 hover:text-white/70 transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-8 pt-6 text-center text-[10px] text-white/30">
            2026 MODIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
