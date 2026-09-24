"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Timer } from "lucide-react";
import { useActiveSale } from "@/lib/pricing";
import { getUpcomingSaleAt, useAdminStore } from "@/lib/admin-store";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function SaleBanner() {
  const sale = useActiveSale();
  const sales = useAdminStore((s) => s.sales);
  const now = useNow();

  if (sale) {
    const ms = Math.max(0, sale.endAt - now);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return (
      <Link href="/products" className="block">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(90deg, #2D1B69 0%, #E91E63 55%, #FF9800 100%)" }}>
          <div className="mx-auto max-w-[1400px] px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider">
              <Zap className="h-3 w-3" /> Sale live
            </span>
            <p className="text-[13px] font-extrabold text-white">{sale.bannerTitle}</p>
            <p className="hidden sm:block text-[11px] text-white/80">{sale.bannerSubtitle}</p>
            <span className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1 text-[12px] font-black text-white tabular-nums">
              <Timer className="h-3.5 w-3.5" /> {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  const upcoming = getUpcomingSaleAt(sales, now);
  if (upcoming) {
    const ms = Math.max(0, upcoming.startAt - now);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return (
      <div className="bg-[#150726]">
        <div className="mx-auto max-w-[1400px] px-4 py-2 flex items-center justify-center gap-2.5 flex-wrap">
          <Timer className="h-3.5 w-3.5 text-[#FF9800]" />
          <p className="text-[12px] font-bold text-white">
            {upcoming.name} starts in <span className="tabular-nums text-[#FF9800]">{pad(h)}:{pad(m)}:{pad(s)}</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
