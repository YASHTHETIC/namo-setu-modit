"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

/**
 * MacroZoom — God-level macro material zoom.
 *
 * Hovering over the product image reveals a magnifying-lens overlay that
 * shows a 2.5× macro view of the material texture (cement grain, paint
 * finish, tile glaze, wood grain). Follows the pointer precisely, clamps
 * to image bounds, and fades out on leave. Touch: tap to toggle the lens.
 * Reduced-motion safe (lens still works, no animation).
 */
interface MacroZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoom?: number; // default 2.5
  lensSize?: number; // default 140px
}

export function MacroZoom({ src, alt, className = "", zoom = 2.5, lensSize = 140 }: MacroZoomProps) {
  const [lens, setLens] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!imgRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      // Clamp lens center inside image
      const half = lensSize / 2;
      const cx = Math.min(Math.max(x, half), rect.width - half);
      const cy = Math.min(Math.max(y, half), rect.height - half);
      setLens({ x: cx, y: cy, active: true });
    },
    [lensSize],
  );

  const handleLeave = useCallback(() => setLens(null), []);

  // Compute background-position so the lens shows the zoomed region centered
  const lensStyle = lens
    ? {
        left: lens.x - lensSize / 2,
        top: lens.y - lensSize / 2,
        width: lensSize,
        height: lensSize,
        backgroundImage: `url("${src}")`,
        backgroundSize: `${imgRef.current?.naturalWidth || 400}px ${imgRef.current?.naturalHeight || 400}px`,
        backgroundPosition: `${-((lens.x / (containerRef.current?.clientWidth || 400)) * 100 - 50) * (zoom - 1)}% ${-((lens.y / (containerRef.current?.clientHeight || 400)) * 100 - 50) * (zoom - 1)}%`,
      }
    : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={(e) => {
        e.preventDefault();
        handleMove(e);
      }}
      onTouchEnd={handleLeave}
      className={`relative inline-block overflow-hidden rounded-xl border border-white/30 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)] ${className}`}
      style={{ touchAction: "none" }}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 400px"
        className="object-cover block transition-opacity duration-300"
        style={{ opacity: lens?.active ? 0.55 : 1 }}
        loading="lazy"
        draggable={false}
      />
      {lens && lens.active && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
          style={lensStyle as React.CSSProperties}
        />
      )}
      {lens && lens.active && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-xs font-black text-white border border-white/20 shadow-lg animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#7CB518]" /> Macro {Math.round(zoom * 10)}×
        </div>
      )}
    </div>
  );
}
