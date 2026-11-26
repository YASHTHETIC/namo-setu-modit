"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";
import Image from "next/image";
import { Heart, Share2, Check, Package, Box, ZoomIn, Maximize2, RotateCw } from "lucide-react";

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
  shades?: { name: string; code: string; family: string }[];
  onSelectShade?: (name: string) => void;
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
  const [turntable, setTurntable] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Turntable smooth 3D auto-spin animation loop
  useEffect(() => {
    if (!turntable) return;
    let animId: number;
    let angle = 0;
    const spin = () => {
      angle = (angle + 1.2) % 360;
      const rad = (angle * Math.PI) / 180;
      setTilt({
        rx: Math.sin(rad) * 9,
        ry: Math.sin(rad * 0.5) * 24,
      });
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, [turntable]);

  const activeImage = images[safeImageIndex];
  const auraColor = selectedShadeColor || "#7CB518";

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
        if (turntable) setTurntable(false);
        // 3D Tilt calculation: max +/- 18 degrees
        const normX = (clientX / rect.width) * 2 - 1; // -1 to 1
        const normY = (clientY / rect.height) * 2 - 1; // -1 to 1
        setTilt({
          rx: -normY * 16,
          ry: normX * 18,
        });
      }
    },
    [mode, turntable]
  );

  const handleMouseLeave = useCallback(() => {
    setZoomPos((prev) => ({ ...prev, active: false }));
    if (!turntable) {
      setTilt({ rx: 0, ry: 0 });
    }
  }, [turntable]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (mode !== "3d" || !containerRef.current || e.touches.length === 0) return;
      if (turntable) setTurntable(false);
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      const normX = Math.max(-1, Math.min(1, (clientX / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (clientY / rect.height) * 2 - 1));
      setTilt({
        rx: -normY * 18,
        ry: normX * 22,
      });
    },
    [mode, turntable]
  );

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
            onClick={() => {
              setTurntable(false);
              setMode("3d");
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mode === "3d" && !turntable
                ? "bg-white text-[#2D1B69] shadow-xs"
                : "text-[#6B5B83] hover:text-[#2D1B69]"
            }`}
            title="3D interactive tilt & perspective"
          >
            <Box className="h-3.5 w-3.5 text-[#00BCD4]" />
            3D Look
          </button>
          <button
            onClick={() => {
              setMode("3d");
              setTurntable((prev) => !prev);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              turntable
                ? "bg-white text-[#E91E63] shadow-xs font-black"
                : "text-[#6B5B83] hover:text-[#2D1B69]"
            }`}
            title="360° Studio Turntable"
          >
            <RotateCw className={`h-3 w-3 text-[#E91E63] ${turntable ? "animate-spin" : ""}`} />
            360° Spin
          </button>
        </div>

        {/* Selected shade pill */}
        {selectedShadeName && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-tiny font-bold text-[#150726] shadow-xs border border-[#EDE7F6]">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-black/10"
              style={{ backgroundColor: auraColor }}
            />
            <span className="truncate max-w-[140px]">{selectedShadeName}</span>
          </div>
        )}
      </div>

      {/* Main interactive stage — Clean, normal product photo presentation */}
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
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          if (mode === "3d") {
            setTilt({ rx: 0, ry: 0 });
          }
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 40 || images.length < 2) return;
          setSelectedImage((i) => (i + (dx < 0 ? 1 : images.length - 1)) % images.length);
        }}
        className="relative aspect-square overflow-hidden rounded-2xl border border-[#EDE7F6] bg-white select-none cursor-crosshair group shadow-xs"
        style={{
          perspective: 1000,
        }}
      >
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
              quality={92}
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
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-[#150726]/85 backdrop-blur-md px-3 py-1.5 text-tiny font-mono text-white/90 shadow-md border border-white/15 opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" />
            <span className="font-sans font-bold">ULTRA ZOOM</span>
            <span className="text-white/30">|</span>
            <span className="font-sans text-white/70">Hover to inspect</span>
          </div>
        )}

        {mode === "3d" && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-[#150726]/85 backdrop-blur-md px-3 py-1.5 text-tiny font-mono text-white/90 shadow-md border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00BCD4] animate-pulse" />
            <span className="font-sans font-bold text-[#00BCD4]">3D LOOK</span>
            <span className="text-white/30">|</span>
            <span>X: {Math.round(tilt.rx)}°</span>
            <span className="text-white/30">|</span>
            <span>Y: {Math.round(tilt.ry)}°</span>
          </div>
        )}

        {/* Fullscreen button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          title="Fullscreen view"
          className="absolute bottom-3 right-12 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-95 text-[#2D1B69] border border-[#DDD6EE]"
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
