"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, MapPin, ChevronDown, Menu, X, Bell, User,
  LogOut, LayoutDashboard, Package, FileText, Truck, BarChart3,
  Settings, GitCompare, Heart
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { searchProducts, categories, type Product } from "@/lib/product-data";

export function ModitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

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
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) setShowMegaMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isHome) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ── Announcement Bar ── */}
      <div className="bg-[#232F3E] text-white text-center py-1.5 px-4 text-[11px]">
        <span className="hidden sm:inline">Free delivery on first order </span>
        <span className="mx-2 text-white/20">|</span>
        <span>MONSOON MEGA SALE — Up to 25% OFF</span>
        <span className="mx-2 text-white/20">|</span>
        <span className="font-bold text-[var(--brand)]">Use code FUTURE25</span>
      </div>

      {/* ── Main Header ── */}
      <header className="sticky top-0 z-50 bg-[#131921]">
        <div className="max-w-[1440px] mx-auto flex h-[60px] items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-1">
            <span className="text-[22px] font-black text-white tracking-tight">MODIT</span>
            <span className="text-[9px] text-[var(--brand)] font-bold hidden sm:block mt-1">BUILDING MATERIALS</span>
          </Link>

          {/* Deliver to */}
          <button className="hidden md:flex items-center gap-1.5 text-white/80 hover:text-white text-[12px] px-2 py-1 rounded hover:border hover:border-white/20 transition-all">
            <MapPin className="h-3.5 w-3.5" />
            <div className="text-left">
              <p className="text-[9px] text-white/50 leading-none">Deliver to</p>
              <p className="text-[12px] font-bold leading-tight">New Delhi 110001</p>
            </div>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-3xl" ref={searchRef}>
            <div className="flex">
              <select className="h-[40px] rounded-l-md bg-gray-100 border-0 text-[12px] text-gray-700 px-2 cursor-pointer focus:outline-none hidden sm:block">
                <option>All</option>
                {categories.slice(0, 6).map(c => <option key={c.slug}>{c.name}</option>)}
              </select>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cement, steel, tiles, paint..."
                className="flex-1 h-[40px] bg-white px-4 text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none border-0" />
              <button className="h-[40px] w-[48px] bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-r-md flex items-center justify-center transition-colors">
                <Search className="h-5 w-5 text-[#111]" />
              </button>
            </div>
            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-xl max-h-[400px] overflow-y-auto">
                  {searchResults.map(p => (
                    <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-[var(--border-light)] last:border-0">
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[var(--text)] truncate">{p.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{p.category}</p>
                      </div>
                      <span className="text-[13px] font-bold text-[var(--text)]">₹{p.price.toLocaleString()}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link href="#" className="hidden lg:flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <GitCompare className="h-5 w-5" />
              <span className="text-[9px] font-medium">Compare</span>
            </Link>
            <Link href="#" className="hidden lg:flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <Bell className="h-5 w-5" />
              <span className="text-[9px] font-medium">Alerts</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-[9px] font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 right-0 h-[18px] min-w-[18px] rounded-full bg-[var(--brand)] text-[10px] font-bold text-[#111] flex items-center justify-center px-1">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </Link>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold px-3 py-2 rounded transition-all ml-1">
                <User className="h-4 w-4" /> Account <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full z-50 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2">
                      <Link href="/auth" className="flex items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-[var(--text)] hover:bg-gray-50">
                        <User className="h-4 w-4" /> Sign In
                      </Link>
                      <Link href="/auth/register" className="flex items-center gap-2 rounded px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        Create Account
                      </Link>
                      <div className="my-1 border-t border-[var(--border-light)]" />
                      <Link href="/dashboard" className="flex items-center gap-2 rounded px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 rounded px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <Package className="h-4 w-4" /> My Orders
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2 rounded px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <Heart className="h-4 w-4" /> Wishlist
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 text-white/80 hover:text-white">
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Category Nav */}
        <div className="bg-[#232F3E] border-t border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center overflow-x-auto px-4 sm:px-6 scrollbar-hide">
            <div ref={megaMenuRef} className="relative">
              <button onClick={() => setShowMegaMenu(!showMegaMenu)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-bold text-white hover:bg-white/10 transition-all">
                <Menu className="h-3.5 w-3.5" /> All Categories <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full z-50 w-[600px] bg-white border border-[var(--border)] rounded-lg shadow-xl p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map(cat => (
                        <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                          onClick={() => setShowMegaMenu(false)}
                          className="flex items-center gap-2 rounded px-3 py-2 text-[12px] text-[var(--text)] hover:bg-gray-50 hover:text-[var(--brand)] transition-all">
                          <span className="text-lg">{cat.icon}</span>
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {["Today's Deals", "Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Bulk Orders"].map(item => (
              <Link key={item} href={item === "Today's Deals" ? "/products?sort=deals" : `/products?category=${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="shrink-0 px-3 py-2.5 text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all border-b-2 border-transparent hover:border-[var(--brand)]">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div initial={{ opacity: 0, x: -300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }}
            className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <div className="relative w-72 h-full bg-white shadow-xl overflow-y-auto">
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-black text-[var(--text)]">MODIT</span>
                  <button onClick={() => setShowMobileMenu(false)}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <Link href="/auth" className="btn-amazon w-full text-[12px]">Sign In</Link>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">Categories</p>
                {categories.map(cat => (
                  <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2.5 px-2 py-2.5 text-[13px] text-[var(--text)] hover:bg-gray-50 rounded transition-colors">
                    <span className="text-lg">{cat.icon}</span> {cat.name}
                  </Link>
                ))}
                <div className="my-3 border-t border-[var(--border-light)]" />
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">Quick Links</p>
                {["Today's Deals", "Track Order", "Bulk Orders", "Sell on MODIT"].map(item => (
                  <Link key={item} href="#"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-2 py-2.5 text-[13px] text-[var(--text)] hover:bg-gray-50 rounded transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <main className="min-h-[60vh]">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#232F3E] mt-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-[16px] font-black text-white mb-2">MODIT</h3>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">India&apos;s B2B marketplace for construction materials.</p>
              <div className="flex gap-2">
                <span className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/20 transition-all">Google Play</span>
                <span className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/20 transition-all">App Store</span>
              </div>
            </div>
            {[
              { title: "Products", items: ["Cement", "Steel & TMT", "Tiles", "Paint", "Electrical"] },
              { title: "Company", items: ["About Us", "Careers", "Blog", "Press"] },
              { title: "Support", items: ["Help Center", "Contact", "API Docs", "Status"] },
              { title: "Legal", items: ["Privacy", "Terms", "Refund", "GST Info"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[12px] font-bold text-white/60 mb-2.5 uppercase tracking-wider">{col.title}</h4>
                <div className="space-y-1.5">
                  {col.items.map(item => (
                    <Link key={item} href="#" className="block text-[11px] text-white/40 hover:text-white/70 transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-6 pt-5 text-center text-[10px] text-white/30">
            2026 MODIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
