"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, Zap, ShoppingCart, Ticket, Store, ChevronRight,
  Lock, RotateCcw, LogOut, IndianRupee, FileText,
} from "lucide-react";
import { useAdminAuth, getAdminPinHint } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Pricing", icon: Package },
  { href: "/admin/sales", label: "Sales & Banners", icon: Zap },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/admin/audit", label: "Activity Log", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const unlocked = useAdminAuth((s) => s.unlocked);
  const unlock = useAdminAuth((s) => s.unlock);
  const lock = useAdminAuth((s) => s.lock);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2D1B69] flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-[18px] font-extrabold text-[#150726]">Staff access only</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-1">This panel controls live prices, sales and orders.</p>
          <input
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setPinError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (unlock(pin)) logAdminActivity("admin.unlock", "Staff unlocked the admin panel");
                else setPinError("Incorrect PIN. Try again.");
              }
            }}
            inputMode="numeric"
            type="password"
            placeholder="Enter staff PIN"
            autoFocus
            className="mt-5 w-full rounded-xl border-2 border-[#DDD6EE] px-4 py-3 text-center text-[16px] font-extrabold tracking-[0.4em] focus:outline-none focus:border-[#2D1B69]"
          />
          {pinError && <p className="mt-2 text-[11px] font-bold text-red-500">{pinError}</p>}
          <button
            onClick={() => { if (unlock(pin)) logAdminActivity("admin.unlock", "Staff unlocked the admin panel"); else setPinError("Incorrect PIN. Try again."); }}
            className="mt-3 w-full h-12 rounded-xl bg-[#2D1B69] text-white text-[14px] font-bold hover:bg-[#1E1245]"
          >
            Unlock panel
          </button>
          <p className="mt-3 text-[11px] text-[#9B8CB5]">{getAdminPinHint()}</p>
          <Link href="/" className="mt-4 inline-block text-[12px] font-bold text-[#2D1B69] hover:underline">← Back to store</Link>
        </div>
      </div>
    );
  }
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
          <button onClick={lock} title="Lock panel" className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#9B8CB5] hover:text-[#E91E63] hover:bg-[#FCE8F0]">
            <LogOut className="h-3.5 w-3.5" /> Lock
          </button>
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
