"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  variant?: "default" | "zoom" | "blur";
  className?: string;
}

/**
 * Scroll-triggered entrance used site-wide (one pattern, one easing).
 * Slides/fades from the given direction once, then stays. `zoom` adds a
 * subtle scale, `blur` a focus-pull — both GPU-cheap. Honors
 * prefers-reduced-motion (renders instantly, no movement).
 */
export function Reveal({ children, delay = 0, direction = "up", variant = "default", className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const offset =
    direction === "left"
      ? "translate-x-8"
      : direction === "right"
        ? "-translate-x-8"
        : direction === "none"
          ? ""
          : "translate-y-6";
  const hiddenFx =
    variant === "zoom" ? "scale-95" : variant === "blur" ? "blur-sm scale-[0.98]" : "";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${className} ${
        visible ? "opacity-100 translate-x-0 translate-y-0 scale-100 blur-0" : `opacity-0 ${offset} ${hiddenFx}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
