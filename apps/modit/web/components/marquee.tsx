"use client";

import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: number; // in seconds
}

/**
 * Modern hardware-accelerated infinite marquee (Magic UI style).
 * Seamlessly loops two duplicate tracks at 60/120fps with pause-on-hover.
 */
export function Marquee({
  children,
  className = "",
  reverse = false,
  pauseOnHover = true,
  speed = 45,
}: MarqueeProps) {
  return (
    <div
      className={`group flex overflow-hidden p-1 [--gap:1.25rem] [gap:var(--gap)] ${className}`}
    >
      <div
        className={`flex shrink-0 justify-around [gap:var(--gap)] animate-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        } ${reverse ? "[animation-direction:reverse]" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`flex shrink-0 justify-around [gap:var(--gap)] animate-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        } ${reverse ? "[animation-direction:reverse]" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}
