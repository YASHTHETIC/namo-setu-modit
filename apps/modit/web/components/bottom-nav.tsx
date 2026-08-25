"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, User, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutGrid, label: "Category", href: "/products" },
  { icon: Package, label: "Orders", href: "/orders" },
  { icon: User, label: "Account", href: "/auth" },
  { icon: ShoppingCart, label: "Cart", href: "/cart", isCart: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#150726] border-t border-white/10 lg:hidden"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}>
      <div className="grid grid-cols-5 gap-0 w-full">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2.5 transition-all duration-200 active:scale-90 relative"
              style={
                isActive
                  ? { color: "#7CB518" }
                  : item.isCart
                  ? { color: "#7CB518" }
                  : { color: "rgba(255,255,255,0.4)" }
              }
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#7CB518] rounded-full" />
              )}
              <div className="relative">
                <item.icon className="h-5 w-5" fill={isActive || item.isCart ? "currentColor" : "none"} strokeWidth={isActive || item.isCart ? 0 : 2} />
                {item.isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-[#E91E63] text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-lg shadow-pink-500/30">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
