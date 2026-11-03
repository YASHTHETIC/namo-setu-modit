"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Play, Apple, X, QrCode, Smartphone, Share, PlusSquare, MoreVertical, Download, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePwaInstall, isStandalone } from "@/lib/pwa";

export type InstallTarget = "android" | "ios" | "any";

/** Global event any button can fire to open the install sheet. */
export const OPEN_APP_SHEET_EVENT = "modit:open-app-sheet";

export function openAppSheet(target: InstallTarget = "any") {
  try {
    window.dispatchEvent(new CustomEvent(OPEN_APP_SHEET_EVENT, { detail: { target } }));
  } catch {
    /* ignore */
  }
}

/**
 * Tailored app install sheet: distinct flows for Android & iPhone.
 * Shows dynamic QR code for desktop scanning and native prompt on mobile.
 */
export function AppInstallSheetHost() {
  const pathname = usePathname();
  const { canInstall, install, installed } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("https://modit.in");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
    const handleOpen = (e: Event) => {
      // Don't open if app is already running in standalone mode
      if (isStandalone()) return;
      const customEvent = e as CustomEvent<{ target?: InstallTarget }>;
      const target = customEvent.detail?.target || "any";
      if (target === "ios") {
        setActiveTab("ios");
      } else if (target === "android") {
        setActiveTab("android");
      } else {
        // Auto-detect device OS
        const ua = navigator.userAgent || "";
        if (/iPad|iPhone|iPod/.test(ua)) {
          setActiveTab("ios");
        } else {
          setActiveTab("android");
        }
      }
      setOpen(true);
    };

    window.addEventListener(OPEN_APP_SHEET_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_APP_SHEET_EVENT, handleOpen);
  }, []);

  const handleNativeInstall = async () => {
    if (!canInstall) return;
    setInstalling(true);
    const ok = await install();
    setInstalling(false);
    if (ok) {
      setJustInstalled(true);
      setTimeout(() => setOpen(false), 2500);
    }
  };

  // If already installed or closed or inside ops surfaces, do not render
  if (!open || installed || isStandalone()) return null;
  const currentPath = pathname ?? "";
  if (currentPath.startsWith("/admin") || currentPath.startsWith("/supplier")) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECF9]">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#2D1B69] flex items-center justify-center text-white font-extrabold shadow-sm">
              <span className="text-[#7CB518] text-lg font-black">M</span>
            </div>
            <div>
              <h3 className="text-body-md sm:text-title-sm font-extrabold text-[#150726]">
                {activeTab === "android" ? "Install on Android" : "Install on iPhone"}
              </h3>
              <p className="text-micro text-[#9B8CB5]">MODIT Materials On Door app</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full p-2 text-[#9B8CB5] hover:bg-[#F7F4FC] hover:text-[#150726] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher: Android vs iPhone */}
        <div className="flex rounded-xl bg-[#F4F1FA] p-1 my-4">
          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-caption font-bold transition-all ${
              activeTab === "android"
                ? "bg-white text-[#150726] shadow-xs"
                : "text-[#6B5B83] hover:text-[#150726]"
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current text-[#7CB518]" />
            Android
          </button>
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-caption font-bold transition-all ${
              activeTab === "ios"
                ? "bg-white text-[#150726] shadow-xs"
                : "text-[#6B5B83] hover:text-[#150726]"
            }`}
          >
            <Apple className="h-4 w-4 fill-current text-[#150726]" />
            iPhone (iOS)
          </button>
        </div>

        {/* Content for Android */}
        {activeTab === "android" && (
          <div className="space-y-4">
            {canInstall && (
              <button
                onClick={handleNativeInstall}
                disabled={installing}
                className="flex w-full items-center justify-center gap-2 py-3.5 rounded-xl bg-[#7CB518] text-white text-body-sm font-extrabold hover:bg-[#6A9C14] transition-all shadow-md active:scale-[0.98]"
              >
                {justInstalled ? (
                  <>
                    <Check className="h-5 w-5 text-white" /> Installed Successfully!
                  </>
                ) : installing ? (
                  "Installing MODIT..."
                ) : (
                  <>
                    <Download className="h-5 w-5" /> Tap to Install Now
                  </>
                )}
              </button>
            )}

            <div className="rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-4 space-y-3">
              <p className="text-caption font-bold text-[#150726] uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[#7CB518]" /> How to install in 5 seconds
              </p>
              <ol className="space-y-2.5 text-caption text-[#4B396B]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Tap the Chrome menu button <MoreVertical className="inline h-3.5 w-3.5 text-[#150726]" /> in the top-right corner.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Select <strong className="text-[#150726] font-extrabold">&ldquo;Install app&rdquo;</strong> or <strong className="text-[#150726] font-extrabold">&ldquo;Add to Home screen&rdquo;</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Tap <strong className="text-[#7CB518] font-extrabold">&ldquo;Install&rdquo;</strong>. MODIT will appear as a full-screen app on your phone.</span>
                </li>
              </ol>
            </div>

            {/* Desktop QR helper */}
            <div className="hidden sm:flex flex-col items-center gap-2 rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-3 text-center">
              <QRCodeSVG value={currentOrigin} size={110} />
              <p className="text-micro text-[#6B5B83] flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Scan with Android phone camera to open & install
              </p>
            </div>
          </div>
        )}

        {/* Content for iPhone */}
        {activeTab === "ios" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-4 space-y-3">
              <p className="text-caption font-bold text-[#150726] uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="h-4 w-4 text-[#150726]" /> How to install on iPhone (Safari)
              </p>
              <ol className="space-y-2.5 text-caption text-[#4B396B]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Make sure this site is open in <strong className="text-[#150726]">Safari</strong> on your iPhone.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Tap the <strong className="text-[#150726]">Share button</strong> <Share className="inline h-3.5 w-3.5 text-blue-600" /> at the bottom bar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Scroll down and tap <strong className="text-[#150726] font-extrabold">&ldquo;Add to Home Screen&rdquo;</strong> <PlusSquare className="inline h-3.5 w-3.5 text-[#150726]" />.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-[#2D1B69] text-white text-micro font-bold items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>Tap <strong className="text-[#7CB518] font-extrabold">&ldquo;Add&rdquo;</strong> in the top-right. MODIT will appear on your home screen!</span>
                </li>
              </ol>
            </div>

            {/* Desktop QR helper for iPhone */}
            <div className="hidden sm:flex flex-col items-center gap-2 rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-3 text-center">
              <QRCodeSVG value={currentOrigin} size={110} />
              <p className="text-micro text-[#6B5B83] flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Scan with iPhone Camera to open in Safari & install
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
