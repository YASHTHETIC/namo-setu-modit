"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, User, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthReady } from "@/lib/use-auth";

// Blinkit-app pattern: 4 tabs only. Orders lives under Account/menu —
// never twice on the same screen.
const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutGrid, label: "Category", href: "/products" },
  { icon: User, label: "Account", href: "/auth", isAccount: true },
  { icon: ShoppingCart, label: "Cart", href: "/cart", isCart: true },
];

/**
 * Bottom tab bar — Blinkit-style light tab architecture in MODIT colors:
 * white bar, muted icons, brand-purple active tab with a green top tick,
 * pink count badge on the cart. Hidden inside the staff panel.
 */
export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const loggedIn = useAuthReady();

  // Buyer nav on all screens (desktop included) — never inside staff panel or supplier hub.
  if (pathname.startsWith("/admin") || pathname.startsWith("/supplier")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DDD6EE] shadow-[0_-4px_16px_rgba(45,27,105,0.08)]"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 gap-0 w-full">
        {NAV_ITEMS.map((item) => {
          const href = "isAccount" in item && item.isAccount && loggedIn ? "/dashboard" : item.href;
          const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          const highlighted = isActive || ("isCart" in item && !!item.isCart && cartCount > 0);
          return (
            <Link
              key={item.label}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5 transition-all duration-200 active:scale-90 relative"
              style={{ color: highlighted ? "#2D1B69" : "#9B8CB5" }}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#7CB518] rounded-full" />
              )}
              <div className="relative">
                <item.icon className="h-5 w-5" fill={highlighted ? "currentColor" : "none"} strokeWidth={highlighted ? 0 : 2} />
                {"isCart" in item && !!item.isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-[#E91E63] text-white text-tiny font-bold flex items-center justify-center px-1 shadow-lg shadow-pink-500/30">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-tiny ${isActive ? "font-bold" : "font-semibold"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
