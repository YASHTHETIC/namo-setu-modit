"use client";

/**
 * App-style haptic feedback for key interactions (PWA install, mobile web).
 * Safe everywhere: no-ops when Vibration API is missing, disabled by the
 * user (localStorage `modit_haptics=off`), or inside try/catch failures.
 * Patterns are tiny (<30ms) so they read as ticks, not buzzing.
 */
type Pattern = number | number[];

export type HapticKind = "tick" | "light" | "success" | "warn" | "delete";

const PATTERNS: Record<HapticKind, Pattern> = {
  tick: 8,
  light: 12,
  success: [10, 40, 14],
  warn: [14, 60, 14],
  delete: [16, 30, 16, 30, 16],
};

export function haptic(kind: HapticKind = "light") {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  try {
    if (localStorage.getItem("modit_haptics") === "off") return;
    const nav = navigator as Navigator & { vibrate?: (p: Pattern) => boolean };
    nav.vibrate?.(PATTERNS[kind]);
  } catch {
    /* never break an interaction over haptics */
  }
}
