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
 * Bottom tab bar — 2028 AMOLED Obsidian Cyber Glass Navigation Dock:
 * Contoured floating island dock with top laser horizon hairline,
 * luminous active indicator pod, and tactile spring transitions.
 */
export function BottomNav() {
  const pathname = usePathname();
  const loggedIn = useAuthReady();

  // Buyer nav on all screens (desktop included) — never inside staff panel or supplier hub.
  const currentPath = pathname ?? "";
  if (currentPath.startsWith("/admin") || currentPath.startsWith("/supplier")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-2 inset-x-3 z-bottomnav mx-auto max-w-md rounded-3xl bg-[#0b0318]/92 backdrop-blur-2xl border border-white/20 lg:hidden shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),0_0_25px_-5px_rgba(124,181,24,0.25)] overflow-hidden"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      {/* Top Laser Horizon Hairline */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#7CB518] via-[#00BCD4] to-transparent opacity-85" />

      <div className="grid grid-cols-4 gap-1 w-full px-2 pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const href = "isAccount" in item && item.isAccount && loggedIn ? "/dashboard" : item.href;
          const isActive = href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(href + "/");
          const highlighted = isActive;
          return (
            <Link
              key={item.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-300 active:scale-90 relative group ${
                isActive
                  ? "bg-white/10 text-white shadow-xs border border-white/15"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gradient-to-r from-[#7CB518] to-[#00BCD4] rounded-full shadow-[0_0_12px_#7CB518] animate-pulse" />
              )}
              <div className={`relative transition-transform duration-200 ${isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(124,181,24,0.7)] text-[#7CB518]" : "group-hover:scale-105"}`}>
                <item.icon className="h-5 w-5" fill={highlighted ? "currentColor" : "none"} strokeWidth={highlighted ? 0 : 2.2} />
              </div>
              <span className={`text-micro tracking-tight ${isActive ? "font-black text-white" : "font-medium text-white/60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
