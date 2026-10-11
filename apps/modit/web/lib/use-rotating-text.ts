"use client";

import { useEffect, useState } from "react";

/**
 * Rotating search hint (one pattern for every search box).
 * Cycles terms every few seconds; static when reduced-motion is on.
 */
export function useRotatingText(terms: string[], intervalMs = 3000): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (terms.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => setIndex((i) => (i + 1) % terms.length), intervalMs);
    return () => clearInterval(t);
  }, [terms.length, intervalMs]);

  return terms[index] ?? terms[0] ?? "";
}

export const SEARCH_HINTS = [
  "Search cement, paint, lighting…",
  "Try 'UltraTech 53 grade'…",
  "Try 'Asian Paints 20L'…",
  "Try 'Philips COB light'…",
  "Try 'Waterproofing'…",
];
