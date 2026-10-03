"use client";

import { useState } from "react";
import { Smartphone, Play, Apple, X, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePwaInstall } from "@/lib/pwa";

/**
 * Compact app band: one button opens a sheet with Android install,
 * iPhone steps and a QR code. No permanent store-button clutter.
 */
export function AppDownload() {
  const { canInstall, installed, install } = usePwaInstall();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);

  const handleAndroid = async () => {
    if (!canInstall) return;
    setInstalling(true);
    const ok = await install();
    setInstalling(false);
    if (ok) {
      setDone(true);
      setSheetOpen(false);
    }
  };

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
          {installed || done ? (
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7CB518]/15 border border-[#7CB518]/30 text-button font-bold text-[#a4e635] flex-shrink-0">
              <Check className="h-4 w-4" /> Installed
            </span>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7CB518] text-white text-button font-bold hover:bg-[#6A9C14] transition-all active:scale-[0.98] flex-shrink-0"
            >
              <Smartphone className="h-4 w-4" /> Get the app
            </button>
          )}
        </div>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-title-md font-extrabold text-[#150726]">Get the MODIT app</h3>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-body-sm text-[#9B8CB5] mb-5">
              Faster checkout, offline catalog and order alerts.
            </p>

            <div className="hidden sm:flex flex-col items-center gap-2 mb-5 rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-4">
              <QRCodeSVG value="https://modit.in" size={128} />
              <p className="text-caption text-[#9B8CB5] flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Scan with your phone camera
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleAndroid}
                disabled={!canInstall || installing}
                className="flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-[#7CB518] text-white text-button font-bold hover:bg-[#6A9C14] transition-all active:scale-[0.98] disabled:opacity-50"
                title={canInstall ? "Install instantly" : "Coming soon on Google Play"}
              >
                <Play className="h-4 w-4 fill-white" />
                {installing ? "Installing..." : canInstall ? "Android · Install now" : "Android · Coming soon on Play"}
              </button>
              <div className="rounded-xl bg-[#F8F6FC] border border-[#DDD6EE] p-4">
                <p className="text-body-sm font-bold text-[#150726] flex items-center gap-2 mb-2">
                  <Apple className="h-4 w-4" /> iPhone
                </p>
                <ol className="space-y-1.5 text-caption text-[#5C4A7A]">
                  <li>1. Open this site in Safari</li>
                  <li>2. Tap Share → Add to Home Screen</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
