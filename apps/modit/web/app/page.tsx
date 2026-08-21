"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet, Menu,
  MapPin, ChevronDown, Zap, Shield, Truck, Clock, TrendingUp, Lock,
  ArrowRight, Star, ChevronRight, X
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { ModitLogo } from "@/components/modit-logo";
import { ProductRail } from "@/widgets/product-rail";
import { StickyCartBar } from "@/widgets/sticky-cart-bar";
import { products, categories } from "@/lib/product-data";

export default function ModitHomePage() {
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincode, setPincode] = useState("201301");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cementProducts = useMemo(() => products.filter((p) => p.categorySlug === "cement"), []);
  const paintingProducts = useMemo(() => products.filter((p) => p.categorySlug === "painting"), []);
  const lightingProducts = useMemo(() => products.filter((p) => p.categorySlug === "lighting"), []);
  const tilingProducts = useMemo(() => products.filter((p) => p.categorySlug === "tiling"), []);
  const discountedProducts = useMemo(
    () => products.filter((p) => p.mrp > p.price).sort((a, b) => b.discount - a.discount).slice(0, 10),
    []
  );

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══════════════════════════════════════════
          HEADER — Sticky dark purple, glassmorphism on scroll
         ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <button className="p-2 text-white/70 hover:text-white transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="transition-transform hover:scale-105">
              <ModitLogo className="h-[40px] w-auto" dark={true} />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative p-2 text-white/70 hover:text-white transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full bg-[#7CB518] text-[9px] font-black text-white flex items-center justify-center px-1 animate-cart-pop shadow-lg shadow-green-500/30">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          DELIVERY BAR — Green accent delivery info
         ═══════════════════════════════════════════ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#7CB518]/15 border border-[#7CB518]/30 rounded-xl px-3 py-1.5">
            <Zap className="h-4 w-4 text-[#7CB518]" />
            <span className="text-[15px] font-black text-[#7CB518]">60</span>
            <span className="text-[9px] font-bold text-[#7CB518] uppercase leading-tight">Mins</span>
          </div>
          <button
            onClick={() => setShowPincodeModal(true)}
            className="flex items-center gap-1.5 text-white hover:text-white/90 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-white/50" />
            <span className="text-[12px] font-semibold">Deliver To</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/50" />
          </button>
          <span className="text-[13px] font-bold text-[#7CB518]">{pincode}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HERO BANNER — Promo with gradient
         ═══════════════════════════════════════════ */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2D8A 100%)" }}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7CB518]/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#E91E63]/20 rounded-full blur-2xl" />
        <div className="relative z-10 p-5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#E91E63] text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
              <Truck className="h-3 w-3" />
              FREE DELIVERY
            </div>
            <h2 className="text-white text-[18px] font-bold leading-tight">Materials On Door</h2>
            <p className="text-white/60 text-[12px] mt-1">Construction materials delivered to your site</p>
          </div>
          <Link href="/products" className="flex items-center gap-2 bg-[#7CB518] text-white text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95">
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ASSURED STRIP — Trust badges
         ═══════════════════════════════════════════ */}
      <div className="mt-4 mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0A3C] to-[#150726] border border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="absolute -top-4 -right-2 w-20 h-32 bg-[#E91E63]/20 rotate-[25deg] rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-2 w-20 h-32 bg-[#7CB518]/20 rotate-[-25deg] rounded-full blur-xl" />
        <div className="p-4 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h3 className="text-[14px] font-bold text-white">Modit <span className="text-[#7CB518]">Assured</span></h3>
            <div className="h-5 w-5 rounded-full bg-[#7CB518]/20 flex items-center justify-center">
              <Shield className="h-3 w-3 text-[#7CB518]" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { title: "7 Day\nReplacement", icon: Shield, color: "#E91E63" },
              { title: "4 Hour\nResolution", icon: Clock, color: "#7CB518" },
              { title: "100% Genuine\nGuarantee", icon: Shield, color: "#7CB518" },
              { title: "Easy\nReturns", icon: Package, color: "#E91E63" },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="h-10 w-10 rounded-full mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${f.color}15`, border: `2px solid ${f.color}40` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <p className="text-[10px] font-bold text-white leading-tight whitespace-pre-line">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CATEGORY GRID — 8 categories, 2 rows of 4
         ═══════════════════════════════════════════ */}
      <div className="mt-5">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <Link href="/products" className="text-[#7CB518] text-[13px] font-semibold">See all →</Link>
        </div>
        <div className="grid grid-cols-4 gap-3 px-4">
          {[
            { name: "Cement", slug: "cement", img: "/products/cement/Ambuja Cement.png", count: 10 },
            { name: "Tiling &\nWaterproof", slug: "tiling", img: "/products/tiling/Dr Fixit.png", count: 14 },
            { name: "Painting", slug: "painting", img: "/products/painting/Asian Paint.png", count: 34 },
            { name: "Lighting", slug: "lighting", img: "/products/lighting/Philips AstraSpot Next LED COB light.webp", count: 17 },
            { name: "Wires &\nCables", slug: "electrical", img: "/products/lighting/download-Photoroom (1).png", count: 8 },
            { name: "Plywood,\nMDF", slug: "plywood", img: "/products/painting/Asian Paints Tractor Emulsion, Base White 20 L.png", count: 6 },
            { name: "Fevicol", slug: "fevicol", img: "/products/tiling/Bostik.png", count: 5 },
            { name: "Hardware", slug: "hardware", img: "/products/tiling/Roff T1.png", count: 4 },
          ].map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`flex flex-col items-center gap-2 group ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-full aspect-square rounded-2xl bg-white border border-[#DDD6EE] overflow-hidden flex items-center justify-center group-hover:border-[#7CB518] group-hover:shadow-lg group-hover:shadow-green-500/10 transition-all duration-300 group-hover:scale-105">
                <img src={cat.img} alt={cat.name} loading="lazy" className="w-[80%] h-[80%] object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <p className="text-[10px] font-semibold text-[#150726] text-center leading-tight whitespace-pre-line">{cat.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PRODUCT RAILS — Horizontal scrollable
         ═══════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto pb-28">
        <ProductRail
          title="🔥 Deals of the Day"
          products={discountedProducts}
          seeAllHref="/products"
          accentColor="pink"
        />
        <ProductRail
          title="Top Picks in Cement"
          products={cementProducts}
          seeAllHref="/products?category=cement"
        />
        <ProductRail
          title="Lighting Essentials"
          products={lightingProducts}
          seeAllHref="/products?category=lighting"
          accentColor="cyan"
        />
        <ProductRail
          title="Tiling & Waterproofing"
          products={tilingProducts}
          seeAllHref="/products?category=tiling"
        />
        <ProductRail
          title="Painting Supplies"
          products={paintingProducts.slice(0, 10)}
          seeAllHref="/products?category=painting"
          accentColor="pink"
        />
      </div>

      {/* ═══════════════════════════════════════════
          FEATURE BAR — USP strip
         ═══════════════════════════════════════════ */}
      <div className="mx-4 mb-24 rounded-2xl bg-gradient-to-r from-[#150726] to-[#2D1B69] p-4 grid grid-cols-3 gap-3 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#E91E63]/10 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#7CB518]/10 rounded-full blur-xl" />
        {[
          { icon: TrendingUp, title: "LOWEST\nPRICES", sub: "Best quality at best prices", color: "#E91E63" },
          { icon: Clock, title: "60 MINS\nDELIVERY", sub: "Superfast delivery at your site", color: "#00BCD4" },
          { icon: Lock, title: "SECURE\nPAYMENTS", sub: "100% safe & secure", color: "#7CB518" },
        ].map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center relative z-10">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}40` }}>
              <f.icon className="h-5 w-5" style={{ color: f.color }} />
            </div>
            <p className="text-[10px] font-black text-white leading-tight whitespace-pre-line">{f.title}</p>
            <p className="text-[8px] text-white/40 mt-0.5 leading-tight">{f.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          STICKY CART BAR
         ═══════════════════════════════════════════ */}
      <StickyCartBar itemCount={cartCount} total={cartTotal} />

      {/* ═══════════════════════════════════════════
          BOTTOM NAVIGATION — Filled icon for active
         ═══════════════════════════════════════════ */}
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
              className={`flex flex-col items-center gap-1 py-2.5 transition-all duration-200 ${
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

      {/* ═══════════════════════════════════════════
          PINCODE MODAL
         ═══════════════════════════════════════════ */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowPincodeModal(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#150726]">Enter Pincode</h3>
              <button onClick={() => setShowPincodeModal(false)} className="p-1 text-[#9B8CB5] hover:text-[#150726]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit pincode"
                className="flex-1 border border-[#DDD6EE] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#150726] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/20"
                maxLength={6}
              />
              <button
                onClick={() => setShowPincodeModal(false)}
                className="bg-[#7CB518] text-white text-[13px] font-bold px-6 py-3 rounded-xl hover:bg-[#6A9C14] transition-colors"
              >
                Check
              </button>
            </div>
            <p className="text-[12px] text-[#9B8CB5] mt-3 text-center">Delivery available in 60 minutes</p>
          </div>
        </div>
      )}
    </div>
  );
}
