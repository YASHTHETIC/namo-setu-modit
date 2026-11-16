"use client";

import { useEffect, useState } from "react";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number; // seconds
}

/**
 * Modern Number Ticker (Magic UI style).
 * Smoothly interpolates numeric values with easeOutExpo physics.
 */
export function NumberTicker({
  value,
  direction = "up",
  className = "",
  delay = 0,
}: NumberTickerProps) {
  const [current, setCurrent] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    const start = direction === "down" ? value : 0;
    const end = value;
    const duration = 1200; // ms
    const startTime = performance.now() + delay * 1000;

    let frameId: number;

    const tick = (now: number) => {
      if (now < startTime) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.round(start + (end - start) * ease);
      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, direction, delay]);

  return (
    <span className={`inline-block tabular-nums tracking-tight ${className}`}>
      {current.toLocaleString("en-IN")}
    </span>
  );
}
