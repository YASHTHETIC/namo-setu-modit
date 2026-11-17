"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "./haptics";

/** Pull distance (px) that must be crossed to trigger a refresh. */
export const PULL_THRESHOLD = 72;
/** Rubber-band cap: beyond this the pull resists heavily. */
export const PULL_MAX = 110;
/** Spinner stays visible at least this long so the state never flickers. */
const MIN_REFRESH_MS = 600;
/** Drag slop before the gesture claims the touch (keeps taps untouched). */
const SLOP_PX = 10;

/**
 * Native-app pull-to-refresh for touch devices. Active only for coarse
 * pointers (phones/tablets): when the page sits at the very top and the
 * user drags down, `pull` grows toward the rubber-band cap. Crossing
 * PULL_THRESHOLD fires `refresh` (typically a react-query refetch), shows
 * the spinner for at least MIN_REFRESH_MS, then settles.
 *
 * The touchmove listener is non-passive and calls preventDefault() once the
 * gesture has claimed the touch, which suppresses the browser's native
 * pull-to-refresh/overscroll so the two never fight.
 */
export function usePullToRefresh(refresh: () => unknown, enabled = true) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const pullRef = useRef(0);
  const busy = useRef(false);
  const startY = useRef<number | null>(null);
  const claimed = useRef(false);

  const done = useCallback(() => {
    busy.current = false;
    pullRef.current = 0;
    setPull(0);
    setRefreshing(false);
  }, []);

  const setPullValue = useCallback((v: number) => {
    pullRef.current = v;
    setPull(v);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: coarse)")?.matches) return;

    const onStart = (e: TouchEvent) => {
      if (busy.current || e.touches.length !== 1) return;
      startY.current = e.touches[0].clientY;
      claimed.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (busy.current || startY.current === null || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startY.current;
      // Only claim the gesture while at the top edge and dragging down.
      if (!claimed.current) {
        if (dy < SLOP_PX || window.scrollY > 0) return;
        claimed.current = true;
      }
      // Rubber-band: the further out, the harder it pulls back.
      const eased = dy <= PULL_MAX ? dy : PULL_MAX + (dy - PULL_MAX) * 0.18;
      setPullValue(Math.round(Math.min(eased, PULL_MAX + 40)));
      e.preventDefault();
    };

    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (!claimed.current) return;
      claimed.current = false;
      const current = pullRef.current;
      setPullValue(0);
      if (current < PULL_THRESHOLD || busy.current) return;
      busy.current = true;
      setRefreshing(true);
      haptic("success");
      Promise.all([
        Promise.resolve(refreshRef.current()).catch(() => undefined),
        new Promise((r) => setTimeout(r, MIN_REFRESH_MS)),
      ]).finally(done);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, done, setPullValue]);

  return { pull, refreshing, threshold: PULL_THRESHOLD, max: PULL_MAX, done };
}
