"use client";

import { CheckCircle2, Clock, MapPin, Package, Truck } from "lucide-react";
import type { DeliveryTrackRead } from "@foundation/api-client";

const stepIcons: Record<string, typeof Package> = {
  placed: Package,
  packed: Package,
  dispatched: Truck,
  out_for_delivery: Truck,
  arriving: MapPin,
  delivered: CheckCircle2,
};

function formatEta(etaMinutes: number | null): string {
  if (etaMinutes === null || etaMinutes === undefined) return "Calculating…";
  if (etaMinutes < 60) return `Arriving in ~${etaMinutes} min`;
  const h = Math.floor(etaMinutes / 60);
  const m = etaMinutes % 60;
  return m === 0 ? `Arriving in ~${h} hr` : `Arriving in ~${h} hr ${m} min`;
}

export function DeliveryTracker({ track }: { track: DeliveryTrackRead }) {
  const currentIdx = track.timeline.reduce(
    (acc, s, i) => (s.done ? i : acc),
    -1,
  );

  return (
    <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B8CB5]">
            {track.delivery_number}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#2D1B69]">
            {track.status === "delivered" ? "Delivered" : formatEta(track.eta_minutes)}
          </h2>
        </div>
        <span className="rounded-full bg-[#F0ECF9] px-3 py-1 text-xs font-bold capitalize text-[#2D1B69]">
          {track.status.replace(/_/g, " ")}
        </span>
      </div>

      {track.distance_km !== null && track.distance_km !== undefined && track.status !== "delivered" && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#5B4B8A]">
          <MapPin className="h-4 w-4" />
          Rider {track.distance_km} km away
        </p>
      )}

      <ol className="mt-5 space-y-0">
        {track.timeline.map((step, i) => {
          const Icon = stepIcons[step.key] ?? Package;
          const isCurrent = i === currentIdx + 1 && !step.done && track.status !== "delivered";
          return (
            <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
              {i < track.timeline.length - 1 && (
                <span
                  className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${
                    step.done ? "bg-[#7CB518]" : "bg-[#EDE9F5]"
                  }`}
                />
              )}
              <span
                className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  step.done
                    ? "border-[#7CB518] bg-[#7CB518] text-white"
                    : isCurrent
                      ? "border-[#00BCD4] bg-white text-[#00BCD4]"
                      : "border-[#EDE9F5] bg-white text-[#C9C2DE]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="pt-1">
                <p
                  className={`text-sm font-bold ${
                    step.done || isCurrent ? "text-[#2D1B69]" : "text-[#9B8CB5]"
                  }`}
                >
                  {step.label}
                </p>
                {step.at && (
                  <p className="flex items-center gap-1 text-xs text-[#9B8CB5]">
                    <Clock className="h-3 w-3" />
                    {new Date(step.at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-center text-[11px] text-[#9B8CB5]">
        Live tracking · auto-refreshes every 15 seconds
      </p>
    </div>
  );
}
