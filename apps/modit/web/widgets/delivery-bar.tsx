"use client";

import { MapPin, Zap } from "lucide-react";
import type { DeliveryBarData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function DeliveryBarWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<DeliveryBarData>(data);

  return (
    <div className="bg-[#150726] border-b border-white/5 px-4 py-2.5">
      <div className="max-w-[1440px] mx-auto flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[var(--green)]/20 border border-[var(--green)]/30 rounded-xl px-3 py-1.5">
          <span className="text-[18px] font-black text-[var(--green)]">{d.eta_minutes}</span>
          <span className="text-[9px] font-bold text-[var(--green)] uppercase leading-tight">Mins</span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <MapPin className="h-3.5 w-3.5 text-[var(--green)]" />
          <span className="text-[11px] font-semibold">Deliver To</span>
        </div>
        <span className="text-[12px] font-bold text-[var(--green)]">{d.pincode}</span>
        <div className="ml-auto">
          <Zap className="h-5 w-5 text-[var(--green)]" />
        </div>
      </div>
    </div>
  );
}
