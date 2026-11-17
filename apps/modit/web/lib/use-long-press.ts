"use client";

import { useRef, useCallback } from "react";

/**
 * Native-style long-press: fires the callback after HOLD_MS of continuous
 * contact and suppresses the click that follows, so a card link doesn't
 * navigate after the gesture. Active for touch/pen pointers only — a
 * desktop mouse-hold stays a normal hover/click interaction. Presses that
 * begin on a <button> (ADD, compare, etc.) never start the gesture.
 */
const HOLD_MS = 550;

export function useLongPress(callback: () => void, enabled = true) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const cancelClick = useCallback((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    if (fired.current) {
      e.preventDefault();
      e.stopPropagation();
      fired.current = false;
    }
  }, []);

  const handlers = {
    onPointerDownCapture: (e: React.PointerEvent) => {
      if (!enabled || e.pointerType === "mouse") return;
      // Buttons keep their own press behavior — never hijack them.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("button")) return;
      fired.current = false;
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        callback();
      }, HOLD_MS);
    },
    onPointerUpCapture: clear,
    onPointerCancelCapture: clear,
    onPointerLeaveCapture: clear,
    onClickCapture: cancelClick,
    onContextMenu: (e: React.MouseEvent) => {
      // The long-press on some Android browsers opens the context menu —
      // swallow it only while our gesture is active.
      if (fired.current || timer.current) e.preventDefault();
    },
  };

  return handlers;
}
