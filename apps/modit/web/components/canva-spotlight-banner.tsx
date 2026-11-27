"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Box, Wand2 } from "lucide-react";
import { BorderBeam } from "@/components/border-beam";
import { AiRoomVisualizer } from "@/components/ai-room-visualizer";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useDisplayProducts } from "@/lib/pricing";

interface ShowcaseShade {
  name: string;
  code: string;
  family: string;
}

const CANVA_SHOWCASE_SHADES: ShowcaseShade[] = [
  { name: "Soft Lilac", code: "#8A6FA0", family: "Pastel" },
  { name: "Off White", code: "#F4EEDB", family: "Neutral" },
  { name: "Sky Mist", code: "#D6E4F0", family: "Cool" },
  { name: "Terracotta", code: "#FF5722", family: "Warm" },
  { name: "Emerald", code: "#047857", family: "Luxe" },
  { name: "Sun Ochre", code: "#F8CB46", family: "Vibrant" },
];

export function CanvaSpotlightBanner() {
  const [activeShade, setActiveShade] = useState<ShowcaseShade>(CANVA_SHOWCASE_SHADES[0]);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [visualizerOpen, setVisualizerOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const { data: paintProducts = [] } = useProducts({ category_slug: "painting", page_size: 5 });
  const displayProducts = useDisplayProducts(paintProducts as Product[]);
  const featuredPaint = displayProducts[0] || null;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;
    setTilt({
      rx: -normY * 14,
      ry: normX * 16,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
  }, []);

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6 my-4 sm:my-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#150726] via-[#1E1245] to-[#150726] border border-white/10 p-4 sm:p-7 shadow-2xl">
          {/* Magic UI Border Beam */}
          <BorderBeam duration={12} colorFrom="#8A6FA0" colorTo="#7CB518" borderWidth={1.5} />

          {/* Ambient Lighting Background */}
          <div
            className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full blur-3xl opacity-35 transition-colors duration-700"
            style={{ backgroundColor: activeShade.code }}
          />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#00BCD4]/20 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Canva Showcase Copy & Shade Swatches */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-tiny font-mono font-bold text-white border border-white/15 w-fit mb-2 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-ping" />
                <span className="text-[#F8CB46] font-black uppercase tracking-wider">CANVA DESIGN STUDIO</span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">3D INTERACTIVE FINISH</span>
              </div>

              <h2 className="text-title-lg sm:text-display-sm font-black text-white tracking-tight leading-tight mt-1">
                Walls that{" "}
                <span
                  className="bg-clip-text text-transparent transition-colors duration-500"
                  style={{
                    backgroundImage: `linear-gradient(90deg, #FFFFFF, ${activeShade.code}, #FFFFFF)`,
                  }}
                >
                  stand out.
                </span>
              </h2>

              <p className="text-tiny sm:text-body-sm text-white/75 mt-2 max-w-xl leading-relaxed">
                Meet the next-generation paint studio — an architectural experience crafted to inspect 3D finishes, explore dynamic fluid backdrops, and preview shades on real walls before buying.
              </p>

              {/* Canva Swatch Picker */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-tiny font-mono font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
                    Choose your backdrop shade:
                  </span>
                  <span className="text-tiny font-mono font-extrabold text-[#150726] bg-white px-2.5 py-0.5 rounded-full shadow-xs">
                    {activeShade.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-1">
                  {CANVA_SHOWCASE_SHADES.map((s) => {
                    const isSelected = activeShade.name === s.name;
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setActiveShade(s)}
                        className={`group/swatch relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${
                          isSelected ? "bg-white/15 scale-105" : "hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all duration-300 ${
                            isSelected
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[#150726] scale-110 shadow-lg"
                              : "border border-white/20 hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: s.code,
                            boxShadow: isSelected ? `0 0 16px ${s.code}90` : undefined,
                          }}
                        />
                        <span className="text-micro font-bold text-white/90 max-w-[58px] truncate leading-none mt-0.5">
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setVisualizerOpen(true)}
                  className="btn-shine inline-flex items-center gap-2 rounded-full bg-[#7CB518] hover:bg-[#6EA414] px-5 py-2.5 text-caption sm:text-body-sm font-extrabold text-white shadow-lg shadow-green-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Wand2 className="h-4 w-4" />
                  Launch AI Room Visualizer
                </button>
                <Link
                  href="/products?category=painting"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-4.5 py-2.5 text-caption sm:text-body-sm font-bold text-white transition-all active:scale-95"
                >
                  Browse 80+ Paints <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Canva 3D Stage */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                ref={stageRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative h-64 sm:h-80 w-full max-w-[360px] rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center cursor-crosshair select-none shadow-xl"
                style={{ perspective: 1000 }}
              >
                {/* Canva Floating Cue: MOVE TO EXPLORE ↗ */}
                <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5 text-tiny font-mono font-extrabold uppercase text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-ping" />
                  <span>MOVE TO EXPLORE ↗</span>
                </div>

                {/* Canva Standout Finish Badge */}
                <div className="pointer-events-none absolute bottom-3 right-3 z-20 hidden min-[380px]:flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-md px-2.5 py-1 shadow-md border border-[#EDE7F6]">
                  <Sparkles className="h-3.5 w-3.5 text-[#7CB518]" />
                  <div className="text-left">
                    <p className="text-tiny font-black text-[#150726] leading-none">Standout finish</p>
                    <p className="text-micro font-medium text-[#7B6A99] leading-none mt-0.5">Made to impress</p>
                  </div>
                </div>

                {/* Organic Fluid Paint Splash Shape */}
                <svg
                  viewBox="0 0 400 400"
                  className="pointer-events-none absolute inset-0 m-auto h-[90%] w-[90%] z-0 transition-all duration-700 opacity-90"
                  style={{
                    filter: `drop-shadow(0 20px 35px ${activeShade.code}60)`,
                  }}
                >
                  <path
                    d="M 200 40 C 290 30, 360 110, 350 200 C 340 280, 290 360, 190 350 C 90 340, 40 270, 50 180 C 60 90, 110 50, 200 40 Z"
                    fill={activeShade.code}
                    opacity="0.35"
                  />
                  <path
                    d="M 210 70 C 280 60, 330 130, 320 210 C 310 270, 260 320, 180 310 C 100 300, 70 230, 80 160 C 90 90, 140 80, 210 70 Z"
                    fill={activeShade.code}
                    opacity="0.65"
                  />
                  {/* Organic Splash Droplets */}
                  <circle cx="75" cy="115" r="14" fill={activeShade.code} opacity="0.75" />
                  <circle cx="330" cy="125" r="12" fill={activeShade.code} opacity="0.65" />
                  <circle cx="340" cy="280" r="16" fill={activeShade.code} opacity="0.8" />
                  <circle cx="85" cy="295" r="15" fill={activeShade.code} opacity="0.65" />
                </svg>

                {/* 3D Tilting Bucket Image with Background Erupting Splash */}
                <div
                  className="relative h-44 sm:h-56 w-44 sm:w-56 z-10 transition-transform duration-100 ease-out"
                  style={{
                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.05, 1.05, 1.05)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Erupting Liquid Paint Splash Jets — framed behind bucket lid */}
                  <svg
                    viewBox="0 0 500 500"
                    className="pointer-events-none absolute inset-0 m-auto h-full w-full -z-10"
                    style={{
                      transform: "translateZ(-16px) translateY(8px)",
                      filter: `drop-shadow(0 10px 18px ${activeShade.code}80)`,
                    }}
                  >
                    {/* Left Splash Jet */}
                    <path
                      d="M 180 180 C 130 160, 70 120, 60 70 C 50 30, 95 30, 110 65 C 125 100, 160 135, 195 165 Z"
                      fill={activeShade.code}
                      opacity="0.95"
                    />
                    {/* Right Splash Jet */}
                    <path
                      d="M 320 180 C 370 160, 430 120, 440 70 C 450 30, 405 30, 390 65 C 375 100, 340 135, 305 165 Z"
                      fill={activeShade.code}
                      opacity="0.95"
                    />
                    {/* Flying Airborne Droplets */}
                    <circle cx="50" cy="45" r="9" fill={activeShade.code} />
                    <circle cx="450" cy="45" r="9" fill={activeShade.code} />
                    <circle cx="250" cy="90" r="11" fill={activeShade.code} />
                    <circle cx="48" cy="42" r="3" fill="#ffffff" opacity="0.8" />
                    <circle cx="448" cy="42" r="3" fill="#ffffff" opacity="0.8" />
                  </svg>

                  <Image
                    src="/products/painting/Asian Paint.png"
                    alt="Asian Paint 3D Bucket"
                    fill
                    sizes="240px"
                    priority
                    draggable={false}
                    className="object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.4)]"
                  />
                </div>

                {/* 3D Telemetry HUD Pill */}
                <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-tiny font-mono text-white/80 shadow-md">
                  <Box className="h-3 w-3 text-[#00BCD4]" />
                  <span>X: {Math.round(tilt.rx)}°</span>
                  <span className="text-white/30">|</span>
                  <span>Y: {Math.round(tilt.ry)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Room Visualizer Modal */}
      {featuredPaint && (
        <AiRoomVisualizer
          open={visualizerOpen}
          onClose={() => setVisualizerOpen(false)}
          product={featuredPaint}
          initialShade={activeShade.name}
          initialShadeColor={activeShade.code}
        />
      )}
    </>
  );
}
