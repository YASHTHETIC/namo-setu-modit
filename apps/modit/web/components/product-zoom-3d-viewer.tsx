"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
import Image from "next/image";
import { Heart, Share2, Check, Package, Sparkles, Box, ZoomIn, Maximize2 } from "lucide-react";

interface ProductZoom3DViewerProps {
  images: string[];
  productName: string;
  safeImageIndex: number;
  setSelectedImage: (updater: number | ((prev: number) => number)) => void;
  wishlisted: boolean;
  toggleWishlist: () => void;
  shared: boolean;
  handleShare: () => void;
  onOpenLightbox: () => void;
  isPaintProduct?: boolean;
  selectedShadeColor?: string | null;
  selectedShadeName?: string | null;
}

export function ProductZoom3DViewer({
  images,
  productName,
  safeImageIndex,
  setSelectedImage,
  wishlisted,
  toggleWishlist,
  shared,
  handleShare,
  onOpenLightbox,
  isPaintProduct = false,
  selectedShadeColor = null,
  selectedShadeName = null,
}: ProductZoom3DViewerProps) {
  const [mode, setMode] = useState<"zoom" | "3d">("zoom");
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const activeImage = images[safeImageIndex];
  const auraColor = selectedShadeColor || (isPaintProduct ? "#FF9800" : "#7CB518");

  // Handle Zoom lens & 3D tilt on mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const px = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
      const py = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

      if (mode === "zoom") {
        setZoomPos({ x: px, y: py, active: true });
      } else {
        // 3D Tilt calculation: max +/- 18 degrees
        const normX = (clientX / rect.width) * 2 - 1; // -1 to 1
        const normY = (clientY / rect.height) * 2 - 1; // -1 to 1
        setTilt({
          rx: -normY * 16,
          ry: normX * 18,
        });
      }
    },
    [mode]
  );

  const handleMouseLeave = useCallback(() => {
    setZoomPos((prev) => ({ ...prev, active: false }));
    setTilt({ rx: 0, ry: 0 });
  }, []);

  return (
    <div className="relative">
      {/* Top mode switch toolbar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="inline-flex items-center rounded-xl bg-[#F0ECF9] p-1 gap-1 border border-[#DDD6EE]/60 text-micro font-bold shadow-xs">
          <button
            onClick={() => setMode("zoom")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mode === "zoom"
                ? "bg-white text-[#2D1B69] shadow-xs"
                : "text-[#6B5B83] hover:text-[#2D1B69]"
            }`}
            title="Amazon-style hover zoom lens"
          >
            <ZoomIn className="h-3.5 w-3.5 text-[#7CB518]" />
            Zoom
          </button>
          <button
            onClick={() => setMode("3d")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mode === "3d"
                ? "bg-white text-[#2D1B69] shadow-xs"
                : "text-[#6B5B83] hover:text-[#2D1B69]"
            }`}
            title="3D interactive tilt & perspective"
          >
            <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
            3D Look
          </button>
        </div>

        {/* Paint aura badge if shade is selected or paint product */}
        {isPaintProduct && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-tiny font-bold text-[#150726] shadow-xs border border-[#EDE7F6]">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-black/10 animate-pulse"
              style={{ backgroundColor: auraColor }}
            />
            <span className="truncate max-w-[120px]">
              {selectedShadeName ? selectedShadeName : "3D Paint View"}
            </span>
            <Sparkles className="h-3 w-3 text-amber-500" />
          </div>
        )}
      </div>

      {/* Main interactive stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (!zoomPos.active) onOpenLightbox();
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 40 || images.length < 2) return;
          setSelectedImage((i) => (i + (dx < 0 ? 1 : images.length - 1)) % images.length);
        }}
        className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[#F0ECF9] select-none cursor-crosshair group"
        style={{
          perspective: 1000,
        }}
      >
        {/* Canva-style Organic Fluid Paint Splash Shape (from Pic 3) */}
        {isPaintProduct && (
          <>
            <svg
              viewBox="0 0 400 400"
              className="pointer-events-none absolute inset-0 m-auto h-[88%] w-[88%] z-0 transition-all duration-700 opacity-85"
              style={{
                filter: `drop-shadow(0 20px 35px ${auraColor}40)`,
              }}
            >
              <path
                d="M 200 40 C 290 30, 360 110, 350 200 C 340 280, 290 360, 190 350 C 90 340, 40 270, 50 180 C 60 90, 110 50, 200 40 Z"
                fill={auraColor}
                opacity="0.3"
              />
              <path
                d="M 210 70 C 280 60, 330 130, 320 210 C 310 270, 260 320, 180 310 C 100 300, 70 230, 80 160 C 90 90, 140 80, 210 70 Z"
                fill={auraColor}
                opacity="0.55"
              />
              {/* Organic splash droplets from Canva design */}
              <circle cx="75" cy="115" r="15" fill={auraColor} opacity="0.65" />
              <circle cx="330" cy="125" r="13" fill={auraColor} opacity="0.55" />
              <circle cx="340" cy="280" r="18" fill={auraColor} opacity="0.7" />
              <circle cx="85" cy="295" r="16" fill={auraColor} opacity="0.55" />
            </svg>

            {/* Canva Pic 3: Floating Prompt "MOVE TO EXPLORE ↗" */}
            <div className="pointer-events-none absolute top-3.5 left-3.5 z-20 flex items-center gap-1 text-tiny sm:text-micro font-black uppercase tracking-wider text-[#2D1B69] bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/60">
              <span>MOVE TO EXPLORE ↗</span>
            </div>

            {/* Canva Pic 3: Floating Standout Finish Badge */}
            <div className="pointer-events-none absolute top-3.5 right-3.5 z-20 flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-[#EDE7F6]">
              <div className="h-6 w-6 rounded-lg bg-[#2D1B69]/10 flex items-center justify-center text-[#2D1B69]">
                <Sparkles className="h-3.5 w-3.5 text-[#7CB518]" />
              </div>
              <div className="text-left">
                <p className="text-tiny sm:text-micro font-black text-[#150726] leading-none">Standout finish</p>
                <p className="text-micro font-medium text-[#9B8CB5] leading-none mt-0.5">Made to impress</p>
              </div>
            </div>
          </>
        )}

        {/* Product image container with 3D or Zoom transforms */}
        <div
          className="relative h-full w-full z-10 transition-transform duration-150 ease-out"
          style={
            mode === "3d"
              ? {
                  transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.04, 1.04, 1.04)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.1s ease-out",
                }
              : mode === "zoom" && zoomPos.active
              ? {
                  transform: "scale(2.2)",
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
              sizes="(max-width: 1024px) 100vw, 560px"
              priority
              draggable={false}
              className="object-contain p-4 drop-shadow-[0_12px_24px_rgba(45,27,105,0.14)]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-32 w-32 text-[var(--text-muted)]/20" />
            </div>
          )}

          {/* 3D Specular Sheen Highlight */}
          {mode === "3d" && (
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 transition-opacity"
              style={{
                background: `linear-gradient(${135 + tilt.ry * 2}deg, rgba(255,255,255,0.45) 0%, transparent 60%)`,
              }}
            />
          )}
        </div>

        {/* Floating 3D shadow underneath */}
        {mode === "3d" && (
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full blur-md bg-black/15 transition-transform duration-100"
            style={{
              transform: `translateX(-50%) translate(${tilt.ry * -1.5}px, ${tilt.rx * 0.8}px) scale(${1 - Math.abs(tilt.rx) * 0.01})`,
            }}
          />
        )}

        {/* Amazon Zoom overlay lens hint */}
        {mode === "zoom" && !zoomPos.active && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-tiny font-bold text-[#2D1B69] shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3.5 w-3.5 text-[#7CB518]" />
            Hover to Zoom · Tap for Fullscreen
          </div>
        )}

        {mode === "3d" && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-tiny font-bold text-[#00838F] shadow-sm">
            <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
            Move cursor to tilt 3D
          </div>
        )}

        {/* Fullscreen button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          title="Fullscreen view"
          className="absolute bottom-3 right-12 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-95 text-[#2D1B69]"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Wishlist + Share buttons */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist();
            }}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all active:scale-90 ${
              wishlisted
                ? "bg-[#FCE4EC] text-[#E91E63]"
                : "bg-white/90 text-[var(--text-secondary)] hover:text-[#E91E63]"
            }`}
          >
            <Heart className={`h-5 w-5 ${wishlisted ? "fill-[#E91E63]" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            title="Share this product"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--text-secondary)] shadow-md backdrop-blur-sm transition-all hover:text-[#2D1B69] active:scale-90"
          >
            {shared ? <Check className="h-5 w-5 text-[#7CB518]" /> : <Share2 className="h-5 w-5" />}
          </button>
        </div>

        {shared && (
          <span className="absolute top-3 right-[52px] z-20 rounded-full bg-[#150726]/85 backdrop-blur-sm px-3 py-1.5 text-micro font-bold text-white animate-[fadeIn_0.2s_ease-out]">
            Link copied
          </span>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/55 backdrop-blur-sm px-2.5 py-1 text-micro font-semibold text-white">
            {safeImageIndex + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
