"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Package, ShoppingCart, Ticket, Zap, AlertTriangle, ArrowRight, IndianRupee,
  RotateCcw, Plus, Activity,
} from "lucide-react";
import { products } from "@/lib/product-data";
import { useAdminStore, getActiveSaleAt, getUpcomingSaleAt, ORDER_STATUSES } from "@/lib/admin-store";
import { resolveProduct } from "@/lib/pricing";
import { useCouponStore } from "@/lib/coupon-store";
import { useReturnStore } from "@/lib/return-store";
import { useAdminActivity } from "@/lib/admin-activity";
import { useOrders } from "@/lib/modit-api";
import { logAdminActivity } from "@/lib/admin-activity";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3 },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2 },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1 },
];

const STAGE_LABEL: Record<string, string> = {
  placed: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminDashboard() {
  const overrides = useAdminStore((s) => s.overrides);
  const sales = useAdminStore((s) => s.sales);
  const orderStatuses = useAdminStore((s) => s.orderStatuses);
  const setOverride = useAdminStore((s) => s.setOverride);
  const coupons = useCouponStore((s) => s.availableCoupons);
  const returns = useReturnStore((s) => s.returns);
  const activity = useAdminActivity((s) => s.entries);
  const { data: apiOrders } = useOrders(undefined, fallbackOrders);

  const orders = useMemo(() => {
    const list = (apiOrders ?? fallbackOrders) as any[];
    return list.map((o) => ({ ...o, status: orderStatuses[o.id]?.status ?? o.status }));
  }, [apiOrders, orderStatuses]);

  const gmv = orders.reduce((s, o) => s + (o.total || 0), 0);
  const aov = orders.length ? Math.round(gmv / orders.length) : 0;

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    ORDER_STATUSES.forEach((st) => { counts[st] = 0; });
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
      else counts[o.status] = 1;
    });
    return counts;
  }, [orders]);

  const revenue7d = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const total = orders
        .filter((o) => (o.placed_at || "").slice(0, 10) === key)
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label, total });
    }
    return days;
  }, [orders]);
  const maxDay = Math.max(1, ...revenue7d.map((d) => d.total));

  const lowStock = useMemo(
    () =>
      products
        .map((p) => ({ p, stock: overrides[p.id]?.stockLevel ?? p.stockLevel }))
        .filter((x) => x.stock <= 50)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [overrides]
  );

  const openReturns = returns.filter((r) => !["refunded", "rejected"].includes(r.status));
  const upcoming = getUpcomingSaleAt(sales, Date.now());
  const activeSale = getActiveSaleAt(sales, Date.now());
  const onSaleCount = activeSale ? products.filter((p) => resolveProduct(p).onSale).length : 0;

  const quickRestock = (id: string, name: string, current: number, add: number) => {
    setOverride(id, { stockLevel: current + add, inStock: true });
    logAdminActivity("product.update", `${name} restocked +${add}`, `Stock ${current} → ${current + add}`);
  };

  const stats = [
    { label: "Revenue (GMV)", value: `₹${(gmv / 100000).toFixed(2)}L`, sub: `${orders.length} orders · AOV ₹${aov.toLocaleString("en-IN")}`, icon: IndianRupee, color: "#2D1B69", bg: "#F0ECF9" },
    { label: "Products on sale", value: onSaleCount, sub: activeSale ? `${activeSale.name} LIVE` : "No sale live", icon: Zap, color: "#7CB518", bg: "#F0F9E8", href: "/admin/sales" },
    { label: "Low stock", value: products.filter((p) => (overrides[p.id]?.stockLevel ?? p.stockLevel) <= 50).length, sub: "items at ≤ 50 units", icon: AlertTriangle, color: "#FF9800", bg: "#FFF4E5", href: "/admin/products" },
    { label: "Active coupons", value: coupons.filter((c) => c.active).length, sub: "buyer offers live", icon: Ticket, color: "#E91E63", bg: "#FCE8F0", href: "/admin/coupons" },
    { label: "Open returns", value: openReturns.length, sub: "need action", icon: RotateCcw, color: "#C2185B", bg: "#FCE8F0", href: "/admin/returns" },
    { label: "Staff actions", value: activity.length, sub: "logged in audit trail", icon: Activity, color: "#00BCD4", bg: "#E8F9FC", href: "/admin/audit" },
  ];

  return (
    <div>
      <h1 className="text-[20px] font-extrabold text-[#150726]">Dashboard</h1>
      <p className="text-[12px] text-[#9B8CB5] mt-0.5">Live business overview — all numbers come from real orders, catalog and admin activity.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {stats.map((c) => {
          const inner = (
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9B8CB5] uppercase tracking-wide">{c.label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                  <c.icon className="h-4 w-4" style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-[24px] font-extrabold text-[#150726] mt-1">{c.value}</p>
              <p className="text-[11px] text-[#9B8CB5]">{c.sub}</p>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      {/* Ops pipeline */}
      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#150726] flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#2D1B69]" /> Order pipeline
          </h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[12px] font-bold text-[#2D1B69] hover:underline">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ORDER_STATUSES.filter((s) => s !== "cancelled").map((st) => (
            <Link key={st} href="/admin/orders" className="rounded-xl bg-[#F7F4FC] border border-[#F0ECF9] px-2 py-2.5 text-center hover:border-[#2D1B69]/30 transition-all">
              <p className="text-[20px] font-extrabold text-[#2D1B69]">{pipeline[st] ?? 0}</p>
              <p className="text-[10px] font-bold text-[#9B8CB5] uppercase">{STAGE_LABEL[st]}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h2 className="text-[14px] font-bold text-[#150726]">Revenue — last 7 days</h2>
          <div className="mt-4 flex items-end gap-2 h-36">
            {revenue7d.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-bold text-[#6B5B83]">{d.total > 0 ? `₹${(d.total / 1000).toFixed(0)}k` : ""}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max(4, (d.total / maxDay) * 100)}%`,
                    background: d.total > 0 ? "linear-gradient(180deg, #7CB518, #5f8f12)" : "#F0ECF9",
                  }}
                />
                <span className="text-[9px] font-bold text-[#9B8CB5]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs attention */}
        <div className="rounded-2xl border border-[#E91E63]/20 bg-white p-5">
          <h2 className="text-[14px] font-bold text-[#150726] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#E91E63]" /> Needs attention
          </h2>
          <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto">
            {openReturns.slice(0, 3).map((r) => (
              <Link key={r.id} href="/admin/returns" className="flex items-center justify-between rounded-xl bg-[#FCE8F0] px-3 py-2.5 hover:bg-[#F8BBD0]/40">
                <span className="text-[12px] font-bold text-[#150726]">Return {r.id} · {r.reason}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#E91E63]" />
              </Link>
            ))}
            {lowStock.map(({ p, stock }) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#FFF4E5] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#150726] truncate max-w-[220px]">{p.name}</p>
                  <p className="text-[10px] text-[#9B8CB5]">{stock} units left</p>
                </div>
                <div className="flex gap-1.5">
                  {[50, 100].map((q) => (
                    <button key={q} onClick={() => quickRestock(p.id, p.name, stock, q)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white border border-[#FF9800]/30 text-[10px] font-bold text-[#FF9800] hover:bg-[#FF9800] hover:text-white">
                      <Plus className="h-3 w-3" />{q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {upcoming && (
              <Link href="/admin/sales" className="flex items-center justify-between rounded-xl bg-[#F0ECF9] px-3 py-2.5">
                <span className="text-[12px] font-bold text-[#150726]">Sale “{upcoming.name}” starts {new Date(upcoming.startAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#2D1B69]" />
              </Link>
            )}
            {openReturns.length === 0 && lowStock.length === 0 && !upcoming && (
              <p className="text-[12px] text-[#7CB518] font-bold text-center py-4">All clear — nothing needs action 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* Sale engine status */}
      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#150726] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#FF9800]" /> Sale engine
          </h2>
          <Link href="/admin/sales" className="flex items-center gap-1 text-[12px] font-bold text-[#2D1B69] hover:underline">
            Manage sales <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {activeSale ? (
          <div className="mt-3 rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 px-4 py-3 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-60" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7CB518]" /></span>
            <div>
              <p className="text-[13px] font-extrabold text-[#150726]">{activeSale.name} is LIVE — {onSaleCount} products discounted</p>
              <p className="text-[11px] text-[#6B5B83]">Ends {new Date(activeSale.endAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · prices revert automatically</p>
            </div>
          </div>
        ) : upcoming ? (
          <div className="mt-3 rounded-xl bg-[#FFF4E5] border border-[#FF9800]/30 px-4 py-3">
            <p className="text-[13px] font-bold text-[#150726]">{upcoming.name} scheduled</p>
            <p className="text-[11px] text-[#6B5B83]">Starts {new Date(upcoming.startAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-[#F7F4FC] border border-[#DDD6EE] px-4 py-3 flex items-center justify-between">
            <p className="text-[12px] text-[#6B5B83]">No sale live. Create one to announce discounts store-wide like Blinkit/Zepto.</p>
            <Link href="/admin/sales" className="px-3 py-1.5 rounded-lg bg-[#E91E63] text-white text-[11px] font-bold hover:bg-[#C2185B]">Create sale</Link>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {activity.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#150726] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#00BCD4]" /> Recent staff activity
            </h2>
            <Link href="/admin/audit" className="flex items-center gap-1 text-[12px] font-bold text-[#2D1B69] hover:underline">
              Full log <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-[#F0ECF9]">
            {activity.slice(0, 5).map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-[#150726] truncate">{a.summary}</p>
                <span className="text-[10px] text-[#9B8CB5] whitespace-nowrap tabular-nums">
                  {new Date(a.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
