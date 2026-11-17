"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Desktop pointer magnet: the wrapped element leans a few px toward the
 * cursor and springs back on leave. Pointer-fine devices only — touch
 * never sees it (no transform jank while scrolling). Pure CSS transition,
 * no animation library needed.
 */
export function Magnetic({
  children,
  strength = 6,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const fine = useRef<boolean | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (fine.current === null) {
      fine.current =
        typeof window !== "undefined" && !!window.matchMedia?.("(pointer: fine)")?.matches;
    }
    if (!fine.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    setOffset({ x: dx * strength, y: dy * strength });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 0.3s var(--ease-spring)",
        willChange: "transform",
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  );
}
