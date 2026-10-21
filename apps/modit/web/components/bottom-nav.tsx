"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, User } from "lucide-react";
import { useAuthReady } from "@/lib/use-auth";

// Blinkit-app pattern: 4 tabs only. Cart lives in the header (count badge) +
// the floating view-cart bar — never twice in a tab strip.
const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutGrid, label: "Category", href: "/products" },
  { icon: Package, label: "Orders", href: "/orders" },
  { icon: User, label: "Account", href: "/auth", isAccount: true },
];

/**
 * Bottom tab bar — AMOLED glass in MODIT colors: deep-black frosted bar,
 * soft-white icons, white active tab with a green top tick. Hidden inside
 * the staff panel.
 */
export function BottomNav() {
  const pathname = usePathname();
  const loggedIn = useAuthReady();

  // Buyer nav on all screens (desktop included) — never inside staff panel or supplier hub.
  if (pathname.startsWith("/admin") || pathname.startsWith("/supplier")) return null;

  return (
    <nav
      aria-label="Primary"
      className="amoled-glass fixed bottom-0 left-0 right-0 z-50 border-x-0 border-b-0 lg:hidden"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 gap-0 w-full">
        {NAV_ITEMS.map((item) => {
          const href = "isAccount" in item && item.isAccount && loggedIn ? "/dashboard" : item.href;
          const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          const highlighted = isActive;
          return (
            <Link
              key={item.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 py-2.5 transition-all duration-200 active:scale-90 relative"
              style={{ color: highlighted ? "#FFFFFF" : "rgba(255,255,255,0.55)" }}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#7CB518] rounded-full shadow-[0_0_8px_rgba(124,181,24,0.8)]" />
              )}
              <div className="relative">
                <item.icon className="h-5 w-5" fill={highlighted ? "currentColor" : "none"} strokeWidth={highlighted ? 0 : 2} />
              </div>
              <span className={`text-tiny ${isActive ? "font-bold" : "font-semibold"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
