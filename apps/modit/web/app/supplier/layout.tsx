"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Store, Lock } from "lucide-react";

import { useCurrentUser } from "@/lib/use-current-user";
import { useSupplierMe } from "@/lib/supplier-api";

const LINKS = [
  { href: "/supplier", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supplier/products", label: "My Products", icon: Package },
  { href: "/supplier/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/supplier/payouts", label: "Payouts", icon: Wallet },
];

/**
 * Blinkit Seller-Hub-style supplier shell: a supplier login sees ONLY
 * their own catalog/orders/payouts — never the staff admin surface.
 */
export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loggedIn, isSupplier, isStaff, isLoading } = useCurrentUser();
  const meQuery = useSupplierMe(loggedIn && (isSupplier || isStaff));

  if (!loggedIn) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2D1B69] flex items-center justify-center">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-title-md font-extrabold text-[#150726]">Supplier login</h1>
          <p className="text-caption text-[#9B8CB5] mt-1">Your catalog, orders and payouts live here.</p>
          <Link href="/auth?next=%2Fsupplier" className="mt-5 block w-full h-12 leading-[3rem] rounded-xl bg-[#7CB518] text-white text-body-md font-bold hover:bg-[#6A9C14]">
            Login / Sign up
          </Link>
          <Link href="/" className="mt-4 inline-block text-caption font-bold text-[#2D1B69] hover:underline">← Back to store</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center">
        <p className="text-body-sm font-bold text-[#9B8CB5]">Checking access…</p>
      </div>
    );
  }

  if (!isSupplier) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#F0ECF9] flex items-center justify-center">
            <Lock className="h-6 w-6 text-[#2D1B69]" />
          </div>
          <h1 className="text-title-md font-extrabold text-[#150726]">Supplier access only</h1>
          <p className="text-caption text-[#9B8CB5] mt-1">
            {isStaff
              ? "Staff accounts use the admin panel — this area is for supplier logins."
              : "This login has no supplier profile yet — ask an administrator to link one."}
          </p>
          <Link href={isStaff ? "/admin" : "/"} className="mt-5 block w-full h-12 leading-[3rem] rounded-xl bg-[#2D1B69] text-white text-body-md font-bold hover:bg-[#1E1245]">
            {isStaff ? "Open admin panel" : "Back to store"}
          </Link>
        </div>
      </div>
    );
  }

  const me = meQuery.data;

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-2 text-xs text-[#9B8CB5] flex-wrap">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#2D1B69] font-semibold">
            <Store className="h-3.5 w-3.5" /> Back to store
          </Link>
          <span className="font-bold text-[#150726]">Supplier Hub</span>
          {me && (
            <>
              <span className="rounded-full bg-[#2D1B69] px-2 py-0.5 text-tiny font-bold text-white">{me.supplier_code}</span>
              {me.is_verified && (
                <span className="rounded-full bg-[#7CB518]/10 px-2 py-0.5 text-tiny font-bold text-[#5A8010]">VERIFIED</span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <aside className="lg:w-60 shrink-0">
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-2 lg:sticky lg:top-24">
              <div className="flex lg:flex-col gap-1 overflow-x-auto">
                {LINKS.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-body-sm font-bold whitespace-nowrap transition-all ${
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

          <div className="fx-page flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
