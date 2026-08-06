"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, MapPin, Search, Star, ChevronRight, ChevronLeft,
  Package, Users, Zap, Headphones, Box, FileText, ShoppingCart,
  LayoutDashboard, Menu, X, Flame, TrendingUp, Brain, Upload,
  MessageSquare, Mic, GitCompareArrows, Sparkles, Heart,
  BadgeCheck, Truck, RotateCcw, CreditCard, Clock, Eye,
  BarChart3, Award, Timer, CheckCircle2, Phone, Calculator,
  CircleDollarSign, TrendingDown, Store,
} from "lucide-react";
import { categories, products, type Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";

/* ───────── DATA ───────── */
const navItems = [
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/rfq", label: "Get Quote" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/projects", label: "Projects" },
];

function getDeals(): Product[] {
  return ["cement-1", "steel-1", "paint-1", "electrical-1", "sanitary-1", "electrical-2"]
    .map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getTopSelling(): Product[] {
  return ["cement-2", "steel-2", "tiles-1", "paint-2", "plumbing-1", "bricks-1"]
    .map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getNewArrivals(): Product[] {
  return ["electrical-3", "sanitary-2", "sand-1", "plywood-1", "hardware-1", "pipes-1"]
    .map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getBestInCategory(slug: string): Product[] {
  return products.filter((p) => p.categorySlug === slug).slice(0, 6);
}

const categoryImages: Record<string, string> = {
  cement: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop",
  "steel-tmt": "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=200&h=200&fit=crop",
  "bricks-blocks": "https://images.unsplash.com/photo-1634126534022-108a831684d7?w=200&h=200&fit=crop",
  "tiles-ceramics": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop",
  paint: "https://images.unsplash.com/photo-1585676737728-432f58d5fdba?w=200&h=200&fit=crop",
  electrical: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  plumbing: "https://images.unsplash.com/photo-1634126534022-108a831684d7?w=200&h=200&fit=crop",
  sanitary: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop",
  "sand-aggregate": "https://images.unsplash.com/photo-1634126534022-108a831684d7?w=200&h=200&fit=crop",
  "pipes-fittings": "https://images.unsplash.com/photo-1634126534022-108a831684d7?w=200&h=200&fit=crop",
  "plywood-boards": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  hardware: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
};

const offerCards = [
  { title: "First Order?", discount: "10% OFF", code: "FIRST10", desc: "Use code at checkout", bg: "linear-gradient(135deg, #F97316 0%, #DC2626 100%)" },
  { title: "Bulk Buyer?", discount: "Extra 5%", code: "BULK5", desc: "On orders above 1 lakh", bg: "linear-gradient(135deg, #059669 0%, #0891B2 100%)" },
  { title: "New Supplier?", discount: "0% Commission", code: "", desc: "For first 3 months", bg: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)" },
];

const brands = ["UltraTech", "Tata Tiscon", "Asian Paints", "Havells", "Cera", "Hindware", "Polycab", "Finolex", "Greenply", "Pidilite", "Sintex", "Anchor"];

const trustSignals = [
  { value: "10,000+", label: "Products", icon: Package },
  { value: "500+", label: "Verified Suppliers", icon: BadgeCheck },
  { value: "40+", label: "Brands", icon: Award },
  { value: "2M+", label: "Orders Delivered", icon: Truck },
  { value: "99.2%", label: "Delivery Success", icon: CheckCircle2 },
  { value: "4.8★", label: "Average Rating", icon: Star },
];

const liveOrders = [
  { buyer: "Rajesh Builders", item: "UltraTech Cement OPC 43", qty: "200 bags", time: "2 min ago", location: "Noida" },
  { buyer: "Priya Interiors", item: "Tata Tiscon TMT 12mm", qty: "5 tons", time: "5 min ago", location: "Gurgaon" },
  { buyer: "Amit Constructions", item: "Asian Paints Apex Ultima", qty: "50 buckets", time: "8 min ago", location: "Delhi" },
  { buyer: "Vikram Infra", item: "Havells 2.5mm Wire", qty: "100 coils", time: "12 min ago", location: "Faridabad" },
  { buyer: "Suresh Enterprises", item: "Cera Sanitary Ware", qty: "30 units", time: "15 min ago", location: "Ghaziabad" },
];

const marketPrices = [
  { item: "TMT Steel 12mm", price: "58,500", unit: "/ton", change: "+1.2%", up: true, color: "#059669" },
  { item: "OPC Cement 43", price: "385", unit: "/bag", change: "-0.5%", up: false, color: "#DC2626" },
  { item: "River Sand", price: "72", unit: "/cu ft", change: "+2.1%", up: true, color: "#059669" },
  { item: "Red Bricks", price: "8.5", unit: "/piece", change: "0.0%", up: false, color: "#94A3B8" },
];

const aiFeatures = [
  { icon: Brain, title: "Material Advisor", desc: "AI recommends materials", color: "#7C3AED" },
  { icon: Upload, title: "BOQ Reader", desc: "Upload & auto-extract", color: "#2563EB" },
  { icon: GitCompareArrows, title: "Price Compare", desc: "200+ suppliers", color: "#059669" },
  { icon: MessageSquare, title: "AI Negotiation", desc: "Best bulk prices", color: "#F97316" },
  { icon: Mic, title: "Voice Order", desc: "Hindi & English", color: "#DC2626" },
  { icon: Calculator, title: "Cost Estimator", desc: "Instant AI quotes", color: "#0891B2" },
];

/* ───────── COMPONENTS ───────── */

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 32, s: 18 });
  useEffect(() => {
    const i = setInterval(() => {
      setTime((p) => {
        let { h, m, s } = p;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#DC2626] text-xs font-black text-white shadow-md">{v}</span>
          {i < 2 && <span className="text-xs font-bold text-[#DC2626]">:</span>}
        </div>
      ))}
    </div>
  );
}

function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((c) => (c + 1) % 3), []);
  useEffect(() => { const t = setInterval(next, 4500); return () => clearInterval(t); }, [next]);

  const slides = [
    {
      title: "Monsoon\nMega Sale",
      sub: "Up to 25% off on Cement, Steel & building materials",
      cta: "Shop Now", href: "/products?category=cement",
      tag: "MEGA DEAL", accent: "#F97316",
      bg: "linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #334155 100%)",
      products: [
        { name: "UltraTech Cement", price: "370", img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=120&h=120&fit=crop", discount: "25%" },
        { name: "Tata Tiscon TMT", price: "58,500", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=120&h=120&fit=crop", discount: "15%" },
        { name: "Asian Paints", price: "2,400", img: "https://images.unsplash.com/photo-1585676737728-432f58d5fdba?w=120&h=120&fit=crop", discount: "20%" },
      ]
    },
    {
      title: "Bulk Order\nPricing",
      sub: "Extra 10% off on orders above 50 units",
      cta: "Get Quote", href: "/rfq",
      tag: "B2B EXCLUSIVE", accent: "#059669",
      bg: "linear-gradient(135deg, #0F172A 0%, #064E3B 50%, #047857 100%)",
      products: [
        { name: "Steel Bars", price: "58,500", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=120&h=120&fit=crop", discount: "10%" },
        { name: "PVC Pipes", price: "450", img: "https://images.unsplash.com/photo-1634126534022-108a831684d7?w=120&h=120&fit=crop", discount: "8%" },
        { name: "Electrical Wire", price: "1,200", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=120&h=120&fit=crop", discount: "12%" },
      ]
    },
    {
      title: "AI\nProcurement",
      sub: "Let AI find the best prices across 200+ suppliers",
      cta: "Try AI Free", href: "/products",
      tag: "AI POWERED", accent: "#7C3AED",
      bg: "linear-gradient(135deg, #0F172A 0%, #312E81 50%, #4C1D95 100%)",
      products: [
        { name: "AI Price Match", price: "Best", img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=120&h=120&fit=crop", discount: "AI" },
        { name: "Smart BOQ", price: "Free", img: "https://images.unsplash.com/photo-1585676737728-432f58d5fdba?w=120&h=120&fit=crop", discount: "NEW" },
        { name: "Voice Order", price: "Live", img: "https://images.unsplash.com/photo-1763771420551-18bc44399f0c?w=120&h=120&fit=crop", discount: "BETA" },
      ]
    },
  ];

  const s = slides[current];

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 340 }}>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: s.bg }} />
          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[120px] opacity-25" style={{ background: s.accent }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-[80px] opacity-15" style={{ background: s.accent }} />

          <div className="relative h-full flex items-center p-6 sm:p-8 lg:p-10">
            {/* Left text */}
            <div className="flex-1 max-w-lg">
              <span className="inline-block rounded-full px-3 py-1 text-[10px] font-black tracking-widest text-white mb-4" style={{ background: s.accent }}>{s.tag}</span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight whitespace-pre-line font-display">{s.title}</h1>
              <p className="mt-4 text-sm sm:text-base text-white/50 max-w-md leading-relaxed">{s.sub}</p>
              <Link href={s.href} className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-xl" style={{ background: s.accent }}>
                {s.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right floating product cards */}
            <div className="hidden lg:flex items-center gap-3 ml-8">
              {s.products.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="w-36 rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 hover:bg-white/15 transition-all cursor-pointer" style={{ transform: `translateY(${i % 2 === 0 ? -10 : 10}px)` }}>
                  <div className="h-20 rounded-xl overflow-hidden bg-white/5 mb-2">
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{p.name}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-black text-white">{p.price === "Best" || p.price === "Free" || p.price === "Live" ? p.price : `\u20b9${p.price}`}</span>
                  </div>
                  <span className="inline-block mt-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-black text-white" style={{ background: s.accent }}>{p.discount} OFF</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-white shadow-lg" : "w-2 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  return (
    <Link href={`/products/${p.id}`} className="group min-w-[185px] max-w-[185px] flex-shrink-0 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100">
      <div className="relative h-36 overflow-hidden bg-white">
        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-gray-200" /></div>}
        {p.discount > 0 && <span className="absolute top-2 left-2 rounded-lg bg-[#DC2626] px-2 py-0.5 text-[9px] font-black text-white shadow-md">{p.discount}% OFF</span>}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Heart className="h-3 w-3" /></button>
        {p.freeDelivery && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-[#059669] px-1.5 py-0.5 text-[8px] font-bold text-white flex items-center gap-0.5"><Truck className="h-2 w-2" />Free</span>}
      </div>
      <div className="p-3">
        <p className="text-[9px] font-black uppercase tracking-wider text-[#F97316]">{p.brand}</p>
        <h3 className="mt-0.5 text-[11px] font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[28px]">{p.name}</h3>
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded bg-[#D1FAE5] px-1 py-0.5">
            <Star className="h-2 w-2 fill-[#059669] text-[#059669]" />
            <span className="text-[9px] font-black text-[#059669]">{p.rating}</span>
          </div>
          <span className="text-[8px] text-gray-400">({p.reviewCount})</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-sm font-black text-gray-900">{"\u20b9"}{p.price.toLocaleString()}</span>
          {p.mrp > p.price && <span className="text-[9px] text-gray-400 line-through">{"\u20b9"}{p.mrp.toLocaleString()}</span>}
        </div>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(p); }} className="mt-2 w-full rounded-xl bg-[#0F172A] py-1.5 text-[10px] font-black text-white hover:bg-[#1E293B] transition-all active:scale-95">ADD TO CART</button>
      </div>
    </Link>
  );
}

function ProductRow({ title, subtitle, items }: { title: string; subtitle?: string; items: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: "l" | "r") => ref.current?.scrollBy({ left: d === "l" ? -320 : 320, behavior: "smooth" });
  return (
    <section className="py-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => scroll("l")} className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-all"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button onClick={() => scroll("r")} className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-all"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

/* ───────── MAIN PAGE ───────── */
export default function Page() {
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("cement");
  const [aiQuery, setAiQuery] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const deals = getDeals();
  const topSelling = getTopSelling();
  const newArrivals = getNewArrivals();
  const catProducts = getBestInCategory(activeCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Announcement Bar ── */}
      <div className="bg-[#0F172A] text-white text-center py-2 px-4 text-[11px] font-semibold tracking-wide">
        <span className="hidden sm:inline">Delivering across Delhi NCR</span>
        <span className="mx-3 hidden sm:inline text-white/20">|</span>
        <span>Free delivery on orders above {"\u20b9"}5,000</span>
        <span className="mx-3 text-white/20">|</span>
        <span>Same-day delivery available</span>
      </div>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F172A]"><span className="text-sm font-black text-white">M</span></div>
            <span className="text-xl font-black tracking-tight text-[#0F172A] font-display">MODIT</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-[#F97316] hover:bg-orange-50 transition-all">{item.label}</Link>
            ))}
          </nav>
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search cement, steel, tiles, paint..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim()) window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`; }} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F97316] focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <MapPin className="h-4 w-4 text-[#F97316]" />
              <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => { setPincode(e.target.value); setDeliveryMsg(""); }} className="w-16 border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none" maxLength={6} />
              <button onClick={() => { if (pincode.length === 6) setDeliveryMsg(`Delivery available to ${pincode}!`); }} className="text-xs font-bold text-[#F97316]">Check</button>
            </div>
          </div>
          <Link href="/cart" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:text-[#F97316] hover:bg-orange-50 transition-all"><ShoppingCart className="h-5 w-5" />Cart</Link>
          <Link href="/auth" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#EA580C] transition-all shadow-md shadow-orange-500/20">Sign In</Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 lg:hidden hover:border-[#F97316] hover:text-[#F97316]">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {deliveryMsg && <div className="bg-[#059669] text-white text-center py-1.5 text-xs font-bold">{deliveryMsg}</div>}
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25 }} className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-black font-display text-gray-900">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><X className="h-4 w-4" /></button>
                </div>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-[#F97316] transition-all">{item.label}<ChevronRight className="h-4 w-4 text-gray-300" /></Link>
                ))}
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <Link href="/auth" onClick={() => setMobileOpen(false)} className="block w-full rounded-xl bg-[#F97316] py-3 text-center text-sm font-bold text-white shadow-md shadow-orange-500/20">Sign In</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* ── Hero ── */}
        <section className="pt-5 pb-2">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <HeroBanner />
            {/* Sidebar */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="rounded-2xl bg-white border border-gray-100 p-4 flex-1 shadow-sm">
                <h3 className="text-xs font-black text-gray-900 font-display mb-2">Quick Links</h3>
                <div className="space-y-0.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order", "AI Assistant"].map((link) => (
                    <Link key={link} href="/products" className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] font-semibold text-gray-500 hover:bg-orange-50 hover:text-[#F97316] transition-all group">
                      {link} <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#F97316] transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%)" }}>
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-[30px]" />
                <div className="relative">
                  <h3 className="text-sm font-black font-display mb-0.5">Download App</h3>
                  <p className="text-[11px] text-white/70 mb-2">Get exclusive app-only deals</p>
                  <div className="flex gap-2">
                    <div className="rounded-lg bg-white/20 backdrop-blur px-2.5 py-1.5 text-[10px] font-bold hover:bg-white/30 cursor-pointer transition-all">Google Play</div>
                    <div className="rounded-lg bg-white/20 backdrop-blur px-2.5 py-1.5 text-[10px] font-bold hover:bg-white/30 cursor-pointer transition-all">App Store</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Search ── */}
        <section className="py-3">
          <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED]/10"><Sparkles className="h-4 w-4 text-[#7C3AED]" /></div>
              <div>
                <h3 className="text-sm font-black text-gray-900 font-display">AI Material Search</h3>
                <p className="text-[11px] text-gray-400">Describe what you need — AI finds the best options</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder='e.g. "I need 200 bags of OPC 43 cement for a 3-floor building in Noida"' value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
              <button className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-purple-500/20" style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}><div className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Search</div></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Cement for house", "TMT bars wholesale", "Best exterior paint", "Plumbing supplies"].map((q) => (
                <button key={q} onClick={() => setAiQuery(q)} className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-500 hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-purple-50 transition-all">{q}</button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Signals ── */}
        <section className="py-3">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {trustSignals.map((t, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 p-3 text-center shadow-sm hover:shadow-md transition-all cursor-default">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50"><t.icon className="h-4 w-4 text-gray-700" /></div>
                <div className="text-sm sm:text-base font-black text-gray-900 font-display">{t.value}</div>
                <div className="text-[9px] font-semibold text-gray-400">{t.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Offer Cards ── */}
        <section className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {offerCards.map((o, i) => (
              <div key={i} className="rounded-2xl p-4 text-white relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all" style={{ background: o.bg }}>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-[25px]" />
                <div className="relative">
                  <div className="text-[11px] font-bold text-white/70">{o.title}</div>
                  <div className="text-xl font-black mt-0.5 font-display">{o.discount}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{o.desc}</div>
                  {o.code && <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur px-2 py-1 text-[10px] font-black">{o.code}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">Shop by Category</h2>
            <Link href="/products" className="text-sm font-bold text-[#F97316] hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {categories.map((cat, i) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="flex flex-col items-center rounded-2xl bg-white border border-gray-100 p-3 transition-all hover:shadow-lg hover:-translate-y-0.5 group shadow-sm">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-50">
                  {categoryImages[cat.slug] ? <img src={categoryImages[cat.slug]} alt={cat.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>}
                </div>
                <span className="mt-2 text-[10px] font-bold text-gray-900 text-center leading-tight">{cat.name}</span>
                <span className="text-[8px] text-gray-400">{cat.productCount} items</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Flash Sale ── */}
        <section className="py-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-[#F97316]" /><h2 className="text-xl font-black text-white font-display">Flash Sale</h2></div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#DC2626]/15 px-3 py-1.5"><Timer className="h-3.5 w-3.5 text-[#EF4444]" /><CountdownTimer /></div>
                </div>
                <Link href="/products" className="text-sm font-bold text-[#F97316] hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {deals.map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                    <div className="relative h-28 overflow-hidden bg-white/5">
                      {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="flex h-full items-center justify-center"><Package className="h-7 w-7 text-white/20" /></div>}
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-[#DC2626] px-1.5 py-0.5 text-[8px] font-black text-white">{p.discount}% OFF</span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-wider text-[#F97316]">{p.brand}</p>
                      <h3 className="mt-0.5 text-[10px] font-semibold text-white line-clamp-2 leading-tight min-h-[26px]">{p.name}</h3>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-xs font-black text-white">{"\u20b9"}{p.price.toLocaleString()}</span>
                        {p.mrp > p.price && <span className="text-[8px] text-white/30 line-through">{"\u20b9"}{p.mrp.toLocaleString()}</span>}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(p); }} className="mt-2 w-full rounded-lg bg-[#F97316] py-1.5 text-[9px] font-black text-white hover:bg-[#EA580C] transition-all active:scale-95">ADD TO CART</button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Trending ── */}
        <ProductRow title="Trending Now" subtitle="Most searched products this week" items={topSelling} />

        {/* ── Category Tabs ── */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">Best in Category</h2>
            <Link href={`/products?category=${activeCategory}`} className="text-sm font-bold text-[#F97316] hover:underline">View All</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
            {["cement", "steel-tmt", "paint", "electrical", "plumbing", "sanitary", "tiles-ceramics", "bricks-blocks"].map((slug) => {
              const cat = categories.find((c) => c.slug === slug);
              return (
                <button key={slug} onClick={() => setActiveCategory(slug)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${activeCategory === slug ? "bg-[#0F172A] text-white shadow-md" : "bg-white border border-gray-200 text-gray-500 hover:border-[#F97316] hover:text-[#F97316]"}`}>
                  {cat?.name || slug}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {catProducts.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>

        {/* ── Brands ── */}
        <section className="py-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight mb-4">Top Brands</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {brands.map((b, i) => (
              <Link key={b} href={`/products?search=${b}`} className="flex h-14 items-center justify-center rounded-xl bg-white border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-0.5 group shadow-sm">
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#F97316] transition-colors">{b}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── New Arrivals ── */}
        <ProductRow title="New Arrivals" subtitle="Latest products added this week" items={newArrivals} />

        {/* ── Live Orders ── */}
        <section className="py-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#059669] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#059669]" /></div>
              <h2 className="text-xl font-black text-gray-900 font-display">Live Orders</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#059669]/10 px-2 py-0.5 text-[9px] font-black text-[#059669]">LIVE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {liveOrders.map((o, i) => (
                <div key={i} className="rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-200"><Store className="h-3.5 w-3.5 text-gray-500" /></div>
                    <div className="text-[10px] font-bold text-gray-900 truncate">{o.buyer}</div>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{o.item}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] font-bold text-gray-700">{o.qty}</span>
                    <span className="text-[8px] text-gray-400">{o.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Features ── */}
        <section className="py-4">
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)" }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-purple-500/15 blur-[50px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20"><Brain className="h-5 w-5 text-purple-300" /></div>
                <div><h2 className="text-xl font-black text-white font-display">AI-Powered Platform</h2><p className="text-[11px] text-purple-300/50">Intelligent procurement for construction</p></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {aiFeatures.map((f, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3.5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-2.5 transition-all group-hover:scale-110" style={{ background: `${f.color}20` }}><f.icon className="h-4.5 w-4.5" style={{ color: f.color }} /></div>
                    <div className="text-[11px] font-bold text-white">{f.title}</div>
                    <div className="text-[9px] text-purple-300/50 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Market Prices ── */}
        <section className="py-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-black text-gray-900 font-display">Today&apos;s Prices</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A]/10 px-2 py-0.5 text-[9px] font-black text-[#0F172A]">LIVE</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {marketPrices.map((p, i) => (
                <div key={i} className="rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                  <div className="text-[11px] font-bold text-gray-500">{p.item}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black text-gray-900 font-display">{"\u20b9"}{p.price}</span>
                    <span className="text-[10px] text-gray-400">{p.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1" style={{ color: p.color }}>
                    {p.up ? <TrendingUp className="h-3 w-3" /> : p.change === "0.0%" ? null : <TrendingDown className="h-3 w-3" />}
                    <span className="text-[10px] font-bold">{p.change === "0.0%" ? "Stable" : p.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-4">
          <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#F97316]/5 blur-[80px]" />
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { value: "5000+", label: "Products" },
                { value: "200+", label: "Suppliers" },
                { value: "10K+", label: "Customers" },
                { value: "24-48h", label: "Delivery" },
              ].map((s, i) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white font-display">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Choose ── */}
        <section className="py-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight mb-4 text-center">Why Choose MODIT</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Truck, title: "Same-Day Delivery", desc: "Order before 2 PM, get it by evening", color: "#059669" },
              { icon: CreditCard, title: "Net 30/60 Credit", desc: "Buy now, pay later with flexible terms", color: "#2563EB" },
              { icon: Shield, title: "Verified Suppliers", desc: "Every supplier vetted for quality", color: "#7C3AED" },
              { icon: Brain, title: "AI Price Match", desc: "Our AI ensures the best price always", color: "#F97316" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 text-center hover:shadow-lg transition-all group shadow-sm">
                <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition-all group-hover:scale-110" style={{ background: `${f.color}10` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-xs font-black text-gray-900 font-display">{f.title}</h3>
                <p className="mt-1 text-[10px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight mb-4">What Customers Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "Rajesh Kumar", role: "Builder, Noida", text: "Saved 12% on my last project with AI price comparison.", rating: 5, avatar: "R" },
              { name: "Priya Sharma", role: "Interior Designer", text: "BOQ reader got me a complete material list in 30 seconds.", rating: 5, avatar: "P" },
              { name: "Amit Patel", role: "Contractor, Gurgaon", text: "Same-day delivery and credit facility. Best B2B platform.", rating: 5, avatar: "A" },
              { name: "Vikram Singh", role: "Project Manager", text: "Voice ordering from site is brilliant for supervisors.", rating: 5, avatar: "V" },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-lg transition-all shadow-sm">
                <div className="flex items-center gap-0.5 mb-2">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3 w-3 fill-[#F97316] text-[#F97316]" />)}</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-3 border-t border-gray-100 pt-2.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] text-[10px] font-black text-white">{t.avatar}</div>
                  <div><div className="text-[11px] font-bold text-gray-900">{t.name}</div><div className="text-[9px] text-gray-400">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-4 pb-8">
          <div className="rounded-2xl p-6 sm:p-8 text-center text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)" }}>
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#F97316]/10 blur-[60px]" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#7C3AED]/10 blur-[60px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">Start Building Smarter Today</h2>
              <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">Join 10,000+ construction professionals saving time and money</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold text-white hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-500/20"><ShoppingCart className="h-4 w-4" /> Start Shopping</Link>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"><FileText className="h-4 w-4" /> Request Quote</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F172A]"><span className="text-[10px] font-black text-white">M</span></div><span className="text-base font-black text-gray-900 font-display">MODIT</span></div>
              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">Delhi NCR&apos;s trusted building material procurement platform.</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-gray-900"><Phone className="h-3.5 w-3.5" />1800-123-4567</div>
            </div>
            {[
              { title: "Products", links: ["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Plumbing"] },
              { title: "Services", links: ["Request Quote", "Track Order", "Check Stock", "AI Assistant", "Project Planner"] },
              { title: "Company", links: ["About Us", "Careers", "Blog", "Press", "Contact"] },
              { title: "Support", links: ["Help Center", "Returns", "Shipping", "Privacy", "Terms"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-black text-gray-900 mb-2 font-display">{col.title}</h4>
                <div className="space-y-1.5">{col.links.map((link) => <Link key={link} href="/products" className="block text-[10px] text-gray-500 hover:text-[#F97316] transition-colors">{link}</Link>)}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[10px] text-gray-400">&copy; 2026 MODIT. All rights reserved.</div>
            <div className="flex gap-3 text-[10px] text-gray-400">
              <Link href="/admin/audit" className="hover:text-gray-600">Privacy</Link>
              <Link href="/admin/audit" className="hover:text-gray-600">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Toast ── */}
      <AnimatePresence>
        {cartMsg && (
          <motion.div initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }} className="fixed bottom-6 left-1/2 z-50 rounded-2xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#059669]" />{cartMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
