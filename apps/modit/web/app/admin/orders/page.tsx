"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Check } from "lucide-react";
import { useOrders } from "@/lib/modit-api";
import { useAdminStore, ORDER_STATUSES } from "@/lib/admin-store";
import { notifyOrderEvent } from "@/lib/order-notifications";
import { logAdminActivity } from "@/lib/admin-activity";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3 },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2 },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1 },
];

const STATUS_LABEL: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrdersPage() {
  const [query, setQuery] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const { data: orders } = useOrders(undefined, fallbackOrders);
  const orderStatuses = useAdminStore((s) => s.orderStatuses);
  const setOrderStatus = useAdminStore((s) => s.setOrderStatus);

  const list = (orders ?? fallbackOrders).map((o: any) => ({
    ...o,
    status: orderStatuses[o.id]?.status ?? o.status,
    overridden: Boolean(orderStatuses[o.id]),
  }));

  const filtered = query.trim()
    ? list.filter((o: any) => (o.order_number || o.id).toLowerCase().includes(query.trim().toLowerCase()))
    : list;

  const handleStatus = (order: any, status: string) => {
    setOrderStatus(order.id, status);
    logAdminActivity("order.status", `Order ${order.order_number || order.id} → ${STATUS_LABEL[status] ?? status}`);
    notifyOrderEvent({
      title: `Order ${STATUS_LABEL[status] ?? status}`,
      body: `Order ${order.order_number || order.id} is now ${STATUS_LABEL[status] ?? status}.`,
      type: "delivery",
      orderId: order.id,
    });
    setSavedId(order.id);
    setTimeout(() => setSavedId(null), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Orders</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">Move orders through fulfillment — buyer timeline and notifications update instantly.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link href={`/orders/${o.id}`} className="flex items-center gap-2 hover:underline">
                <p className="text-[14px] font-extrabold text-[#150726]">{o.order_number || o.id}</p>
                <ChevronRight className="h-4 w-4 text-[#9B8CB5]" />
              </Link>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12px] font-extrabold text-[#2D1B69]">₹{(o.total || 0).toLocaleString("en-IN")}</span>
                <span className="text-[11px] text-[#9B8CB5]">{o.items_count ?? "?"} items</span>
                {o.overridden && (
                  <span className="rounded-full bg-[#E8F9FC] px-2 py-0.5 text-[10px] font-bold text-[#00BCD4]">Updated by admin</span>
                )}
                {savedId === o.id && (
                  <span className="flex items-center gap-1 rounded-full bg-[#F0F9E8] px-2 py-0.5 text-[10px] font-bold text-[#7CB518]"><Check className="h-3 w-3" /> Saved</span>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ORDER_STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatus(o, st)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all ${
                    o.status === st
                      ? "border-[#7CB518] bg-[#F0F9E8] text-[#5f8f12]"
                      : "border-[#F0ECF9] text-[#9B8CB5] hover:border-[#C9B8E8] hover:text-[#2D1B69]"
                  }`}
                >
                  {STATUS_LABEL[st]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[13px] text-[#9B8CB5] py-10">No orders match “{query}”.</p>
        )}
      </div>
    </div>
  );
}
