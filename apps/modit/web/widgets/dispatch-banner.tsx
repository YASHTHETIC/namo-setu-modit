"use client";

import { Clock } from "lucide-react";
import type { DispatchBannerData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function DispatchBannerWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<DispatchBannerData>(data);

  return (
    <div className="bg-[#1E0A3C] px-4 py-2.5">
      <div className="max-w-[1440px] mx-auto flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 text-[var(--green)]" />
        </div>
        <p className="text-[12px] text-white/80">
          Your order will be dispatched at <span className="font-bold text-[var(--green)]">{d.dispatch_time}</span> on <span className="font-bold text-[var(--green)]">{d.dispatch_date}</span>
        </p>
      </div>
    </div>
  );
}
