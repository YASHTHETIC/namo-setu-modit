"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Truck, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/reveal";

/**
 * Shared futuristic FX primitives (one pattern for the whole storefront).
 * All motion is transform/opacity only and honors prefers-reduced-motion.
 */

/** Ambient backdrop: drifting glow orbs + panning grid. Parent must be relative. */
export function FxBackdrop({
  tone = "dark",
  className = "",
  style,
}: {
  tone?: "dark" | "light";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div aria-hidden className={`fx-scene ${className}`} style={style}>
      {tone === "dark" ? (
        <>
          <div
            className="fx-orb fx-orb-a"
            style={{ width: 280, height: 280, top: -90, right: -60, background: "rgba(124,181,24,0.35)" }}
          />
          <div
            className="fx-orb fx-orb-b"
            style={{ width: 320, height: 320, bottom: -120, left: -80, background: "rgba(233,30,99,0.28)" }}
          />
          <div className="fx-grid-bg" />
        </>
      ) : (
        <>
          <div
            className="fx-orb fx-orb-a"
            style={{ width: 260, height: 260, top: -100, right: -70, background: "rgba(124,181,24,0.22)" }}
          />
          <div
            className="fx-orb fx-orb-b"
            style={{ width: 300, height: 300, bottom: -130, left: -90, background: "rgba(45,27,105,0.14)" }}
          />
          <div className="fx-grid-bg light" />
        </>
      )}
    </div>
  );
}

/** Staggered scroll entrance for grids/lists. Each child gets a Reveal wrapper. */
export function Stagger({
  children,
  step = 70,
  maxDelay = 420,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  step?: number;
  maxDelay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}) {
  return (
    <>
      {Children.map(children, (child, i) => (
        <Reveal delay={Math.min(i * step, maxDelay)} direction={direction} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  );
}

/** 3D "Material on Door" overlay badge for product imagery. */
export function DoorBadge({ overlay = false }: { overlay?: boolean }) {
  return (
    <span className={`trust3d trust3d-door text-tiny font-bold ${overlay ? "trust3d-overlay absolute bottom-2 left-2 z-20" : ""}`}>
      <Truck className="truck h-3.5 w-3.5" />
      Material on Door
    </span>
  );
}

/** 3D "7-Day Replacement" trust badge for product info areas. */
export function ReplaceBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`trust3d trust3d-shield trust3d-ring text-tiny font-bold ${className}`}>
      <ShieldCheck className="h-3.5 w-3.5 text-[#7CB518]" />
      7-Day Replacement
    </span>
  );
}

/** Animated number that counts up when scrolled into view. */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-IN"),
  duration = 1200,
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            setDisplay(value * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
