"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Check, Truck, PackageOpen } from "lucide-react";
import { useOrders, useUpdateOrderStatus, useCreateDelivery } from "@/lib/modit-api";
import { ORDER_STATUSES } from "@/lib/admin-store";
import { notifyOrderEvent } from "@/lib/order-notifications";
import { logAdminActivity } from "@/lib/admin-activity";
import { broadcastPush } from "@/lib/pwa";

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
  const [syncError, setSyncError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState<Record<string, string>>({});
  const { data: orders, isError: ordersOffline, isLoading: ordersLoading } = useOrders(undefined);
  const updateStatus = useUpdateOrderStatus();
  const createDelivery = useCreateDelivery();

  const list = orders ?? [];

  const filtered = query.trim()
    ? list.filter((o: any) => (o.order_number || o.id).toLowerCase().includes(query.trim().toLowerCase()))
    : list;

  const handleStatus = async (order: any, status: string) => {
    // Server is the source of truth: PATCH the order, then the shared cache
    // refetch reflects the new status for admin and buyer alike.
    setSyncError("");
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status });
    } catch {
      setSyncError(`Server sync failed for ${order.order_number || order.id} — try again.`);
      return;
    }
    logAdminActivity("order.status", `Order ${order.order_number || order.id} → ${STATUS_LABEL[status] ?? status}`);
    broadcastPush(
      `Order ${STATUS_LABEL[status] ?? status}`,
      `Order ${order.order_number || order.id} is now ${STATUS_LABEL[status] ?? status}. Tap to track.`,
      `/orders/${order.id}`
    );
    notifyOrderEvent({
      title: `Order ${STATUS_LABEL[status] ?? status}`,
      body: `Order ${order.order_number || order.id} is now ${STATUS_LABEL[status] ?? status}.`,
      type: "delivery",
      orderId: order.id,
    });
    setSavedId(order.id);
    setTimeout(() => setSavedId(null), 1500);
  };

  const handleDispatch = async (order: any) => {
    const poId = order.purchase_order_id;
    if (!poId || busyId) return;
    setBusyId(order.id);
    setSyncError("");
    try {
      // picked_up = the goods leave the warehouse NOW: the backend stamps
      // dispatched_at so the buyer's track timeline matches the order status.
      const delivery = await createDelivery.mutateAsync({ purchase_order_id: poId, status: "picked_up" });
      setDispatched((prev) => ({ ...prev, [order.id]: delivery.delivery_number }));
      await handleStatus(order, "dispatched");
    } catch {
      setSyncError(`Could not create delivery for ${order.order_number || order.id}.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726]">Orders</h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">Move orders through fulfillment — buyer timeline and notifications update instantly.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-body-sm focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link href={`/orders/${o.id}`} className="flex items-center gap-2 hover:underline">
                <p className="text-body-md font-extrabold text-[#150726]">{o.order_number || o.id}</p>
                <ChevronRight className="h-4 w-4 text-[#9B8CB5]" />
              </Link>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-caption font-extrabold text-[#2D1B69]">₹{(o.total || 0).toLocaleString("en-IN")}</span>
                <span className="text-micro text-[#9B8CB5]">{o.items_count ?? "?"} items</span>
                {savedId === o.id && (
                  <span className="flex items-center gap-1 rounded-full bg-[#F0F9E8] px-2 py-0.5 text-tiny font-bold text-[#7CB518]"><Check className="h-3 w-3" /> Saved</span>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ORDER_STATUSES.map((st) => {
                // Delivered/cancelled orders are final server-side — no
                // clickable dead buttons that would 400.
                const final = o.status === "delivered" || o.status === "cancelled";
                return (
                  <button
                    key={st}
                    onClick={() => handleStatus(o, st)}
                    disabled={final || o.status === st}
                    className={`px-2.5 py-1.5 rounded-lg text-micro font-bold border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      o.status === st
                        ? "border-[#7CB518] bg-[#F0F9E8] text-[#5a8010]"
                        : "border-[#F0ECF9] text-[#9B8CB5] hover:border-[#C9B8E8] hover:text-[#2D1B69]"
                    }`}
                  >
                    {STATUS_LABEL[st]}
                  </button>
                );
              })}
              {o.purchase_order_id && !["dispatched", "in_transit", "delivered", "cancelled"].includes(o.status) && (
                <button
                  onClick={() => handleDispatch(o)}
                  disabled={busyId === o.id}
                  className="px-3 py-1.5 rounded-lg text-micro font-bold bg-[#2D1B69] text-white hover:bg-[#1E1245] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Truck className="h-3.5 w-3.5" />
                  {busyId === o.id ? "Dispatching…" : "Dispatch + delivery"}
                </button>
              )}
            </div>
            {dispatched[o.id] && (
              <p className="mt-2 text-micro font-bold text-[#7CB518]">
                Delivery {dispatched[o.id]} created — buyer can track it live.
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && !ordersLoading && !ordersOffline && (
          <div className="text-center py-14">
            <PackageOpen className="mx-auto h-10 w-10 text-[#C9B8E8]" />
            <p className="mt-3 text-body-sm font-bold text-[#150726]">No orders yet</p>
            <p className="mt-1 text-caption text-[#9B8CB5]">New buyer orders will show up here automatically.</p>
          </div>
        )}
        {ordersOffline && (
          <p className="text-center text-body-sm text-[#9B8CB5] py-10">Orders unavailable — server unreachable. Recheck connection.</p>
        )}
        {list.length > 0 && filtered.length === 0 && (
          <p className="text-center text-body-sm text-[#9B8CB5] py-10">No orders match “{query}”.</p>
        )}
        {syncError && (
          <p className="rounded-xl border border-[#E91E63]/30 bg-[#FCE4EC] px-4 py-2.5 text-caption font-semibold text-[#E91E63]">
            {syncError}
          </p>
        )}
      </div>
    </div>
  );
}
