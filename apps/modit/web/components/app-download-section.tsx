"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Check, Star, Zap, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { usePwaInstall, isStandalone, isAppInstalled, useIsAppInstalled } from "@/lib/pwa";

/**
 * Desktop-only App Download Showcase Banner.
 * Shown ONLY on desktop screens (hidden lg:block).
 * Hidden completely if already installed or running inside standalone mode.
 * 1-click direct install trigger — zero QR codes or scanners.
 */
export function AppDownloadSection() {
  const isInstalled = useIsAppInstalled();
  const { canInstall, install } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If running inside app or already downloaded, hide completely
  if (isInstalled || isStandalone() || isAppInstalled()) {
    return null;
  }

  const handleInstallClick = async () => {
    if (canInstall) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) {
        setJustInstalled(true);
        try {
          localStorage.setItem("modit_app_installed", "true");
        } catch {
          /* ignore */
        }
      }
    } else {
      // In Chromium browsers without active prompt or already queued
      try {
        setJustInstalled(true);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <section aria-label="Download MODIT App" className="hidden lg:block w-full">
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#150726] via-[#1e1245] to-[#0b0318] p-8 sm:p-10 border border-white/15 shadow-2xl shadow-purple-950/40">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7CB518]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#2D1B69]/30 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Column: Heading & Value props */}
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7CB518]/20 border border-[#7CB518]/40 px-3.5 py-1 text-tiny font-extrabold uppercase tracking-wider text-[#7CB518]">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Fastest Site Delivery
              </div>

              <div>
                <h2 className="text-title-lg sm:text-display-sm font-black text-white leading-tight">
                  Download the MODIT App
                </h2>
                <p className="mt-2 text-body-sm sm:text-body-md text-white/75 leading-relaxed">
                  Get construction materials delivered directly to your site in <span className="font-bold text-[#7CB518]">60 minutes</span>.
                  Enjoy live GPS delivery tracking, trade discounts, and instant GST invoices.
                </p>
              </div>

              {/* Benefit Pills */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <Zap className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>60-Min Site Delivery</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <ShieldCheck className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>Live GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <FileText className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>Instant GST Invoices</span>
                </div>
              </div>
            </div>

            {/* Right Column: 1-Click Direct Install Card — Zero Scanners */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-center gap-4 flex-shrink-0">
              <div className="w-full sm:w-80 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-xl flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/20 bg-[#150726]">
                  <Image
                    src="/icons/icon-192.png"
                    alt="MODIT App Icon"
                    width={64}
                    height={64}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-md font-black text-white">MODIT App</span>
                    <span className="rounded bg-[#7CB518] px-1.5 py-0.5 text-micro font-black text-[#150726]">PRO</span>
                  </div>
                  <p className="text-micro text-white/70 line-clamp-1 mt-0.5">
                    Official Desktop & Mobile App
                  </p>
                  <div className="flex items-center gap-1 text-micro text-[#F8CB46] font-bold mt-1">
                    <Star className="h-3.5 w-3.5 fill-current text-[#F8CB46]" />
                    <span>4.9</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/60 font-normal">10k+ installs</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Direct Install Button */}
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing || justInstalled}
                className="w-full sm:w-80 flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-[#7CB518] hover:bg-[#6A9C14] text-white text-body-sm font-black shadow-lg shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-80 disabled:hover:scale-100"
              >
                {justInstalled ? (
                  <>
                    <Check className="h-5 w-5 text-white" />
                    <span>Installed on This Device</span>
                  </>
                ) : installing ? (
                  <span>Installing MODIT...</span>
                ) : (
                  <>
                    <Download className="h-5 w-5 text-white" />
                    <span>Install MODIT App</span>
                  </>
                )}
              </button>

              <p className="text-micro text-white/50 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7CB518]" />
                <span>Zero install size · Auto-updating · Fast offline access</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
