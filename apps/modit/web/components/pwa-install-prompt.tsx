"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Check } from "lucide-react";
import { usePwaInstall, isStandalone, isAppInstalled } from "@/lib/pwa";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const { canInstall, install } = usePwaInstall();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!canInstall || isStandalone() || isAppInstalled()) {
      setShow(false);
      return;
    }
    try {
      if (localStorage.getItem("modit_pwa_dismissed") === "true") return;
      if (localStorage.getItem("modit_app_installed") === "true") return;
    } catch {
      /* ignore */
    }
    // Stagger prompt so it never collides or annoys
    const timer = setTimeout(() => setShow(true), 45000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    if (!canInstall) {
      setShow(false);
      return;
    }
    try {
      const ok = await install();
      if (ok) {
        setDone(true);
        try {
          localStorage.setItem("modit_app_installed", "true");
        } catch {
          /* ignore */
        }
        setTimeout(() => setShow(false), 2000);
      }
    } catch {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem("modit_pwa_dismissed", "true");
    } catch {
      /* ignore */
    }
  };

  if (!show || !canInstall || isStandalone() || isAppInstalled()) return null;
  // Never interrupt checkout/payment — or ops surfaces.
  const currentPath = pathname ?? "";
  if (currentPath.startsWith("/checkout") || currentPath.startsWith("/payment")) return null;
  if (currentPath.startsWith("/admin") || currentPath.startsWith("/supplier")) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 z-sheet max-w-[420px] mx-auto sm:left-auto sm:right-6 sm:mx-0 sm:max-w-[360px]">
      <div className="bg-[#150726] rounded-2xl border border-white/15 p-4 shadow-2xl shadow-purple-950/60 relative animate-slide-in-up">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 p-1 text-white/40 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="MODIT"
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl flex-shrink-0 shadow-md ring-1 ring-white/10"
          />
          <div className="flex-1 min-w-0 pr-4">
            {done ? (
              <p className="text-body-sm font-bold text-white flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#7CB518]" /> Installed Successfully!
              </p>
            ) : (
              <>
                <p className="text-body-sm font-extrabold text-white leading-tight">Install MODIT App</p>
                <p className="text-micro text-white/70 mt-0.5 leading-snug">
                  Faster 60-min delivery alerts, 1-tap ordering & offline cart
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7CB518] hover:bg-[#6A9C14] text-white text-caption font-extrabold shadow-md shadow-green-500/25 active:scale-95 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/60 text-caption font-medium transition-all"
                  >
                    Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
