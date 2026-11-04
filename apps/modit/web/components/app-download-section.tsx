"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Star, Zap, ShieldCheck, FileText, CheckCircle2, Play, Apple } from "lucide-react";
import { usePwaInstall, useIsStandalone } from "@/lib/pwa";
import { openAppSheet } from "@/components/app-install-sheet";

/**
 * Universal App Download Showcase Banner (Mobile & Desktop).
 * Visible in mobile browsers (Chrome / Safari) and desktop browsers.
 * Hidden automatically when running inside the installed app (isStandalone).
 * 1-click direct install trigger — zero QR codes or scanners.
 */
export function AppDownloadSection() {
  const isApp = useIsStandalone();
  const { canInstall, install } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If running inside the installed standalone app, hide completely
  if (isApp) {
    return null;
  }

  const handleAndroidInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) {
        setJustInstalled(true);
      }
    } else {
      // Native prompt unavailable (iOS/unsupported/covered): open the guided
      // install sheet with the Android steps instead of an alert.
      openAppSheet("android");
    }
  };

  const handleIosClick = () => {
    openAppSheet("ios");
  };

  return (
    <section aria-label="Download MODIT App" className="w-full">
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#150726] via-[#1e1245] to-[#0b0318] p-5 sm:p-10 border border-white/15 shadow-2xl shadow-purple-950/40">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7CB518]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#2D1B69]/30 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Column: Heading & Value props */}
            <div className="w-full lg:max-w-2xl space-y-3.5 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7CB518]/20 border border-[#7CB518]/40 px-3 py-1 text-micro sm:text-tiny font-extrabold uppercase tracking-wider text-[#7CB518]">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Fastest Site Delivery
              </div>

              <div>
                <h2 className="text-body-lg sm:text-title-lg font-black text-white leading-tight">
                  Download the MODIT App
                </h2>
                <p className="mt-1.5 sm:mt-2 text-caption sm:text-body-md text-white/75 leading-relaxed">
                  Get construction materials delivered directly to your site in <span className="font-bold text-[#7CB518]">60 minutes</span>.
                  Enjoy live GPS delivery tracking, trade discounts, and instant GST invoices.
                </p>
              </div>

              {/* Benefit Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 text-micro sm:text-tiny font-bold text-white/90">
                  <Zap className="h-3.5 w-3.5 text-[#7CB518] flex-shrink-0" />
                  <span>60-Min Site Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 text-micro sm:text-tiny font-bold text-white/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#7CB518] flex-shrink-0" />
                  <span>Live GPS Tracking</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 text-micro sm:text-tiny font-bold text-white/90">
                  <FileText className="h-3.5 w-3.5 text-[#7CB518] flex-shrink-0" />
                  <span>Instant GST Invoices</span>
                </div>
              </div>
            </div>

            {/* Right Column: 1-Click Install Triggers (Android & iPhone) — Zero Scanners */}
            <div className="w-full lg:w-auto flex flex-col items-stretch sm:items-center gap-3 flex-shrink-0">
              <div className="w-full sm:w-80 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-xl flex items-center gap-3.5">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/20 bg-[#150726]">
                  <Image
                    src="/icons/icon-192.png"
                    alt="MODIT App Icon"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-sm sm:text-body-md font-black text-white">MODIT App</span>
                    <span className="rounded bg-[#7CB518] px-1.5 py-0.2 text-micro font-black text-[#150726]">PRO</span>
                  </div>
                  <p className="text-micro text-white/70 line-clamp-1 mt-0.5">
                    Fast Site Delivery App
                  </p>
                  <div className="flex items-center gap-1 text-micro text-[#F8CB46] font-bold mt-0.5">
                    <Star className="h-3 w-3 fill-current text-[#F8CB46]" />
                    <span>4.9</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/60 font-normal">10k+ installs</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Android and iPhone */}
              <div className="w-full sm:w-80 flex flex-col gap-2">
                {/* 1-Tap Android Install Button */}
                <button
                  type="button"
                  onClick={handleAndroidInstall}
                  disabled={installing || justInstalled}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-[#7CB518] hover:bg-[#6A9C14] text-white text-body-sm font-black shadow-lg shadow-green-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-80"
                >
                  {justInstalled ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>Installed on Your Device</span>
                    </>
                  ) : installing ? (
                    <span>Installing MODIT...</span>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current text-white" />
                      <span>Download for Android</span>
                    </>
                  )}
                </button>

                {/* iPhone / iOS Button */}
                <button
                  type="button"
                  onClick={handleIosClick}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-caption font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <Apple className="h-4 w-4 fill-current text-white" />
                  <span>Download for iPhone (iOS)</span>
                </button>
              </div>

              <p className="text-micro text-white/50 flex items-center gap-1.5 text-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7CB518]" />
                <span>Zero install size · Auto-updating · Free to install</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
