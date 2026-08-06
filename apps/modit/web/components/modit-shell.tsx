"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Truck,
  FolderOpen,
  BarChart3,
  Settings,
  Clock,
  Star,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { searchProducts, categories, type Product } from "@/lib/product-data";

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
  const [mobileCategory, setMobileCategory] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchProducts(searchQuery).slice(0, 8);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) setShowMegaMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowMegaMenu(false);
        setShowUserMenu(false);
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowSearch(false);
    setShowMegaMenu(false);
  }, [pathname]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setShowSearch(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router]
  );

  if (isHome) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top Bar */}
      <div className="bg-[#0F172A] text-xs text-white/70">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-[var(--brand)]" /> Delivering across Delhi NCR
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline">Free delivery on orders above ₹5,000</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/suppliers" className="hover:text-[var(--brand)] transition-colors">Sell on MODIT</Link>
            <Link href="/dashboard" className="hover:text-[var(--brand)] transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br bg-[var(--brand)] text-sm font-bold text-gray-900">
              M
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">MODIT</span>
              <span className="ml-1.5 hidden text-[10px] font-medium uppercase tracking-wider text-[var(--brand)] lg:inline">
                Construction Procurement
              </span>
            </div>
          </Link>

          {/* Location */}
          <button className="hidden items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:border-[var(--brand-200)] transition-colors lg:flex">
            <MapPin className="h-4 w-4 text-[var(--brand)]" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400">Deliver to</p>
              <p className="text-xs font-semibold text-gray-900">New Delhi 110001</p>
            </div>
          </button>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                placeholder="Search cement, steel, tiles, paint..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900"
              />
            </form>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl"
                >
                  <div className="p-2">
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors"
                      >
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] flex items-center justify-center border border-gray-200">
                          <Package className="h-5 w-5 text-[var(--brand)]/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category} · {p.brand || "No brand"}</p>
                        </div>
                        <span className="text-sm font-bold text-[var(--brand)]">₹{p.price.toLocaleString()}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2">
                    <button
                      onClick={() => { handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent); }}
                      className="text-xs font-medium text-[var(--brand)] hover:underline"
                    >
                      See all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-orange-50 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-gray-900">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-orange-50 transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="hidden lg:inline">Sign In</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl"
                >
                  <div className="p-2">
                    <Link href="/auth" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 hover:bg-orange-50">
                      <LogOut className="h-4 w-4" /> Sign In
                    </Link>
                    <Link href="/auth/register" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-orange-50">
                      <User className="h-4 w-4" /> Create Account
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-orange-50">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-orange-50">
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <Link href="/payment/history" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-orange-50">
                      <FileText className="h-4 w-4" /> Payments
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-orange-50">
                      <Settings className="h-4 w-4" /> Admin
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category Nav Bar */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6 scrollbar-hide">
            {/* Mega Menu Trigger */}
            <div ref={megaMenuRef} className="relative">
              <button
                onClick={() => setShowMegaMenu(!showMegaMenu)}
                onMouseEnter={() => setShowMegaMenu(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Menu className="h-3.5 w-3.5" />
                All Categories
                <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    onMouseLeave={() => setShowMegaMenu(false)}
                    className="absolute left-0 top-full z-50 mt-1 w-[700px] rounded-xl border border-gray-200 bg-white shadow-xl"
                  >
                    <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100 p-4">
                      {categories.map((cat) => (
                        <div key={cat.slug} className="px-4 py-2">
                          <Link
                            href={`/products?category=${cat.slug}`}
                            onClick={() => setShowMegaMenu(false)}
                            className="text-sm font-semibold text-gray-900 hover:text-[var(--brand)] transition-colors"
                          >
                            {cat.name}
                          </Link>
                          <div className="mt-1.5 space-y-1">
                            {cat.subCategories.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/products?category=${cat.slug}&sub=${sub.slug}`}
                                onClick={() => setShowMegaMenu(false)}
                                className="block text-xs text-gray-500 hover:text-[var(--brand)] transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Category Links */}
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand)] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand-50)] transition-colors"
            >
              View All →
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-80 overflow-y-auto bg-white shadow-xl border-l border-gray-200"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold">Menu</span>
                  <button onClick={() => setShowMobileMenu(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {mobileCategory ? (
                  <div>
                    <button
                      onClick={() => setMobileCategory(null)}
                      className="mb-3 text-sm text-[var(--brand)] font-medium"
                    >
                      ← Back to Categories
                    </button>
                    <h3 className="text-sm font-bold mb-2">
                      {categories.find((c) => c.slug === mobileCategory)?.name}
                    </h3>
                    <div className="space-y-1">
                      {categories
                        .find((c) => c.slug === mobileCategory)
                        ?.subCategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/products?category=${mobileCategory}&sub=${sub.slug}`}
                            className="block rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-orange-50"
                          >
                            {sub.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => setMobileCategory(cat.slug)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50"
                      >
                        {cat.name}
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </button>
                    ))}
                    <div className="my-2 border-t border-gray-100" />
                    <Link href="/dashboard" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-orange-50">Dashboard</Link>
                    <Link href="/orders" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-orange-50">Orders</Link>
                    <Link href="/auth" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand)] hover:bg-orange-50">Sign In</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Products</h4>
              <div className="space-y-2">
                <Link href="/products?category=cement" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Cement</Link>
                <Link href="/products?category=steel-tmt" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Steel & TMT</Link>
                <Link href="/products?category=tiles-ceramics" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Tiles</Link>
                <Link href="/products?category=paint" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Paint</Link>
                <Link href="/products?category=electrical" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Electrical</Link>
                <Link href="/products?category=plumbing" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Plumbing</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Services</h4>
              <div className="space-y-2">
                <Link href="/rfq" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Request Quote</Link>
                <Link href="/orders" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Track Order</Link>
                <Link href="/inventory" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Check Stock</Link>
                <Link href="/suppliers" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Find Suppliers</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Company</h4>
              <div className="space-y-2">
                <Link href="/analytics" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Analytics</Link>
                <Link href="/admin" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Admin</Link>
                <Link href="/dashboard/profile" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Profile</Link>
                <Link href="/auth" className="block text-xs text-gray-500 hover:text-[var(--brand)]">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold text-white">Contact</h4>
              <div className="space-y-2">
                <p className="text-xs text-white/40">1800-123-4567</p>
                <p className="text-xs text-white/40">Delhi NCR, India</p>
                <p className="text-xs text-white/40">support@modit.in</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-white/40">
            2026 MODIT. All rights reserved. | Delhi NCR&apos;s trusted building material procurement platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
