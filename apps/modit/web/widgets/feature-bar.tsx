"use client";

import { TrendingUp, Timer, Lock } from "lucide-react";
import type { FeatureBarData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  TrendingUp,
  Timer,
  Lock,
};

export function FeatureBarWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<FeatureBarData>(data);

  return (
    <div className="mt-4 mx-4 mb-4 rounded-2xl bg-gradient-to-r from-[#150726] to-[#2D1B69] p-4 grid grid-cols-3 gap-3 border border-white/10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-[var(--pink)]/10 rounded-full blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[var(--green)]/10 rounded-full blur-xl" />
      {d.features.map((f) => {
        const Icon = ICON_MAP[f.icon] || TrendingUp;
        return (
          <div key={f.title} className="flex flex-col items-center text-center relative z-10">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-2" style={{ background: `${f.color}20`, border: `1.5px solid ${f.color}40` }}>
              <Icon className="h-6 w-6" style={{ color: f.color }} />
            </div>
            <p className="text-[10px] font-black text-white leading-tight whitespace-pre-line">{f.title}</p>
            <p className="text-[8px] text-white/50 mt-0.5 leading-tight whitespace-pre-line">{f.description}</p>
          </div>
        );
      })}
    </div>
  );
}
