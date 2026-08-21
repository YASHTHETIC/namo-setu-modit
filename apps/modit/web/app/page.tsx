"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet, Menu,
  MapPin, ChevronDown, Zap, Shield, Truck, Clock, TrendingUp, Lock,
  ArrowRight, Star, ChevronRight, X, ChevronUp, Sparkles, ArrowUpRight, Heart
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { ModitLogo } from "@/components/modit-logo";
import { ProductRail } from "@/widgets/product-rail";
import { StickyCartBar } from "@/widgets/sticky-cart-bar";
import { products, searchProducts } from "@/lib/product-data";

/* ── Scroll-reveal hook ──────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Animated counter hook ───────────────────────────────────────── */
function useCountUp(target: number, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

/* ── Reveal section wrapper ──────────────────────────────────────── */
function RevealSection({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Ripple button ───────────────────────────────────────────────── */
function RippleButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);
  }, []);
  return (
    <button {...props} className={`relative overflow-hidden ${className}`} onClick={(e) => { addRipple(e); props.onClick?.(e); }}>
      {ripples.map((r) => (
        <span key={r.id} className="absolute w-10 h-10 rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{ left: r.x - 20, top: r.y - 20 }} />
      ))}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function ModitHomePage() {
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const router = useRouter();
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pincode, setPincode] = useState("201301");
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [deliveryPulse, setDeliveryPulse] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResults = useMemo(() => searchQuery.length >= 2 ? searchProducts(searchQuery).slice(0, 8) : [], [searchQuery]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [showSearch]);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setDeliveryPulse((p) => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const cementProducts = useMemo(() => products.filter((p) => p.categorySlug === "cement"), []);
  const paintingProducts = useMemo(() => products.filter((p) => p.categorySlug === "painting"), []);
  const lightingProducts = useMemo(() => products.filter((p) => p.categorySlug === "lighting"), []);
  const tilingProducts = useMemo(() => products.filter((p) => p.categorySlug === "tiling"), []);
  const discountedProducts = useMemo(
    () => products.filter((p) => p.mrp > p.price).sort((a, b) => b.discount - a.discount).slice(0, 10),
    []
  );

  const featureCountRef = useScrollReveal(0.3);
  const featureVisible = featureCountRef.visible;
  const lowestPriceCount = useCountUp(500, 1200, featureVisible);
  const deliveryCount = useCountUp(60, 1000, featureVisible);
  const secureCount = useCountUp(100, 800, featureVisible);

  const categories = [
    { name: "Cement", slug: "cement", img: "/products/cement/Ambuja Cement.png", count: 10, color: "#2D1B69" },
    { name: "Tiling &\nWaterproof", slug: "tiling", img: "/products/tiling/Dr Fixit.png", count: 14, color: "#E91E63" },
    { name: "Painting", slug: "painting", img: "/products/painting/Asian Paint.png", count: 34, color: "#7CB518" },
    { name: "Lighting", slug: "lighting", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp", count: 17, color: "#00BCD4" },
    { name: "Wires &\nCables", slug: "electrical", img: "/products/lighting/download-Photoroom (1).png", count: 8, color: "#FF9800" },
    { name: "Plywood,\nMDF", slug: "plywood", img: "/products/painting/Asian Paints Tractor Emulsion, Base White 20 L.png", count: 6, color: "#795548" },
    { name: "Fevicol", slug: "fevicol", img: "/products/tiling/Bostik.png", count: 5, color: "#E91E63" },
    { name: "Hardware", slug: "hardware", img: "/products/tiling/Roff T1.png", count: 4, color: "#607D8B" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-shadow hover:shadow-lg hover:shadow-purple-900/20">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <RippleButton className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/5" onClick={() => setShowMenu(true)}>
            <Menu className="h-5 w-5" />
          </RippleButton>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="transition-all hover:scale-105 active:scale-95">
              <ModitLogo className="h-[40px] w-auto" dark={true} />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <RippleButton className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/5" onClick={() => setShowSearch(true)}>
              <Search className="h-5 w-5" />
            </RippleButton>
            <Link href="/cart" className="relative p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-white/5">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full bg-[#7CB518] text-[9px] font-black text-white flex items-center justify-center px-1 shadow-lg shadow-green-500/30 animate-cart-pop">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ DELIVERY BAR — Pulsing bolt ═══ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3">
          <div className={`flex items-center gap-2 bg-[#7CB518]/15 border border-[#7CB518]/30 rounded-xl px-3 py-1.5 transition-all duration-500 ${deliveryPulse ? "shadow-md shadow-green-500/20" : ""}`}>
            <Zap className="h-4 w-4 text-[#7CB518] transition-transform duration-300" style={{ transform: deliveryPulse ? "scale(1.2)" : "scale(1)" }} />
            <span className="text-[15px] font-black text-[#7CB518]">60</span>
            <span className="text-[9px] font-bold text-[#7CB518] uppercase leading-tight">Mins</span>
          </div>
          <button
            onClick={() => setShowPincodeModal(true)}
            className="flex items-center gap-1.5 text-white hover:text-white/90 transition-colors group"
          >
            <MapPin className="h-3.5 w-3.5 text-white/50 group-hover:text-[#7CB518] transition-colors" />
            <span className="text-[12px] font-semibold">Deliver To</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/50 group-hover:rotate-180 transition-transform duration-300" />
          </button>
          <span className="text-[13px] font-bold text-[#7CB518]">{pincode}</span>
        </div>
      </div>

      {/* ═══ HERO BANNER — Animated gradient + truck ═══ */}
      <RevealSection>
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden relative group" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2D8A 50%, #2D1B69 100%)" }}>
          {/* Animated mesh gradient overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            background: "radial-gradient(circle at 20% 50%, rgba(124,181,24,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.2), transparent 50%)",
            animation: "meshMove 8s ease-in-out infinite alternate",
          }} />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7CB518]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#E91E63]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 p-5 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#E91E63] text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 animate-pulse">
                <Truck className="h-3 w-3" />
                FREE DELIVERY
              </div>
              <h2 className="text-white text-[18px] font-bold leading-tight">Materials On Door</h2>
              <p className="text-white/60 text-[12px] mt-1">Construction materials delivered to your site</p>
            </div>
            <Link href="/products" className="flex items-center gap-2 bg-[#7CB518] text-white text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25">
              Shop Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* ═══ ASSURED STRIP ═══ */}
      <RevealSection delay={100}>
        <div className="mt-4 mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0A3C] to-[#150726] border border-white/10 relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
          <div className="absolute -top-4 -right-2 w-20 h-32 bg-[#E91E63]/20 rotate-[25deg] rounded-full blur-xl group-hover:rotate-[35deg] transition-transform duration-500" />
          <div className="absolute -bottom-4 -left-2 w-20 h-32 bg-[#7CB518]/20 rotate-[-25deg] rounded-full blur-xl group-hover:rotate-[-35deg] transition-transform duration-500" />
          <div className="p-4 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h3 className="text-[14px] font-bold text-white">Modit <span className="text-[#7CB518]">Assured</span></h3>
              <div className="h-5 w-5 rounded-full bg-[#7CB518]/20 flex items-center justify-center animate-bounce">
                <Shield className="h-3 w-3 text-[#7CB518]" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { title: "7 Day\nReplacement", icon: Shield, color: "#E91E63" },
                { title: "4 Hour\nResolution", icon: Clock, color: "#7CB518" },
                { title: "100% Genuine\nGuarantee", icon: Shield, color: "#7CB518" },
                { title: "Easy\nReturns", icon: Package, color: "#E91E63" },
              ].map((f, i) => (
                <div key={f.title} className="text-center group/item cursor-pointer">
                  <div className="h-10 w-10 rounded-full mx-auto mb-1.5 flex items-center justify-center group-hover/item:scale-125 group-hover/item:rotate-6 transition-all duration-300"
                    style={{ background: `${f.color}15`, border: `2px solid ${f.color}40` }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <p className="text-[10px] font-bold text-white leading-tight whitespace-pre-line">{f.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ CATEGORY GRID — Staggered reveal + tilt ═══ */}
      <RevealSection delay={150}>
        <div className="mt-5">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link href="/products" className="text-[#7CB518] text-[13px] font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3 px-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-full aspect-square rounded-2xl bg-white border border-[#DDD6EE] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-500/10 group-hover:scale-105 group-hover:-rotate-1 ${
                    mounted ? "animate-fade-up" : "opacity-0"
                  }`}
                  style={{
                    animationDelay: `${i * 60}ms`,
                    borderColor: undefined,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = cat.color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#DDD6EE"; }}
                >
                  <img src={cat.img} alt={cat.name} loading="lazy" className="w-[75%] h-[75%] object-contain group-hover:scale-110 group-hover:rotate-3 transition-all duration-500" />
                </div>
                <p className="text-[10px] font-semibold text-[#150726] text-center leading-tight whitespace-pre-line group-hover:text-[#7CB518] transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ PRODUCT RAILS ═══ */}
      <div className="max-w-[1440px] mx-auto pb-28">
        <RevealSection delay={100}>
          <ProductRail
            title="Deals of the Day"
            products={discountedProducts}
            seeAllHref="/products"
            accentColor="pink"
          />
        </RevealSection>
        <RevealSection delay={150}>
          <ProductRail
            title="Top Picks in Cement"
            products={cementProducts}
            seeAllHref="/products?category=cement"
          />
        </RevealSection>
        <RevealSection delay={200}>
          <ProductRail
            title="Lighting Essentials"
            products={lightingProducts}
            seeAllHref="/products?category=lighting"
            accentColor="cyan"
          />
        </RevealSection>
        <RevealSection delay={250}>
          <ProductRail
            title="Tiling & Waterproofing"
            products={tilingProducts}
            seeAllHref="/products?category=tiling"
          />
        </RevealSection>
        <RevealSection delay={300}>
          <ProductRail
            title="Painting Supplies"
            products={paintingProducts.slice(0, 10)}
            seeAllHref="/products?category=painting"
            accentColor="pink"
          />
        </RevealSection>
      </div>

      {/* ═══ FEATURE BAR — Animated counters ═══ */}
      <RevealSection>
        <div ref={featureCountRef.ref} className="mx-4 mb-24 rounded-2xl bg-gradient-to-r from-[#150726] to-[#2D1B69] p-5 grid grid-cols-3 gap-3 border border-white/10 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#E91E63]/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#7CB518]/10 rounded-full blur-xl" />
          {/* Animated gradient line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#E91E63] via-[#7CB518] to-[#00BCD4]"
            style={{ backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
          {[
            { icon: TrendingUp, value: lowestPriceCount, suffix: "+", title: "LOWEST\nPRICES", sub: "Best quality at best prices", color: "#E91E63" },
            { icon: Clock, value: deliveryCount, suffix: " min", title: "FAST\nDELIVERY", sub: "Superfast delivery at your site", color: "#00BCD4" },
            { icon: Lock, value: secureCount, suffix: "%", title: "SECURE\nPAYMENTS", sub: "100% safe & secure", color: "#7CB518" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center relative z-10 group/feat cursor-pointer">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-2 group-hover/feat:scale-110 group-hover/feat:rotate-6 transition-all duration-300"
                style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}40` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <p className="text-[18px] font-black text-white leading-none">
                {f.value}{f.suffix}
              </p>
              <p className="text-[9px] font-black text-white/70 leading-tight whitespace-pre-line mt-1">{f.title}</p>
              <p className="text-[7px] text-white/40 mt-0.5 leading-tight">{f.sub}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ═══ BRAND STRIP ═══ */}
      <RevealSection>
        <div className="mx-4 mb-6">
          <div className="section-header px-0">
            <h2>Trusted Brands</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {["UltraTech", "ACC", "Ambuja", "Asian Paints", "Philips", "Dr Fixit", "Kajaria", "Roff"].map((brand, i) => (
              <div key={brand} className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className="h-14 w-14 rounded-2xl bg-white border border-[#DDD6EE] flex items-center justify-center group-hover:border-[#7CB518] group-hover:shadow-lg group-hover:shadow-green-500/10 transition-all duration-300 group-hover:scale-110">
                  <span className="text-[11px] font-bold text-[#150726] group-hover:text-[#7CB518] transition-colors text-center leading-tight">{brand.split(" ")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ STICKY CART BAR ═══ */}
      <StickyCartBar itemCount={cartCount} total={cartTotal} />

      {/* ═══ BACK TO TOP ═══ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed z-50 right-4 bg-[#150726] text-white p-3 rounded-full shadow-xl shadow-purple-900/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          showBackToTop ? "bottom-20 opacity-100 translate-y-0" : "bottom-10 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* ═══ BOTTOM NAV ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#150726] border-t border-white/10 safe-area-bottom">
        <div className="max-w-[1440px] mx-auto grid grid-cols-5 gap-0">
          {[
            { icon: Home, label: "Home", href: "/", active: true },
            { icon: LayoutGrid, label: "Category", href: "/products" },
            { icon: Package, label: "Orders", href: "/orders" },
            { icon: User, label: "Account", href: "/auth" },
            { icon: Wallet, label: "Wallet", href: "/payment/history", highlight: true },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 transition-all duration-200 active:scale-90 ${
                item.highlight
                  ? "bg-[#7CB518]/10 border-t-2 border-[#7CB518]"
                  : item.active
                  ? "text-[#7CB518]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <item.icon className="h-5 w-5" fill={item.active ? "currentColor" : "none"} />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ═══ PINCODE MODAL ═══ */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowPincodeModal(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#150726]">Enter Pincode</h3>
              <button onClick={() => setShowPincodeModal(false)} className="p-1 text-[#9B8CB5] hover:text-[#150726] transition-colors hover:rotate-90 duration-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit pincode"
                className="flex-1 border-2 border-[#DDD6EE] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#150726] focus:outline-none focus:border-[#7CB518] focus:ring-4 focus:ring-[#7CB518]/10 transition-all"
                maxLength={6}
              />
              <RippleButton className="bg-[#7CB518] text-white text-[13px] font-bold px-6 py-3 rounded-xl hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25">
                Check
              </RippleButton>
            </div>
            <div className="flex items-center gap-2 mt-4 p-3 bg-[#7CB518]/5 rounded-xl border border-[#7CB518]/20">
              <Zap className="h-4 w-4 text-[#7CB518]" />
              <p className="text-[12px] text-[#150726]">Delivery available in <span className="font-bold text-[#7CB518]">60 minutes</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENU SIDEBAR ═══ */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div className="w-72 h-full bg-[#150726] p-5 animate-slide-in-left overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Link href="/" onClick={() => setShowMenu(false)}>
                <ModitLogo className="h-[36px] w-auto" dark={true} />
              </Link>
              <button onClick={() => setShowMenu(false)} className="p-1 text-white/60 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {[
                { icon: Home, label: "Home", href: "/" },
                { icon: LayoutGrid, label: "All Categories", href: "/products" },
                { icon: Package, label: "My Orders", href: "/orders" },
                { icon: ShoppingCart, label: "My Cart", href: "/cart" },
                { icon: Heart, label: "Wishlist", href: "/wishlist" },
                { icon: Wallet, label: "Payment History", href: "/payment/history" },
                { icon: User, label: "Account", href: "/auth" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <item.icon className="h-5 w-5 group-hover:text-[#7CB518] transition-colors" />
                  <span className="text-[14px] font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold text-white/30 uppercase px-4 mb-3">Categories</p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="h-6 w-6 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src={cat.img} alt="" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-[13px] font-medium">{cat.name.split("\n")[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEARCH MODAL ═══ */}
      {showSearch && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
          <div className="w-full bg-[#150726] p-4 animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[1440px] mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && searchQuery) { router.push(`/products?search=${encodeURIComponent(searchQuery)}`); setShowSearch(false); setSearchQuery(""); } }}
                    placeholder="Search cement, paint, lighting..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-[#7CB518]/50 focus:bg-white/15 transition-all"
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-3 text-white/60 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {searchResults.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-white/5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-white/50">{p.brand}</p>
                      </div>
                      <p className="text-[13px] font-bold text-[#7CB518]">₹{p.price.toLocaleString("en-IN")}</p>
                    </Link>
                  ))}
                  <Link
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-semibold text-[#7CB518] hover:bg-white/5 transition-colors"
                  >
                    View all results <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-[13px] text-white/50">No products found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
              {searchQuery.length < 2 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] font-bold text-white/40 uppercase mb-2">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {["Cement", "Asian Paint", "Philips LED", "Dr Fixit", "Bostik", "UltraTech"].map((term) => (
                      <button
                        key={term}
                        onClick={() => { setSearchQuery(term); }}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[12px] font-semibold text-white/70 hover:bg-[#7CB518]/20 hover:border-[#7CB518]/40 hover:text-[#7CB518] transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Mesh gradient animation ═══ */}
      <style jsx global>{`
        @keyframes meshMove {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -10px) scale(1.1); }
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
