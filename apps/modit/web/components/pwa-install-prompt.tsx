"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const { canInstall, install } = usePwaInstall();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!canInstall) {
      setShow(false);
      return;
    }
    if (localStorage.getItem("modit_pwa_dismissed")) return;
    // Late + staggered so it never collides with the push prompt.
    const timer = setTimeout(() => setShow(true), 45000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    const ok = await install();
    if (ok) {
      setDone(true);
      setTimeout(() => setShow(false), 2000);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("modit_pwa_dismissed", "true");
  };

  if (!show || !canInstall) return null;
  // Never interrupt checkout/payment.
  if (pathname.startsWith("/checkout") || pathname.startsWith("/payment")) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] max-w-[400px] mx-auto sm:left-auto sm:right-6 sm:mx-0 sm:max-w-[340px]">
      <div className="bg-[#150726] rounded-2xl border border-white/10 p-4 shadow-2xl shadow-black/40 relative">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="MODIT" className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            {done ? (
              <p className="text-[13px] font-bold text-white flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#7CB518]" /> Installing MODIT...
              </p>
            ) : (
              <>
                <p className="text-[13px] font-bold text-white">Install MODIT app</p>
                <p className="text-[11px] text-white/50 mt-0.5">Faster checkout, offline catalog, order alerts on your home screen</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleInstall} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6A9C14] transition-all">
                    <Download className="h-3 w-3" /> Install
                  </button>
                  <button onClick={handleDismiss} className="px-4 py-2 rounded-full bg-white/10 text-white/50 text-[11px] font-semibold hover:bg-white/15 transition-all">
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
