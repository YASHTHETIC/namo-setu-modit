"use client";

import { CheckCircle2, Clock, MapPin, Package, Truck, Zap } from "lucide-react";
import type { DeliveryTrackRead } from "@foundation/api-client";

const stepIcons: Record<string, typeof Package> = {
  placed: Package,
  packed: Package,
  dispatched: Truck,
  out_for_delivery: Truck,
  arriving: MapPin,
  delivered: CheckCircle2,
};

function formatEta(etaMinutes: number): string {
  if (etaMinutes < 60) return `Arriving in ~${etaMinutes} min`;
  const h = Math.floor(etaMinutes / 60);
  const m = etaMinutes % 60;
  return m === 0 ? `Arriving in ~${h} hr` : `Arriving in ~${h} hr ${m} min`;
}

/**
 * Honest headline. An ETA only exists once the rider has pinged a location
 * AND we know the destination — until then "Calculating…" would spin
 * forever. Fall back to what the delivery status actually says instead.
 */
function trackHeadline(track: DeliveryTrackRead): string {
  if (track.status === "delivered") return "Delivered";
  if (track.status === "failed") return "Delivery delayed";
  if (track.eta_minutes !== null && track.eta_minutes !== undefined) {
    return formatEta(track.eta_minutes);
  }
  if (track.status === "pending") return "Preparing your materials";
  return "On the way to site";
}

export function DeliveryTracker({ track }: { track: DeliveryTrackRead }) {
  const currentIdx = track.timeline.reduce(
    (acc, s, i) => (s.done ? i : acc),
    -1,
  );

  return (
    <div className="card-2028 specular-sheen rounded-3xl border border-[#DDD6EE] bg-white p-6 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-micro font-bold uppercase tracking-wider text-[#9B8CB5]">
            Consignment #{track.delivery_number}
          </p>
          <h2 className="mt-1 text-title-lg font-black text-[#2D1B69]">
            {trackHeadline(track)}
          </h2>
        </div>
        <span className={`rounded-full px-3.5 py-1 text-tiny font-black capitalize border ${
          track.status === "delivered"
            ? "bg-[#F0F9E8] text-[#5A8010] border-[#7CB518]/30"
            : "bg-[#F0ECF9] text-[#2D1B69] border-[#2D1B69]/20"
        }`}>
          {track.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* 2028 Real-time Telemetry Bar */}
      {track.status !== "delivered" && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0b0318] p-3.5 text-white border border-white/10 shadow-glass-elevated">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BCD4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00BCD4]"></span>
            </span>
            <div>
              <p className="text-caption font-extrabold text-white flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-[#00BCD4]" />
                <span>Live GPS Telemetry</span>
              </p>
              {track.distance_km !== null && track.distance_km !== undefined ? (
                <p className="text-micro text-[#00BCD4] font-medium">Rider {track.distance_km} km away from site</p>
              ) : (
                <p className="text-micro text-white/70">Vehicle assigned · en route to pickup hub</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-tiny font-bold text-[#7CB518] bg-[#7CB518]/20 px-2.5 py-1 rounded-full border border-[#7CB518]/30">
              <Zap className="h-3 w-3" />
              <span>Active Route</span>
            </span>
          </div>
        </div>
      )}

      <ol className="mt-6 space-y-0">
        {track.timeline.map((step, i) => {
          const Icon = stepIcons[step.key] ?? Package;
          const isCurrent = i === currentIdx + 1 && !step.done && track.status !== "delivered";
          return (
            <li key={step.key} className="relative flex gap-3.5 pb-6 last:pb-0">
              {i < track.timeline.length - 1 && (
                <span
                  className={`absolute left-[17px] top-9 h-[calc(100%-2rem)] w-0.5 transition-all duration-500 ${
                    step.done ? "bg-[#7CB518]" : "bg-[#DDD6EE]"
                  }`}
                />
              )}
              <span
                className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                  step.done
                    ? "border-[#7CB518] bg-[#7CB518] text-white shadow-cyber-green"
                    : isCurrent
                      ? "border-[#00BCD4] bg-white text-[#00BCD4] shadow-cyber-cyan animate-pulse"
                      : "border-[#DDD6EE] bg-white text-[#9B8CB5]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="pt-0.5">
                <p
                  className={`text-body-sm font-bold ${
                    step.done || isCurrent ? "text-[#2D1B69]" : "text-[#9B8CB5]"
                  }`}
                >
                  {step.label}
                </p>
                {step.at && (
                  <p className="flex items-center gap-1 text-micro text-[#9B8CB5] mt-0.5">
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

      <div className="mt-5 pt-3 border-t border-[#DDD6EE]/60 text-center">
        <p className="text-micro font-medium text-[#9B8CB5] flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518]"></span>
          <span>Live telemetry · Synchronized with MODIT Logistics Network</span>
        </p>
      </div>
    </div>
  );
}
