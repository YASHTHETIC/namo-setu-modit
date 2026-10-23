"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageGuard } from "@/components/product-thumb";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bath,
  Bell,
  ChevronDown,
  ChevronRight,
  Droplets,
  GitCompare,
  Hammer,
  Heart,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  Menu,
  Package,
  Paintbrush,
  Plug,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useCartStore } from "@/lib/cart-store";
import { productLink } from "@/lib/utils";
import { categories, type Product } from "@/lib/product-data";
import { useProducts, useSearchProducts, useCategories } from "@/lib/api-hooks";
import { useDisplayProducts } from "@/lib/pricing";
import { useRotatingText, SEARCH_HINTS } from "@/lib/use-rotating-text";
import { ModitLogo } from "@/components/modit-logo";
import { BottomNav } from "@/components/bottom-nav";
import { CartDrawer } from "@/widgets/cart-drawer";
import { useCartUi } from "@/lib/cart-ui";
import { ComparisonBar } from "@/components/comparison-bar";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { LocationMenu } from "@/components/location-menu";
import { HighlightedText } from "@/components/highlighted-text";
import { SiteFooter } from "@/components/site-footer";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";
import { SaleBanner } from "@/components/sale-banner";

/** Trade icon per category slug (mega menu + mobile menu). Falls back to Package. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cement: Layers,
  painting: Paintbrush,
  lighting: Lightbulb,
  tiling: LayoutGrid,
  conduits: Plug,
  "hardware-tools": Hammer,
  hinges: Wrench,
  pipes: Droplets,
  sanitary: Bath,
  waterproofing: ShieldCheck,
  electrical: Zap,
};

export function CategoryTileIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = CATEGORY_ICONS[slug] ?? Package;
  return <Icon className={className} aria-hidden />;
}

export function ModitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchHint = useRotatingText(SEARCH_HINTS);
  const router = useRouter();
  const isHome = pathname === "/";
  const isAuth = pathname.startsWith("/auth");
  // Ops platforms (staff admin, supplier hub) render their own chrome —
  // buyers never see buyer header/footer/nav there and vice versa.
  const isOps = pathname.startsWith("/admin") || pathname.startsWith("/supplier");

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const headerHidden = useHideOnScroll(140);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [recentTerms, setRecentTerms] = useState<string[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("modit-recent-searches");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string").slice(0, 6) : [];
    } catch {
      return [];
    }
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { data: apiSearchResults = [] } = useSearchProducts(searchQuery);
  const searchResults = useDisplayProducts(apiSearchResults as Product[]);
  const { data: apiCategories = [] } = useCategories();
  const categoriesList = (apiCategories.length > 0 ? apiCategories : categories) as typeof categories;

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const openDrawer = useCartUi((s) => s.openDrawer);

  const megaMenuItems = useMemo(
    () =>
      categoriesList.slice(0, 10).map((category) => ({
        ...category,
        image: undefined,
      })),
    [categoriesList]
  );

  useEffect(() => {
    if (searchQuery.length >= 1) {
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
    setHighlightIdx(-1);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const submitSearch = (term?: string) => {
    const query = (term ?? searchQuery).trim();
    if (!query) return;
    try {
      if (typeof window !== "undefined") {
        const updated = [query, ...recentTerms.filter((t) => t !== query)].slice(0, 6);
        setRecentTerms(updated);
        localStorage.setItem("modit-recent-searches", JSON.stringify(updated));
      }
    } catch {
      /* storage unavailable */
    }
    setShowSearch(false);
    setShowMobileSearch(false);
    setSearchFocused(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  if (isHome || isAuth || isOps) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell min-h-screen">
      {/* Announcement bar (announce-bar CSS owns vertical padding + notch inset) */}
      <div className="announce-bar bg-[#150726] text-[#F8CB46] text-center text-xs font-bold tracking-wide">
        Enterprise procurement for construction materials, bulk orders, and supplier sourcing.
      </div>

      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${headerHidden ? "-translate-y-full" : "translate-y-0"}`} style={{ background: 'linear-gradient(135deg, rgba(11,3,24,0.92) 0%, rgba(21,7,38,0.88) 55%, rgba(30,18,69,0.9) 130%)', paddingTop: "var(--safe-t)" }}>
        <div className="market-container flex min-h-[56px] sm:min-h-[64px] items-center gap-2 sm:gap-3 px-3 sm:px-0 py-2 sm:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3 touch-target">
            <ModitLogo light className="h-[36px] sm:h-[42px] w-auto" />
          </Link>

          <div className="hidden flex-col justify-center xl:flex" aria-label="Delivery location">
            <LocationMenu />
          </div>

          <div className="hidden flex-1 items-center xl:flex">
            <div ref={searchRef} className="relative w-full">
              <div className="flex h-14 items-stretch overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_4px_16px_rgba(0,0,0,0.35)] ring-1 ring-white/10 transition-shadow focus-within:shadow-[var(--shadow-md)]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setHighlightIdx((i) => Math.min(i + 1, searchResults.length - 1));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setHighlightIdx((i) => Math.max(i - 1, -1));
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      if (highlightIdx >= 0 && searchResults[highlightIdx]) {
                        const p = searchResults[highlightIdx] as unknown as { id: string; slug?: string };
                        setShowSearch(false);
                        setSearchFocused(false);
                        router.push(productLink(p));
                      } else {
                        submitSearch();
                      }
                    } else if (event.key === "Escape") {
                      setSearchQuery("");
                      setSearchFocused(false);
                    }
                  }}
                  placeholder={searchHint}
                  aria-label="Search products"
                  aria-expanded={showSearch}
                  aria-controls="modit-search-listbox"
                  role="combobox"
                  aria-autocomplete="list"
                  className="h-full flex-1 border-0 bg-transparent px-5 text-body-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => submitSearch()}
                  className="m-1 inline-flex w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cta)] to-[var(--cta-hover)] text-white transition-all hover:shadow-[0_4px_12px_rgba(45,27,105,0.3)]"
                  aria-label="Search"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
              </div>

              {(showSearch || (searchFocused && searchResults.length === 0)) && (
                <div
                  id="modit-search-listbox"
                  role="listbox"
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-xl)] animate-slide-down"
                >
                    {searchQuery.trim() === "" ? (
                      <div className="p-4">
                        {recentTerms.length > 0 && (
                          <div className="mb-3">
                            <p className="mb-2 text-micro font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recentTerms.map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => submitSearch(term)}
                                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="mb-2 text-micro font-bold uppercase tracking-wider text-[var(--text-muted)]">Popular</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Cement", "Paint", "Tiles", "Plywood", "LED Lights", "TMT Bars"].map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => submitSearch(term)}
                              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((product, idx) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchFocused(false);
                              setSearchQuery("");
                            }}
                            className={`flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 transition-colors last:border-0 ${highlightIdx === idx ? "bg-[var(--brand-50)]" : "hover:bg-[var(--bg-subtle)]"}`}
                          >
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[var(--bg-alt)] flex-shrink-0">
                            <ImageGuard src={product.images?.[0]} alt={product.name} fill sizes="48px" draggable={false} className="object-contain" />
                          </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[var(--text)]">
                                <HighlightedText text={product.name} query={searchQuery} markClassName="text-[#5A8010]" />
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">{product.category} · Verified listing</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-[var(--text)]">₹{product.price.toLocaleString("en-IN")}</p>
                              {product.onSale
                                ? <p className="text-tiny font-bold text-[#7CB518]">SALE · <span className="text-[var(--text-muted)] line-through">₹{product.mrp.toLocaleString("en-IN")}</span></p>
                                : <p className="text-xs text-[var(--text-muted)]">{product.rating} rating</p>}
                            </div>
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={() => submitSearch()}
                          className="flex w-full items-center justify-center gap-2 bg-[var(--brand-50)] px-4 py-3 text-sm font-semibold text-[var(--brand)]"
                        >
                          View all results <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => submitSearch()}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                      >
                        <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          No matches for &ldquo;{searchQuery.trim()}&rdquo; — <span className="font-semibold text-[var(--brand)]">search anyway</span>
                        </span>
                      </button>
                    )}
                  </div>
              )}
            </div>
          </div>

          {/* Desktop: cart button (gray when empty, green with total when filled) + account */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button onClick={() => openDrawer()} className={`relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all ${cartCount > 0 ? "bg-[#7CB518] hover:bg-[#6A9C14] shadow-green-500/25" : "bg-white/10 hover:bg-white/15 ring-1 ring-white/15 shadow-black/30"}`} aria-label="Open cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="tabular-nums">{cartCount} item{cartCount === 1 ? "" : "s"} · ₹{cartItems.reduce((s, i) => s + (i.unitPrice ?? i.product.price) * i.quantity, 0).toLocaleString("en-IN")}</span>
              ) : (
                "My Cart"
              )}
            </button>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(194,65,12,0.25)] transition-all hover:shadow-[0_6px_16px_rgba(45,27,105,0.3)]"
              >
                <User className="h-4 w-4" />
                Account
                <ChevronDown className="h-4 w-4" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-xl)] animate-slide-down"
                >
                    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-4">
                      <p className="text-sm font-semibold text-[var(--text)]">Welcome back</p>
                      <p className="text-xs text-[var(--text-muted)]">Access orders, invoices, and saved projects</p>
                    </div>
                    <div className="p-2">
                      <Link href="/auth" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--brand-50)]">
                        <User className="h-4 w-4 text-[var(--brand)]" /> Sign in
                      </Link>
                      <Link href="/auth/register" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        Create account
                      </Link>
                      <div className="my-2 border-t border-[var(--border-subtle)]" />
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <LayoutDashboard className="h-4 w-4" /> Buyer dashboard
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <Package className="h-4 w-4" /> Orders
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <Heart className="h-4 w-4" /> Wishlist
                      </Link>
                      <Link href="/compare" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <GitCompare className="h-4 w-4" /> Compare
                      </Link>
                      <Link href="/notifications" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <Bell className="h-4 w-4" /> Notifications
                      </Link>
                      <div className="my-2 border-t border-[var(--border-subtle)]" />
                      <Link href="/supplier" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <Store className="h-4 w-4" /> Supplier Hub
                      </Link>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* Mobile: search + cart + menu */}
          <div className="flex items-center gap-1 lg:hidden ml-auto">
            <button
              type="button"
              onClick={() => setShowMobileSearch(true)}
              className="touch-target rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => openDrawer()} className="relative touch-target rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors" aria-label="Open cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#E91E63] px-1 text-tiny font-bold text-white shadow-lg shadow-pink-500/30">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowMobileMenu((value) => !value)}
              className="touch-target rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Toggle navigation"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <SaleBanner />

      {showMobileMenu && (
        <div className="fixed inset-0 z-modal lg:hidden animate-fade-in">
          <button type="button" className="absolute inset-0 bg-[rgba(20,23,31,0.42)]" onClick={() => setShowMobileMenu(false)} aria-label="Close navigation" />
          <aside className="relative flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-[var(--shadow-xl)] animate-drawer-in">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-4">
                <div className="flex items-center gap-3">
                  <ModitLogo className="h-[38px] w-auto" />
                </div>
                <button type="button" onClick={() => setShowMobileMenu(false)} aria-label="Close menu" className="rounded-full p-2 text-[var(--text-secondary)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <Link href="/auth" className="btn-gold w-full justify-center">
                  Sign in
                </Link>
                <div className="mt-4 grid gap-2">
                  {megaMenuItems.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/products?category=${category.slug}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-3 py-3 text-sm font-medium text-[var(--text)]"
                    >
                      <CategoryTileIcon slug={category.slug} className="h-5 w-5 flex-shrink-0 text-[#2D1B69]" />
                      <span className="flex-1">{category.name}</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </Link>
                  ))}
                </div>
                <div className="mt-6 rounded-[24px] bg-[var(--brand-50)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Quick access</p>
                  <div className="mt-3 grid gap-2">
                    <Link href="/dashboard" className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-[var(--text)]">Dashboard</Link>
                    <Link href="/orders" className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-[var(--text)]">Orders</Link>
                    <Link href="/notifications" className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-[var(--text)]">Notifications</Link>
                    <Link href="/supplier" className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-[var(--text)]">Supplier Hub</Link>
                  </div>
                </div>
              </div>
            </aside>
        </div>
      )}

      {(showSearch || showMobileSearch) && (
        <div className="fixed inset-0 z-modal flex flex-col lg:hidden animate-fade-in" style={{ background: "rgba(21,7,38,0.97)" }}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); else if (e.key === "Escape") { setShowMobileSearch(false); setSearchQuery(""); } }}
                  placeholder={searchHint}
                  autoFocus
                  className="w-full h-12 rounded-xl bg-white/10 border border-white/10 pl-10 pr-10 text-body-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#7CB518] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} aria-label="Clear search"
className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button onClick={() => { setShowSearch(false); setShowMobileSearch(false); setSearchQuery(""); }} className="text-white/60 hover:text-white text-body-md font-semibold">Cancel</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10 flex-shrink-0">
                        <ImageGuard src={product.images?.[0]} alt={product.name} fill sizes="40px" draggable={false} className="object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-body-sm font-semibold text-white">
                          <HighlightedText text={product.name} query={searchQuery} />
                        </p>
                        <p className="text-micro text-white/40">{product.category}</p>
                      </div>
                      <p className="text-body-sm font-bold text-[#7CB518] flex-shrink-0">₹{product.price.toLocaleString("en-IN")}</p>
                    </Link>
                  ))}
                  <button
                    onClick={() => submitSearch()}
                    className="w-full mt-2 py-3 rounded-xl bg-[#7CB518]/10 text-[#7CB518] text-body-sm font-bold hover:bg-[#7CB518]/20 transition-colors"
                  >
                    View all results →
                  </button>
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-16 text-center">
                  <Search className="h-8 w-8 text-white/20 mx-auto mb-3" />
                  <p className="text-body-sm text-white/50">No products found for &quot;{searchQuery}&quot;</p>
                  <p className="text-micro text-white/30 mt-1">Try searching for cement, paint, or lighting</p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  <div>
                    <p className="text-micro font-bold text-white/30 uppercase tracking-wider mb-3">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {["Cement", "TMT Bars", "Paint", "Tiles", "Plywood", "LED Lights"].map((term) => (
                        <button
                          key={term}
                          onClick={() => { setSearchQuery(term); }}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-caption text-white/60 hover:border-[#7CB518]/40 hover:text-[#7CB518] transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-micro font-bold text-white/30 uppercase tracking-wider mb-3">Categories</p>
                    <div className="space-y-1">
                      {categories.slice(0, 6).map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => { setShowSearch(false); setShowMobileSearch(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <CategoryTileIcon slug={cat.slug} className="h-5 w-5 flex-shrink-0 text-[#7CB518]" />
                          <span className="text-body-sm text-white/60">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Content clearance derives from the chrome stack: tab bar + stable
          gesture-nav inset — 3-button Android nav no longer swallows content. */}
      <main className="fx-page market-container min-h-[60vh] py-6 pb-[calc(var(--chrome-nav)+20px)] lg:pb-8">{children}</main>

      <SiteFooter />

      <PushNotificationPrompt />
      <ComparisonBar />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}
