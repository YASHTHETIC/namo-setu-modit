"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, Truck, Shield, Zap, Clock, TrendingUp, Award, Heart,
  ArrowRight, Package, FileText, BarChart3, MapPin, Brain, Layers,
  ChevronRight, CheckCircle, Globe, Sparkles, Users, Boxes, Target,
  CircleDot, TruckIcon,
} from "lucide-react";

const HERO_SLIDES = [
  {
    badge: "B2B EXCLUSIVE",
    title: "Bulk Order\nPricing",
    subtitle: "Extra 10% off on orders above 50 units",
    cta: "Get Quote",
    ctaLink: "/rfq",
    products: [
      { name: "STEEL BARS", price: "₹58,500", discount: "10% OFF", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=200&h=200&fit=crop" },
      { name: "PVC PIPES", price: "₹450", discount: "8% OFF", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop" },
      { name: "ELECTRICAL WIRE", price: "₹1,200", discount: "12% OFF", img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop" },
    ],
  },
  {
    badge: "MEGA DEAL",
    title: "Monsoon\nMega Sale",
    subtitle: "Up to 25% off on Cement, Steel & building materials",
    cta: "Shop Now",
    ctaLink: "/products",
    products: [
      { name: "ULTRATECH CEMENT", price: "₹370", discount: "25% OFF", img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop" },
      { name: "TATA TISCON TMT", price: "₹58,500", discount: "15% OFF", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=200&h=200&fit=crop" },
      { name: "ASIAN PAINTS", price: "₹2,400", discount: "20% OFF", img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=200&h=200&fit=crop" },
    ],
  },
  {
    badge: "NEW ARRIVAL",
    title: "Premium\nTiles Collection",
    subtitle: "Explore 500+ designs from top brands",
    cta: "Explore",
    ctaLink: "/products?category=tiles",
    products: [
      { name: "KAJARIA TILES", price: "₹42/sqft", discount: "24% OFF", img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop" },
      { name: "GRANITE SLABS", price: "₹120/sqft", discount: "18% OFF", img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop" },
      { name: "PORCELAIN", price: "₹85/sqft", discount: "15% OFF", img: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop" },
    ],
  },
];

const STATS = [
  { label: "Products", value: "10,000+", icon: Boxes },
  { label: "Verified Suppliers", value: "500+", icon: Users },
  { label: "Brands", value: "40+", icon: Award },
  { label: "Orders Delivered", value: "2M+", icon: Truck },
  { label: "Delivery Accuracy", value: "99.2%", icon: Target },
  { label: "Average Rating", value: "4.8★", icon: Star },
];

export default function ModitHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(c => (c + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-[#0F172A] text-white text-center py-2 px-4 text-[11px] font-semibold tracking-wide">
        <span>Delivering across Delhi NCR</span>
        <span className="mx-3 text-white/20">|</span>
        <span>Free delivery on orders above ₹5,000</span>
        <span className="mx-3 text-white/20">|</span>
        <span>Same-day delivery available</span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A]">
              <span className="text-sm font-black text-white">M</span>
            </div>
            <span className="text-xl font-black tracking-tight text-[#0F172A] font-display">MODIT</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {["Products", "Suppliers", "Get Quote", "Orders", "Inventory", "Projects"].map(item => (
              <Link key={item} href={item === "Get Quote" ? "/rfq" : item === "Products" ? "/products" : "#"}
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-[var(--brand)] hover:bg-orange-50 transition-all">
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search cement, steel, tiles, paint..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <MapPin className="h-4 w-4 text-[var(--brand)]" />
              <input type="text" placeholder="Pincode" className="w-16 border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none" maxLength={6} />
              <button className="text-xs font-bold text-[var(--brand)]">Check</button>
            </div>
          </div>

          <Link href="/cart" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:text-[var(--brand)] hover:bg-orange-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            Cart
          </Link>

          <Link href="/auth" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-dark)] transition-all shadow-md shadow-orange-500/20">
            Sign In
          </Link>
        </div>

        {/* Category Nav */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-[1400px] mx-auto flex items-center gap-0 overflow-x-auto px-4 sm:px-6 scrollbar-hide py-1.5">
            {["Cement", "Steel & TMT", "Bricks & Blocks", "Tiles & Ceramics", "Paint", "Electrical", "Plumbing", "Sanitary & Bath"].map(cat => (
              <Link key={cat} href={`/products?category=${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-white hover:text-[var(--brand)] transition-colors">
                {cat}
              </Link>
            ))}
            <Link href="/products" className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-white transition-colors">
              View All →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="pt-5 pb-2">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#065F46] via-[#047857] to-[#059669] text-white" style={{ minHeight: 340 }}>
              <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-[120px] opacity-5" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[var(--brand)] rounded-full blur-[80px] opacity-10" />

              <div className="relative h-full flex items-center p-6 sm:p-8 lg:p-10">
                <div className="flex-1 max-w-lg">
                  <motion.span key={slide.badge} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="inline-block rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-black tracking-wider text-white mb-4">
                    {slide.badge}
                  </motion.span>
                  <motion.h1 key={slide.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight whitespace-pre-line font-display mb-3">
                    {slide.title}
                  </motion.h1>
                  <motion.p key={slide.subtitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="text-white/70 text-base mb-6">
                    {slide.subtitle}
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Link href={slide.ctaLink} className="btn-cta">
                      {slide.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </div>

                {/* Floating Product Cards */}
                <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3">
                  {slide.products.map((p, i) => (
                    <motion.div key={`${currentSlide}-${p.name}`} initial={{ opacity: 0, x: 30, rotateY: 15 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
                      className="w-40 rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 hover:bg-white/15 transition-all cursor-pointer"
                      style={{ transform: `translateY(${i % 2 === 0 ? -8 : 8}px)` }}>
                      <div className="h-24 rounded-xl overflow-hidden mb-2 bg-white/5">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{p.name}</p>
                      <p className="text-xs font-black text-white mt-0.5">{p.price}</p>
                      <span className="badge-green mt-1">{p.discount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {HERO_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30"}`} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Quick Links */}
              <div className="card p-4 flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Quick Links</h3>
                <div className="space-y-0.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map(item => (
                    <Link key={item} href="#" className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:text-[var(--brand)] hover:bg-orange-50 transition-colors group">
                      {item} <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[var(--brand)]" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Download App */}
              <div className="rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[#EA580C] p-4 text-white">
                <h3 className="text-sm font-bold mb-1">Download App</h3>
                <p className="text-xs text-white/70 mb-3">Get exclusive app-only deals</p>
                <div className="flex gap-2">
                  <span className="flex-1 rounded-lg bg-white/20 backdrop-blur px-3 py-2 text-[10px] font-bold text-center cursor-pointer hover:bg-white/30 transition-all">Google Play</span>
                  <span className="flex-1 rounded-lg bg-white/20 backdrop-blur px-3 py-2 text-[10px] font-bold text-center cursor-pointer hover:bg-white/30 transition-all">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Material Search */}
        <section className="py-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">AI Material Search</h2>
                <p className="text-xs text-[var(--text-muted)]">Describe what you need — AI finds the best options</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder='e.g. "I need 200 bags of OPC 43 cement for a 3-floor building in Noida"'
                className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
              <button className="btn-cta px-6">
                <Sparkles className="h-4 w-4" /> Search
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Cement for house", "TMT bars wholesale", "Best exterior paint", "Plumbing supplies"].map(tag => (
                <span key={tag} className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-400 hover:text-[var(--brand)] hover:border-orange-200 transition-all cursor-pointer">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06 }}
                className="card p-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-lg font-black text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#020617] mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-black text-[#0F172A]">M</div>
                <span className="text-lg font-black text-white">MODIT</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">India&apos;s B2B marketplace for building materials.</p>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Contact"] },
              { title: "Support", items: ["Help Center", "Track Order", "Returns", "FAQ"] },
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
