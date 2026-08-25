"use client";

import Link from "next/link";
import { useOrders } from "@/lib/modit-api";
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, ChevronRight, ArrowLeft, FileText } from "lucide-react";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3 },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2 },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
  delivered: { label: "Delivered", color: "text-[#7CB518]", bg: "bg-[#7CB518]/10", icon: CheckCircle2 },
  in_transit: { label: "In Transit", color: "text-[#00BCD4]", bg: "bg-[#00BCD4]/10", icon: Truck },
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#2D1B69]/10", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#E91E63]/10", icon: Clock },
  placed: { label: "Placed", color: "text-[#9B8CB5]", bg: "bg-[#9B8CB5]/10", icon: FileText },
  dispatched: { label: "Dispatched", color: "text-[#00BCD4]", bg: "bg-[#00BCD4]/10", icon: Truck },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", icon: Clock },
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders(undefined, fallbackOrders);
  const orderList = orders ?? fallbackOrders;

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/products" className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[16px] font-bold text-white">My Orders</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[800px] py-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#DDD6EE] bg-white p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2"><div className="h-4 w-32 bg-[#F0ECF9] rounded" /><div className="h-3 w-24 bg-[#F0ECF9] rounded" /></div>
                  <div className="h-6 w-20 bg-[#F0ECF9] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : orderList.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center">
              <Package className="h-10 w-10 text-[#2D1B69]" />
            </div>
            <h2 className="text-[18px] font-bold text-[#150726]">No orders yet</h2>
            <p className="mt-2 text-[13px] text-[#9B8CB5] max-w-xs mx-auto">When you place an order, it will appear here with tracking details and delivery updates.</p>
            <Link href="/products"
              className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#2D1B69] text-white text-[13px] font-bold hover:bg-[#1E0F4A] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orderList.map((order) => {
              const st = statusConfig[order.status] || statusConfig.placed;
              const Icon = st.icon;
              const date = order.placed_at
                ? new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#2D1B69]/30 cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#150726]">{order.order_number || order.id.slice(0, 12)}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.color}`}>
                            <Icon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#9B8CB5]">
                          {date} · {(order as any).items_count || 0} item{((order as any).items_count || 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[15px] font-extrabold text-[#2D1B69]">₹{((order as any).total || 0).toLocaleString("en-IN")}</p>
                        <ChevronRight className="h-4 w-4 text-[#9B8CB5] ml-auto mt-1 group-hover:text-[#2D1B69] transition-colors" />
                      </div>
                    </div>

                    {/* Status Bar */}
                    {(order.status === "in_transit" || order.status === "confirmed") && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#F0ECF9] overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${order.status === "in_transit" ? "w-3/4 bg-[#00BCD4]" : "w-1/3 bg-[#2D1B69]"}`} />
                        </div>
                        <span className="text-[10px] font-semibold text-[#9B8CB5]">
                          {order.status === "in_transit" ? "Arriving soon" : "Being processed"}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
