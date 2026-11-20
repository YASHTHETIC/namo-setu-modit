"use client";

import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  reverse?: boolean;
  delay?: number;
}

/**
 * Modern Border Beam (Magic UI style).
 * Traveling laser glow along card perimeters using GPU-accelerated conic-gradient & CSS mask.
 */
export function BorderBeam({
  className = "",
  duration = 8,
  borderWidth = 1.5,
  colorFrom = "#7CB518",
  colorTo = "#00BCD4",
  reverse = false,
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] z-20 ${className}`}
      style={{
        padding: `${borderWidth}px`,
        maskImage: "linear-gradient(black, black), linear-gradient(black, black)",
        WebkitMaskImage: "linear-gradient(black, black), linear-gradient(black, black)",
        maskClip: "content-box, border-box",
        WebkitMaskClip: "content-box, border-box",
        maskComposite: "exclude",
        WebkitMaskComposite: "xor",
      }}
    >
      <div
        className="absolute inset-[-150%] animate-[spin_8s_linear_infinite]"
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationDirection: reverse ? "reverse" : "normal",
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 315deg, ${colorFrom} 342deg, ${colorTo} 360deg)`,
        }}
      />
    </div>
  );
}
