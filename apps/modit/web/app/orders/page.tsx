"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, fetchOrderDetail } from "@/lib/modit-api";
import { useCartStore } from "@/lib/cart-store";
import { resolveReorderProduct, reorderQuantity } from "@/lib/order-reorder";
import { notifyOrderEvent } from "@/lib/order-notifications";
import { useAdminStore } from "@/lib/admin-store";
import { formatINR } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { useToast } from "@foundation/ui";
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, ChevronRight, ArrowLeft, FileText, IndianRupee, Repeat, Check, CalendarClock } from "lucide-react";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3, expected_delivery: "2026-08-02T14:00:00Z", items: [{ productId: "cement-acc", quantity: 200 }, { productId: "paint-asian-apex", quantity: 5 }, { productId: "hardware-tools-stanley-94-248-65-piece-homeowner-s-22", quantity: 500 }] },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2, expected_delivery: "2026-08-07T14:00:00Z", items: [{ productId: "cement-ultratech", quantity: 100 }, { productId: "tile-kajaria-1", quantity: 200 }] },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1, expected_delivery: "2026-08-10T14:00:00Z", items: [{ productId: "tile-drfixit", quantity: 20 }] },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Package; dot: string }> = {
  delivered: { label: "Delivered", color: "text-[#7CB518]", bg: "bg-[#F0F9E8]", border: "border-[#7CB518]/20", icon: CheckCircle2, dot: "bg-[#7CB518]" },
  in_transit: { label: "In Transit", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Truck, dot: "bg-[#00BCD4]" },
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#F0ECF9]", border: "border-[#2D1B69]/20", icon: CheckCircle2, dot: "bg-[#2D1B69]" },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#FCE4EC]", border: "border-[#E91E63]/20", icon: Clock, dot: "bg-[#E91E63]" },
  placed: { label: "Placed", color: "text-[#9B8CB5]", bg: "bg-[#F8F6FC]", border: "border-[#DDD6EE]", icon: FileText, dot: "bg-[#9B8CB5]" },
  dispatched: { label: "Dispatched", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Truck, dot: "bg-[#00BCD4]" },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: Clock, dot: "bg-red-400" },
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const { data: orders, isLoading } = useOrders(undefined, fallbackOrders);
  const orderList = orders ?? fallbackOrders;
  const adminOrderStatuses = useAdminStore((s) => s.orderStatuses);

  const totalSpent = orderList.reduce((sum, o) => sum + ((o as any).total || 0), 0);
  const deliveredCount = orderList.filter(o => o.status === "delivered").length;
  const activeCount = orderList.filter(o => ["placed", "in_transit", "confirmed", "processing", "dispatched"].includes(o.status)).length;

  const handleReorder = async (order: any) => {
    // Only real catalog products — never invent a placeholder item (it would
    // fail at server checkout with an unknown SKU). The orders list endpoint
    // returns ids and totals but no line items, so fetch full detail first
    // when the row doesn't carry items (demo fallback rows do).
    let lines = (order.items ?? []) as Array<any>;
    if (lines.length === 0) {
      try {
        const detail: any = await fetchOrderDetail(order.id);
        lines = Array.isArray(detail?.items) ? detail.items : [];
      } catch {
        toast.error("Reorder failed", "Could not load that order's items.");
        return;
      }
    }
    let addedCount = 0;
    const wantedCount = lines.length;
    lines.forEach((line) => {
      const p = resolveReorderProduct(line);
      if (p) {
        addItem(p, reorderQuantity(line));
        addedCount += 1;
      }
    });
    if (addedCount === 0) {
      toast.error("Reorder failed", "Those products are no longer available.");
      return;
    }
    if (addedCount < wantedCount) {
      toast.warning("Partial reorder", `${addedCount} of ${wantedCount} items were still available.`);
    }
    notifyOrderEvent({
      title: "Items reordered",
      body: `${addedCount} item(s) from order ${order.order_number || order.id} added back to your cart.`,
      type: "order",
      orderId: order.id,
    });
    setReorderedId(order.id);
    setTimeout(() => router.push("/cart"), 600);
  };

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Gradient header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,188,212,0.4), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/products" aria-label="Back to products" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-title-md font-extrabold text-white">My Orders</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#7CB518]/20 flex items-center justify-center">
                  <Package className="h-3.5 w-3.5 text-[#7CB518]" />
                </div>
                <span className="text-micro text-white/50">Total</span>
              </div>
              <p className="text-title-lg font-extrabold text-white">{orderList.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#00BCD4]/20 flex items-center justify-center">
                  <Truck className="h-3.5 w-3.5 text-[#00BCD4]" />
                </div>
                <span className="text-micro text-white/50">Active</span>
              </div>
              <p className="text-title-lg font-extrabold text-white">{activeCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#E91E63]/20 flex items-center justify-center">
                  <IndianRupee className="h-3.5 w-3.5 text-[#E91E63]" />
                </div>
                <span className="text-micro text-white/50">Spent</span>
              </div>
              <p className="text-title-md font-extrabold text-white">{formatINR(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] py-4 sm:px-6">
        {orderList.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-caption font-bold border transition-all ${
                  statusFilter === t.id
                    ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                    : "border-[#DDD6EE] bg-white text-[#6B5B83] hover:border-[#2D1B69]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="space-y-3 px-4 sm:px-0">
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
          <div className="py-20 text-center px-4">
            <div className="fx-float-slow mx-auto mb-6 h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center">
              <Package className="h-10 w-10 text-[#2D1B69]" />
            </div>
            <h2 className="text-title-md font-bold text-[#150726]">No orders yet</h2>
            <p className="mt-2 text-body-sm text-[#9B8CB5] max-w-xs mx-auto">When you place an order, it will appear here with tracking details and delivery updates.</p>
            <Link href="/products"
              className="btn-shine mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#7CB518] text-white text-body-md font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25">
              <ShoppingCart className="h-4 w-4" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-4 sm:px-0">
            {orderList
              .filter((order) => {
                const s = (adminOrderStatuses[(order as any).id]?.status ?? (order as any).status) as string;
                if (statusFilter === "all") return true;
                if (statusFilter === "delivered") return s === "delivered";
                if (statusFilter === "cancelled") return s === "cancelled";
                return !["delivered", "cancelled"].includes(s);
              })
              .map((order, idx) => {
              const liveStatus = adminOrderStatuses[order.id]?.status ?? order.status;
              const st = statusConfig[liveStatus] || statusConfig.placed;
              const Icon = st.icon;
              const date = order.placed_at
                ? new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const time = order.placed_at
                ? new Date(order.placed_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "";
              const itemCount = (order as any).items_count || 0;
              const total = (order as any).total || 0;

              return (
                <Reveal key={order.id} delay={Math.min(idx * 60, 300)}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/orders/${order.id}`); }}
                  className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#2D1B69]/20 cursor-pointer group"
                >
                    {/* Color accent bar */}
                    <div className={`h-[3px] ${st.dot}`} />

                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-body-md font-extrabold text-[#150726] tracking-tight">{order.order_number || order.id.slice(0, 12)}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-micro font-bold border ${st.bg} ${st.color} ${st.border}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-caption text-[#9B8CB5]">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{date}</span>
                            <span>·</span>
                            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-body-lg font-extrabold text-[#2D1B69]">{formatINR(total)}</p>
                          <ChevronRight className="h-4 w-4 text-[#9B8CB5] ml-auto mt-1 group-hover:text-[#7CB518] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Progress bar for active orders */}
                      {["in_transit", "confirmed", "processing", "dispatched"].includes(liveStatus) && (
                        <div className="mt-4 pt-3 border-t border-[#F0ECF9]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-tiny font-semibold text-[#9B8CB5] uppercase tracking-wide">Progress</span>
                                <span className="text-tiny font-bold text-[#2D1B69]">
                                  Step {liveStatus === "confirmed" ? "1" : liveStatus === "processing" ? "2" : "3"} of 4 · {liveStatus === "confirmed" ? "30%" : liveStatus === "processing" ? "50%" : liveStatus === "dispatched" ? "70%" : "85%"}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#F0ECF9] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${liveStatus === "in_transit" ? "w-[85%] bg-gradient-to-r from-[#00BCD4] to-[#7CB518]" : liveStatus === "dispatched" ? "w-[70%] bg-[#00BCD4]" : liveStatus === "processing" ? "w-[50%] bg-[#E91E63]" : "w-[30%] bg-[#2D1B69]"}`}
                                />
                              </div>
                            </div>
                            <span className="text-micro font-semibold text-[#6B5B83] whitespace-nowrap">
                              {liveStatus === "in_transit" ? "Arriving soon" : liveStatus === "dispatched" ? "On the way" : liveStatus === "processing" ? "Being prepared" : "Order confirmed"}
                            </span>
                          </div>
                          {(order as any).expected_delivery && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-micro font-semibold text-[#00BCD4]">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Estimated delivery by {new Date((order as any).expected_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivered checkmark + Reorder */}
                      {liveStatus === "delivered" && (
                        <div className="mt-3 pt-3 border-t border-[#F0ECF9] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-[#F0F9E8] flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-[#7CB518]" />
                            </div>
                            <span className="text-caption font-semibold text-[#7CB518]">Delivered successfully</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(order);
                            }}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-micro font-bold transition-all ${
                              reorderedId === order.id
                                ? "bg-[#7CB518] text-white"
                                : "bg-[#7CB518]/10 text-[#7CB518] hover:bg-[#7CB518] hover:text-white"
                            }`}
                          >
                            {reorderedId === order.id ? <><Check className="h-3 w-3" /> Added</> : <><Repeat className="h-3 w-3" /> Reorder</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
