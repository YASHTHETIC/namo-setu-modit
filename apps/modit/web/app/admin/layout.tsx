"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Zap, ShoppingCart, Ticket, Warehouse, Store, ChevronRight,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Pricing", icon: Package },
  { href: "/admin/sales", label: "Sales & Banners", icon: Zap },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-2 text-xs text-[#9B8CB5]">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#2D1B69] font-semibold">
            <Store className="h-3.5 w-3.5" /> Back to store
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#150726]">Admin Panel</span>
          <span className="ml-1 rounded-full bg-[#E91E63]/10 px-2 py-0.5 text-[10px] font-bold text-[#E91E63]">STAFF ONLY</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <aside className="lg:w-60 shrink-0">
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-2 lg:sticky lg:top-24">
              <div className="flex lg:flex-col gap-1 overflow-x-auto">
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap transition-all ${
                        active
                          ? "bg-[#2D1B69] text-white shadow-md"
                          : "text-[#6B5B83] hover:bg-[#F0ECF9] hover:text-[#2D1B69]"
                      }`}
                    >
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
