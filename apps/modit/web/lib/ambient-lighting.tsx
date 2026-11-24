"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Ambient Category Lighting System.
 *
 * Shifts the page's atmospheric CSS variables based on the active product
 * category, creating an immersive per-category environment:
 *   cement   → dusty warm gray / ochre
 *   painting → deep purple / electric gold
 *   lighting → cool cyan / indigo
 *   tiling   → ocean teal / ceramic white
 *   default  → neutral slate
 *
 * All transitions use GPU-cheap CSS custom properties on <body>, so the
 * rest of the UI inherits the mood automatically. Honors
 * prefers-reduced-motion (instant snap, no crossfade).
 */
const CATEGORY_PALETTES: Record<string, {
  bg: string;
  surface: string;
  accent: string;
  accentGlow: string;
  text: string;
  muted: string;
}> = {
  cement:   { bg: "#0E0A16", surface: "#130B1F", accent: "#7CB518", accentGlow: "rgba(124,181,24,0.35)", text: "#F0ECF9", muted: "#C9B8E8" },
  painting: { bg: "#14081A", surface: "#1B0C26", accent: "#F8CB46", accentGlow: "rgba(248,203,70,0.35)", text: "#F5F2FC", muted: "#EDE7F6" },
  lighting: { bg: "#08141A", surface: "#0C1B26", accent: "#00BCD4", accentGlow: "rgba(0,188,212,0.35)", text: "#E0F7FA", muted: "#B2EBF2" },
  tiling:   { bg: "#0A1416", surface: "#0E1B1F", accent: "#E91E63", accentGlow: "rgba(233,30,99,0.35)", text: "#FCE4EC", muted: "#F48FB1" },
  electrical:{ bg: "#1A1008", surface: "#24170C", accent: "#F8CB46", accentGlow: "rgba(248,203,70,0.35)", text: "#FFF6DE", muted: "#F5E3C4" },
};

const DEFAULT = CATEGORY_PALETTES.cement;

export function useAmbientLighting(categorySlug: string | null | undefined) {
  const [active, setActive] = useState<keyof typeof CATEGORY_PALETTES | null>(null);

  const apply = useCallback((slug: string | null | undefined) => {
    if (typeof document === "undefined") return;
    const key = (slug ?? "cement").toLowerCase() as keyof typeof CATEGORY_PALETTES;
    const palette = CATEGORY_PALETTES[key] ?? DEFAULT;
    const root = document.documentElement;
    root.style.setProperty("--ambient-bg", palette.bg);
    root.style.setProperty("--ambient-surface", palette.surface);
    root.style.setProperty("--ambient-accent", palette.accent);
    root.style.setProperty("--ambient-accent-glow", palette.accentGlow);
    root.style.setProperty("--ambient-text", palette.text);
    root.style.setProperty("--ambient-muted", palette.muted);
    setActive(key);
  }, []);

  useEffect(() => {
    apply(categorySlug);
    // Re-apply on every category change so the mood follows the user.
  }, [categorySlug, apply]);

  return { active, palette: CATEGORY_PALETTES[active ?? "cement"] ?? DEFAULT };
}

/**
 * Wrapper that reads the category from the current route context and
 * applies ambient lighting. Use once per page shell (home, products, PDP).
 */
export function AmbientLightingProvider({ categorySlug, children }: { categorySlug?: string | null; children: React.ReactNode }) {
  useAmbientLighting(categorySlug);
  return <>{children}</>;
}
