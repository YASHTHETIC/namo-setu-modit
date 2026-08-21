"use client";

import { Clock } from "lucide-react";
import type { DispatchBannerData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function DispatchBannerWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<DispatchBannerData>(data);

  return (
    <div className="bg-[#1E0A3C] px-4 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <p className="text-[13px] text-white/80">
          Your order will be dispatched at <span className="font-bold text-[var(--green)]">{d.dispatch_time}</span> on <span className="font-bold text-[var(--green)]">{d.dispatch_date}</span>
        </p>
      </div>
    </div>
  );
}
