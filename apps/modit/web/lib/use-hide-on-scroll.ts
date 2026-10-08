"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hide-on-scroll for sticky headers (Blinkit-style app feel):
 * scrolling down slides the header away, scrolling up brings it back.
 * Returns true while the header should be hidden.
 */
export function useHideOnScroll(threshold = 140) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > threshold && y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4 || y <= threshold) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
