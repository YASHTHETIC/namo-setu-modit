import os

content = r'''"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Truck, Shield, MapPin, Search, Phone,
  Star, ChevronRight, ChevronLeft, Package, Users, CheckCircle,
  Zap, ShieldCheck, Headphones, BarChart3, Box, FileText, ShoppingCart,
  LayoutDashboard, Menu, X, Clock, Flame, TrendingUp, Percent,
  Brain, Upload, MessageSquare, RefreshCw, Mic,
  GitCompareArrows, Store, Timer, Sparkles, Eye, Heart, IndianRupee,
  TrendingDown, Award, BadgeCheck, TruckIcon, RotateCcw, CreditCard,
} from "lucide-react";
import { categories, products, type Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";

const navItems = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/rfq", label: "Get Quote", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Box },
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
];

function getDeals(): Product[] {
  return ["cement-1", "steel-1", "paint-1", "electrical-1", "sanitary-1", "electrical-2"].map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getTopSelling(): Product[] {
  return ["cement-2", "steel-2", "tiles-1", "paint-2", "plumbing-1", "bricks-1"].map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getNewArrivals(): Product[] {
  return ["electrical-3", "sanitary-2", "sand-1", "plywood-1", "hardware-1", "pipes-1"].map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
function getBestInCategory(catSlug: string): Product[] {
  return products.filter((p) => p.categorySlug === catSlug).slice(0, 6);
}

const categoryImages: Record<string, string> = {
  cement: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop",
  "steel-tmt": "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=200&h=200&fit=crop",
  "bricks-blocks": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  "tiles-ceramics": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop",
  paint: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&h=200&fit=crop",
  electrical: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop",
  sanitary: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop",
  "sand-aggregate": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  "pipes-fittings": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop",
  "plywood-boards": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  hardware: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
};

const banners = [
  { title: "Monsoon Sale", subtitle: "Up to 25% off on Cement & Steel", cta: "Shop Now", href: "/products?category=cement", bg: "from-orange-600 via-red-500 to-pink-500", tag: "LIMITED TIME" },
  { title: "Bulk Orders", subtitle: "Extra 10% off on orders above 50 units", cta: "Get Quote", href: "/rfq", bg: "from-emerald-600 via-teal-500 to-cyan-500", tag: "B2B DEAL" },
  { title: "New: AI Procurement", subtitle: "Let AI find the best prices for you", cta: "Try AI", href: "/products", bg: "from-violet-600 via-purple-500 to-indigo-500", tag: "NEW FEATURE" },
];

const offerCards = [
  { title: "First Order?", discount: "10% OFF", code: "FIRST10", desc: "Use code at checkout", color: "from-orange-500 to-red-500" },
  { title: "Bulk Buyer?", discount: "Extra 5%", code: "BULK5", desc: "On orders above 1 lakh", color: "from-emerald-500 to-teal-500" },
  { title: "New Supplier?", discount: "0% Commission", code: "", desc: "For first 3 months", color: "from-violet-500 to-purple-500" },
];

const brands = [
  { name: "UltraTech", slug: "ultratech" },
  { name: "Tata Tiscon", slug: "tata-tiscon" },
  { name: "Asian Paints", slug: "asian-paints" },
  { name: "Havells", slug: "havells" },
  { name: "Cera", slug: "cera" },
  { name: "Hindware", slug: "hindware" },
  { name: "Polycab", slug: "polycab" },
  { name: "Finolex", slug: "finolex" },
  { name: "Greenply", slug: "greenply" },
  { name: "Pidilite", slug: "pidilite" },
  { name: "Sintex", slug: "sintex" },
  { name: "Anchor", slug: "anchor" },
];

const trustFeatures = [
  { icon: Truck, title: "Free Delivery", desc: "On orders above 5,000" },
  { icon: Shield, title: "Genuine Products", desc: "100% authentic brands" },
  { icon: CreditCard, title: "Easy Credit", desc: "Net 30/60 payment terms" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: BadgeCheck, title: "Verified Sellers", desc: "All suppliers vetted" },
  { icon: Headphones, title: "24/7 Support", desc: "Call: 1800-123-4567" },
];

const stats = [
  { value: "5000+", label: "Products" },
  { value: "200+", label: "Suppliers" },
  { value: "10K+", label: "Customers" },
  { value: "24-48h", label: "Delivery" },
];

const deliveryAreas = ["New Delhi", "Noida", "Gurgaon", "Faridabad", "Ghaziabad", "Greater Noida", "Dwarka", "Rohini", "Pitampura", "Karol Bagh"];

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 32, s: 18 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">{v}</span>
          {i < 2 && <span className="text-xs font-bold text-red-600">:</span>}
        </div>
      ))}
    </div>
  );
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), []);
  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className={`bg-gradient-to-r ${banners[current].bg} p-6 sm:p-8 lg:p-10`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white mb-3">{banners[current].tag}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{banners[current].title}</h2>
              <p className="mt-2 text-sm sm:text-base text-white/80">{banners[current].subtitle}</p>
              <Link href={banners[current].href} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg">
                {banners[current].cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden sm:block text-6xl lg:text-8xl font-black text-white/10">{banners[current].tag === "LIMITED TIME" ? "25%" : banners[current].tag === "B2B DEAL" ? "10%" : "AI"}</div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}

function ProductGrid({ title, subtitle, products: prods, viewAll }: { title: string; subtitle?: string; products: Product[]; viewAll?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => scroll("left")} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button onClick={() => scroll("right")} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><ChevronRight className="h-3.5 w-3.5" /></button>
          {viewAll && <Link href={viewAll} className="ml-1 text-xs font-semibold text-[var(--brand)] hover:underline">View All</Link>}
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {prods.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="min-w-[180px] max-w-[180px] flex-shrink-0 rounded-xl border border-[var(--border-subtle)] bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden" style={{ scrollSnapAlign: "start" }}>
            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
              {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-[var(--brand)]/20" /></div>}
              {p.discount > 0 && <span className="absolute top-1 left-1 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{p.discount}% OFF</span>}
              <button className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[var(--text-muted)] hover:text-red-500"><Heart className="h-3 w-3" /></button>
            </div>
            <div className="p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--brand)]">{p.brand}</p>
              <h3 className="mt-0.5 text-[11px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">{p.name}</h3>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{"\u20b9"}{p.price.toLocaleString()}</span>
                {p.mrp > p.price && <span className="text-[9px] text-[var(--text-muted)] line-through">{"\u20b9"}{p.mrp.toLocaleString()}</span>}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <div className="flex items-center gap-0.5 rounded bg-green-50 px-1 py-0.5">
                  <Star className="h-2 w-2 fill-green-600 text-green-600" />
                  <span className="text-[9px] font-bold text-green-700">{p.rating}</span>
                </div>
                <span className="text-[8px] text-[var(--text-muted)]">({p.reviewCount})</span>
              </div>
              {p.freeDelivery && <p className="mt-1 text-[8px] font-medium text-emerald-600">Free Delivery</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DealCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  return (
    <Link href={`/products/${product.id}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.div animate={{ y: hovered ? -4 : 0, boxShadow: hovered ? "0 20px 40px -12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)" }} className="rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden transition-all">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
          {product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-[var(--brand)]/20" /></div>}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2">
            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{product.discount}% OFF</span>
            <span className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-primary)]">{product.brand}</span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{product.name}</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-[var(--text-primary)]">{"\u20b9"}{product.price.toLocaleString()}</span>
            {product.mrp > product.price && <span className="text-[10px] text-[var(--text-muted)] line-through">{"\u20b9"}{product.mrp.toLocaleString()}</span>}
          </div>
          {product.bulkLabel && <p className="mt-1 text-[9px] font-medium text-emerald-600">{product.bulkLabel}</p>}
          <div className="mt-2 flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">{product.rating} ({product.reviewCount})</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product); }} className="mt-2 w-full rounded-lg bg-[var(--brand)] py-1.5 text-[11px] font-bold text-white hover:bg-[var(--brand-dark)] transition-colors">
            ADD TO CART
          </button>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Page() {
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("cement");
  const addItem = useCartStore((s) => s.addItem);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const deals = getDeals();
  const topSelling = getTopSelling();
  const newArrivals = getNewArrivals();
  const catProducts = getBestInCategory(activeCategory);

  const checkDelivery = () => {
    if (pincode.length === 6) setDeliveryMessage(`Delivery available to ${pincode}! Estimated: 24-48 hours`);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setCartMessage(`${product.name} added to cart`);
    setTimeout(() => setCartMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Announcement Bar */}
      <div className="bg-[var(--text-primary)] text-white text-center py-1.5 px-4 text-[11px] font-medium">
        <span className="hidden sm:inline">Delivering across Delhi NCR</span>
        <span className="mx-2 hidden sm:inline">|</span>
        <span>Free delivery on orders above {"\u20b9"}5,000</span>
        <span className="mx-2">|</span>
        <span>Same-day delivery available</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] shadow-md shadow-[var(--brand)]/20">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">MODIT</span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                <item.icon className="h-3.5 w-3.5" />{item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Search cement, steel, tiles, paint, pipes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim()) window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`; }} className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:bg-white focus:ring-1 focus:ring-[var(--brand)]/20 outline-none transition-all" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--brand)]" />
              <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => { setPincode(e.target.value); setDeliveryMessage(""); }} className="w-14 border-none bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none" maxLength={6} />
              <button onClick={checkDelivery} className="text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-dark)]">Check</button>
            </div>
          </div>

          <Link href="/cart" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
          <Link href="/auth" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-[var(--brand-dark)] transition-colors">
            Sign In
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] xl:hidden">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {deliveryMessage && <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-700">{deliveryMessage}</div>}
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 xl:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25 }} className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold">Menu</span>
                  <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
                </div>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]">
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">
                  <Link href="/auth" onClick={() => setMobileOpen(false)} className="block w-full rounded-xl bg-[var(--brand)] py-2.5 text-center text-sm font-bold text-white">Sign In</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* Hero Banner Carousel + Trust Strip */}
        <section ref={heroRef} className="pt-4 pb-2">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <BannerCarousel />
            {/* Right Side - Quick Links */}
            <div className="hidden lg:flex flex-col gap-3">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-4 flex-1">
                <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2">Quick Links</h3>
                <div className="space-y-1.5">
                  {["Get Best Price", "Track Order", "Find Supplier", "Bulk Order"].map((link) => (
                    <Link key={link} href="/products" className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]">
                      {link} <ChevronRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] p-4 text-white">
                <h3 className="text-xs font-bold mb-1">Download App</h3>
                <p className="text-[10px] text-white/70 mb-2">Get exclusive app-only deals</p>
                <div className="flex gap-2">
                  <div className="rounded-lg bg-white/10 px-2 py-1 text-[9px] font-medium">Google Play</div>
                  <div className="rounded-lg bg-white/10 px-2 py-1 text-[9px] font-medium">App Store</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Features Strip */}
        <section className="py-3">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {trustFeatures.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-white px-2.5 py-2">
                <f.icon className="h-4 w-4 text-[var(--brand)] shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-[var(--text-primary)]">{f.title}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Offer Cards */}
        <section className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {offerCards.map((o, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.02 }} className={`rounded-xl bg-gradient-to-r ${o.color} p-4 text-white`}>
                <div className="text-[10px] font-medium text-white/80">{o.title}</div>
                <div className="text-xl font-extrabold mt-0.5">{o.discount}</div>
                <div className="text-[10px] text-white/70 mt-0.5">{o.desc}</div>
                {o.code && <div className="mt-2 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">{o.code} <CopyIcon /></div>}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories - Horizontal Scroll */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Shop by Category</h2>
            <Link href="/products" className="text-xs font-semibold text-[var(--brand)] hover:underline">View All</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
                <Link href={`/products?category=${cat.slug}`} className="flex flex-col items-center min-w-[90px] rounded-xl border border-[var(--border-subtle)] bg-white p-3 transition-all hover:shadow-md hover:border-[var(--brand)] hover:-translate-y-0.5">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
                    {categoryImages[cat.slug] ? <img src={categoryImages[cat.slug]} alt={cat.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-[var(--brand)]" /></div>}
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-[var(--text-primary)] text-center leading-tight">{cat.name}</span>
                  <span className="text-[8px] text-[var(--text-muted)]">{cat.productCount}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Deals of the Day with Timer */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">Deals of the Day</h2>
              <CountdownTimer />
            </div>
            <Link href="/products" className="text-xs font-semibold text-[var(--brand)] hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {deals.map((p) => <DealCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Best in Category Tabs */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Best in Category</h2>
            <Link href={`/products?category=${activeCategory}`} className="text-xs font-semibold text-[var(--brand)] hover:underline">View All</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
            {["cement", "steel-tmt", "paint", "electrical", "plumbing", "sanitary", "tiles-ceramics", "bricks-blocks"].map((slug) => {
              const cat = categories.find((c) => c.slug === slug);
              return (
                <button key={slug} onClick={() => setActiveCategory(slug)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${activeCategory === slug ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20" : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}>
                  {cat?.name || slug}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {catProducts.map((p) => <DealCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Top Selling */}
        <section className="py-4">
          <ProductGrid title="Top Selling Products" subtitle="Most ordered by contractors in Delhi NCR" products={topSelling} viewAll="/products" />
        </section>

        {/* Brands */}
        <section className="py-4">
          <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-3">Top Brands</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {brands.map((b, i) => (
              <motion.div key={b.slug} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
                <Link href={`/products?search=${b.name}`} className="flex h-14 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-white px-3 transition-all hover:shadow-md hover:border-[var(--brand)] hover:-translate-y-0.5">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">{b.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-4">
          <ProductGrid title="New Arrivals" subtitle="Latest products added this week" products={newArrivals} viewAll="/products" />
        </section>

        {/* Stats */}
        <section className="py-4">
          <div className="rounded-xl bg-[var(--text-primary)] p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features - Compact */}
        <section className="py-4">
          <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <h2 className="text-base font-extrabold">AI-Powered Features</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: Brain, title: "Material Advisor", desc: "AI recommends materials" },
                { icon: Upload, title: "BOQ Reader", desc: "Upload & auto-extract" },
                { icon: GitCompareArrows, title: "Price Compare", desc: "50+ suppliers" },
                { icon: MessageSquare, title: "AI Negotiation", desc: "Best bulk prices" },
                { icon: Mic, title: "Voice Order", desc: "Hindi & English" },
                { icon: RefreshCw, title: "Smart Reorder", desc: "Auto alerts" },
              ].map((f, i) => (
                <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors cursor-pointer">
                  <f.icon className="h-5 w-5 text-orange-400 mb-2" />
                  <div className="text-[11px] font-bold">{f.title}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Compact */}
        <section className="py-4">
          <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-3">How MODIT Works</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: "01", title: "Search", desc: "Browse 5000+ products or use AI", icon: Search },
              { step: "02", title: "Compare", desc: "Real-time prices from verified suppliers", icon: BarChart3 },
              { step: "03", title: "Order", desc: "One-click order with credit options", icon: ShoppingCart },
              { step: "04", title: "Receive", desc: "Track delivery in real-time", icon: Truck },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative rounded-xl border border-[var(--border-subtle)] bg-white p-4 text-center hover:shadow-md transition-shadow">
                <div className="absolute -top-2 left-4 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">{s.step}</div>
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[var(--brand)]">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">{s.title}</h3>
                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials - Compact */}
        <section className="py-4">
          <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-3">What Customers Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "Rajesh K.", role: "Builder, Noida", text: "Saved 12% on my last project with AI price comparison." },
              { name: "Priya S.", role: "Interior Designer", text: "BOQ reader got me a complete material list in 30 seconds." },
              { name: "Amit P.", role: "Contractor, Delhi", text: "Same-day delivery and credit facility. Best platform." },
              { name: "Vikram S.", role: "Project Manager", text: "Voice ordering from site is brilliant for supervisors." },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-3 border-t pt-2">
                  <div className="text-[11px] font-bold text-[var(--text-primary)]">{t.name}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-4 pb-6">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--brand)] via-[var(--brand-dark)] to-[var(--slate-deep)] p-6 sm:p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-xl sm:text-2xl font-extrabold">Start Building Smarter Today</h2>
              <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">Join 10,000+ construction professionals saving time and money</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand-dark)] hover:bg-orange-50 transition-colors">
                  <ShoppingCart className="h-4 w-4" /> Start Shopping
                </Link>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                  <FileText className="h-4 w-4" /> Request Quote
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)] text-[10px] font-bold text-white">M</div>
                <span className="font-bold text-[var(--text-primary)]">MODIT</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] max-w-xs leading-relaxed">Delhi NCR&apos;s trusted building material procurement platform.</p>
              <div className="mt-2 text-[11px] font-medium text-[var(--text-primary)]">1800-123-4567</div>
            </div>
            {[
              { title: "Products", links: ["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Plumbing"] },
              { title: "Services", links: ["Request Quote", "Track Order", "Check Stock", "Find Suppliers", "Project Planner"] },
              { title: "Company", links: ["Analytics", "Admin", "Profile", "Sign In"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">{col.title}</h4>
                <div className="space-y-1.5">
                  {col.links.map((link) => (
                    <Link key={link} href="/products" className="block text-[10px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">{link}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[10px] text-[var(--text-muted)]">&copy; 2026 MODIT. All rights reserved.</div>
            <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
              <Link href="/admin/audit" className="hover:text-[var(--text-secondary)]">Privacy</Link>
              <Link href="/admin/audit" className="hover:text-[var(--text-secondary)]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <AnimatePresence>
        {cartMessage && (
          <motion.div initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }} className="fixed bottom-6 left-1/2 z-50 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-medium text-white shadow-xl flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />{cartMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
  );
}
'''

target = os.path.join('apps', 'modit', 'web', 'app', 'page.tsx')
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written {len(content)} chars')
