"use client";

import { Truck } from "lucide-react";
import type { PromoBannerData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function PromoBannerWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<PromoBannerData>(data);

  return (
    <div className="mt-3 mx-4 rounded-2xl overflow-hidden bg-gradient-to-r from-[#2D1B69] to-[#4A2D8A] relative">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Truck className="h-8 w-8 text-[var(--green)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-[var(--green)]">{d.title}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-bold text-white">Free Delivery</p>
          <p className="text-[11px] text-white/70">{d.subtitle}</p>
          {d.badge_text && (
            <span className="inline-block mt-1 text-white text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.badge_color }}>
              {d.badge_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
