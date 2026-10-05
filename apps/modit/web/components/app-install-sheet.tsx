"use client";

import { useState, useEffect } from "react";
import { Play, Apple, X, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePwaInstall } from "@/lib/pwa";

/** Global event any header button can fire to open the install sheet. */
export const OPEN_APP_SHEET_EVENT = "modit:open-app-sheet";
export function openAppSheet() {
  try {
    window.dispatchEvent(new CustomEvent(OPEN_APP_SHEET_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Global install sheet (one instance in layout). Opens from any header
 * button or the homepage band via the OPEN_APP_SHEET_EVENT event.
 */
export function AppInstallSheetHost() {
  const { canInstall, install } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_APP_SHEET_EVENT, show);
    return () => window.removeEventListener(OPEN_APP_SHEET_EVENT, show);
  }, []);

  const handleAndroid = async () => {
    if (!canInstall) return;
    setInstalling(true);
    const ok = await install();
    setInstalling(false);
    if (ok) setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-title-md font-extrabold text-[#150726]">Get the MODIT app</h3>
          <button
            onClick={() => setOpen(false)}
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
  );
}
