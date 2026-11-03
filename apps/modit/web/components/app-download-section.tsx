"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Apple, QrCode, Smartphone, Zap, ShieldCheck, FileText, CheckCircle2, Star, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { openAppSheet } from "@/components/app-install-sheet";
import { useIsStandalone, usePwaInstall } from "@/lib/pwa";

export function AppDownloadSection() {
  const isApp = useIsStandalone();
  const { canInstall, install } = usePwaInstall();
  const [currentOrigin, setCurrentOrigin] = useState("https://modit.in");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const handleAndroidClick = async () => {
    if (canInstall) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) return;
    }
    openAppSheet("android");
  };

  if (isApp) {
    return null;
  }

  return (
    <section aria-label="Download MODIT App" className="w-full">
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#150726] via-[#1e1245] to-[#0b0318] p-6 sm:p-10 border border-white/15 shadow-2xl shadow-purple-950/40">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7CB518]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#2D1B69]/30 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading, value props, and download buttons */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7CB518]/20 border border-[#7CB518]/40 px-3.5 py-1 text-micro sm:text-tiny font-extrabold uppercase tracking-wider text-[#7CB518]">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Quick Commerce For Construction
              </div>

              <div>
                <h2 className="text-title-lg sm:text-display-sm font-black text-white leading-tight">
                  Download the MODIT App
                </h2>
                <p className="mt-2 text-body-sm sm:text-body-md text-white/75 max-w-xl leading-relaxed">
                  Get construction materials delivered directly to your site in <span className="font-bold text-[#7CB518]">60 minutes</span>.
                  Enjoy live GPS delivery tracking, trade discounts, and instant GST invoices.
                </p>
              </div>

              {/* Benefit Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <Zap className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>60-Min Site Delivery</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <Smartphone className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>Live GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-tiny font-bold text-white/90">
                  <FileText className="h-4 w-4 text-[#7CB518] flex-shrink-0" />
                  <span>Instant GST Invoices</span>
                </div>
              </div>

              {/* Download Buttons: Android & iOS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Android Download Button */}
                <button
                  type="button"
                  onClick={handleAndroidClick}
                  disabled={installing}
                  className="flex items-center gap-3.5 rounded-2xl bg-white hover:bg-[#F0ECF9] px-5 py-3.5 text-[#150726] shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group flex-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#150726] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2D1B69] transition-colors">
                    <Play className="h-5 w-5 fill-current text-[#7CB518]" />
                  </div>
                  <div className="text-left">
                    <span className="block text-tiny uppercase tracking-wider font-extrabold text-[#6B5B83]">
                      Download for
                    </span>
                    <span className="block text-body-md font-black text-[#150726] leading-tight">
                      Android (Play / APK)
                    </span>
                  </div>
                </button>

                {/* iPhone / iOS Download Button */}
                <button
                  type="button"
                  onClick={() => openAppSheet("ios")}
                  className="flex items-center gap-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-white shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group flex-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-white text-[#150726] flex items-center justify-center flex-shrink-0">
                    <Apple className="h-5 w-5 fill-current text-[#150726]" />
                  </div>
                  <div className="text-left">
                    <span className="block text-tiny uppercase tracking-wider font-extrabold text-white/60">
                      Download for
                    </span>
                    <span className="block text-body-md font-black text-white leading-tight">
                      iPhone (iOS Safari)
                    </span>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 text-micro text-white/50 pt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7CB518]" />
                <span>Zero install size · Auto-updates · Free for contractors & homeowners</span>
              </div>
            </div>

            {/* Right Column: App Mockup Card & Live QR Code (Desktop & Tablet) */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4">
              <div className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-xl flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/20 bg-[#150726]">
                  <Image
                    src="/icons/icon-192.png"
                    alt="MODIT App Icon"
                    width={80}
                    height={80}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-md font-black text-white">MODIT</span>
                    <span className="rounded bg-[#7CB518] px-1.5 py-0.5 text-micro font-black text-[#150726]">PRO</span>
                  </div>
                  <p className="text-micro text-white/70 line-clamp-1 mt-0.5">
                    Materials On Door: Quick Site Delivery
                  </p>
                  <div className="flex items-center gap-1 text-micro text-[#F8CB46] font-bold mt-1">
                    <Star className="h-3.5 w-3.5 fill-current text-[#F8CB46]" />
                    <span>4.9</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/60 font-normal">10k+ installs</span>
                  </div>
                </div>
              </div>

              {/* Live QR Code Box */}
              <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl flex items-center gap-4 border border-[#DDD6EE]">
                <div className="rounded-xl border border-[#DDD6EE] p-1.5 bg-white flex-shrink-0 shadow-xs">
                  <QRCodeSVG value={currentOrigin} size={88} level="M" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-extrabold text-[#150726] flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-[#7CB518]" /> Scan to install
                  </p>
                  <p className="text-micro text-[#6B5B83] mt-1 leading-snug">
                    Point your iPhone or Android camera to open and add to home screen.
                  </p>
                  <span className="inline-block mt-1.5 text-tiny font-bold text-[#7CB518]">
                    Scan QR Code →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
