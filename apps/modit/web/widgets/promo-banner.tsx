"use client";

import { Truck } from "lucide-react";
import type { PromoBannerData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function PromoBannerWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<PromoBannerData>(data);

  return (
    <div className="mt-3 mx-4 rounded-2xl overflow-hidden bg-gradient-to-r from-[#2D1B69] via-[#3D2580] to-[#4A2D8A] relative">
      {/* Left: MODIT truck illustration area */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-20 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
            <Truck className="h-10 w-10 text-[var(--green)]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-black text-[var(--green)] uppercase">{d.title}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-[13px] font-bold text-white">{d.subtitle || "Free Delivery"}</p>
          <p className="text-[11px] text-white/70">on next 5 orders</p>
          {d.badge_text && (
            <span className="inline-block mt-1.5 text-white text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--pink)]">
              {d.badge_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
