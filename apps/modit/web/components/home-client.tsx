"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageGuard } from "@/components/product-thumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet, Menu,
  MapPin, ChevronDown, Zap, Truck, Clock, TrendingUp, Lock,
  ArrowRight, Star, X, ChevronUp, ChevronRight, Sparkles, ArrowUpRight, Heart,
  BadgeCheck, Undo2, ReceiptIndianRupee, ShieldCheck, Smartphone, Download
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthReady } from "@/lib/use-auth";
import { ModitLogo } from "@/components/modit-logo";
import { RecentlyViewed } from "@/components/recently-viewed";
import { FlashDeals } from "@/components/flash-deals";
import { usePincode } from "@/lib/pincode-context";
import { onlyDigits, productLink } from "@/lib/utils";
import { useRotatingText, SEARCH_HINTS } from "@/lib/use-rotating-text";
import { ProductRail } from "@/widgets/product-rail";
import { HighlightedText } from "@/components/highlighted-text";
import { getSearchSuggestions } from "@/lib/search-suggestions";
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
import { AppDownloadSection } from "@/components/app-download-section";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { AiProjectKitsSection } from "@/components/ai-project-kits";
import { useIsStandalone } from "@/lib/pwa";
import { BorderBeam } from "@/components/border-beam";
import { Marquee } from "@/components/marquee";
import { NumberTicker } from "@/components/number-ticker";
import { Magnetic } from "@/components/magnetic";
import { Cube3D } from "@/components/cube-3d";
import { Particles3DVfx } from "@/components/particles-3d-vfx";

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
export default function HomeClient() {
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const router = useRouter();
  const openDrawer = useCartUi((s) => s.openDrawer);
  const loggedIn = useAuthReady();
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
  const desktopSuggestions = useMemo(
    () => (searchQuery.trim().length >= 1 ? getSearchSuggestions(searchQuery, products, 6) : []),
    [searchQuery, products]
  );
  const isApp = useIsStandalone();
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
  // ═══ AUTO-SLIDE: the promo deals rail rotates by itself (manager request:
  // "Auto slide nhi ho rhi"). Pauses while hovered/touched, resumes after
  // 8s idle, loops back to start, never fights prefers-reduced-motion. ═══
  const promoRef = useRef<HTMLDivElement>(null);
  const promoPauseUntilRef = useRef(0);
  const promoHoverRef = useRef(false);

  useEffect(() => {
    const el = promoRef.current;
    if (!el) return;
    // Reduced motion: still advance (so the rail isn't stuck), just without
    // the smooth animation those users asked to avoid.
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const touch = () => { promoPauseUntilRef.current = Date.now() + 8000; };
    const enter = () => { promoHoverRef.current = true; };
    const leave = () => { promoHoverRef.current = false; };
    el.addEventListener("pointerdown", touch, { passive: true });
    el.addEventListener("wheel", touch, { passive: true });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    const timer = window.setInterval(() => {
      const paused =
        promoHoverRef.current || Date.now() < promoPauseUntilRef.current;
      if (paused || document.hidden) return;
      const card = el.querySelector<HTMLElement>("a[data-promo-card]");
      const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.6;
      const max = el.scrollWidth - el.clientWidth - 4;
      if (max <= 0) return;
      if (el.scrollLeft >= max) {
        el.scrollTo({ left: 0, behavior });
      } else {
        el.scrollBy({ left: step, behavior });
      }
    }, 4000);
    return () => {
      window.clearInterval(timer);
      el.removeEventListener("pointerdown", touch);
      el.removeEventListener("wheel", touch);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
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
    { name: "Cement", slug: "cement", img: "/products/cement/Ambuja Cement.png", count: 14, color: "#2D1B69" },
    { name: "Painting", slug: "painting", img: "/products/painting/Asian Paint.png", count: 98, color: "#7CB518" },
    { name: "Lighting", slug: "lighting", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp", count: 45, color: "#00BCD4" },
    { name: "Tiling", slug: "tiling", img: "/products/tiling/Dr Fixit.png", count: 68, color: "#E91E63" },
    { name: "Conduits & GI Boxes", slug: "conduits", img: "/products/conduits/PRINS-PVC-Conduit-Pipe-20-mm-Heavy-for-Electrical-Fittings.png", count: 37, color: "#FF9800" },
    { name: "Hardware & Tools", slug: "hardware-tools", img: "/products/hardware-tools/250g Wooden Handle Claw Hammer.png", count: 103, color: "#607D8B" },
    { name: "Hinges & Handles", slug: "hinges", img: "/products/hinges/Ebco Sleek Telescopic Drawer Channel Regular Close 35 Kg Capacity Zinc.png", count: 104, color: "#795548" },
    { name: "Pipes & Tanks", slug: "pipes", img: "/products/pipes/Ashirvad Flowguard Plus CPVC Ball Valve.png", count: 116, color: "#00BCD4" },
    { name: "Sanitary & Bath", slug: "sanitary", img: "/products/sanitary/32-45-8-wash-basin-over-counter-for-bathroom-45-x-32-x-10-cm-original-imahdff46mfrfvtu.webp", count: 157, color: "#2196F3" },
    { name: "Waterproofing", slug: "waterproofing", img: "/products/waterproofing/Asian Paints SmartCare Damp Proof Advanced.png", count: 21, color: "#009688" },
    { name: "Fans & Exhaust", slug: "fans", img: "/products/fans/Aero 400.png", count: 42, color: "#673AB7" },
    { name: "Door Locks", slug: "locks", img: "/products/locks/Atom.png", count: 52, color: "#3F51B5" },
    { name: "Fevicol Adhesives", slug: "fevicol", img: "/products/fevicol/Fevicol HeatX Heatproof Adhesive 1 Ltr.png", count: 56, color: "#E91E63" },
    { name: "Home Appliances", slug: "appliances", img: "/products/appliances/ArnoNeo6L2022PackagingFrontView_1.webp", count: 56, color: "#FF5722" },
    { name: "Kitchen Sinks", slug: "kitchen", img: "/products/kitchen/Florentine Prime Sink Cock Table Mounted Swinging Spout.jpeg", count: 40, color: "#00BCD4" },
    { name: "Plywood & MDF", slug: "plywood", img: "/products/plywood/12mm Sainik 710 Plywood Board 8x4 ft at.png", count: 44, color: "#795548" },
    { name: "Switches & Sockets", slug: "switches", img: "/products/switches/6-ampere-rectangular-polycarbonate-havells-modular-switch--957.jpg", count: 166, color: "#607D8B" },
    { name: "Designer Tiles", slug: "tiles", img: "/products/tiles/Blue-Granite.png", count: 19, color: "#9C27B0" },
    { name: "Wardrobe Fittings", slug: "wardrobe", img: "/products/wardrobe/45mm-Telescopic-Channel.png", count: 25, color: "#4CAF50" },
    { name: "Wires, MCB & Boards", slug: "electrical", img: "/products/electrical/0020082_havells-25-sq-mm-180-mtr-frls-house-wire_600-Photoroom.png", count: 42, color: "#FF9800" },
  ];

  /** Photo tiles for headline categories; the rest use brand icons. */
  const TILE_IMAGES: Record<string, { img: string; color: string }> = Object.fromEntries(
    categories.map((c) => [c.slug, { img: c.img, color: c.color }])
  );

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══ HEADER — 2028 Obsidian Glass: mobile (menu · logo · search · cart), sm+ with search bar ═══ */}
      <header className={`sticky top-0 z-50 glass-cyber border-b border-white/10 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`} style={{ paddingTop: "var(--safe-t)" }}>
        <div className="max-w-[1600px] lg:w-[84vw] mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          <RippleButton className="p-2 text-white/80 hover:text-white transition-colors rounded-xl hover:bg-white/10" onClick={() => setShowMenu(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </RippleButton>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="transition-all hover:scale-105 active:scale-95 group">
              <ModitLogo className="h-[40px] w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" light={true} />
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSearch(true)}
              aria-label="Search products"
              className="p-2 text-white/80 hover:text-white transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-white/10 sm:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => openDrawer()} aria-label="Open cart" className="relative p-2.5 text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 rounded-xl hover:bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-[20px] min-w-[20px] rounded-full bg-[#E91E63] text-tiny font-black text-white flex items-center justify-center px-1 shadow-[0_0_12px_rgba(233,30,99,0.7)] animate-cart-pop border border-white/30">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Desktop inline search bar with Blinkit-style live autocomplete dropdown */}
        <div className="mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 pb-3 hidden sm:block relative">
          <div className="relative w-full">
            <div className="flex h-12 items-center rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE7F6] shadow-sm px-3.5 transition-all focus-within:shadow-[0_0_20px_rgba(124,181,24,0.25)] focus-within:border-[#7CB518]">
              <Search className="h-4.5 w-4.5 text-[#9B8CB5] flex-shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    handleSearchSubmit(searchQuery);
                  } else if (e.key === "Escape") {
                    setSearchQuery("");
                  }
                }}
                placeholder={searchHint}
                className="h-full flex-1 bg-transparent text-body-md text-[#150726] placeholder:text-[#9B8CB5] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-[#9B8CB5] hover:text-[#150726] hover:bg-[#F0ECF9] transition-colors cursor-pointer mr-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSearchSubmit(searchQuery)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#2D1B69] to-[#1E0D36] hover:from-[#1E0D36] hover:to-[#150726] text-white text-caption font-black transition-all shadow-md shadow-purple-950/30 cursor-pointer hover:scale-102 active:scale-98"
              >
                Search
              </button>
            </div>

            {/* Desktop Autocomplete Dropdown */}
            {searchQuery.trim().length >= 1 && desktopSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#EDE7F6] shadow-[0_24px_50px_rgba(21,7,38,0.25)] overflow-hidden animate-slide-down">
                {desktopSuggestions.map((s) => (
                  <button
                    key={s.text}
                    type="button"
                    onClick={() => handleSearchSubmit(s.query)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F8F6FC] border-b border-[#F0ECF9] last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-[#F7F4FC] border border-[#EDE7F6] flex-shrink-0 flex items-center justify-center">
                      {s.image ? (
                        <ImageGuard src={s.image} alt={s.text} fill sizes="36px" className="object-contain p-1" />
                      ) : (
                        <Search className="h-4 w-4 text-[#9B8CB5]" />
                      )}
                    </div>
                    <p className="truncate text-body-sm font-medium text-[#150726]">
                      <HighlightedText text={s.text} query={searchQuery} markClassName="font-black text-[#2D1B69]" />
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSearchSubmit(searchQuery)}
                  className="flex w-full items-center justify-center gap-1.5 bg-gradient-to-r from-[#F7F4FC] to-[#F0ECF9] hover:from-[#F0ECF9] hover:to-[#E8E0F7] px-4 py-3 text-caption font-extrabold text-[#2D1B69] transition-colors cursor-pointer border-t border-[#EDE7F6]"
                >
                  See all results for &ldquo;{searchQuery}&rdquo; <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Futuristic Laser Horizon Line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#7CB518]/60 via-[#00BCD4]/70 to-transparent" />
      </header>

      {/* ═══ DELIVERY HEADER — 2028 Cyber Bar ═══ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 sm:px-6 py-2 sm:py-2.5">
        <div className="max-w-[1600px] lg:w-[84vw] mx-auto flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#7CB518] to-[#5A8010] leading-none shadow-[0_0_15px_rgba(124,181,24,0.35)] border border-emerald-400/30">
            <span className="text-caption font-black text-white">60</span>
            <span className="text-tiny font-black text-white/90">Min</span>
          </div>
          <button onClick={() => setShowPincodeModal(true)} className="min-w-0 flex-1 text-left group focus:outline-none cursor-pointer">
            <p className="flex items-center gap-2 text-body-md font-extrabold text-white leading-tight">
              <span className="truncate">Deliver To <span className="text-[#7CB518] drop-shadow-[0_0_8px_rgba(124,181,24,0.5)]">{pincode ? pincode : "set location"}</span></span>
              <ChevronDown className="h-3.5 w-3.5 text-white/60 flex-shrink-0 group-hover:rotate-180 transition-transform duration-300" />
            </p>
            <p className="hidden sm:flex items-center gap-1.5 mt-0.5 text-white/70">
              <MapPin className="h-3 w-3 text-white/50 group-hover:text-[#7CB518] transition-colors flex-shrink-0" />
              <span className="text-caption font-semibold truncate">
                Express Dispatch in <span className="text-[#7CB518] font-black">60 min</span> — tap to change
              </span>
            </p>
          </button>
          {nearest && typeof nearest.distance_km === "number" && (
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-tiny font-bold text-white/80 tabular-nums flex-shrink-0 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00BCD4] animate-ping" />
              {nearest.distance_km < 1 ? `${Math.round(nearest.distance_km * 1000)} m away` : `${nearest.distance_km.toFixed(1)} km away`}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-white/60 flex-shrink-0 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <div className="h-2 w-2 rounded-full bg-[#7CB518] shadow-[0_0_8px_#7CB518] animate-pulse" />
            <span className="text-tiny font-extrabold uppercase tracking-wider text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* ═══ FREE DELIVERY PROMO STRIP — 2028 Cyber Gradient ═══ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(95deg, #AD1457 0%, #E91E63 45%, #8A1250 100%)" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_70%)]" />
        <div className="max-w-[1600px] lg:w-[84vw] mx-auto relative z-10 flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3">
          <span className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-[#E91E63]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-white font-black leading-none whitespace-nowrap tracking-tight text-body-lg sm:text-title-md flex items-center gap-2">
              FREE SITE DELIVERY
              <span className="hidden md:inline-block text-micro font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">2028 PRO DISPATCH</span>
            </p>
            <p className="text-tiny sm:text-body-sm font-semibold text-white/90 mt-1 leading-tight">On all orders ₹5,000+ across all categories</p>
          </div>
          <span className="hidden sm:block h-7 w-px bg-white/25 flex-shrink-0" />
          <p className="hidden sm:block text-tiny text-white/80 leading-tight flex-shrink-0 font-medium">Fast · Tracked · Doorstep</p>
          <span className="flex-shrink-0 rounded-full bg-white px-3 py-1 text-tiny font-black text-[#E91E63] shadow-md shadow-black/15">AUTO-APPLIED</span>
        </div>
      </div>


      {/* ═══ TRUST & HERO ═══ */}
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6">
      <ActiveOrderBanner />

      {/* ═══ HERO BANNER — 2028 Futuristic Cyber Standard ═══ */}
      <Reveal>
        <div className="mt-3 sm:mt-4 rounded-3xl overflow-hidden relative group border border-white/15 shadow-[0_20px_50px_rgba(21,7,38,0.5)] gradient-pan" style={{ background: "linear-gradient(135deg, #0b0318 0%, #150726 40%, #2D1B69 75%, #4A2D8A 100%)", backgroundSize: "200% 200%" }}>
          {/* Dual Opposing Traveling Laser Glow Beams */}
          <BorderBeam duration={7} colorFrom="#7CB518" colorTo="#00BCD4" borderWidth={2} />
          <BorderBeam duration={7} delay={-3.5} reverse={true} colorFrom="#F8CB46" colorTo="#E91E63" borderWidth={2} />

          {/* 3D Holographic Particle Matrix VFX */}
          <Particles3DVfx particleCount={36} speed={0.8} />

          {/* 2028 Ambient Fluid Aurora Mesh & Drifting Orbs */}
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_25%,_rgba(124,181,24,0.35)_0%,_transparent_45%),radial-gradient(circle_at_80%_75%,_rgba(0,188,212,0.35)_0%,_transparent_45%),radial-gradient(circle_at_50%_40%,_rgba(248,203,70,0.25)_0%,_transparent_50%)] animate-pulse" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#7CB518]/30 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#00BCD4]/35 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/3 h-56 w-56 -translate-y-1/2 rounded-full bg-[#F8CB46]/25 blur-3xl" />

          <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 px-3.5 py-1.5 text-tiny font-black text-white mb-3.5 shadow-glass-specular">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7CB518]"></span>
                  </span>
                  <span className="text-[#F8CB46] font-black tracking-wider uppercase">60-MIN SITE DROP</span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/90">FREE OVER ₹5,000</span>
                  <span className="text-white/40">·</span>
                  <span className="text-[#00BCD4] font-black uppercase">LIVE GPS</span>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="text-white text-title-lg sm:text-display font-black leading-tight tracking-tight">
                  Site Material, <span className="text-holo drop-shadow-[0_0_25px_rgba(124,181,24,0.5)]">On Door</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-white/85 text-caption sm:text-body-md mt-2.5 leading-relaxed">
                  Direct factory cement, paints, tiles, electricals &amp; steel — dispatched in 60 minutes with official GST tax invoices
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-5 flex items-center gap-3">
                  <Magnetic strength={8}>
                    <Link href="/products" className="btn-shine specular-sheen inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#F7F4FC] to-white text-[#150726] text-caption sm:text-body-sm font-black px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(248,203,70,0.4)] border border-white/60 cursor-pointer group/cta">
                      Explore Catalog
                      <ArrowRight className="h-4 w-4 group-hover/cta:translate-x-1.5 transition-transform text-[#2D1B69]" />
                    </Link>
                  </Magnetic>
                  <Link href="/rfq" className="hidden sm:inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-caption sm:text-body-sm font-bold px-4 py-2.5 sm:py-3 rounded-full border border-white/20 backdrop-blur-md transition-all hover:scale-102">
                    <span>Bulk RFQ</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#7CB518]" />
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* 3D Levitating Product Stage */}
            <div className="flex sm:items-center gap-3 sm:gap-4 flex-shrink-0 pr-1">
              <div className="hidden sm:block flex-shrink-0 mr-1">
                <Cube3D />
              </div>
              <Tilt3D max={18} className="flex-shrink-0">
                <div className="relative group/p1">
                  <div className="h-24 w-20 sm:h-36 sm:w-32 rounded-3xl bg-gradient-to-b from-white/95 to-white/85 p-2 sm:p-3 rotate-[-6deg] group-hover/p1:rotate-0 transition-all duration-500 shadow-[0_25px_50px_rgba(0,0,0,0.5)] ring-2 sm:ring-4 ring-white/60 group-hover/p1:ring-[#7CB518] backdrop-blur-md specular-sheen">
                    <Image src="/products/cement/Ambuja Cement.png" alt="Ambuja Cement" width={128} height={144} loading="lazy" draggable={false} className="h-full w-full object-contain filter drop-shadow-md" />
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#150726]/90 border border-[#7CB518]/50 text-tiny font-black text-[#7CB518] shadow-md uppercase tracking-wider">
                    Cement
                  </span>
                </div>
              </Tilt3D>
              <div className="hidden sm:block flex-shrink-0">
                <Tilt3D max={18}>
                  <div className="relative group/p2 -ml-6 mt-8">
                    <div className="h-36 w-32 rounded-3xl bg-gradient-to-b from-white/95 to-white/85 p-3 rotate-[6deg] group-hover/p2:rotate-0 transition-all duration-500 shadow-[0_25px_50px_rgba(0,0,0,0.5)] ring-4 ring-white/60 group-hover/p2:ring-[#00BCD4] backdrop-blur-md specular-sheen">
                      <Image src="/products/painting/Asian Paint.png" alt="Asian Paint" width={128} height={144} loading="lazy" draggable={false} className="h-full w-full object-contain filter drop-shadow-md" />
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#150726]/90 border border-[#00BCD4]/50 text-tiny font-black text-[#00BCD4] shadow-md uppercase tracking-wider">
                      Paint
                    </span>
                  </div>
                </Tilt3D>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ═══ GLOBAL TRUST STRIP — 2028 Obsidian Elevation Cards ═══ */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#E8E0F7] p-3.5 shadow-sm hover:shadow-[0_10px_25px_rgba(124,181,24,0.18)] hover:border-[#7CB518]/60 transition-all duration-300 hover:-translate-y-0.5 group">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7CB518]/15 text-[#7CB518] border border-[#7CB518]/30 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(124,181,24,0.2)]">
            <Truck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-caption sm:text-body-sm font-black text-[#150726] leading-tight truncate">60-Min Site Drop</h4>
            <p className="text-micro text-[#6B5B83] leading-snug truncate mt-0.5">Express GPS doorstep delivery</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#E8E0F7] p-3.5 shadow-sm hover:shadow-[0_10px_25px_rgba(248,203,70,0.2)] hover:border-[#F8CB46]/70 transition-all duration-300 hover:-translate-y-0.5 group">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8CB46]/20 text-[#B45309] border border-[#F8CB46]/35 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(248,203,70,0.2)]">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-caption sm:text-body-sm font-black text-[#150726] leading-tight truncate">100% Genuine Brands</h4>
            <p className="text-micro text-[#6B5B83] leading-snug truncate mt-0.5">Direct authorized mill depots</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#E8E0F7] p-3.5 shadow-sm hover:shadow-[0_10px_25px_rgba(233,30,99,0.18)] hover:border-[#E91E63]/60 transition-all duration-300 hover:-translate-y-0.5 group">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E91E63]/15 text-[#E91E63] border border-[#E91E63]/30 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(233,30,99,0.2)]">
            <ReceiptIndianRupee className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-caption sm:text-body-sm font-black text-[#150726] leading-tight truncate">GST Tax Invoice</h4>
            <p className="text-micro text-[#6B5B83] leading-snug truncate mt-0.5">Instant B2B credit download</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#E8E0F7] p-3.5 shadow-sm hover:shadow-[0_10px_25px_rgba(0,188,212,0.18)] hover:border-[#00BCD4]/60 transition-all duration-300 hover:-translate-y-0.5 group">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00BCD4]/15 text-[#0097A7] border border-[#00BCD4]/30 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(0,188,212,0.2)]">
            <Undo2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-caption sm:text-body-sm font-black text-[#150726] leading-tight truncate">7-Day Site Returns</h4>
            <p className="text-micro text-[#6B5B83] leading-snug truncate mt-0.5">Hassle-free unopened pickup</p>
          </div>
        </div>
      </div>

      {/* ═══ PROMO CARDS — Blinkit solid-color row, Materials on Door edition ═══ */}
      <div className="section-header !pb-1">
        <h2>Site essentials, top deals</h2>
      </div>
      <div
        ref={promoRef}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x pb-1 scroll-smooth"
      >
        {[
          { title: "Bulk Cement, Site Rates", sub: "Truck-load deals from top brands", tag: "BULK RATES", img: "/products/cement/Ambuja Cement.png", alt: "Cement", href: "/products?category=cement", bg: "#7CB518", dark: false, cta: "Order Now" },
          { title: "Paints & Waterproofing", sub: "Asian Paints, Dr Fixit & more", tag: "TOP BRANDS", img: "/products/painting/Asian Paint.png", alt: "Paint", href: "/products?category=painting", bg: "#2D1B69", dark: false, cta: "Order Now" },
          { title: "Site Lighting", sub: "Philips LEDs, panels & battens", tag: "NEW RANGE", img: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp", alt: "LED lights", href: "/products?category=lighting", bg: "#00BCD4", dark: false, cta: "Order Now" },
          { title: "Tiles & Fix-It Range", sub: "Adhesives, grouts & repair", tag: "PRO CHOICE", img: "/products/tiling/Dr Fixit.png", alt: "Waterproofing and tile care", href: "/products?category=tiling", bg: "#F8CB46", dark: true, cta: "Order Now" },
        ].map((p) => (
          <Link
            key={p.title}
            href={p.href}
            data-promo-card
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

      {/* ═══ CATEGORY GRID — 2028 Specular Perimeter Reflection Tiles ═══ */}
      <Reveal delay={150}>
        <div className="mt-4 sm:mt-5">
          <div className="section-header">
            <h2>Shop by Category</h2>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3.5 lg:grid-cols-8 pb-2 pt-1">
            {visibleCategories.map((cat, i) => {
              const manual = TILE_IMAGES[cat.slug];
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
                  className="flex w-full flex-col items-center gap-1.5 group cursor-pointer group-hover:-translate-y-1 transition-transform duration-200"
                >
                  <div
                    className={`category-plate-3d transform-3d card-2028 specular-sheen relative w-full aspect-square rounded-2xl bg-gradient-to-b from-white via-[#F7F4FC] to-[#F5F2FC] border border-[#DDD6EE] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_20px_40px_-6px_rgba(45,27,105,0.28),0_0_25px_-3px_rgba(124,181,24,0.32)] ${
                      mounted ? "animate-fade-up" : "opacity-0"
                    }`}
                    style={{
                      animationDelay: `${Math.min(i, 12) * 45}ms`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tint; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#DDD6EE"; }}
                  >
                    {/* 2028 Specular Perimeter Reflection Sheen */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {img ? (
                      <div className="relative h-full w-full layer-3d-pop">
                        <Image
                          src={img}
                          alt={cat.name}
                          fill
                          sizes="(min-width: 1024px) 128px, (min-width: 640px) 96px, 56px"
                          loading="lazy"
                          draggable={false}
                          className="object-contain p-1.5 sm:p-2 animate-fade-in transition-transform duration-500 group-hover:scale-115 drop-shadow-[0_8px_14px_rgba(0,0,0,0.12)]"
                        />
                      </div>
                    ) : (
                      <div className="layer-3d-pop">
                        <CategoryTileIcon slug={cat.slug} className="h-9 w-9 text-[#2D1B69] transition-transform duration-500 group-hover:scale-115 drop-shadow-[0_8px_14px_rgba(0,0,0,0.12)]" />
                      </div>
                    )}
                  </div>
                  <p className="text-micro sm:text-caption font-bold text-[#150726] text-center leading-tight line-clamp-2 min-h-[26px] sm:min-h-[30px] group-hover:text-[#2D1B69] transition-colors">{cat.name}</p>
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

      {/* ═══ AI PROJECT KITS (Blinkit Recipe-to-Cart for Materials on Door) ═══ */}
      <Reveal>
        <AiProjectKitsSection />
      </Reveal>

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
      {/* ═══ FEATURE STRIP — flat divider row on phones (no chip cards);
           sm+: the light chip cards with stripes ═══ */}
      <Reveal>
        <div className="mb-5 sm:mb-8">
          <div className="sm:hidden flex items-stretch divide-x divide-[#E7DEF5] border-y border-[#E7DEF5]">
            {[
              { icon: TrendingUp, title: "LOWEST PRICES", color: "#E91E63" },
              { icon: Clock, title: "60 MINS DELIVERY", color: "#7CB518" },
              { icon: Lock, title: "SECURE PAYMENTS", color: "#00BCD4" },
            ].map((f) => (
              <div key={f.title} className="flex flex-1 items-center justify-center gap-1.5 px-1 py-2.5">
                <f.icon className="h-4 w-4 flex-shrink-0" style={{ color: f.color }} />
                <p className="text-micro font-black leading-tight" style={{ color: f.color }}>{f.title}</p>
              </div>
            ))}
          </div>
          <div className="hidden sm:grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, title: "LOWEST PRICES", sub: "Best quality at best prices", color: "#E91E63" },
              { icon: Clock, title: "60 MINS DELIVERY", sub: "Superfast, to your site", color: "#7CB518" },
              { icon: Lock, title: "SECURE PAYMENTS", sub: "100% safe & secure", color: "#00BCD4" },
            ].map((f) => (
              <div key={f.title} className="assure-stripes-light relative overflow-hidden rounded-2xl bg-white border border-[#DDD6EE] p-4 group/feat">
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-caption font-black leading-tight tracking-tight" style={{ color: f.color }}>{f.title}</p>
                    <p className="text-caption text-[#9B8CB5] leading-tight mt-1">{f.sub}</p>
                  </div>
                  <span
                    className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover/feat:scale-110"
                    style={{ background: `${f.color}15`, border: `1.5px solid ${f.color}35` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      </div>
      </div>{/* ═══ /shared edge B (rails + feature) ═══ */}

      {/* ═══ BRAND MARQUEE — Modern Infinite Hardware-Accelerated Rail (Magic UI Style) ═══ */}
      <Reveal>
        <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 mb-6 pb-2">
          <div className="section-header px-0 mb-3 flex items-center justify-between">
            <h2>Trusted Mill Brands</h2>
            <span className="text-tiny font-mono font-bold text-[#6B5B83] uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
              100% DIRECT DEPOT
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white/40 border border-[#EDE7F6] py-3 shadow-[0_2px_12px_rgba(26,10,51,0.03)]">
            {/* Dual Edge Fade Gradients */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#F8F6FC] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#F8F6FC] to-transparent z-10" />

            <Marquee speed={40} pauseOnHover={true}>
              {[
                { name: "UltraTech", img: "/products/cement/Ultratech Cement.png", tag: "CEMENT" },
                { name: "ACC", img: "/products/cement/ACC Cement.png", tag: "CEMENT" },
                { name: "Ambuja", img: "/products/cement/Ambuja Cement.png", tag: "CEMENT" },
                { name: "Asian Paints", img: "/products/painting/Asian Paint.png", tag: "PAINT" },
                { name: "Philips", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp", tag: "LIGHTING" },
                { name: "Dr. Fixit", img: "/products/tiling/Dr Fixit.png", tag: "FIX-IT" },
                { name: "Kajaria", img: "/products/tiling/Kajaria Adhesives Tiling.png", tag: "TILES" },
                { name: "Roff", img: "/products/tiling/Roff T1.png", tag: "TILES" },
                { name: "Hettich", img: "/products/hinges/Hettich Clamps for KA Channels.png", tag: "FITTINGS" },
                { name: "Crompton", img: "/products/lighting/crompton-led-star-slim-recess-panel-round-6k-1678368249930_SKU-0684_0-1756465491712-Photoroom.png", tag: "LIGHTING" },
                { name: "Jaquar", img: "/products/sanitary/32-45-8-wash-basin-over-counter-for-bathroom-45-x-32-x-10-cm-original-imahdff46mfrfvtu.webp", tag: "BATH" },
                { name: "Legrand", img: "/products/switches/1000023225_25325e44-5c03-4885-8994-7222219bde89_250x2502x 1.webp", tag: "SWITCHES" },
                { name: "Fevicol", img: "/products/hardware-tools/Fevicol Craft and General Adhesives 2 Fevistik 15gm 2.jpg", tag: "ADHESIVES" },
                { name: "Havells", img: "/products/switches/6-ampere-rectangular-polycarbonate-havells-modular-switch--957.jpg", tag: "ELECTRICAL" },
                { name: "Birla White", img: "/products/painting/Birla Putty.png", tag: "PUTTY" },
                { name: "Stanley", img: "/products/hardware-tools/STANLEY 15 mx Long Measuring Tape Yellow STHT38515-812.png", tag: "TOOLS" },
              ].map((brand) => (
                <Link
                  key={brand.name}
                  href={`/products?search=${encodeURIComponent(brand.name)}`}
                  className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#EDE7F6] hover:border-[#7CB518] hover:shadow-[0_8px_20px_-4px_rgba(124,181,24,0.22)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#F7F4FC] overflow-hidden flex items-center justify-center p-1 border border-[#F0ECF9]">
                    <Image
                      src={brand.img}
                      alt={brand.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="text-left pr-1">
                    <span className="text-micro font-mono font-bold text-[#7CB518] uppercase leading-none block">
                      {brand.tag}
                    </span>
                    <span className="text-caption font-extrabold text-[#150726] group-hover:text-[#7CB518] transition-colors leading-tight block mt-0.5">
                      {brand.name}
                    </span>
                  </div>
                </Link>
              ))}
            </Marquee>
          </div>
        </div>
      </Reveal>

      {/* ═══ MATERIAL CALCULATOR + BULK CTA — one compact band ═══ */}
      <Reveal>
        <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 gap-3 sm:block">
            {/* Calculator */}
            <Link
              href="/calculator"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F0ECF9] to-[#E8F9FC] p-3 sm:p-5 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 text-center sm:text-left transition-transform hover:scale-[1.01] active:scale-[0.99] border border-white/40 shadow-sm sm:mb-6 group"
            >
              <BorderBeam duration={8} colorFrom="#00BCD4" colorTo="#7CB518" borderWidth={1.5} />
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#2D1B69] flex items-center justify-center flex-shrink-0 relative z-10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="16" y2="10"/>
                  <line x1="8" y1="14" x2="12" y2="14"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-[#2D1B69] px-2 py-0.5 text-micro font-black text-[#F8CB46]">
                    <Sparkles className="h-2.5 w-2.5" /> AI ESTIMATOR
                  </span>
                </div>
                <h3 className="text-caption sm:text-body-md font-extrabold text-[#150726] leading-tight">Smart Material Estimator</h3>
                <p className="text-caption text-[#9B8CB5] hidden sm:block mt-0.5">Instant formulas for cement, paint, tiles &amp; steel with 1-tap cart addition</p>
              </div>
              <span className="btn-shine hidden sm:inline-flex items-center gap-2 bg-[#2D1B69] text-white text-caption font-bold px-5 py-2.5 rounded-full hover:bg-[#150726] transition-all shadow-lg shadow-purple-900/20 flex-shrink-0 relative z-10">
                Calculate <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className="h-7 w-7 sm:hidden rounded-full bg-[#2D1B69]/10 flex items-center justify-center flex-shrink-0 relative z-10">
                <ArrowRight className="h-3.5 w-3.5 text-[#2D1B69]" />
              </span>
            </Link>

            {/* Bulk / business */}
            <Link
              href="/rfq"
              className="relative overflow-hidden rounded-2xl bg-[#150726] px-3 sm:px-5 py-3 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 text-center sm:text-left transition-transform hover:scale-[1.01] active:scale-[0.99] border border-white/10 shadow-lg group"
            >
              <BorderBeam duration={8} colorFrom="#7CB518" colorTo="#F8CB46" borderWidth={1.5} />
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-[#7CB518] px-2 py-0.5 text-micro font-black text-white">
                    <Sparkles className="h-2.5 w-2.5" /> AI PAPER OCR
                  </span>
                </div>
                <h3 className="text-caption sm:text-body-md font-extrabold text-white leading-tight">Handwritten Slip &amp; Bulk RFQ</h3>
                <p className="text-caption text-white/55 mt-0.5 hidden sm:block">Upload site slip photo or WhatsApp list · Direct mill rates &amp; GST invoice</p>
              </div>
              <span className="btn-shine hidden sm:inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-button font-bold text-[#2D1B69] hover:bg-[#F0ECF9] transition-all flex-shrink-0 relative z-10">
                Upload Slip <ArrowRight className="h-4 w-4" />
              </span>
              <span className="h-7 w-7 sm:hidden rounded-full bg-white/10 flex items-center justify-center mx-auto flex-shrink-0 relative z-10">
                <ArrowRight className="h-3.5 w-3.5 text-[#7CB518]" />
              </span>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ═══ BLINKIT-STYLE APP DOWNLOAD SECTION (Android / iOS 1-tap triggers + QR) ═══ */}
      <Reveal>
        <AppDownloadSection />
      </Reveal>

      {/* ═══ FOOTER (All links, trade policies, app download buttons) ═══ */}
      <SiteFooter className="mt-4 pb-24 lg:pb-8" />

      {/* ═══ STICKY CART BAR + QUICK DRAWER ═══ */}
      <StickyCartBar itemCount={cartCount} total={cartTotal} />
      <CartDrawer />

      {/* ═══ MOBILE BOTTOM NAVIGATION BAR (Home, Category, Orders, Account) ═══ */}
      <BottomNav />

      {/* ═══ BACK TO TOP ═══ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed z-40 left-4 hidden sm:flex bg-[#150726] text-white p-3 rounded-full shadow-xl shadow-purple-900/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          showBackToTop ? "bottom-[var(--chrome-stack)] opacity-100 translate-y-0" : "bottom-24 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

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
              <Link
                href="/admin"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all group"
              >
                <ShieldCheck className="h-5 w-5 text-[#E91E63]" />
                <span className="text-body-md font-semibold">Admin Panel</span>
              </Link>
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
