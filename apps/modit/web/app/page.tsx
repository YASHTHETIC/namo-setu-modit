"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageGuard } from "@/components/product-thumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet, Menu,
  MapPin, ChevronDown, Zap, Truck, Clock, TrendingUp, Lock,
  ArrowRight, Star, ChevronRight, X, ChevronUp, Sparkles, ArrowUpRight, Heart,
  BadgeCheck, Undo2, Receipt, ShieldCheck
} from "lucide-react";
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
import { Tilt3D, Parallax } from "@/components/fx";
import { StickyCartBar } from "@/widgets/sticky-cart-bar";
import { CartDrawer } from "@/widgets/cart-drawer";
import { useCartUi } from "@/lib/cart-ui";
import { useProducts, useSearchProducts, type Product } from "@/lib/api-hooks";
import { useNearestWarehouse } from "@/lib/modit-api";
import { ActiveOrderBanner } from "@/components/active-order-banner";
import { categories as allCategories } from "@/lib/product-data";
import { CategoryTileIcon } from "@/components/modit-shell";

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
  const openDrawer = useCartUi((s) => s.openDrawer);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const headerHidden = useHideOnScroll(140);
  useModalBehavior(showPincodeModal, () => setShowPincodeModal(false));
  useModalBehavior(showSearch, () => { setShowSearch(false); setSearchQuery(""); setHighlightIdx(-1); });
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { pincode: ctxPincode, setPincode: setContextPincode, coords } = usePincode();
  const { data: nearest } = useNearestWarehouse(coords?.lat, coords?.lng);
  const searchHint = useRotatingText(SEARCH_HINTS);
  // Display value for the header/modal — seeded from the SAVED location
  // (context loads it from localStorage after mount); never a hardcoded pin.
  const [pincode, setPincodeLocal] = useState("");
  const setPincode = useCallback((val: string) => {
    setPincodeLocal(val);
    if (val.length === 6) setContextPincode(val);
  }, [setContextPincode]);

  const { data: allProducts = [] } = useProducts({ page_size: 2000 });
  const products = allProducts as Product[];
  const { data: searchResults = [] } = useSearchProducts(searchQuery);
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cartToast, setCartToast] = useState<{ name: string; price: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    setPincodeLocal(ctxPincode ?? "");
  }, [ctxPincode]);
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

  const cementProducts = useMemo(() => products.filter((p) => p.categorySlug === "cement"), [products]);
  const paintingProducts = useMemo(() => products.filter((p) => p.categorySlug === "painting"), [products]);
  const lightingProducts = useMemo(() => products.filter((p) => p.categorySlug === "lighting"), [products]);
  const tilingProducts = useMemo(() => products.filter((p) => p.categorySlug === "tiling"), [products]);
  const discountedProducts = useMemo(
    () => products.filter((p) => p.mrp > p.price).sort((a, b) => b.discount - a.discount).slice(0, 10),
    [products]
  );
  const popularProducts = useMemo(
    () => products.filter((p) => p.inStock).sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount)).slice(0, 10),
    [products]
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
  }, [products]);

  // Only show categories that actually have products in the live catalog.
  // While the catalog is still loading, fall back to the full static list.
  const visibleCategories = useMemo(() => {
    if (products.length === 0) return allCategories;
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
    return allCategories.filter((c) => (counts.get(c.slug) ?? 0) > 0);
  }, [products]);

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

      {/* ═══ HEADER — mobile: one row (menu · logo · search · cart).
           sm+: menu + logo + cart with the full search row below. ═══ */}
      <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="max-w-[1600px] lg:w-[84vw] mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          <RippleButton className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/5" onClick={() => setShowMenu(true)}>
            <Menu className="h-5 w-5" />
          </RippleButton>
          <div className="flex-1 flex justify-center sm:justify-center">
            <Link href="/" className="transition-all hover:scale-105 active:scale-95">
              <ModitLogo className="h-[40px] w-auto" light={true} />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(true)}
              aria-label="Search products"
              className="p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-white/5 sm:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
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
        {/* Search row — full width, opens the search sheet (hidden on the
            compact mobile row where the search icon opens the same sheet) */}
        <div className="mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 pb-3 hidden sm:block">
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

      {/* ═══ DELIVERY HEADER — one dense row on phones (Blinkit fit),
           full two-line hierarchy on sm+ ═══ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 sm:px-6 py-2 sm:py-2.5">
        <div className="max-w-[1600px] lg:w-[84vw] mx-auto flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg sm:rounded-xl bg-[#7CB518] leading-none shadow-lg shadow-green-500/25">
            <span className="text-caption font-black text-white">60</span>
            <span className="text-tiny font-black text-white/80">Min</span>
          </div>
          <button onClick={() => setShowPincodeModal(true)} className="min-w-0 flex-1 text-left group focus:outline-none">
            <p className="flex items-center gap-2 text-body-md font-extrabold text-white leading-tight">
              <span className="truncate">Deliver To <span className="text-[#7CB518]">{pincode ? pincode : "set location"}</span></span>
              <ChevronDown className="h-3 w-3 text-white/50 flex-shrink-0 group-hover:rotate-180 transition-transform duration-300" />
            </p>
            <p className="hidden sm:flex items-center gap-1 mt-0.5 text-white/70">
              <MapPin className="h-3 w-3 text-white/50 group-hover:text-[#7CB518] transition-colors flex-shrink-0" />
              <span className="text-caption font-semibold truncate">
                Delivery in <span className="text-[#7CB518] font-extrabold">60 min</span> — tap to change
              </span>
            </p>
          </button>
          {nearest && typeof nearest.distance_km === "number" && (
            <span className="hidden sm:block rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-tiny font-bold text-white/70 tabular-nums flex-shrink-0">
              {nearest.distance_km < 1 ? `${Math.round(nearest.distance_km * 1000)} m away` : `${nearest.distance_km.toFixed(1)} km away`}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-white/40 flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
            <span className="text-tiny font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* ═══ TRUST — active-order ETA banner (real data) + MODIT Assured ═══ */}
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6">
      <ActiveOrderBanner />
      {/* ═══ FREE DELIVERY PROMO STRIP — icon · slogan · divider · claim · Valid pill ═══ */}
      <div className="assure-stripes mt-2.5 sm:mt-3 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(100deg, #E91E63 0%, #C2185B 55%, #8A1250 100%)" }}>
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3">
          <span className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-md">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-[#E91E63]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-white font-black italic leading-none whitespace-nowrap tracking-tight text-body-lg sm:text-title-md" style={{ transform: "skewX(-6deg)" }}>FREE DELIVERY</p>
            <p className="text-tiny sm:text-body-sm font-bold text-white/85 mt-1 leading-tight">On orders ₹5000+</p>
          </div>
          <span className="hidden sm:block h-7 w-px bg-white/25 flex-shrink-0" />
          <p className="hidden sm:block text-tiny text-white/70 leading-tight flex-shrink-0">Fast, tracked, doorstep</p>
          <span className="flex-shrink-0 rounded-lg bg-white px-2.5 py-1 text-tiny font-black text-[#E91E63] shadow-sm">Valid</span>
        </div>
      </div>
      <div className="mt-3">
        {/* Reference-style dark assurance panel: centered shield title,
            4 icon columns, diagonal corner stripes.
            Copy stays strictly to real policies (no invented claims). */}
        <div className="assure-stripes relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#150726] via-[#1E1245] to-[#2D1B69] border border-white/10 px-2 py-2.5 sm:py-4">
          <div className="flex items-center justify-center gap-1.5 mb-2 sm:mb-3">
            <ShieldCheck className="h-4 w-4 text-[#7CB518]" />
            <p className="text-caption font-extrabold text-white tracking-wide">MODIT ASSURED</p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {[
              { icon: Undo2, title: "7-Day Returns", sub: "On delivered items", tint: "#7CB518" },
              { icon: Truck, title: "Free Delivery", sub: "On orders ₹5000+", tint: "#00BCD4" },
              { icon: Receipt, title: "GST Invoice", sub: "With every order", tint: "#E91E63" },
              { icon: BadgeCheck, title: "Genuine Products", sub: "Verified brands only", tint: "#F8CB46" },
            ].map((t) => (
              <div key={t.title} className="flex flex-col items-center gap-1 px-0.5 sm:gap-1.5 sm:px-1 text-center">
                <span className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center" style={{ background: `${t.tint}1F`, border: `1.5px solid ${t.tint}55` }}>
                  <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: t.tint }} />
                </span>
                <span className="text-tiny font-black leading-tight" style={{ color: t.tint }}>{t.title}</span>
                <span className="hidden sm:block text-tiny text-white/55 leading-tight">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ HERO BANNER — Blinkit photo-hero architecture, MODIT dark.
           Phone: compact banner (heading + one-liner + small tile).
           sm+: full-size with dual product tiles. ═══ */}
      <Reveal>
        <div className="mt-3 sm:mt-4 rounded-2xl overflow-hidden relative group" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2D8A 50%, #2D1B69 100%)" }}>
          <div className="relative z-10 p-3 sm:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-[#F8CB46] text-[#150726] text-tiny font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2">
                <Truck className="h-3 w-3" />
                FREE DELIVERY
              </div>
              <h1 className="text-white text-title-md sm:text-title-lg font-extrabold leading-tight">Site Material, On Door</h1>
              <p className="text-white/70 text-tiny sm:text-body-sm mt-0.5 sm:mt-1">Cement, paints, lights & more — in 60 minutes</p>
              <Link href="/products" className="mt-2 sm:mt-3 inline-flex items-center gap-2 bg-white text-[#150726] text-caption sm:text-body-sm font-bold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full hover:bg-[#F0ECF9] transition-all hover:scale-105 active:scale-95">
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex sm:items-center gap-2 flex-shrink-0 pr-0.5">
              <Parallax strength={12} className="flex-shrink-0">
                <div className="h-16 w-12 sm:h-28 sm:w-24 rounded-xl sm:rounded-[28px] bg-white p-1 sm:p-2 rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500 shadow-xl ring-2 sm:ring-4 ring-white/40">
                  <Image src="/products/cement/Ambuja Cement.png" alt="Cement bags" width={96} height={112} loading="lazy" draggable={false} className="h-full w-full object-contain" />
                </div>
              </Parallax>
              <div className="hidden sm:block flex-shrink-0">
                <Parallax strength={26}>
                  <div className="h-28 w-24 rounded-[28px] bg-white p-2 rotate-[4deg] group-hover:rotate-0 transition-transform duration-500 -ml-4 mt-6 shadow-xl ring-4 ring-white/40">
                    <Image src="/products/painting/Asian Paint.png" alt="Paint buckets" width={96} height={112} loading="lazy" draggable={false} className="h-full w-full object-contain" />
                  </div>
                </Parallax>
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
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x pb-1">
        {[
          { title: "Bulk Cement, Site Rates", sub: "Truck-load deals from top brands", tag: "BULK RATES", img: "/products/cement/Ambuja Cement.png", alt: "Cement", href: "/products?category=cement", bg: "#7CB518", dark: false, cta: "Order Now" },
          { title: "Paints & Waterproofing", sub: "Asian Paints, Dr Fixit & more", tag: "TOP BRANDS", img: "/products/painting/Asian Paint.png", alt: "Paint", href: "/products?category=painting", bg: "#2D1B69", dark: false, cta: "Order Now" },
          { title: "Site Lighting", sub: "Philips LEDs, panels & battens", tag: "NEW RANGE", img: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp", alt: "LED lights", href: "/products?category=lighting", bg: "#00BCD4", dark: false, cta: "Order Now" },
          { title: "Tiles & Fix-It Range", sub: "Adhesives, grouts & repair", tag: "PRO CHOICE", img: "/products/tiling/Dr Fixit.png", alt: "Waterproofing and tile care", href: "/products?category=tiling", bg: "#F8CB46", dark: true, cta: "Order Now" },
        ].map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="snap-start shrink-0 w-[222px] sm:w-[320px] rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: p.bg }}
          >
            <div className="flex-1 min-w-0">
              <h3 className={`text-caption sm:text-body-md font-extrabold leading-tight ${p.dark ? "text-[#150726]" : "text-white"}`}>{p.title}</h3>
              <p className={`hidden sm:block text-micro mt-1 leading-snug ${p.dark ? "text-[#150726]/70" : "text-white/85"}`}>{p.sub}</p>
              <span className={`mt-1.5 sm:mt-2.5 inline-block px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-tiny sm:text-caption font-bold ${p.dark ? "bg-[#150726] text-white" : "bg-white text-[#150726]"}`}>
                {p.cta}
              </span>
            </div>
            <Tilt3D max={9} className="flex-shrink-0">
              <div className="relative">
                <div className="h-16 w-16 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[28px] bg-white p-1 sm:p-2 shadow-xl ring-2 sm:ring-4 ring-white/40">
                  <Image src={p.img} alt={p.alt} width={128} height={128} loading="lazy" draggable={false} className="h-full w-full object-contain" />
                </div>
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 sm:px-2 py-0.5 rounded-full text-micro sm:text-tiny font-black tracking-wide shadow-md ${p.dark ? "bg-[#150726] text-[#F8CB46]" : "bg-[#150726] text-white"}`}>
                  {p.tag}
                </span>
              </div>
            </Tilt3D>
          </Link>
        ))}
      </div>

      {/* ═══ CATEGORY GRID — Blinkit-style uniform tiles ═══ */}
      <Reveal delay={150}>
        <div className="mt-4 sm:mt-5">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link href="/products" className="text-[#7CB518] text-body-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Blinkit Home pattern: EVERY category on the first page.
              Mobile: mock-style 4-col grid, first 12 tiles (3 rows) with the
              header's See-all for the rest; sm+ shows the full wall. */}
          <div className="grid grid-cols-6 gap-x-2 gap-y-3 pb-1 sm:grid-cols-6 sm:gap-4 lg:grid-cols-10 [&>*:nth-child(n+13)]:hidden sm:[&>*:nth-child(n+13)]:flex">
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
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className={`relative w-full aspect-square rounded-2xl bg-white border border-[#DDD6EE] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500/10 group-hover:scale-105 ${
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
                        sizes="(min-width: 1024px) 128px, (min-width: 640px) 96px, 56px"
                        loading="lazy"
                        draggable={false}
                        className="object-contain p-1 sm:p-1.5 animate-fade-in transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <CategoryTileIcon slug={cat.slug} className="h-9 w-9 text-[#2D1B69] transition-transform duration-500 group-hover:scale-110" />
                    )}
                  </div>
                  <p className="text-micro sm:text-caption font-bold text-[#150726] text-center leading-tight line-clamp-2 min-h-[26px] sm:min-h-[30px] group-hover:text-[#7CB518] transition-colors">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ═══ RECENTLY VIEWED — personal, right after categories ═══ */}
      <div>
        <RecentlyViewed />
      </div>
      </div>{/* ═══ /shared edge A ═══ */}

      {/* ═══ FLASH DEALS ═══ */}
      <FlashDeals />

      {/* ═══ PRODUCT RAILS + FEATURE BAR — same shared edge ═══ */}
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6">
      <div className="pb-4 sm:pb-8">
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
      {/* ═══ FEATURE CHIPS — light reference-style row: title left, icon right,
          diagonal stripes. Replaces the dark counter band (no invented numbers). ═══ */}
      <Reveal>
        <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: TrendingUp, title: "LOWEST PRICES", sub: "Best quality at best prices", color: "#E91E63" },
            { icon: Clock, title: "60 MINS DELIVERY", sub: "Superfast, to your site", color: "#7CB518" },
            { icon: Lock, title: "SECURE PAYMENTS", sub: "100% safe & secure", color: "#00BCD4" },
          ].map((f) => (
            <div key={f.title} className="assure-stripes-light relative overflow-hidden rounded-2xl bg-white border border-[#DDD6EE] p-3 sm:p-4 group/feat">
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-caption font-black leading-tight tracking-tight" style={{ color: f.color }}>{f.title}</p>
                  <p className="hidden sm:block text-tiny sm:text-caption text-[#9B8CB5] leading-tight mt-1">{f.sub}</p>
                </div>
                <span
                  className="h-7 w-7 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-300 group-hover/feat:scale-110"
                  style={{ background: `${f.color}15`, border: `1.5px solid ${f.color}35` }}
                >
                  <f.icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" style={{ color: f.color }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      </div>
      </div>{/* ═══ /shared edge B (rails + feature) ═══ */}

      {/* ═══ BRAND STRIP ═══ */}
      <Reveal>
        <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 mb-6 pb-2">
          <div className="section-header px-0 mb-4">
            <h2>Trusted Brands</h2>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { name: "UltraTech", img: "/products/cement/Ultratech Cement.png" },
              { name: "ACC", img: "/products/cement/ACC Cement.png" },
              { name: "Ambuja", img: "/products/cement/Ambuja Cement.png" },
              { name: "Asian Paints", img: "/products/painting/Asian Paint.png" },
              { name: "Philips", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp" },
              { name: "Dr. Fixit", img: "/products/tiling/Dr Fixit.png" },
              { name: "Kajaria", img: "/products/tiling/Kajaria Adhesives Tiling.png" },
              { name: "Roff", img: "/products/tiling/Roff T1.png" },
              { name: "Hettich", img: "/products/hinges/Hettich Clamps for KA Channels.png" },
              { name: "Crompton", img: "/products/lighting/crompton-led-star-slim-recess-panel-round-6k-1678368249930_SKU-0684_0-1756465491712-Photoroom.png" },
              { name: "Jaquar", img: "/products/sanitary/32-45-8-wash-basin-over-counter-for-bathroom-45-x-32-x-10-cm-original-imahdff46mfrfvtu.webp" },
              { name: "Legrand", img: "/products/switches/1000023225_25325e44-5c03-4885-8994-7222219bde89_250x2502x 1.webp" },
              { name: "Fevicol", img: "/products/hardware-tools/Fevicol Craft and General Adhesives 2 Fevistik 15gm 2.jpg" },
              { name: "Havells", img: "/products/switches/6-ampere-rectangular-polycarbonate-havells-modular-switch--957.jpg" },
              { name: "Birla White", img: "/products/painting/Birla Putty.png" },
              { name: "Stanley", img: "/products/hardware-tools/STANLEY 15 mx Long Measuring Tape Yellow STHT38515-812.png" },
            ].map((brand) => (
              <Link key={brand.name} href={`/products?search=${encodeURIComponent(brand.name)}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group w-[62px] sm:w-[76px]">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white border-2 border-[#DDD6EE] overflow-hidden flex items-center justify-center group-hover:border-[#7CB518] group-hover:shadow-lg group-hover:shadow-green-500/10 transition-all duration-300 group-hover:scale-110">
                  <Image src={brand.img} alt={brand.name} width={80} height={80} loading="lazy" draggable={false} className="h-full w-full object-contain p-1.5" />
                </div>
                <span className="text-tiny font-bold text-[#150726] group-hover:text-[#7CB518] transition-colors text-center leading-tight line-clamp-1">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ═══ MATERIAL CALCULATOR + BULK CTA — one compact band (side-by-side
           on mobile, stacked full-width rows on desktop) ═══ */}
      <Reveal>
        <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 gap-3 sm:block">
            {/* Calculator */}
            <Link
              href="/calculator"
              className="rounded-2xl border-[1.5px] border-dashed border-[#2D1B69]/20 bg-gradient-to-r from-[#F0ECF9] to-[#E8F9FC] p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left transition-transform hover:scale-[1.02] active:scale-[0.99] sm:mb-6"
            >
              <div className="h-10 w-10 rounded-2xl bg-[#2D1B69] flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="16" y2="10"/>
                  <line x1="8" y1="14" x2="12" y2="14"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-body-md font-extrabold text-[#150726]">Material Calculator</h3>
                <p className="text-caption text-[#9B8CB5] hidden sm:block">Estimate paint, putty, primer & more for your room</p>
              </div>
              <span className="btn-shine hidden sm:inline-flex items-center gap-2 bg-[#2D1B69] text-white text-caption font-bold px-5 py-2.5 rounded-full hover:bg-[#150726] transition-all shadow-lg shadow-purple-900/20 flex-shrink-0">
                Calculate <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <ArrowRight className="h-4 w-4 text-[#2D1B69] sm:hidden" />
            </Link>
            {/* Bulk / business */}
            <Link
              href="/rfq"
              className="rounded-2xl bg-[#150726] px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 text-center sm:text-left transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-body-md font-extrabold text-white">Buying in bulk for a project?</h3>
                <p className="text-caption text-white/55 mt-0.5 hidden sm:block">Get negotiated quotes from verified suppliers with GST invoicing</p>
              </div>
              <span className="btn-shine hidden sm:inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-button font-bold text-[#2D1B69] hover:bg-[#F0ECF9] transition-all flex-shrink-0">
                Start RFQ <ArrowRight className="h-4 w-4" />
              </span>
              <span className="h-8 w-8 sm:hidden rounded-full bg-white/10 flex items-center justify-center mx-auto">
                <ArrowRight className="h-4 w-4 text-[#7CB518]" />
              </span>
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
        className={`fixed z-40 left-4 hidden sm:flex bg-[#150726] text-white p-3 rounded-full shadow-xl shadow-purple-900/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
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
                    <Image src={cat.img} alt={cat.name} width={24} height={24} loading="lazy" className="h-full w-full object-contain" />
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
            <div className="max-w-[1600px] mx-auto">
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
                      <ImageGuard src={p.images?.[0]} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover bg-white/5" />
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
