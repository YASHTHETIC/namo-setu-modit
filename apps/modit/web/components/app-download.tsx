"use client";

import { useState } from "react";
import { Smartphone, Play, Apple, X, Check, BellRing } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";

/**
 * App download band: Android installs the PWA instantly (Play listing:
 * "coming soon" state), iPhone gets Add-to-Home-Screen steps.
 */
export function AppDownload() {
  const { canInstall, installed, install } = usePwaInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);

  const handleAndroid = async () => {
    if (!canInstall) return;
    setInstalling(true);
    const ok = await install();
    setInstalling(false);
    if (ok) setDone(true);
  };

  return (
    <div className="market-container px-4 sm:px-6">
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #150726 0%, #2D1B69 60%, #1E0F4A 100%)" }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#7CB518]/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-[#00BCD4]/10 rounded-full blur-2xl" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 hidden sm:flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-[#7CB518]" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-extrabold text-white">Get the MODIT app</h3>
            <p className="text-[12px] text-white/55 mt-0.5">
              Faster checkout, offline catalog and order alerts on your home screen
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            {installed || done ? (
              <span className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7CB518]/15 border border-[#7CB518]/30 text-[13px] font-bold text-[#a4e635]">
                <Check className="h-4 w-4" /> Installed
              </span>
            ) : (
              <button
                onClick={handleAndroid}
                disabled={!canInstall || installing}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all active:scale-[0.98] disabled:opacity-50"
                title={canInstall ? "Install instantly" : "Coming soon on Google Play"}
              >
                <Play className="h-4 w-4 fill-white" />
                {installing ? "Installing..." : canInstall ? "Android · Install now" : "Android · Coming soon on Play"}
              </button>
            )}
            <button
              onClick={() => setIosOpen(true)}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-[13px] font-bold hover:bg-white/15 transition-all active:scale-[0.98]"
            >
              <Apple className="h-4 w-4" /> iPhone
            </button>
          </div>
        </div>
        {!canInstall && !installed && !done && (
          <p className="relative z-10 mt-3 text-[11px] text-white/40">
            Android installs instantly from here · iPhone: open in Safari → Share → Add to Home Screen
          </p>
        )}
      </div>

      {iosOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIosOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#150726] flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#2D1B69]" /> Install on iPhone
              </h3>
              <button onClick={() => setIosOpen(false)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <ol className="space-y-3">
              {[
                { n: "1", t: "Open this site in Safari", d: "The install option only appears in Apple's Safari browser." },
                { n: "2", t: "Tap the Share button", d: "The square-with-arrow icon at the bottom of Safari." },
                { n: "3", t: "Tap “Add to Home Screen”", d: "MODIT appears on your home screen like a native app, with order alerts." },
              ].map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span className="h-7 w-7 rounded-full bg-[#2D1B69] text-white text-[12px] font-black flex items-center justify-center flex-shrink-0">{s.n}</span>
                  <div>
                    <p className="text-[13px] font-bold text-[#150726]">{s.t}</p>
                    <p className="text-[11px] text-[#9B8CB5] mt-0.5">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button onClick={() => setIosOpen(false)} className="mt-5 w-full py-3 rounded-xl bg-[#2D1B69] text-white text-[13px] font-bold hover:bg-[#1E1245]">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
