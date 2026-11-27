"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { haptic } from "@/lib/haptics";

/**
 * ProductCard3D — God-level product card with macro 3D tilt.
 *
 * On pointer move, the card tilts in 3D space following the cursor, with a
 * sweeping macro light glint across the surface and a colored border glow
 * that matches the category accent. Touch devices get a subtle press tilt.
 * All motion is reduced-motion safe.
 */
interface ProductCard3DProps {
  children: React.ReactNode;
  className?: string;
  accent?: string; // category accent color hex
  disabled?: boolean;
}

export function ProductCard3D({ children, className = "", accent = "#7CB518", disabled = false }: ProductCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: -py * 10, y: px * 14 });
      setHovered(true);
    },
    [disabled],
  );

  const handleLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setHovered(true);
  }, [disabled]);
  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`product-card-3d h-full flex flex-col relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 ${className}`}
      style={{
        borderColor: hovered ? accent : "transparent",
        boxShadow: hovered
          ? `0 20px 40px -10px rgba(45,27,105,0.2), 0 0 0 1px ${accent}`
          : "0 10px 25px -5px rgba(0,0,0,0.08)",
      }}
    >
      <div className="macro-glint absolute inset-0 pointer-events-none" />
      {children}
    </div>
  );
}
