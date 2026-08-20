"use client";

import { Shield, RotateCcw, Clock, CircleCheck, Package } from "lucide-react";
import type { AssuredStripData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  RotateCcw,
  Clock,
  CircleCheck,
  Package,
};

export function AssuredStripWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<AssuredStripData>(data);

  return (
    <div className="mt-3 mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0A3C] to-[#150726] border border-white/10 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--green)] via-[var(--pink)] to-[var(--cyan)]" />
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[var(--pink)]/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[var(--green)]/20 rounded-full blur-2xl" />
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <h3 className="text-[14px] font-bold text-white">{d.title.split(" ")[0]} <span className="text-[var(--green)]">{d.title.split(" ").slice(1).join(" ")}</span></h3>
          <Shield className="h-4 w-4 text-[var(--green)]" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {d.features.map((f) => {
            const Icon = ICON_MAP[f.icon] || Package;
            return (
              <div key={f.title} className="text-center">
                <div className="h-10 w-10 rounded-full mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}40` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <p className="text-[10px] font-bold text-white leading-tight">{f.title}</p>
                <p className="text-[8px] text-white/50 mt-0.5 leading-tight">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
