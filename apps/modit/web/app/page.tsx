"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet, Menu,
  MapPin, ChevronDown, Zap, Truck, Clock, TrendingUp, Lock,
  ArrowRight, Star, ChevronRight, X, ChevronUp, Sparkles, ArrowUpRight, Heart,
  BadgeCheck, Undo2, Receipt
} from "lucide-react";
import { useToast } from "@foundation/ui";
import { useCartStore } from "@/lib/cart-store";
import { ModitLogo } from "@/components/modit-logo";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { ComparisonBar } from "@/components/comparison-bar";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { RecentlyViewed } from "@/components/recently-viewed";
import { FlashDeals } from "@/components/flash-deals";
import { usePincode } from "@/lib/pincode-context";
import { onlyDigits, productLink } from "@/lib/utils";
import { useRotatingText, SEARCH_HINTS } from "@/lib/use-rotating-text";
import { ProductRail } from "@/widgets/product-rail";
import { HighlightedText } from "@/components/highlighted-text";
import { useModalBehavior } from "@/lib/use-modal-behavior";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";
import { Reveal } from "@/components/reveal";
import { StickyCartBar } from "@/widgets/sticky-cart-bar";
import { CartDrawer } from "@/widgets/cart-drawer";
import { useCartUi } from "@/lib/cart-ui";
import { useProducts, useSearchProducts, type Product } from "@/lib/api-hooks";
import { useNearestWarehouse } from "@/lib/modit-api";
import { categories as allCategories } from "@/lib/product-data";
import { CategoryTileIcon } from "@/components/modit-shell";

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
  const toast = useToast();
  const openDrawer = useCartUi((s) => s.openDrawer);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const headerHidden = useHideOnScroll(140);
  useModalBehavior(showPincodeModal, () => setShowPincodeModal(false));
  useModalBehavior(showSearch, () => { setShowSearch(false); setSearchQuery(""); setHighlightIdx(-1); });
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setPincode: setContextPincode, coords } = usePincode();
  const { data: nearest } = useNearestWarehouse(coords?.lat, coords?.lng);
  const searchHint = useRotatingText(SEARCH_HINTS);
  const [pincode, setPincodeLocal] = useState("201301");
  const setPincode = useCallback((val: string) => {
    setPincodeLocal(val);
    if (val.length === 6) setContextPincode(val);
  }, [setContextPincode]);

  const { data: allProducts = [] } = useProducts({ page_size: 1000 });
  const products = allProducts as Product[];
  const { data: searchResults = [] } = useSearchProducts(searchQuery);
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cartToast, setCartToast] = useState<{ name: string; price: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setContextPincode("201301"); }, [setContextPincode]);
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [showSearch]);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("modit-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);
  // Cart toast subscription
  const prevCartCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCount.current && cartItems.length > 0) {
      const added = cartItems[cartItems.length - 1];
      setCartToast({ name: added.product.name, price: added.product.price });
      setTimeout(() => setCartToast(null), 2600);
    }
    prevCartCount.current = cartCount;
  }, [cartCount, cartItems]);

  const handleSearchSubmit = (term: string) => {
    if (!term) return;
    // Save to recent searches
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 6);
    setRecentSearches(updated);
    try { localStorage.setItem("modit-recent-searches", JSON.stringify(updated)); } catch {}
    router.push(`/products?search=${encodeURIComponent(term)}`);
    setShowSearch(false);
    setSearchQuery("");
    setHighlightIdx(-1);
  };

  const cementProducts = useMemo(() => products.filter((p) => p.categorySlug === "cement"), []);
  const paintingProducts = useMemo(() => products.filter((p) => p.categorySlug === "painting"), []);
  const lightingProducts = useMemo(() => products.filter((p) => p.categorySlug === "lighting"), []);
  const tilingProducts = useMemo(() => products.filter((p) => p.categorySlug === "tiling"), []);
  const discountedProducts = useMemo(
    () => products.filter((p) => p.mrp > p.price).sort((a, b) => b.discount - a.discount).slice(0, 10),
    []
  );
  const popularProducts = useMemo(
    () => products.filter((p) => p.inStock).sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount)).slice(0, 10),
    []
  );
  // Blinkit Home pattern: a rail per category. Curated rails above cover
  // cement/lighting/tiling/painting — auto-fill the next three biggest.
  const autoRails = useMemo(() => {
    const covered = new Set(["cement", "lighting", "tiling", "painting"]);
    return allCategories
      .filter((c) => !covered.has(c.slug))
      .map((c) => ({ cat: c, items: products.filter((p) => p.categorySlug === c.slug) }))
      .filter((r) => r.items.length >= 4)
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show categories that actually have products in the live catalog.
  // While the catalog is still loading, fall back to the full static list.
  const visibleCategories = useMemo(() => {
    if (products.length === 0) return allCategories;
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
    return allCategories.filter((c) => (counts.get(c.slug) ?? 0) > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);
  const featureCountRef = useScrollReveal(0.3);
  const featureVisible = featureCountRef.visible;
  const lowestPriceCount = useCountUp(500, 1200, featureVisible);
  const deliveryCount = useCountUp(60, 1000, featureVisible);
  const secureCount = useCountUp(100, 800, featureVisible);

  const categories = [
    { name: "Cement", slug: "cement", img: "/products/cement/Ambuja Cement.png", count: 10, color: "#2D1B69" },
    { name: "Tiling &\nWaterproof", slug: "tiling", img: "/products/tiling/Dr Fixit.png", count: 14, color: "#E91E63" },
    { name: "Painting", slug: "painting", img: "/products/painting/Asian Paint.png", count: 34, color: "#7CB518" },
    { name: "Lighting", slug: "lighting", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp", count: 12, color: "#00BCD4" },
    { name: "Wires &\nCables", slug: "electrical", img: "/products/lighting/download-Photoroom 1.png", count: 8, color: "#FF9800" },
    { name: "Plywood,\nMDF", slug: "plywood", img: "/products/painting/Asian Paints Tractor Emulsion Base White 20 L.png", count: 6, color: "#795548" },
    { name: "Fevicol", slug: "fevicol", img: "/products/tiling/Bostik.png", count: 5, color: "#E91E63" },
    { name: "Hardware", slug: "hardware-tools", img: "/products/hardware-tools/250g Wooden Handle Claw Hammer.png", count: 27, color: "#607D8B" },
  ];

  /** Photo tiles for headline categories; the rest use brand icons. */
  const TILE_IMAGES: Record<string, { img: string; color: string }> = Object.fromEntries(
    categories.map((c) => [c.slug, { img: c.img, color: c.color }])
  );

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══ HEADER — hides on scroll down, returns on scroll up ═══ */}
      <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <RippleButton className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/5" onClick={() => setShowMenu(true)}>
            <Menu className="h-5 w-5" />
          </RippleButton>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="transition-all hover:scale-105 active:scale-95">
              <ModitLogo className="h-[40px] w-auto" light={true} />
            </Link>
          </div>
          {/* Desktop cart — mobile uses the bottom-nav Cart tab (one cart entry, Blinkit-style) */}
          <div className="hidden lg:flex items-center gap-1">
            <button onClick={() => openDrawer()} aria-label="Open cart" className="relative p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-white/5">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full bg-[#E91E63] text-tiny font-black text-white flex items-center justify-center px-1 shadow-lg shadow-green-500/30 animate-cart-pop">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Search row — full width, opens the search sheet */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowSearch(true)}
            className="flex h-11 w-full items-center gap-2.5 rounded-xl bg-white/10 border border-white/10 px-4 text-body-md text-white/40 transition-colors hover:bg-white/15"
            aria-label="Search products"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{searchHint}</span>
          </button>
        </div>
      </header>

      {/* ═══ CATEGORY SHORTCUTS — Blinkit-app icon strip under search ═══ */}
      <div className="bg-[#150726] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex gap-1 overflow-x-auto scrollbar-hide px-4">
          <Link href="/products" className="flex flex-col items-center gap-1 px-3 py-2 text-white flex-shrink-0 border-b-2 border-[#7CB518]">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-tiny font-bold">All</span>
          </Link>
          {/* Every live category up top — nothing hidden behind "few" */}
          {visibleCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="flex flex-col items-center gap-1 px-3 py-2 text-white/60 hover:text-white flex-shrink-0 transition-colors"
            >
              <CategoryTileIcon slug={c.slug} className="h-5 w-5" />
              <span className="text-tiny font-semibold whitespace-nowrap">{c.name.replace("\n", " ")}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ DELIVERY HEADER — Blinkit-app ETA-first hierarchy, MODIT dark ═══ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-body-md font-extrabold text-white leading-tight">
                Delivery in <span className="text-[#7CB518]">60 min</span>
              </p>
              {nearest && typeof nearest.distance_km === "number" && (
                <span className="flex-shrink-0 rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-tiny font-bold text-white/70 tabular-nums">
                  {nearest.distance_km < 1 ? `${Math.round(nearest.distance_km * 1000)} m away` : `${nearest.distance_km.toFixed(1)} km away`}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPincodeModal(true)}
              className="mt-0.5 flex items-center gap-1 text-white/70 hover:text-white transition-colors group max-w-full"
            >
              <MapPin className="h-3 w-3 text-white/50 group-hover:text-[#7CB518] transition-colors flex-shrink-0" />
              <span className="text-caption font-semibold truncate">
                {pincode ? `Deliver to ${pincode}` : "Set delivery location"}
              </span>
              <ChevronDown className="h-3 w-3 text-white/50 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0" />
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-white/40 flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
            <span className="text-tiny font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="trust-strip scrollbar-hide mt-3">
        {[
          { icon: BadgeCheck, text: "100% Genuine Products", color: "#7CB518" },
          { icon: Lock, text: "Secure Payments", color: "#2D1B69" },
          { icon: Truck, text: "Free Delivery 5000+", color: "#00BCD4" },
          { icon: Undo2, text: "7-Day Returns", color: "#E91E63" },
          { icon: Receipt, text: "GST Invoice", color: "#FF9800" },
        ].map((item) => (
          <div key={item.text} className="trust-item">
            <item.icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
            <span style={{ color: item.color }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* ═══ PAGE GUTTER — every section below breathes inside the same
          centered margins; nothing touches the screen corners ═══ */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
      {/* ═══ HERO BANNER — Blinkit photo-hero architecture, MODIT dark ═══ */}
      <Reveal>
        <div className="mt-4 rounded-2xl overflow-hidden relative group" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2D8A 50%, #2D1B69 100%)" }}>
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-[#F8CB46] text-[#150726] text-tiny font-bold px-2.5 py-1 rounded-full mb-2">
                <Truck className="h-3 w-3" />
                FREE DELIVERY
              </div>
              <h1 className="text-white text-title-lg font-extrabold leading-tight">Site Material, On Door</h1>
              <p className="text-white/70 text-body-sm mt-1">Cement, paints, lights & more — in 60 minutes</p>
              <Link href="/products" className="mt-3 inline-flex items-center gap-2 bg-white text-[#150726] text-body-sm font-bold px-5 py-2 rounded-full hover:bg-[#F0ECF9] transition-all hover:scale-105 active:scale-95">
                Shop Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex sm:items-center gap-2 flex-shrink-0">
              <div className="h-20 w-16 sm:h-28 sm:w-24 rounded-[28px] bg-white p-1.5 sm:p-2 rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500 shadow-xl ring-4 ring-white/40">
                <Image src="/products/cement/Ambuja Cement.png" alt="Cement bags" width={96} height={112} loading="lazy" draggable={false} className="h-full w-full object-contain" />
              </div>
              <div className="hidden sm:block h-28 w-24 rounded-[28px] bg-white p-2 rotate-[4deg] group-hover:rotate-0 transition-transform duration-500 -ml-4 mt-6 shadow-xl ring-4 ring-white/40">
                <Image src="/products/painting/Asian Paint.png" alt="Paint buckets" width={96} height={112} loading="lazy" draggable={false} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ═══ PROMO CARDS — Blinkit solid-color row, construction edition ═══ */}
      <div className="section-header !pb-1">
        <h2>Site essentials, top deals</h2>
        <Link href="/products?sort=discount" className="text-[#7CB518] text-body-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-1">
        {[
          { title: "Bulk Cement, Site Rates", sub: "Truck-load deals from top brands", tag: "BULK RATES", img: "/products/cement/Ambuja Cement.png", alt: "Cement", href: "/products?category=cement", bg: "#7CB518", dark: false, cta: "Order Now" },
          { title: "Paints & Waterproofing", sub: "Asian Paints, Dr Fixit & more", tag: "TOP BRANDS", img: "/products/painting/Asian Paint.png", alt: "Paint", href: "/products?category=painting", bg: "#2D1B69", dark: false, cta: "Order Now" },
          { title: "Site Lighting", sub: "Philips LEDs, panels & battens", tag: "NEW RANGE", img: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp", alt: "LED lights", href: "/products?category=lighting", bg: "#00BCD4", dark: false, cta: "Order Now" },
          { title: "Tiles & Fix-It Range", sub: "Adhesives, grouts & repair", tag: "PRO CHOICE", img: "/products/tiling/Dr Fixit.png", alt: "Waterproofing and tile care", href: "/products?category=tiling", bg: "#F8CB46", dark: true, cta: "Order Now" },
        ].map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="snap-start shrink-0 w-[270px] sm:w-[320px] rounded-2xl p-4 flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: p.bg }}
          >
            <div className="flex-1 min-w-0">
              <h3 className={`text-body-md font-extrabold leading-tight ${p.dark ? "text-[#150726]" : "text-white"}`}>{p.title}</h3>
              <p className={`text-micro mt-1 leading-snug ${p.dark ? "text-[#150726]/70" : "text-white/85"}`}>{p.sub}</p>
              <span className={`mt-2.5 inline-block px-3.5 py-1.5 rounded-full text-caption font-bold ${p.dark ? "bg-[#150726] text-white" : "bg-white text-[#150726]"}`}>
                {p.cta}
              </span>
            </div>
            <div className="relative flex-shrink-0">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-[28px] bg-white p-2 shadow-xl ring-4 ring-white/40">
                <Image src={p.img} alt={p.alt} width={128} height={128} loading="lazy" draggable={false} className="h-full w-full object-contain" />
              </div>
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-tiny font-black tracking-wide shadow-md ${p.dark ? "bg-[#150726] text-[#F8CB46]" : "bg-[#150726] text-white"}`}>
                {p.tag}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══ CATEGORY GRID — Blinkit-style uniform tiles ═══ */}
      <Reveal delay={150}>
        <div className="mt-5">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link href="/products" className="text-[#7CB518] text-body-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Blinkit Home pattern: EVERY category on the first page.
              Mobile scrolls horizontally, desktop shows the full grid. */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible lg:grid-cols-10 sm:gap-4">
            {visibleCategories.map((cat, i) => {
              const manual = TILE_IMAGES[cat.slug];
              // Blinkit wall: EVERY tile gets a real photo — curated art for
              // headline categories, first catalog image for the rest.
              const fallbackImg = !manual
                ? products.find((p) => p.categorySlug === cat.slug)?.images?.[0]
                : undefined;
              const img = manual?.img ?? fallbackImg;
              const tint = manual?.color ?? "#2D1B69";
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  prefetch
                  className="flex flex-col items-center gap-1 group snap-start shrink-0 w-[92px] sm:w-auto"
                >
                  <div
                    className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white border border-[#DDD6EE] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500/10 group-hover:scale-105 ${
                      mounted ? "animate-fade-up" : "opacity-0"
                    }`}
                    style={{
                      animationDelay: `${Math.min(i, 12) * 50}ms`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tint; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#DDD6EE"; }}
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={cat.name}
                        fill
                        sizes="96px"
                        loading="lazy"
                        draggable={false}
                        className="object-contain p-1.5 animate-fade-in transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <CategoryTileIcon slug={cat.slug} className="h-9 w-9 text-[#2D1B69] transition-transform duration-500 group-hover:scale-110" />
                    )}
                  </div>
                  <p className="text-caption font-bold text-[#150726] text-center leading-tight line-clamp-2 min-h-[30px] group-hover:text-[#7CB518] transition-colors">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ═══ RECENTLY VIEWED — personal, right after categories ═══ */}
      <div className="market-container">
        <RecentlyViewed />
      </div>
      </div>{/* ═══ /PAGE GUTTER ═══ */}

      {/* ═══ FLASH DEALS ═══ */}
      <FlashDeals />

      {/* ═══ PRODUCT RAILS + FEATURE BAR — same centered gutters ═══ */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 pb-8">
        <Reveal delay={100}>
          <ProductRail
            title="Deals of the Day"
            products={discountedProducts}
            seeAllHref="/products?sort=discount"
            accentColor="pink"
          />
        </Reveal>
        <Reveal delay={150}>
          <ProductRail
            title="Popular Right Now"
            products={popularProducts}
            seeAllHref="/products?sort=rating"
          />
        </Reveal>
        <Reveal delay={150}>
          <ProductRail
            title="Top Picks in Cement"
            products={cementProducts}
            seeAllHref="/products?category=cement"
          />
        </Reveal>
        <Reveal delay={200}>
          <ProductRail
            title="Lighting Essentials"
            products={lightingProducts}
            seeAllHref="/products?category=lighting"
            accentColor="cyan"
          />
        </Reveal>
        <Reveal delay={250}>
          <ProductRail
            title="Tiling & Waterproofing"
            products={tilingProducts}
            seeAllHref="/products?category=tiling"
          />
        </Reveal>
        <Reveal delay={300}>
          <ProductRail
            title="Painting Supplies"
            products={paintingProducts.slice(0, 10)}
            seeAllHref="/products?category=painting"
            accentColor="pink"
          />
        </Reveal>
        {/* Auto per-category rails (clone Home pattern — every big
            category gets its own rail with a see-all landing) */}
        {autoRails.map((r, ri) => (
          <Reveal key={r.cat.slug} delay={150}>
            <ProductRail
              title={r.cat.name}
              products={r.items.slice(0, 10)}
              seeAllHref={`/products?category=${r.cat.slug}`}
              accentColor={(["cyan", "purple", "green"] as const)[ri % 3]}
            />
          </Reveal>
        ))}
      {/* ═══ FEATURE BAR — Animated counters ═══ */}
      <Reveal>
        <div ref={featureCountRef.ref} className="mb-8 rounded-2xl bg-gradient-to-r from-[#150726] via-[#2D1B69] to-[#150726] p-5 sm:p-6 grid grid-cols-3 gap-2 sm:gap-3 border border-white/15 relative overflow-hidden group shadow-2xl shadow-purple-900/40">
          <div className="fx-orb fx-orb-a" style={{ width: 200, height: 200, top: -80, right: -50, background: "rgba(233,30,99,0.18)" }} />
          <div className="fx-orb fx-orb-b" style={{ width: 220, height: 220, bottom: -100, left: -60, background: "rgba(0,188,212,0.16)" }} />
          {/* Animated gradient line */}
          <div className="strip-line absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#E91E63] via-[#7CB518] to-[#00BCD4]" />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00BCD4] via-[#7CB518] to-[#E91E63] opacity-60" />
          {[
            { icon: TrendingUp, value: lowestPriceCount, suffix: "+", title: "LOWEST\nPRICES", sub: "Best quality at best prices", color: "#E91E63" },
            { icon: Clock, value: deliveryCount, suffix: " min", title: "FAST\nDELIVERY", sub: "Superfast delivery at your site", color: "#00BCD4" },
            { icon: Lock, value: secureCount, suffix: "%", title: "SECURE\nPAYMENTS", sub: "100% safe & secure", color: "#7CB518" },
          ].map((f, i) => (
            <div key={f.title} className="assured-item flex flex-col items-center text-center relative z-10 group/feat cursor-pointer rounded-xl px-1 py-2 transition-all duration-300 hover:-translate-y-1 hover:bg-white/5">
              <div className="assured-orb h-11 w-11 rounded-xl flex items-center justify-center mb-2 group-hover/feat:scale-110 transition-all duration-300"
                style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}40`, animationDelay: `${i * 0.5}s` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <p className="text-title-md font-black text-white leading-none tabular-nums">
                {f.value}{f.suffix}
              </p>
              <p className="text-tiny font-black text-white/70 leading-tight whitespace-pre-line mt-1">{f.title}</p>
              <p className="text-tiny text-white/40 mt-0.5 leading-tight">{f.sub}</p>
            </div>
          ))}
        </div>
      </Reveal>
      </div>{/* ═══ /rails+gutter ═══ */}

      {/* ═══ BRAND STRIP ═══ */}
      <Reveal>
        <div className="market-container mb-6 px-4 pb-2 sm:px-6">
          <div className="section-header px-0 mb-4">
            <h2>Trusted Brands</h2>
            <Link href="/products?sort=rating" className="text-[#7CB518] text-body-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { name: "UltraTech", img: "/products/cement/Ultratech Cement.png" },
              { name: "ACC", img: "/products/cement/ACC Cement.png" },
              { name: "Ambuja", img: "/products/cement/Ambuja Cement.png" },
              { name: "Asian Paints", img: "/products/painting/Asian Paint.png" },
              { name: "Philips", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp" },
              { name: "Dr. Fixit", img: "/products/tiling/Dr Fixit.png" },
              { name: "Kajaria", img: "/products/tiling/Kajaria Adhesives Tiling.png" },
              { name: "Roff", img: "/products/tiling/Roff T1.png" },
            ].map((brand) => (
              <Link key={brand.name} href={`/products?search=${encodeURIComponent(brand.name)}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group w-[76px] sm:w-[88px]">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white border-2 border-[#DDD6EE] overflow-hidden flex items-center justify-center shadow-md shadow-purple-900/5 group-hover:border-[#7CB518] group-hover:shadow-lg group-hover:shadow-green-500/10 transition-all duration-300 group-hover:scale-110">
                  <Image src={brand.img} alt={brand.name} width={80} height={80} loading="lazy" draggable={false} className="h-full w-full object-contain p-1.5" />
                </div>
                <span className="text-tiny font-bold text-[#150726] group-hover:text-[#7CB518] transition-colors text-center leading-tight">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ═══ MATERIAL CALCULATOR ═══ */}
      <Reveal>
        <div className="market-container px-4 pt-2 pb-6 sm:px-6">
          <div className="rounded-2xl border-[1.5px] border-dashed border-[#2D1B69]/20 bg-gradient-to-r from-[#F0ECF9] to-[#E8F9FC] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg shadow-purple-900/5 hover:shadow-xl hover:shadow-purple-900/10 transition-shadow relative overflow-hidden group/calc">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#7CB518]/10 blur-2xl pointer-events-none" />
            <div className="h-10 w-10 rounded-2xl bg-[#2D1B69] flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="12" y2="14"/>
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left relative">
              <h3 className="text-body-md font-extrabold text-[#150726] flex items-center justify-center sm:justify-start gap-2">
                Material Calculator
                <span className="rounded-full bg-[#7CB518] px-2 py-0.5 text-tiny font-black text-white tracking-wide">FREE</span>
              </h3>
              <p className="text-caption text-[#9B8CB5]">Estimate paint, putty, primer & more for your room — in under a minute</p>
            </div>
            <Link
              href="/calculator"
              className="btn-shine flex items-center gap-2 bg-[#2D1B69] text-white text-caption font-bold px-5 py-2.5 rounded-full hover:bg-[#150726] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/20 group/calcbtn"
            >
              Calculate <ArrowRight className="h-3.5 w-3.5 group-hover/calcbtn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ═══ BULK / BUSINESS CTA ═══ */}
      <Reveal>
        <div className="market-container px-4 pb-6 sm:px-6">
          <div className="rounded-2xl bg-[#150726] px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 relative overflow-hidden border border-white/10 shadow-xl shadow-purple-900/30 group/rfq">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(124,181,24,0.45) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-[#2D1B69]/60 blur-3xl pointer-events-none" />
            <div className="flex-1 relative">
              <h3 className="text-body-md font-extrabold text-white">Buying in bulk for a project?</h3>
              <p className="text-caption text-white/55 mt-0.5 flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-[#7CB518] flex-shrink-0" />
                Get negotiated quotes from verified suppliers with GST invoicing
              </p>
            </div>
            <Link
              href="/rfq"
              className="btn-shine inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-button font-bold text-[#2D1B69] hover:bg-[#F0F9E8] transition-all flex-shrink-0 relative group/rfqbtn"
            >
              Start RFQ <ArrowRight className="h-4 w-4 group-hover/rfqbtn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ═══ STICKY CART BAR + QUICK DRAWER ═══ */}
      <StickyCartBar itemCount={cartCount} total={cartTotal} />
      <CartDrawer />

      {/* ═══ BACK TO TOP ═══ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed z-40 left-4 bg-[#150726] text-white p-3 rounded-full shadow-xl shadow-purple-900/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          showBackToTop ? "bottom-[150px] opacity-100 translate-y-0" : "bottom-24 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* ═══ BOTTOM NAV ═══ */}
      <SiteFooter className="pb-24 lg:pb-8" />
      <PushNotificationPrompt />
      <PwaInstallPrompt />
      <ComparisonBar />
      <BottomNav />

          {/* ═══ PINCODE MODAL ═══ */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-modal bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowPincodeModal(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 animate-slide-in-up max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-body-lg font-bold text-[#150726]">Enter Pincode</h3>
                <p className="text-micro text-[#9B8CB5] mt-0.5">Check delivery availability</p>
              </div>
              <button onClick={() => setShowPincodeModal(false)} aria-label="Close" className="p-1 text-[#9B8CB5] hover:text-[#150726] transition-colors hover:rotate-90 duration-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-3 items-stretch">
              <input
                type="text"
                value={pincode}
                autoFocus
                aria-label="Delivery pincode"
                onKeyDown={(e) => { if (e.key === "Escape") setShowPincodeModal(false); }}
                onChange={(e) => setPincode(onlyDigits(e.target.value, 6))}
                placeholder="Enter 6-digit pincode"
                className="flex-1 min-w-0 border-2 border-[#DDD6EE] rounded-xl px-4 h-12 text-body-lg font-semibold text-[#150726] focus:outline-none focus:border-[#7CB518] focus:ring-4 focus:ring-[#7CB518]/10 transition-all tabular-nums tracking-widest"
                maxLength={6}
              />
              <RippleButton
                onClick={() => { if (pincode.length === 6) setShowPincodeModal(false); }}
                disabled={pincode.length !== 6}
                className="bg-[#7CB518] text-white text-body-sm font-bold px-6 h-12 inline-flex items-center justify-center rounded-xl hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
              >
                Check
              </RippleButton>
            </div>
            <div className="flex items-center gap-2 mt-4 p-3 bg-[#7CB518]/5 rounded-xl border border-[#7CB518]/20">
              <Zap className="h-4 w-4 text-[#7CB518]" />
              <p className="text-caption text-[#150726]">Delivery available in <span className="font-bold text-[#7CB518]">60 minutes</span></p>
            </div>
            {/* Popular pincodes */}
            <div className="mt-4">
              <p className="text-tiny font-bold text-[#9B8CB5] uppercase mb-2">Popular Areas</p>
              <div className="flex flex-wrap gap-2">
                {["201301", "110001", "400001", "560001", "600001"].map((pc) => (
                  <button
                    key={pc}
                    onClick={() => setPincode(pc)}
                    className="px-3 py-1.5 bg-[#F0ECF9] border border-[#DDD6EE] rounded-full text-micro font-semibold text-[#2D1B69] hover:bg-[#E8E0F7] hover:border-[#C9B8E8] transition-all"
                  >
                    {pc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENU SIDEBAR ═══ */}
      {showMenu && (
        <div className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div className="w-72 h-full bg-[#150726] p-5 animate-slide-in-left overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Link href="/" onClick={() => setShowMenu(false)}>
                <ModitLogo className="h-[36px] w-auto" light={true} />
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <item.icon className="h-5 w-5 group-hover:text-[#7CB518] transition-colors" />
                  <span className="text-body-md font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-tiny font-bold text-white/30 uppercase px-4 mb-3">Categories</p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="h-6 w-6 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src={cat.img} alt={cat.name} width={24} height={24} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-body-sm font-medium">{cat.name.split("\n")[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEARCH MODAL ═══ */}
      {showSearch && (
        <div className="fixed inset-0 z-modal bg-black/60 backdrop-blur-md" onClick={() => { setShowSearch(false); setSearchQuery(""); setHighlightIdx(-1); }}>
          <div className="w-full bg-[#150726] p-4 animate-slide-in-up max-h-[85dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[1440px] mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setHighlightIdx(-1); }}
                    onKeyDown={(e) => {
                      const list = searchResults.length > 0 ? searchResults : [];
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightIdx((i) => Math.min(i + 1, list.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightIdx((i) => Math.max(i - 1, -1));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (highlightIdx >= 0 && list[highlightIdx]) {
                          handleSearchSubmit(list[highlightIdx].name);
                        } else if (searchQuery) {
                          handleSearchSubmit(searchQuery);
                        }
                      } else if (e.key === "Escape") {
                        setShowSearch(false);
                        setSearchQuery("");
                        setHighlightIdx(-1);
                      }
                    }}
                    placeholder={searchHint}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-10 py-3.5 text-body-lg text-white placeholder-white/40 focus:outline-none focus:border-[#7CB518]/50 focus:bg-white/15 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setHighlightIdx(-1); searchInputRef.current?.focus(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); setHighlightIdx(-1); }} className="p-3 text-white/60 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Autocomplete suggestions — when typing 1 char */}
              {searchQuery.length === 1 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => { setSearchQuery(p.name); setHighlightIdx(-1); }}
                        className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors border-b border-white/5 last:border-0 ${
                          highlightIdx === idx ? "bg-[#7CB518]/20" : "hover:bg-white/10"
                        }`}
                      >
                        <Search className="h-3.5 w-3.5 text-white/30" />
                        <div className="flex-1 min-w-0">
                          <p className="text-caption font-semibold text-white truncate"><HighlightedText text={p.name} query={searchQuery} /></p>
                          <p className="text-tiny text-white/40">{p.brand}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Search results — when >= 2 chars */}
              {searchResults.length > 0 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {searchResults.map((p, idx) => (
                    <Link
                      key={p.id}
                      href={productLink(p)}
                      onClick={() => { handleSearchSubmit(searchQuery); }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-white/5 last:border-0 ${
                        highlightIdx === idx ? "bg-[#7CB518]/20" : "hover:bg-white/10"
                      }`}
                    >
                      <img src={p.images[0]} alt={p.name} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 rounded-lg object-cover bg-white/5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-semibold text-white truncate"><HighlightedText text={p.name} query={searchQuery} /></p>
                        <p className="text-micro text-white/50">{p.brand} · {p.unit}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <p className="text-body-sm font-bold text-[#7CB518]">₹{p.price.toLocaleString("en-IN")}</p>
                        {p.mrp > p.price && (
                          <p className="text-tiny text-white/40 line-through">₹{p.mrp.toLocaleString("en-IN")}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { handleSearchSubmit(searchQuery); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-body-sm font-semibold text-[#7CB518] hover:bg-white/5 transition-colors"
                  >
                    View all results <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Search className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="text-body-sm text-white/50">No products found for &quot;{searchQuery}&quot;</p>
                  <p className="text-micro text-white/30 mt-1">Try searching for cement, paint, or lighting</p>
                </div>
              )}

              {/* Default state — recent + trending */}
              {searchQuery.length < 2 && (
                <div className="mt-3 space-y-3">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-micro font-bold text-white/40 uppercase">Recent Searches</p>
                        <button
                          onClick={() => { setRecentSearches([]); localStorage.removeItem("modit-recent-searches"); }}
                          className="text-tiny text-white/30 hover:text-[#E91E63] transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSearchSubmit(term)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-caption font-semibold text-white/70 hover:bg-[#7CB518]/20 hover:border-[#7CB518]/40 hover:text-[#7CB518] transition-all flex items-center gap-1.5"
                          >
                            <Clock className="h-3 w-3 opacity-50" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending / Popular */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-micro font-bold text-white/40 uppercase mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      Trending Now
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["UltraTech Cement", "Asian Paint", "Philips LED", "Dr Fixit", "Bostik", "Kajaria Tiles"].map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearchSubmit(term)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-caption font-semibold text-white/70 hover:bg-[#E91E63]/20 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-all"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick categories */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-micro font-bold text-white/40 uppercase mb-2">Browse Categories</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: "Cement", slug: "cement", color: "#2D1B69" },
                        { name: "Painting", slug: "painting", color: "#7CB518" },
                        { name: "Lighting", slug: "lighting", color: "#00BCD4" },
                        { name: "Tiling", slug: "tiling", color: "#E91E63" },
                      ].map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
                        >
                          <div className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                          <span className="text-caption font-semibold">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CART TOAST ═══ */}
      {cartToast && (
        <div className="cart-toast">
          <div className="h-8 w-8 rounded-lg bg-[#7CB518]/20 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-4 w-4 text-[#7CB518]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-caption font-semibold text-white truncate max-w-[180px]">{cartToast.name}</span>
            <span className="text-tiny text-white/50">Added to cart · ₹{cartToast.price.toLocaleString("en-IN")}</span>
          </div>
          <div className="toast-progress" />
        </div>
      )}

    </div>
  );
}
