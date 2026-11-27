"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import {
  X,
  ZoomIn,
  ZoomOut,
  Box,
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
  const [mode, setMode] = useState<"zoom" | "3d">("3d");
  const [zoomLevel, setZoomLevel] = useState(2.2);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
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
    if (mode === "3d") {
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
          className="product-thumb-blend relative w-full max-w-2xl aspect-square rounded-3xl overflow-hidden flex items-center justify-center cursor-crosshair border border-white/25 bg-gradient-to-b from-[#F8F6FC] to-[#F0ECF9] shadow-2xl"
          style={{ perspective: 1200 }}
        >
          

          {/* PRODUCT BUCKET IMAGE WITH 3D OR ZOOM TRANSFORM */}
          <div
            className="relative h-full w-full flex items-center justify-center transition-transform duration-150 ease-out"
            style={
              mode === "3d"
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
                sizes="(max-width: 1024px) 100vw, 960px"
                quality={92}
                priority
                draggable={false}
                className="object-contain p-8 drop-shadow-[0_16px_32px_rgba(45,27,105,0.25)]"
              />
            ) : (
              <Package className="h-32 w-32 text-white/20" />
            )}

            {/* Specular lighting sheen across the bucket */}
            {(mode === "3d") && (
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-45 transition-opacity"
                style={{
                  background: `linear-gradient(${130 + tilt.ry * 2}deg, rgba(255,255,255,0.55) 0%, transparent 55%)`,
                }}
              />
            )}

            
          </div>

          {/* Floating floor contact shadow */}
          {(mode === "3d") && (
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

          {(mode === "3d") && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1.5 text-tiny font-bold text-white border border-white/20 shadow-lg">
              <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
              Drag with mouse or swipe touch to rotate 3D
            </div>
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

          {/* Futuristic 3D Orientation HUD Pill */}
          {(mode === "3d") && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-tiny font-mono text-white/80 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00BCD4] animate-pulse" />
              <span>TILT X: {Math.round(tilt.rx)}°</span>
              <span className="text-white/30">|</span>
              <span>Y: {Math.round(tilt.ry)}°</span>
            </div>
          )}

          {/* Futuristic Loupe HUD in Zoom Mode */}
          {mode === "zoom" && !zoomPos.active && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-tiny font-mono text-white/80 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
              <span>LOUPE OPTICS</span>
              <span className="text-white/30">|</span>
              <span className="font-sans text-white/70">Drag to inspect detail</span>
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
              className={`h-11 w-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-[#F8F6FC] product-thumb-blend ${
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
