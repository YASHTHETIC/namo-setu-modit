"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, MapPin, ChevronDown, Menu, X, Bell, User,
  LayoutDashboard, Package, GitCompare, Heart
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
      {/* Announcement */}
      <div className="bg-gradient-to-r from-[var(--brand)] via-[var(--brand-hover)] to-[var(--brand)] text-white text-center py-1.5 px-4 text-[11px] font-semibold tracking-wide">
        Free delivery on first order | MONSOON MEGA SALE | <span className="font-bold bg-white/20 px-2 py-0.5 rounded">FUTURE25</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto flex h-[64px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[var(--brand)] flex items-center justify-center shadow-sm shadow-[var(--brand)]/20">
              <span className="text-[15px] font-black text-white">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[22px] font-black text-[var(--text)] tracking-tight leading-none">MODIT</span>
              <span className="block text-[8px] text-[var(--brand)] font-bold tracking-[0.2em]">BUILDING MATERIALS</span>
            </div>
          </Link>

          <button className="hidden md:flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text)] text-[12px] px-3 py-2 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-[var(--border)]">
            <MapPin className="h-4 w-4 text-[var(--brand)]" />
            <div className="text-left">
              <p className="text-[9px] text-[var(--text-muted)] leading-none uppercase tracking-wider">Deliver to</p>
              <p className="text-[12px] font-bold leading-tight text-[var(--text)]">New Delhi 110001</p>
            </div>
          </button>

          <div className="flex-1 max-w-2xl" ref={searchRef}>
            <div className="relative flex items-center">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cement, steel, tiles, paint..."
                className="w-full h-[42px] bg-[var(--bg)] border border-[var(--border)] rounded-full pl-5 pr-14 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all" />
              <button className="absolute right-1.5 h-[34px] w-[34px] bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-full flex items-center justify-center transition-colors shadow-sm shadow-[var(--brand)]/20">
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[var(--border)] rounded-xl shadow-xl max-h-[400px] overflow-y-auto">
                  {searchResults.map(p => (
                    <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-[var(--border-light)] last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
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

          <div className="flex items-center gap-1">
            <Link href="#" className="hidden lg:flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--brand)] px-3 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-all text-[12px] font-medium">
              <GitCompare className="h-4 w-4" /> Compare
            </Link>
            <Link href="#" className="hidden lg:flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--brand)] px-3 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-all text-[12px] font-medium">
              <Bell className="h-4 w-4" /> Alerts
            </Link>
            <Link href="/cart" className="relative flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--brand)] px-3 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-all text-[12px] font-medium">
              <div className="relative">
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-[16px] min-w-[16px] rounded-full bg-[var(--brand)] text-[9px] font-black text-white flex items-center justify-center px-1">{cartCount > 99 ? "99+" : cartCount}</span>
                )}
              </div>
              Cart
            </Link>
            <div ref={userMenuRef} className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 bg-[var(--text)] hover:bg-[var(--navy-light)] text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-all ml-1">
                <User className="h-3.5 w-3.5" /> Account <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full z-50 mt-1 w-56 bg-white border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2">
                      <Link href="/auth" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-[var(--text)] hover:bg-gray-50">
                        <User className="h-4 w-4" /> Sign In
                      </Link>
                      <Link href="/auth/register" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        Create Account
                      </Link>
                      <div className="my-1 border-t border-[var(--border-light)]" />
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <Package className="h-4 w-4" /> My Orders
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-gray-50">
                        <Heart className="h-4 w-4" /> Wishlist
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 text-white/80 hover:text-white">
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border-light)] bg-[var(--bg)]">
          <div className="max-w-[1440px] mx-auto flex items-center gap-1 overflow-x-auto px-4 sm:px-6 py-2 scrollbar-hide">
            <div ref={megaMenuRef} className="relative shrink-0">
              <button onClick={() => setShowMegaMenu(!showMegaMenu)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold bg-[var(--text)] text-white rounded-full hover:bg-[var(--navy-light)] transition-all">
                <Menu className="h-3 w-3" /> All Categories
              </button>
              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full z-50 w-[600px] bg-white border border-[var(--border)] rounded-xl shadow-xl p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map(cat => (
                        <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                          onClick={() => setShowMegaMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--text)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all">
                          <span className="text-lg">{cat.icon}</span> {cat.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {["Today's Deals", "Cement", "Steel & TMT", "Tiles", "Paint", "Electrical", "Bulk Orders"].map((item, i) => (
              <Link key={item} href={item === "Today's Deals" ? "/products?sort=deals" : `/products?category=${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="shrink-0 px-3.5 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] rounded-full transition-all">
                {item}
              </Link>
            ))}
            <Link href="/products" className="shrink-0 px-3.5 py-1.5 text-[12px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-light)] rounded-full transition-all">
              View All →
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div initial={{ opacity: 0, x: -300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }}
            className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <div className="relative w-72 h-full bg-white shadow-xl overflow-y-auto">
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 rounded-lg bg-[var(--brand)] flex items-center justify-center">
                      <span className="text-[12px] font-black text-white">M</span>
                    </div>
                    <span className="text-[14px] font-black text-[var(--text)]">MODIT</span>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <Link href="/auth" className="btn-brand w-full text-[12px]">Sign In</Link>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">Categories</p>
                {categories.map(cat => (
                  <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2.5 px-2 py-2.5 text-[13px] text-[var(--text)] hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-lg">{cat.icon}</span> {cat.name}
                  </Link>
                ))}
                <div className="my-3 border-t border-[var(--border-light)]" />
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">Quick Links</p>
                {["Today's Deals", "Track Order", "Bulk Orders", "Sell on MODIT"].map(item => (
                  <Link key={item} href="#" onClick={() => setShowMobileMenu(false)}
                    className="block px-2 py-2.5 text-[13px] text-[var(--text)] hover:bg-gray-50 rounded-lg transition-colors">{item}</Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-[60vh]">{children}</main>

      {/* Footer */}
      <footer className="bg-[var(--navy)] mt-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
                  <span className="text-[14px] font-black text-white">M</span>
                </div>
                <span className="text-[16px] font-black text-white">MODIT</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">India&apos;s B2B marketplace for construction materials.</p>
              <div className="flex gap-2">
                <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/10 transition-all">Google Play</span>
                <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white cursor-pointer hover:bg-white/10 transition-all">App Store</span>
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
                    <Link key={item} href="#" className="block text-[11px] text-white/35 hover:text-white/70 transition-colors">{item}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-6 pt-5 text-center text-[10px] text-white/25">
            2026 MODIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
