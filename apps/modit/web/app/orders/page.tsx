"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders } from "@/lib/modit-api";
import { useCartStore } from "@/lib/cart-store";
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, ChevronRight, ArrowLeft, FileText, IndianRupee, TrendingUp, MapPin, Repeat, Check } from "lucide-react";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3 },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2 },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Package; dot: string }> = {
  delivered: { label: "Delivered", color: "text-[#7CB518]", bg: "bg-[#F0F9E8]", border: "border-[#7CB518]/20", icon: CheckCircle2, dot: "bg-[#7CB518]" },
  in_transit: { label: "In Transit", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Truck, dot: "bg-[#00BCD4]" },
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#F0ECF9]", border: "border-[#2D1B69]/20", icon: CheckCircle2, dot: "bg-[#2D1B69]" },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#FCE8F0]", border: "border-[#E91E63]/20", icon: Clock, dot: "bg-[#E91E63]" },
  placed: { label: "Placed", color: "text-[#9B8CB5]", bg: "bg-[#F8F6FC]", border: "border-[#DDD6EE]", icon: FileText, dot: "bg-[#9B8CB5]" },
  dispatched: { label: "Dispatched", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Truck, dot: "bg-[#00BCD4]" },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: Clock, dot: "bg-red-400" },
};

export default function OrdersPage() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const { data: orders, isLoading } = useOrders(undefined, fallbackOrders);
  const orderList = orders ?? fallbackOrders;

  const totalSpent = orderList.reduce((sum, o) => sum + ((o as any).total || 0), 0);
  const deliveredCount = orderList.filter(o => o.status === "delivered").length;
  const activeCount = orderList.filter(o => ["in_transit", "confirmed", "processing", "dispatched"].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Gradient header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #1E0F4A 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,188,212,0.4), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/products" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[18px] font-extrabold text-white">My Orders</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#7CB518]/20 flex items-center justify-center">
                  <Package className="h-3.5 w-3.5 text-[#7CB518]" />
                </div>
                <span className="text-[11px] text-white/50">Total</span>
              </div>
              <p className="text-[20px] font-extrabold text-white">{orderList.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#00BCD4]/20 flex items-center justify-center">
                  <Truck className="h-3.5 w-3.5 text-[#00BCD4]" />
                </div>
                <span className="text-[11px] text-white/50">Active</span>
              </div>
              <p className="text-[20px] font-extrabold text-white">{activeCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-[#E91E63]/20 flex items-center justify-center">
                  <IndianRupee className="h-3.5 w-3.5 text-[#E91E63]" />
                </div>
                <span className="text-[11px] text-white/50">Spent</span>
              </div>
              <p className="text-[18px] font-extrabold text-white">₹{(totalSpent / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] py-4 sm:px-6">
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
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center">
              <Package className="h-10 w-10 text-[#2D1B69]" />
            </div>
            <h2 className="text-[18px] font-bold text-[#150726]">No orders yet</h2>
            <p className="mt-2 text-[13px] text-[#9B8CB5] max-w-xs mx-auto">When you place an order, it will appear here with tracking details and delivery updates.</p>
            <Link href="/products"
              className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25">
              <ShoppingCart className="h-4 w-4" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-4 sm:px-0">
            {orderList.map((order) => {
              const st = statusConfig[order.status] || statusConfig.placed;
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
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#2D1B69]/20 cursor-pointer group">
                    {/* Color accent bar */}
                    <div className={`h-[3px] ${st.dot}`} />

                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-[14px] font-extrabold text-[#150726] tracking-tight">{order.order_number || order.id.slice(0, 12)}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${st.bg} ${st.color} ${st.border}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[#9B8CB5]">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{date}</span>
                            <span>·</span>
                            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-[16px] font-extrabold text-[#2D1B69]">₹{total.toLocaleString("en-IN")}</p>
                          <ChevronRight className="h-4 w-4 text-[#9B8CB5] ml-auto mt-1 group-hover:text-[#7CB518] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Progress bar for active orders */}
                      {["in_transit", "confirmed", "processing", "dispatched"].includes(order.status) && (
                        <div className="mt-4 pt-3 border-t border-[#F0ECF9]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-semibold text-[#9B8CB5] uppercase tracking-wide">Progress</span>
                                <span className="text-[10px] font-bold text-[#2D1B69]">
                                  {order.status === "confirmed" ? "30%" : order.status === "processing" ? "50%" : order.status === "dispatched" ? "70%" : "85%"}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#F0ECF9] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${order.status === "in_transit" ? "w-[85%] bg-gradient-to-r from-[#00BCD4] to-[#7CB518]" : order.status === "dispatched" ? "w-[70%] bg-[#00BCD4]" : order.status === "processing" ? "w-[50%] bg-[#E91E63]" : "w-[30%] bg-[#2D1B69]"}`}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[#6B5B83] whitespace-nowrap">
                              {order.status === "in_transit" ? "Arriving soon" : order.status === "dispatched" ? "On the way" : order.status === "processing" ? "Being prepared" : "Order confirmed"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Delivered checkmark + Reorder */}
                      {order.status === "delivered" && (
                        <div className="mt-3 pt-3 border-t border-[#F0ECF9] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-[#F0F9E8] flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-[#7CB518]" />
                            </div>
                            <span className="text-[12px] font-semibold text-[#7CB518]">Delivered successfully</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const fallbackProduct = {
                                id: `reorder-${order.id}`,
                                name: `${itemCount} items from ${order.order_number || order.id}`,
                                slug: "reorder",
                                sku: "",
                                description: "",
                                shortDescription: "",
                                brand: null,
                                brandSlug: null,
                                category: "",
                                categorySlug: "",
                                subCategory: null,
                                subCategorySlug: null,
                                unit: "unit",
                                unitCode: "unit",
                                unitSymbol: null,
                                price: Math.round(total / itemCount || 1),
                                mrp: Math.round(total / itemCount || 1),
                                discount: 0,
                                bulkPrice: null,
                                bulkMinQty: null,
                                bulkLabel: null,
                                gstRate: 18,
                                gstCode: "GST18",
                                rating: 4.5,
                                reviewCount: 100,
                                inStock: true,
                                stockLevel: 100,
                                moq: 1,
                                deliveryDays: 1,
                                freeDelivery: true,
                                seller: { name: "MODIT", rating: 5, isVerified: true },
                                images: ["/products/cement/Ambuja Cement.png"],
                                specifications: {},
                                features: [],
                                tags: ["reorder"],
                              };
                              addItem(fallbackProduct, 1);
                              setReorderedId(order.id);
                              setTimeout(() => router.push("/cart"), 600);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
