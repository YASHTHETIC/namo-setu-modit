"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Home, LayoutGrid, Package, User, Wallet } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useHomeLayout } from "@/lib/modit-api";
import { STATIC_HOME_LAYOUT } from "@/lib/static-layout";
import { ModitLogo } from "@/components/modit-logo";
import { LayoutRenderer } from "@/components/layout/layout-renderer";

export default function ModitHomePage() {
  const [pincode, setPincode] = useState("201301");
  const { data: layout, isLoading } = useHomeLayout(pincode);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Use API response or static fallback
  const sections = layout?.sections ?? STATIC_HOME_LAYOUT.sections;

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══ HEADER — Dark Purple App Style ═══ */}
      <header className="sticky top-0 z-50 bg-[#150726] border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/" className="shrink-0">
            <ModitLogo className="h-[38px] w-auto" dark={false} />
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-[var(--green)] text-[9px] font-black text-white flex items-center justify-center px-1">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ SERVER-DRIVEN LAYOUT ═══ */}
      {/* All sections come from the backend JSON via useHomeLayout().
          The LayoutRenderer maps each section.type to a widget component.
          To add/reorder/remove sections: change the backend, not the frontend. */}
      <LayoutRenderer sections={sections} />

      {/* ═══ BOTTOM NAVIGATION — Mobile App Style ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#150726] border-t border-white/10 safe-area-bottom">
        <div className="max-w-[1440px] mx-auto grid grid-cols-5 gap-0">
          {[
            { icon: Home, label: "Home", href: "/", active: true },
            { icon: LayoutGrid, label: "Category", href: "/products" },
            { icon: Package, label: "Orders", href: "/orders" },
            { icon: User, label: "Account", href: "/auth" },
            { icon: Wallet, label: "My Wallet", href: "/payment/history", highlight: true },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${item.highlight ? 'bg-[var(--green)]/15 border-t-2 border-[var(--green)]' : item.active ? 'text-[var(--green)]' : 'text-white/50 hover:text-white/80'}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
