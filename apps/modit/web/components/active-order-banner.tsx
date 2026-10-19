"use client";

import Link from "next/link";
import { Truck, ChevronRight, Package } from "lucide-react";
import { useOrders, useOrderDelivery, useDeliveryTrack } from "@/lib/modit-api";
import { useAuthReady } from "@/lib/use-auth";

const ACTIVE_STATUSES = new Set(["placed", "confirmed", "processing", "in_transit", "dispatched"]);

const STATUS_LABEL: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  in_transit: "In transit",
  dispatched: "Dispatched",
};

function formatEta(minutes: number): string {
  if (minutes < 60) return `Arriving in ~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `Arriving in ~${h} hr` : `Arriving in ~${h} hr ${m} min`;
}

/**
 * Dispatch/ETA banner — the mock's "your order will be dispatched" tile,
 * backed purely by real data: latest non-terminal order, its delivery
 * (if dispatched) and the server's live eta_minutes. Renders nothing for
 * guests or when no order is active.
 */
export function ActiveOrderBanner() {
  const loggedIn = useAuthReady();
  const { data: orders } = useOrders(undefined, undefined, { enabled: loggedIn });
  const active = Array.isArray(orders)
    ? orders.find((o) => ACTIVE_STATUSES.has(o.status))
    : undefined;
  const { data: delivery } = useOrderDelivery(active?.id, Boolean(active));
  const { data: track } = useDeliveryTrack(delivery?.id);

  if (!active) return null;

  const label = STATUS_LABEL[active.status] ?? active.status;
  const eta =
    track?.eta_minutes !== null && track?.eta_minutes !== undefined
      ? formatEta(track.eta_minutes)
      : `Placed ${new Date(active.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  const Icon = active.status === "placed" || active.status === "confirmed" ? Package : Truck;

  return (
    <Link
      href={delivery ? `/track/${delivery.id}` : `/orders/${active.id}`}
      className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#2D1B69] to-[#1E1245] px-4 py-3 transition-colors hover:border-[#7CB518]/40 group"
    >
      <span className="h-9 w-9 flex-shrink-0 rounded-full border border-[#7CB518]/30 bg-[#7CB518]/15 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#7CB518]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-extrabold text-white">
          Order {active.order_number} · {label}
        </span>
        <span className="mt-0.5 block truncate text-micro text-white/60">{eta}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
