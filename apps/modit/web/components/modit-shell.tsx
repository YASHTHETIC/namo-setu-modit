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
import { categories, products as catalogProducts, searchProducts, type Product } from "@/lib/product-data";

export function ModitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const megaMenuItems = useMemo(
    () =>
      categories.slice(0, 10).map((category) => ({
        ...category,
        image: catalogProducts.find((product) => product.categorySlug === category.slug)?.images?.[0],
      })),
    []
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchProducts(searchQuery).slice(0, 6);
      setSearchResults(results);
      setShowSearch(results.length > 0);
    } else {
      setSearchResults([]);
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

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell min-h-screen">
      {/* Announcement bar */}
      <div className="announce-bar text-white text-center py-2 text-xs font-medium">
        Enterprise procurement for construction materials, bulk orders, and supplier sourcing.
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-purple-200/60" style={{ background: 'linear-gradient(135deg, #F5F2FC 0%, #EDE8F5 30%, #F8F6FC 60%, #F5F2FC 100%)' }}>
        <div className="market-container flex min-h-[76px] items-center gap-3 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <img src="/modit-logo.svg" alt="MODIT — Materials on Door" className="h-[46px] w-auto" />
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

          <button
            type="button"
            onClick={() => setShowMobileMenu((value) => !value)}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] lg:hidden"
            aria-label="Toggle navigation"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="dark-nav border-t border-white/5">
          <div className="market-container flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {[
              { label: "Products", href: "/products" },
              { label: "Suppliers", href: "/suppliers" },
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
                      ? "text-[var(--brand)] bg-[var(--brand)]/10 border-b-2 border-[var(--brand)]"
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
                  <img src="/modit-logo.svg" alt="MODIT" className="h-[38px] w-auto" />
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

      <main className="market-container min-h-[60vh] py-6">{children}</main>

      <footer className="mt-6 bg-gradient-to-b from-[#0D0720] to-[#060314] border-t border-white/5 relative overflow-hidden">
        {/* Decorative top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[var(--brand)]/30 to-transparent" />
        <div className="market-container py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <img src="/modit-logo.svg" alt="MODIT" className="h-[42px] w-auto" />
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                A production-grade procurement platform for building materials, supplier sourcing, bulk orders, and enterprise checkout.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">GST invoices</span>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">Verified suppliers</span>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5">Project workflows</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text)]">Marketplace</h4>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="/products">Products</Link></li>
                <li><Link href="/rfq">RFQ</Link></li>
                <li><Link href="/suppliers">Suppliers</Link></li>
                <li><Link href="/projects">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text)]">Account</h4>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/orders">Orders</Link></li>
                <li><Link href="/cart">Cart</Link></li>
                <li><Link href="/notifications">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text)]">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="/auth">Login</Link></li>
                <li><Link href="/auth/register">Create account</Link></li>
                <li><Link href="/dashboard/profile">Profile settings</Link></li>
                <li><Link href="/payment/history">Payment history</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 text-sm text-white/30 md:flex-row md:items-center md:justify-between">
            <p>© 2026 MODIT. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
              <Link href="/shipping" className="hover:text-white/50 transition-colors">Shipping</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}