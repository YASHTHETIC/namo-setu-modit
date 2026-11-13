"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import {
  X,
  ZoomIn,
  ZoomOut,
  Box,
  Sparkles,
  Waves,
  RotateCw,
  Maximize2,
  Check,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { formatINR2 } from "@/lib/utils";

interface AmazonInspectionModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  productName: string;
  price: number;
  unit?: string;
  initialImageIndex?: number;
  isPaintProduct?: boolean;
  shades?: { name: string; code: string; family?: string }[];
  selectedShade?: string | null;
  onSelectShade?: (shadeName: string) => void;
  onAddToCart?: () => void;
}

/**
 * Amazon-style Interactive Product Inspection Window.
 * Features:
 *  1. Ultra Zoom Lens (Amazon mouse-follow loupe / 1x to 3.5x zoom).
 *  2. 3D 360° Perspective Tilt & Drag Inspection.
 *  3. Paint Splash Eruption ("paint bucket se bhr uchal rha h") with fluid liquid arcs & droplets.
 *  4. Live Shade Swatch Switcher inside the inspection window.
 *  5. Direct Add to Cart / Order CTA.
 */
export function AmazonInspectionModal({
  open,
  onClose,
  images,
  productName,
  price,
  unit,
  initialImageIndex = 0,
  isPaintProduct = false,
  shades = [],
  selectedShade = null,
  onSelectShade,
  onAddToCart,
}: AmazonInspectionModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialImageIndex);
  const [mode, setMode] = useState<"zoom" | "3d" | "splash">("zoom");
  const [zoomLevel, setZoomLevel] = useState(2.2);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [isBursting, setIsBursting] = useState(false);
  const [activeShade, setActiveShade] = useState<string>(selectedShade || shades[0]?.name || "Soft Lilac");
  const [added, setAdded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedShade) setActiveShade(selectedShade);
  }, [selectedShade]);

  useEffect(() => {
    setActiveIndex(initialImageIndex);
  }, [initialImageIndex]);

  // Handle keyboard ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeImage = images[activeIndex] || images[0];
  const activeShadeObj = shades.find((s) => s.name === activeShade);
  const splashColor = activeShadeObj?.code || (isPaintProduct ? "#8A6FA0" : "#7CB518");

  const handlePickShade = (shadeName: string) => {
    setActiveShade(shadeName);
    onSelectShade?.(shadeName);
    setIsBursting(true);
    setTimeout(() => setIsBursting(false), 900);
  };

  const handleTriggerBurst = () => {
    setIsBursting(true);
    setTimeout(() => setIsBursting(false), 900);
  };

  // Zoom lens mouse tracking
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

    if (mode === "zoom") {
      setZoomPos({ x: px, y: py, active: true });
    } else if (isDragging.current) {
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      setTilt({
        rx: Math.max(-28, Math.min(28, -dy * 0.35)),
        ry: Math.max(-35, Math.min(35, dx * 0.4)),
      });
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (mode === "3d" || mode === "splash") {
      isDragging.current = true;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, active: false }));
    isDragging.current = false;
    setTilt({ rx: 0, ry: 0 });
  };

  // Mobile Touch 3D drag
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const clientX = touch.clientX - rect.left;
    const clientY = touch.clientY - rect.top;

    const normX = Math.max(-1, Math.min(1, (clientX / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, (clientY / rect.height) * 2 - 1));

    if (mode === "zoom") {
      const px = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
      const py = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
      setZoomPos({ x: px, y: py, active: true });
    } else {
      setTilt({
        rx: -normY * 24,
        ry: normX * 28,
      });
    }
  };

  const handleTouchEnd = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleAddClick = () => {
    onAddToCart?.();
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1100);
  };

  return (
    <div
      className="fixed inset-0 z-modal flex flex-col bg-black/95 backdrop-blur-xl animate-[fadeIn_0.25s_ease-out] select-none"
      onClick={onClose}
    >
      {/* Top Amazon Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#150726]/80 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-micro font-black uppercase tracking-wider text-[#7CB518]">
              Amazon-Style 3D &amp; Zoom Inspection
            </span>
            <h2 className="text-body-sm sm:text-title-sm font-extrabold text-white truncate max-w-[260px] sm:max-w-md">
              {productName}
            </h2>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setMode("zoom")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny font-bold transition-all cursor-pointer ${
              mode === "zoom"
                ? "bg-[#2D1B69] text-white shadow-sm ring-1 ring-white/20"
                : "text-white/70 hover:text-white"
            }`}
          >
            <ZoomIn className="h-3.5 w-3.5 text-[#7CB518]" />
            <span>Ultra Zoom</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny font-bold transition-all cursor-pointer ${
              mode === "3d"
                ? "bg-[#2D1B69] text-white shadow-sm ring-1 ring-white/20"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
            <span>3D 360° Tilt</span>
          </button>
          {isPaintProduct && (
            <button
              type="button"
              onClick={() => {
                setMode("splash");
                handleTriggerBurst();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny font-bold transition-all cursor-pointer ${
                mode === "splash"
                  ? "bg-gradient-to-r from-[#2D1B69] to-[#7CB518] text-white shadow-sm ring-1 ring-white/20"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Waves className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Paint Splash Burst ✨</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspection window"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stage Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-2xl aspect-square rounded-3xl overflow-hidden flex items-center justify-center cursor-crosshair border border-white/10 bg-radial from-[#1E0D36] to-[#0A0210] shadow-2xl"
          style={{ perspective: 1200 }}
        >
          {/* BACKGROUND PAINT SPLASH AURA (Manager Pic 3 & Canva Style) */}
          {isPaintProduct && (
            <svg
              viewBox="0 0 500 500"
              className={`pointer-events-none absolute inset-0 m-auto h-[92%] w-[92%] z-0 transition-transform duration-700 ${
                isBursting ? "scale-110 opacity-95" : "scale-100 opacity-80"
              }`}
              style={{
                filter: `drop-shadow(0 25px 45px ${splashColor}50)`,
              }}
            >
              {/* Radial liquid wave */}
              <path
                d="M 250 50 C 370 30, 460 130, 440 250 C 420 370, 360 460, 240 450 C 120 440, 50 360, 60 240 C 70 120, 130 70, 250 50 Z"
                fill={splashColor}
                opacity="0.35"
              />
              <path
                d="M 260 90 C 350 80, 420 160, 400 260 C 380 340, 320 400, 230 390 C 140 380, 100 300, 110 210 C 120 120, 170 100, 260 90 Z"
                fill={splashColor}
                opacity="0.6"
              />
              {/* Liquid Droplets */}
              <circle cx="85" cy="140" r="18" fill={splashColor} opacity="0.75" />
              <circle cx="410" cy="150" r="16" fill={splashColor} opacity="0.7" />
              <circle cx="425" cy="350" r="22" fill={splashColor} opacity="0.8" />
              <circle cx="105" cy="370" r="20" fill={splashColor} opacity="0.7" />
            </svg>
          )}

          {/* PRODUCT BUCKET IMAGE WITH 3D OR ZOOM TRANSFORM */}
          <div
            className="relative h-full w-full z-10 flex items-center justify-center transition-transform duration-150 ease-out"
            style={
              mode === "3d" || mode === "splash"
                ? {
                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.05, 1.05, 1.05)`,
                    transformStyle: "preserve-3d",
                    transition: isDragging.current ? "none" : "transform 0.25s ease-out",
                  }
                : mode === "zoom" && zoomPos.active
                ? {
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: "transform 0.08s ease-out",
                  }
                : {
                    transform: "scale(1)",
                    transition: "transform 0.25s ease-out",
                  }
            }
          >
            {activeImage ? (
              <Image
                src={activeImage}
                alt={productName}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
                draggable={false}
                className="object-contain p-8 drop-shadow-[0_16px_32px_rgba(45,27,105,0.25)]"
              />
            ) : (
              <Package className="h-32 w-32 text-white/20" />
            )}

            {/* Specular lighting sheen across the bucket */}
            {(mode === "3d" || mode === "splash") && (
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-45 transition-opacity"
                style={{
                  background: `linear-gradient(${130 + tilt.ry * 2}deg, rgba(255,255,255,0.55) 0%, transparent 55%)`,
                }}
              />
            )}

            {/* FOREGROUND ERUPTING PAINT SPLASH ("paint bucket se bhr uchal rha h kind of") */}
            {isPaintProduct && (
              <svg
                viewBox="0 0 500 500"
                className={`pointer-events-none absolute inset-0 m-auto h-full w-full z-20 transition-all duration-500 ${
                  isBursting ? "scale-105" : "scale-100"
                }`}
                style={{
                  transform: "translateZ(30px)",
                  filter: `drop-shadow(0 12px 24px ${splashColor}80)`,
                }}
              >
                <defs>
                  {/* Glossy liquid highlight gradient */}
                  <linearGradient id="splashGloss" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Left Erupting Splash Jet — Leaping out of the left bucket rim */}
                <path
                  d="M 180 180 C 130 160, 70 120, 60 70 C 50 30, 95 30, 110 65 C 125 100, 160 135, 195 165 Z"
                  fill={splashColor}
                  opacity="0.95"
                />
                {/* Wet gloss sheen along the left splash arc */}
                <path
                  d="M 170 170 C 125 150, 75 110, 68 75 C 65 55, 90 45, 102 70 C 112 95, 145 130, 180 155 Z"
                  fill="url(#splashGloss)"
                  opacity="0.6"
                />

                {/* Right Erupting Splash Jet — Leaping out of the right bucket rim */}
                <path
                  d="M 320 180 C 370 160, 430 120, 440 70 C 450 30, 405 30, 390 65 C 375 100, 340 135, 305 165 Z"
                  fill={splashColor}
                  opacity="0.95"
                />
                {/* Wet gloss sheen along the right splash arc */}
                <path
                  d="M 330 170 C 375 150, 425 110, 432 75 C 435 55, 410 45, 398 70 C 388 95, 355 130, 320 155 Z"
                  fill="url(#splashGloss)"
                  opacity="0.6"
                />

                {/* Central Paint Wave Crown Bursting Over Front Rim */}
                <path
                  d="M 175 180 Q 250 150 325 180 Q 250 200 175 180 Z"
                  fill={splashColor}
                  opacity="0.95"
                />
                <ellipse cx="250" cy="180" rx="65" ry="10" fill="url(#splashGloss)" opacity="0.5" />

                {/* Airborne Flying Droplets (Leaping Outward in 3D) */}
                <circle cx="50" cy="45" r="10" fill={splashColor} />
                <circle cx="85" cy="25" r="7" fill={splashColor} />
                <circle cx="450" cy="45" r="10" fill={splashColor} />
                <circle cx="415" cy="25" r="7" fill={splashColor} />
                <circle cx="250" cy="90" r="12" fill={splashColor} />
                <circle cx="230" cy="65" r="7" fill={splashColor} />
                <circle cx="270" cy="70" r="8" fill={splashColor} />

                {/* Droplet glossy specular highlights */}
                <circle cx="48" cy="42" r="3" fill="#ffffff" opacity="0.8" />
                <circle cx="448" cy="42" r="3" fill="#ffffff" opacity="0.8" />
                <circle cx="248" cy="87" r="4" fill="#ffffff" opacity="0.8" />
              </svg>
            )}
          </div>

          {/* Floating floor contact shadow */}
          {(mode === "3d" || mode === "splash") && (
            <div
              className="pointer-events-none absolute bottom-8 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-full blur-xl bg-black/50 transition-transform duration-100"
              style={{
                transform: `translateX(-50%) translate(${tilt.ry * -1.5}px, ${tilt.rx * 0.8}px) scale(${
                  1 - Math.abs(tilt.rx) * 0.01
                })`,
              }}
            />
          )}

          {/* Amazon Floating Lens Hint */}
          {mode === "zoom" && !zoomPos.active && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1.5 text-tiny font-bold text-white border border-white/20 shadow-lg">
              <ZoomIn className="h-3.5 w-3.5 text-[#7CB518]" />
              Hover or drag to inspect with Amazon Zoom Lens
            </div>
          )}

          {(mode === "3d" || mode === "splash") && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1.5 text-tiny font-bold text-white border border-white/20 shadow-lg">
              <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
              Drag with mouse or swipe touch to rotate 3D
            </div>
          )}

          {/* Splash Burst Animation Trigger Button */}
          {isPaintProduct && (
            <button
              type="button"
              onClick={handleTriggerBurst}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1.5 text-tiny font-extrabold text-amber-300 border border-amber-300/40 shadow-lg hover:bg-black/90 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Burst Paint Splash ✨</span>
            </button>
          )}

          {/* Zoom Level Pill Controls (When in Zoom Mode) */}
          {mode === "zoom" && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/20">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1.5, z - 0.5))}
                className="h-7 w-7 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-tiny font-black text-[#7CB518] px-1 tabular-nums">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.5))}
                className="h-7 w-7 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SHADE SELECTION SWATCH BAR (For Paint Products) */}
      {isPaintProduct && shades.length > 0 && (
        <div
          className="px-4 py-2.5 bg-[#0C0313]/90 border-t border-white/10 flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-tiny font-black uppercase text-white/70 tracking-wider">
              Choose Backdrop Shade:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-tiny font-extrabold text-white border border-white/20">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-xs"
                style={{ backgroundColor: splashColor }}
              />
              {activeShade}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
            {shades.map((sh) => {
              const selected = activeShade === sh.name;
              return (
                <button
                  key={sh.name}
                  type="button"
                  onClick={() => handlePickShade(sh.name)}
                  className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer ${
                    selected
                      ? "h-9 w-9 ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg"
                      : "h-7 w-7 hover:scale-105 border border-white/40 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: sh.code }}
                  title={`${sh.name} (${sh.code})`}
                  aria-label={sh.name}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Thumbnail Gallery & 1-Tap Checkout Dock */}
      <div
        className="px-4 py-3 bg-[#150726] border-t border-white/10 flex items-center justify-between gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-11 w-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-white/5 ${
                i === activeIndex
                  ? "border-[#7CB518] scale-105 shadow-md shadow-green-500/30"
                  : "border-white/20 hover:border-white/50 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" width={44} height={44} className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>

        {/* Right Dock: Price & Add to Cart */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-body-md font-black text-white tabular-nums leading-tight">
              {formatINR2(price)}
            </p>
            <p className="text-tiny font-bold text-[#7CB518]">60-Min Express Delivery</p>
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            disabled={added}
            className={`px-5 py-2.5 rounded-xl text-body-sm font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
              added
                ? "bg-[#7CB518] text-white"
                : "bg-gradient-to-r from-[#7CB518] to-[#6A9C14] hover:opacity-95 text-white shadow-green-500/25"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
