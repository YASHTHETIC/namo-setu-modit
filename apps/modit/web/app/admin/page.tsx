"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Package, ShoppingCart, Ticket, Zap, AlertTriangle, ArrowRight, IndianRupee, TrendingUp, RotateCcw,
} from "lucide-react";
import { products } from "@/lib/product-data";
import { useAdminStore, getActiveSaleAt, getUpcomingSaleAt } from "@/lib/admin-store";
import { resolveProduct } from "@/lib/pricing";
import { useCouponStore } from "@/lib/coupon-store";
import { useReturnStore } from "@/lib/return-store";

export default function AdminDashboard() {
  const overrides = useAdminStore((s) => s.overrides);
  const sales = useAdminStore((s) => s.sales);
  const orderStatuses = useAdminStore((s) => s.orderStatuses);
  const coupons = useCouponStore((s) => s.availableCoupons);
  const returns = useReturnStore((s) => s.returns);
  const openReturns = returns.filter((r) => !["refunded", "rejected"].includes(r.status)).length;

  const stats = useMemo(() => {
    const now = Date.now();
    const activeSale = getActiveSaleAt(sales, now);
    const upcoming = getUpcomingSaleAt(sales, now);
    const hidden = products.filter((p) => overrides[p.id]?.hidden).length;
    const edited = Object.keys(overrides).length;
    const onSaleCount = activeSale
      ? products.filter((p) => {
          const r = resolveProduct(p, now);
          return r.onSale;
        }).length
      : 0;
    const lowStock = products.filter((p) => (overrides[p.id]?.stockLevel ?? p.stockLevel) <= 10).length;
    const activeCoupons = coupons.filter((c) => c.active).length;
    return { activeSale, upcoming, hidden, edited, onSaleCount, lowStock, lowStockTotal: products.length, activeCoupons };
  }, [overrides, sales, coupons]);

  const cards = [
    { label: "Catalog products", value: products.length, icon: Package, color: "#2D1B69", bg: "#F0ECF9" },
    { label: "Prices edited", value: stats.edited, icon: TrendingUp, color: "#00BCD4", bg: "#E8F9FC", href: "/admin/products" },
    { label: "Products on sale", value: stats.onSaleCount, icon: Zap, color: "#7CB518", bg: "#F0F9E8", href: "/admin/sales" },
    { label: "Low stock (≤10)", value: stats.lowStock, icon: AlertTriangle, color: "#FF9800", bg: "#FFF4E5", href: "/admin/products" },
    { label: "Active coupons", value: stats.activeCoupons, icon: Ticket, color: "#E91E63", bg: "#FCE8F0", href: "/admin/coupons" },
    { label: "Orders updated", value: Object.keys(orderStatuses).length, icon: ShoppingCart, color: "#7CB518", bg: "#F0F9E8", href: "/admin/orders" },
    { label: "Open returns", value: openReturns, icon: RotateCcw, color: "#E91E63", bg: "#FCE8F0", href: "/admin/returns" },
  ];

  return (
    <div>
      <h1 className="text-[20px] font-extrabold text-[#150726]">Dashboard</h1>
      <p className="text-[12px] text-[#9B8CB5] mt-0.5">Control products, pricing, sales, orders and coupons — changes reflect on the store instantly.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cards.map((c) => {
          const inner = (
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9B8CB5] uppercase tracking-wide">{c.label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                  <c.icon className="h-4 w-4" style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-[26px] font-extrabold text-[#150726] mt-1">{c.value}</p>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      {/* Sale status */}
      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#150726] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#FF9800]" /> Sale engine
          </h2>
          <Link href="/admin/sales" className="flex items-center gap-1 text-[12px] font-bold text-[#2D1B69] hover:underline">
            Manage sales <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {stats.activeSale ? (
          <div className="mt-3 rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 px-4 py-3 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-60" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7CB518]" /></span>
            <div>
              <p className="text-[13px] font-extrabold text-[#150726]">{stats.activeSale.name} is LIVE — {stats.onSaleCount} products discounted</p>
              <p className="text-[11px] text-[#6B5B83]">Ends {new Date(stats.activeSale.endAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · prices revert automatically</p>
            </div>
          </div>
        ) : stats.upcoming ? (
          <div className="mt-3 rounded-xl bg-[#FFF4E5] border border-[#FF9800]/30 px-4 py-3">
            <p className="text-[13px] font-bold text-[#150726]">{stats.upcoming.name} scheduled</p>
            <p className="text-[11px] text-[#6B5B83]">Starts {new Date(stats.upcoming.startAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-[#F7F4FC] border border-[#DDD6EE] px-4 py-3 flex items-center justify-between">
            <p className="text-[12px] text-[#6B5B83]">No sale live. Create one to announce discounts store-wide like Blinkit/Zepto.</p>
            <Link href="/admin/sales" className="px-3 py-1.5 rounded-lg bg-[#E91E63] text-white text-[11px] font-bold hover:bg-[#C2185B]">Create sale</Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/products", icon: IndianRupee, title: "Edit prices", desc: "Change MRP, selling price, bulk rates, stock" },
          { href: "/admin/orders", icon: ShoppingCart, title: "Update orders", desc: "Move orders packed → dispatched → delivered" },
          { href: "/admin/coupons", icon: Ticket, title: "New coupon", desc: "Create codes with limits and expiry" },
        ].map((a) => (
          <Link key={a.href + a.title} href={a.href} className="rounded-2xl border border-[#DDD6EE] bg-white p-4 hover:border-[#2D1B69]/30 hover:shadow-md transition-all group">
            <a.icon className="h-5 w-5 text-[#2D1B69]" />
            <p className="text-[13px] font-bold text-[#150726] mt-2 group-hover:text-[#2D1B69]">{a.title}</p>
            <p className="text-[11px] text-[#9B8CB5] mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
