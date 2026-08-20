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
    <div className="mt-4 mx-4 rounded-2xl bg-gradient-to-r from-[#150726] to-[#2D1B69] p-3 grid grid-cols-3 gap-2">
      {d.features.map((f) => {
        const Icon = ICON_MAP[f.icon] || TrendingUp;
        return (
          <div key={f.title} className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}20` }}>
              <Icon className="h-5 w-5" style={{ color: f.color }} />
            </div>
            <div>
              <p className="text-[9px] font-black text-white leading-tight whitespace-pre-line">{f.title}</p>
              <p className="text-[8px] text-white/50 leading-tight whitespace-pre-line">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
