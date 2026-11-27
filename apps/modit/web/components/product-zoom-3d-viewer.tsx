"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";
import Image from "next/image";
import { Heart, Share2, Check, Package, RotateCw, Maximize2 } from "lucide-react";

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
  selectedShadeColor = null,
  selectedShadeName = null,
}: ProductZoom3DViewerProps) {
  const [revolve, setRevolve] = useState(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Smooth 3D auto-revolve loop
  useEffect(() => {
    if (!revolve) return;
    let animId: number;
    let angle = 0;
    const spin = () => {
      angle = (angle + 1.2) % 360;
      const rad = (angle * Math.PI) / 180;
      setTilt({
        rx: Math.sin(rad) * 8,
        ry: Math.sin(rad * 0.7) * 22,
      });
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, [revolve]);

  const activeImage = images[safeImageIndex];
  const auraColor = selectedShadeColor || "#7CB518";

  // 3D Tilt calculation on mouse move (crystal clear, no zoom/scale)
  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      if (revolve) setRevolve(false);
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // 3D Tilt: max +/- 16 deg X, +/- 18 deg Y
      const normX = (clientX / rect.width) * 2 - 1; // -1 to 1
      const normY = (clientY / rect.height) * 2 - 1; // -1 to 1
      setTilt({
        rx: -normY * 16,
        ry: normX * 18,
      });
    },
    [revolve]
  );

  const handleMouseLeave = useCallback(() => {
    if (!revolve) {
      setTilt({ rx: 0, ry: 0 });
    }
  }, [revolve]);

  // Touch handling for mobile & tablet
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!containerRef.current || e.touches.length === 0) return;
      if (revolve) setRevolve(false);
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      const normX = Math.max(-1, Math.min(1, (clientX / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (clientY / rect.height) * 2 - 1));
      setTilt({
        rx: -normY * 16,
        ry: normX * 18,
      });
    },
    [revolve]
  );

  return (
    <div className="relative">
      {/* Top 3D Control Bar: 3D Revolve toggle + Selected shade indicator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={() => setRevolve((r) => !r)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-tiny font-bold transition-all shadow-xs border cursor-pointer ${
            revolve
              ? "bg-[#2D1B69] text-white border-[#2D1B69] shadow-md shadow-purple-900/20"
              : "bg-white text-[#2D1B69] border-[#EDE7F6] hover:border-[#7CB518]"
          }`}
          title="Toggle 3D product revolve"
          aria-pressed={revolve}
        >
          <RotateCw className={`h-3.5 w-3.5 text-[#7CB518] ${revolve ? "animate-spin" : ""}`} />
          <span>{revolve ? "Revolving 3D" : "3D Revolve"}</span>
        </button>

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

      {/* Main 3D Stage — Crystal Clear Product, Smooth 3D Revolve/Tilt, Zero Auto-Zoom */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onOpenLightbox}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          if (!revolve) {
            setTilt({ rx: 0, ry: 0 });
          }
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 40 || images.length < 2) return;
          setSelectedImage((i) => (i + (dx < 0 ? 1 : images.length - 1)) % images.length);
        }}
        className="product-thumb-blend relative aspect-square overflow-hidden rounded-2xl border border-[#EDE7F6] bg-[#F8F6FC] select-none cursor-grab active:cursor-grabbing group shadow-xs hover:border-[#7CB518]/60 transition-colors"
        style={{
          perspective: 1200,
        }}
      >
        {/* Crystal Clear 3D Product Stage (no zoom, pure 100% scale) */}
        <div
          className="relative h-full w-full"
          style={{
            transform:
              tilt.rx !== 0 || tilt.ry !== 0
                ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                : undefined,
            transformStyle: tilt.rx !== 0 || tilt.ry !== 0 ? "preserve-3d" : undefined,
            transition: revolve ? "none" : "transform 0.15s ease-out",
          }}
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
              className="object-contain p-4 sm:p-6 drop-shadow-[0_12px_24px_rgba(45,27,105,0.14)]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-32 w-32 text-[var(--text-muted)]/20" />
            </div>
          )}

          {/* 3D Specular Lighting Glint */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-30 transition-opacity"
            style={{
              background: `linear-gradient(${135 + tilt.ry * 2}deg, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            }}
          />
        </div>

        {/* Dynamic 3D depth shadow underneath */}
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-full blur-md bg-black/15 transition-transform duration-100"
          style={{
            transform: `translateX(-50%) translate(${tilt.ry * -1.2}px, ${tilt.rx * 0.6}px) scale(${1 - Math.abs(tilt.rx) * 0.01})`,
          }}
        />

        {/* 3D Interactive Badge (subtle, non-intrusive) */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-[#150726]/75 backdrop-blur-md px-2.5 py-1 text-micro font-bold text-white/90 shadow-sm border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] shadow-[0_0_6px_#7CB518]" />
          <span>3D VIEW</span>
        </div>

        {/* Fullscreen / Lightbox inspection button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          title="Full inspection view"
          aria-label="Full inspection view"
          className="absolute bottom-3 right-12 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-95 text-[#2D1B69] border border-[#DDD6EE] cursor-pointer"
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
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all active:scale-90 cursor-pointer ${
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
            aria-label="Share this product"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--text-secondary)] shadow-md backdrop-blur-sm transition-all hover:text-[#2D1B69] active:scale-90 cursor-pointer"
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
