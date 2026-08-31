"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  GitCompare,
  Heart,
  LayoutDashboard,
  MapPin,
  Menu,
  Mic,
  Package,
  Search,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";

import { useCartStore } from "@/lib/cart-store";
import { categories, type Product } from "@/lib/product-data";
import { useProducts, useSearchProducts, useCategories } from "@/lib/api-hooks";
import { ModitLogo } from "@/components/modit-logo";
import { BottomNav } from "@/components/bottom-nav";
import { ComparisonBar } from "@/components/comparison-bar";
import { ReferralModal } from "@/components/referral-modal";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";

export function ModitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isAuth = pathname.startsWith("/auth");

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const { data: apiSearchResults = [] } = useSearchProducts(searchQuery);
  const searchResults = apiSearchResults as Product[];
  const { data: apiCategories = [] } = useCategories();
  const categoriesList = (apiCategories.length > 0 ? apiCategories : categories) as typeof categories;

  const searchRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const megaMenuItems = useMemo(
    () =>
      categoriesList.slice(0, 10).map((category) => ({
        ...category,
        image: undefined,
      })),
    [categoriesList]
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false);
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) setShowMegaMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setShowSearch(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  if (isHome || isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell min-h-screen">
      {/* Announcement bar */}
      <div className="announce-bar text-white text-center py-2 text-xs font-medium">
        Enterprise procurement for construction materials, bulk orders, and supplier sourcing.
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-purple-200/60 transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #F5F2FC 0%, #EDE8F5 30%, #F8F6FC 60%, #F5F2FC 100%)' }}>
        <div className="market-container flex min-h-[56px] sm:min-h-[64px] items-center gap-2 sm:gap-3 px-3 sm:px-0 py-2 sm:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3 touch-target">
            <ModitLogo className="h-[36px] sm:h-[42px] w-auto" />
          </Link>

          <div ref={megaMenuRef} className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setShowMegaMenu((value) => !value)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              <Menu className="h-4 w-4" />
              Mega Categories
              <ChevronDown className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {showMegaMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full z-50 mt-3 w-[760px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-xl)]"
                >
                  <div className="grid grid-cols-[1.1fr_0.9fr]">
                    <div className="border-r border-[var(--border-subtle)] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Shop categories</p>
                          <p className="text-sm text-[var(--text-secondary)]">Browse the marketplace by trade</p>
                        </div>
                        <Link href="/products" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
                          View all
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {megaMenuItems.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/products?category=${category.slug}`}
                            onClick={() => setShowMegaMenu(false)}
                            className="group flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 p-2.5 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-200)] hover:bg-white"
                          >
                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-[var(--bg-alt)]">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl">{category.icon}</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-[var(--text)]">{category.name}</div>
                              <div className="text-xs text-[var(--text-muted)]">{category.productCount.toLocaleString()} products</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 bg-[var(--bg-alt)] p-4">
                      <div className="overflow-hidden rounded-[24px] bg-[var(--brand)] p-5 text-white shadow-[var(--shadow-brand-soft)]">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                          <Truck className="h-4 w-4" /> Same day dispatch
                        </div>
                        <p className="mt-3 text-2xl font-black leading-tight">Bulk procurement with warehouse-grade reliability.</p>
                        <p className="mt-2 text-sm text-white/82">Verified suppliers, negotiated tiers, and GST-ready checkout across the product graph.</p>
                        <Link href="/rfq" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--brand)]">
                          Start RFQ <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Popular searches</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['cement', 'tmt bars', 'tiles', 'paint', 'electrical', 'hardware'].map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                router.push(`/products?search=${encodeURIComponent(term)}`);
                              }}
                              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden flex-1 items-center xl:flex">
            <div ref={searchRef} className="relative w-full">
              <div className="flex h-14 items-stretch overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] transition-shadow focus-within:shadow-[var(--shadow-md)]">
                <button className="flex items-center gap-2 border-r border-[var(--border-subtle)] px-4 text-sm font-semibold text-[var(--text)]">
                  <MapPin className="h-4 w-4 text-[var(--brand)]" />
                  <span className="hidden 2xl:inline">Delhi NCR</span>
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  placeholder="Search cement, steel, tiles, paint, electrical, plumbing"
                  aria-label="Search products"
                  className="h-full flex-1 border-0 bg-transparent px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submitSearch}
                  className="flex w-12 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--brand)]"
                  aria-label="Voice search"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={submitSearch}
                  className="m-1 inline-flex w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cta)] to-[var(--cta-hover)] text-white transition-all hover:shadow-[0_4px_12px_rgba(45,27,105,0.3)]"
                  aria-label="Search"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
              </div>

              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-xl)]"
                  >
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 transition-colors last:border-0 hover:bg-[var(--bg-subtle)]"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--bg-alt)]">
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">{product.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{product.category} · Verified listing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--text)]">₹{product.price.toLocaleString()}</p>
                          <p className="text-xs text-[var(--text-muted)]">{product.rating} rating</p>
                        </div>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="flex w-full items-center justify-center gap-2 bg-[var(--brand-50)] px-4 py-3 text-sm font-semibold text-[var(--brand)]"
                    >
                      View all results <ChevronRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <Link href="/auth" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]">
              Supplier Login
            </Link>
            <Link href="/notifications" className="rounded-full p-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand)]" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" className="rounded-full p-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand)]" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/products" className="rounded-full p-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand)]" aria-label="Compare">
              <GitCompare className="h-5 w-5" />
            </Link>
            <Link href="/cart" className="relative rounded-full p-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand)]" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--cta)] px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
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
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-xl)]"
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
                      <Link href="/notifications" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">
                        <Bell className="h-4 w-4" /> Notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile: search + cart + menu */}
          <div className="flex items-center gap-1 lg:hidden ml-auto">
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="touch-target rounded-full text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand)] transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative touch-target rounded-full text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand)] transition-colors" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#E91E63] px-1 text-[9px] font-bold text-white shadow-lg shadow-pink-500/30">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setShowMobileMenu((value) => !value)}
              className="touch-target rounded-full border border-[var(--border)] text-[var(--text-secondary)]"
              aria-label="Toggle navigation"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="dark-nav border-t border-white/5">
          <div className="market-container flex items-center gap-0 overflow-x-auto scrollbar-hide pr-12 lg:pr-0">
            {[
              { label: "Products", href: "/products" },
              { label: "Suppliers", href: "/suppliers" },
              { label: "Calculator", href: "/calculator" },
              { label: "Get Quote", href: "/rfq" },
              { label: "Orders", href: "/orders" },
              { label: "Inventory", href: "/inventory" },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/products" && pathname.startsWith("/products"));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`shrink-0 px-5 py-2.5 text-[12px] font-semibold transition-all ${
                    isActive
                      ? "text-[#7CB518] bg-[#7CB518]/10 border-b-2 border-[#7CB518]"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] lg:hidden">
            <button type="button" className="absolute inset-0 bg-[rgba(20,23,31,0.42)]" onClick={() => setShowMobileMenu(false)} aria-label="Close navigation" />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-[var(--shadow-xl)]"
            >
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
                      <span className="text-lg">{category.icon}</span>
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
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col lg:hidden" style={{ background: "rgba(21,7,38,0.97)" }}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
                  placeholder="Search cement, paint, lighting..."
                  autoFocus
                  className="w-full h-12 rounded-xl bg-white/10 border border-white/10 pl-10 pr-10 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:border-[#7CB518] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-white/60 hover:text-white text-[14px] font-semibold">Cancel</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/10 flex-shrink-0">
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{product.name}</p>
                        <p className="text-[11px] text-white/40">{product.category}</p>
                      </div>
                      <p className="text-[13px] font-bold text-[#7CB518] flex-shrink-0">₹{product.price.toLocaleString()}</p>
                    </Link>
                  ))}
                  <button
                    onClick={submitSearch}
                    className="w-full mt-2 py-3 rounded-xl bg-[#7CB518]/10 text-[#7CB518] text-[13px] font-bold hover:bg-[#7CB518]/20 transition-colors"
                  >
                    View all results →
                  </button>
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-16 text-center">
                  <Search className="h-8 w-8 text-white/20 mx-auto mb-3" />
                  <p className="text-[13px] text-white/50">No products found for &quot;{searchQuery}&quot;</p>
                  <p className="text-[11px] text-white/30 mt-1">Try searching for cement, paint, or lighting</p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  <div>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-3">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {["Cement", "TMT Bars", "Paint", "Tiles", "Plywood", "LED Lights"].map((term) => (
                        <button
                          key={term}
                          onClick={() => { setSearchQuery(term); }}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/60 hover:border-[#7CB518]/40 hover:text-[#7CB518] transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-3">Categories</p>
                    <div className="space-y-1">
                      {categories.slice(0, 6).map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-[13px] text-white/60">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="market-container min-h-[60vh] py-6 pb-20 lg:pb-6">{children}</main>

      <footer className="mt-6 border-t border-white/5 relative overflow-hidden" style={{ background: "linear-gradient(to bottom, #0D0720, #060314)", color: "rgba(255,255,255,0.5)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[var(--brand)]/30 to-transparent" />
        <div className="market-container py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <ModitLogo className="h-[42px] w-auto" light={true} />
              </div>
              <p className="mt-4 max-w-md text-sm leading-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                A production-grade procurement platform for building materials, supplier sourcing, bulk orders, and enterprise checkout.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>GST invoices</span>
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>Verified suppliers</span>
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>Project workflows</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Marketplace</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/products" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Products</Link></li>
                <li><Link href="/rfq" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">RFQ</Link></li>
                <li><Link href="/suppliers" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Suppliers</Link></li>
                <li><Link href="/calculator" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Material Calculator</Link></li>
                <li><Link href="/projects" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Account</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/dashboard" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/orders" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Orders</Link></li>
                <li><Link href="/cart" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Cart</Link></li>
                <li><Link href="/notifications" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Support</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/auth" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Login</Link></li>
                <li><Link href="/auth/register" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Create account</Link></li>
                <li><Link href="/dashboard/profile" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Profile settings</Link></li>
                <li><Link href="/payment/history" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Payment history</Link></li>
                <li><button onClick={() => setShowReferral(true)} style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Refer & Earn ₹200</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 text-sm md:flex-row md:items-center md:justify-between" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p>&copy; 2026 MODIT. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Terms</Link>
              <Link href="/privacy" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Privacy</Link>
              <Link href="/shipping" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Shipping</Link>
            </div>
          </div>
        </div>
      </footer>

      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />
      <PushNotificationPrompt />
      <ComparisonBar />
      <BottomNav />
    </div>
  );
}