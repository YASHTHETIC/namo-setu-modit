"use client";

import { Smartphone, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";
import { openAppSheet } from "@/components/app-install-sheet";

/**
 * Compact app band (homepage). The button opens the global install
 * sheet — same as the header download buttons on every page.
 */
export function AppDownload() {
  const { installed } = usePwaInstall();

  return (
    <div className="market-container px-4 sm:px-6">
      <div className="rounded-2xl p-4 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #150726 0%, #2D1B69 60%, #1E0F4A 100%)" }}
        />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 hidden sm:flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-[#7CB518]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-body-md font-extrabold text-white">Get the MODIT app</h3>
            <p className="text-caption text-white/55 truncate">
              Faster checkout and order alerts on your home screen
            </p>
          </div>
          {installed ? (
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7CB518]/15 border border-[#7CB518]/30 text-button font-bold text-[#a4e635] flex-shrink-0">
              <Check className="h-4 w-4" /> Installed
            </span>
          ) : (
            <button
              onClick={openAppSheet}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7CB518] text-white text-button font-bold hover:bg-[#6A9C14] transition-all active:scale-[0.98] flex-shrink-0"
            >
              <Smartphone className="h-4 w-4" /> Get the app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
