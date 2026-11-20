"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ShieldCheck } from "lucide-react";

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

/** Pointer-driven 3D tilt (desktop only — hover-capable, fine pointers). */
export function Tilt3D({
  children,
  max = 7,
  pop = 30,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  pop?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<CSSProperties>({});
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      transform: `rotateY(${(px * max * 2).toFixed(2)}deg) rotateX(${(-py * max * 2).toFixed(2)}deg) translateZ(${pop}px)`,
    });
  };
  const reset = () => enabled && setTilt({});

  return (
    <div className={`tilt-scene ${className}`}>
      <div
        ref={ref}
        className="tilt-card"
        style={tilt}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Scroll-linked depth: the block drifts at a slower rate than the page
 * (parallax) while passing through the viewport — the "3D scroll" feel.
 * rAF-throttled, transform-only, disabled for reduced motion.
 */
export function Parallax({
  children,
  strength = 24,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const active = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([e]) => { active.current = e.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    let raf = 0;
    const measure = () => {
      raf = 0;
      if (!active.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 → element enters at bottom, 1 → exits at top
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      setOffset((p - 0.5) * strength * 2);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ transform: `translateY(${offset.toFixed(1)}px)` }}>
      {children}
    </div>
  );
}

/**
 * 2028 Interactive Spotlight Glow Card.
 * Tracks pointer movement to render a soft radial ambient spotlight behind content.
 */
export function GlowSpotlight({
  children,
  className = "",
  glowColor = "rgba(124, 181, 24, 0.15)",
  size = 350,
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPosition(null);
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {isHovered && position && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * 2028 Cyber Status Badge with animated neon pulse dot.
 */
export function CyberBadge({
  label,
  variant = "green",
  className = "",
}: {
  label: string;
  variant?: "green" | "cyan" | "pink" | "gold";
  className?: string;
}) {
  const styles = {
    green: "bg-[#7CB518]/10 text-[#7CB518] border-[#7CB518]/30 shadow-[0_0_12px_rgba(124,181,24,0.25)]",
    cyan: "bg-[#00BCD4]/10 text-[#00BCD4] border-[#00BCD4]/30 shadow-[0_0_12px_rgba(0,188,212,0.25)]",
    pink: "bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30 shadow-[0_0_12px_rgba(233,30,99,0.25)]",
    gold: "bg-[#F8CB46]/10 text-[#F8CB46] border-[#F8CB46]/30 shadow-[0_0_12px_rgba(248,203,70,0.25)]",
  };
  const dotStyles = {
    green: "bg-[#7CB518]",
    cyan: "bg-[#00BCD4]",
    pink: "bg-[#E91E63]",
    gold: "bg-[#F8CB46]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-black tracking-wide uppercase ${styles[variant]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full animate-ping ${dotStyles[variant]}`} />
      {label}
    </span>
  );
}
