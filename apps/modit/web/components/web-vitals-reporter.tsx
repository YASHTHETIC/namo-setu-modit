"use client";

import { useEffect } from "react";

import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

function send(metric: "lcp" | "cls" | "inp", value: number) {
  try {
    const token = getAccessToken();
    if (!token) return;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/modit/analytics/events?event_name=${encodeURIComponent(`web_vital_${metric}`)}`;
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: { value: Math.round(value) } }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the page for telemetry */
  }
}

/**
 * Real-user Core Web Vitals (LCP/CLS/INP) via PerformanceObserver.
 * Reports once per page view on hide — only for logged-in users (needs token).
 * Budgets: LCP < 2500ms, CLS < 0.05 (x1000 => <50), INP < 200ms.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    let lcp = 0;
    let cls = 0;
    let inp = 0;
    let sent = false;

    const flush = () => {
      if (sent) return;
      sent = true;
      if (lcp > 0) send("lcp", lcp);
      send("cls", Math.round(cls * 1000));
      if (inp > 0) send("inp", inp);
    };

    const observers: PerformanceObserver[] = [];
    try {
      if (typeof PerformanceObserver === "undefined") return;
      const lcpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lcp = Math.max(lcp, (entry as PerformanceEntry & { renderTime?: number; loadTime?: number }).renderTime ?? (entry as PerformanceEntry & { loadTime?: number }).loadTime ?? entry.startTime);
        }
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObs);

      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!e.hadRecentInput) cls += e.value ?? 0;
        }
      });
      clsObs.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObs);

      const inpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { duration?: number; interactionId?: number };
          if (e.interactionId || (e.duration ?? 0) > 0) inp = Math.max(inp, e.duration ?? 0);
        }
      });
      try {
        inpObs.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
      } catch {
        inpObs.observe({ type: "first-input", buffered: true });
      }
      observers.push(inpObs);
    } catch {
      return;
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
    return () => {
      observers.forEach((o) => {
        try {
          o.disconnect();
        } catch {}
      });
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
