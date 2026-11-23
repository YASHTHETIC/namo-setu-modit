"use client";

import React, { useEffect, useRef } from "react";

interface Particles3DVfxProps {
  particleCount?: number;
  className?: string;
  speed?: number;
  interactive?: boolean;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
}

const BRAND_PALETTE = [
  "#7CB518", // Emerald Green
  "#00BCD4", // Cyber Cyan
  "#F8CB46", // Electric Gold
  "#E91E63", // Neon Pink
];

/**
 * 2028 God-Level 3D Holographic Particle Matrix VFX.
 * Hardware-accelerated Canvas with 3D perspective projection,
 * depth of field, pointer parallax deflection, and automatic viewport pause.
 */
export function Particles3DVfx({
  particleCount = 38,
  className = "",
  speed = 1,
  interactive = true,
}: Particles3DVfxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const inViewRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Initialize 3D particles in a bounding volume
    const fov = 350;
    const particles: Particle3D[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.2,
        y: (Math.random() - 0.5) * height * 1.2,
        z: Math.random() * 600 - 200, // -200 to +400 depth
        vx: (Math.random() - 0.5) * 0.45 * speed,
        vy: (Math.random() - 0.5) * 0.45 * speed - 0.15, // gentle upward drift
        vz: (Math.random() - 0.5) * 0.8 * speed,
        size: Math.random() * 2.2 + 1.2,
        color: BRAND_PALETTE[Math.floor(Math.random() * BRAND_PALETTE.length)],
        alpha: Math.random() * 0.5 + 0.35,
      });
    }

    // Pointer move listener on canvas container
    const handlePointerMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left - width / 2,
        y: e.clientY - rect.top - height / 2,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const parent = canvas.parentElement;
    if (parent && interactive) {
      parent.addEventListener("mousemove", handlePointerMove, { passive: true });
      parent.addEventListener("mouseleave", handlePointerLeave, { passive: true });
    }

    // Intersection observer to freeze simulation off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Main 3D Animation Render Loop
    const render = () => {
      if (inViewRef.current) {
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Move along velocity
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Interactive subtle magnetic deflection
          if (mouseRef.current.active) {
            const dx = p.x - mouseRef.current.x;
            const dy = p.y - mouseRef.current.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 15000 && distSq > 100) {
              const force = 180 / distSq;
              p.x += dx * force;
              p.y += dy * force;
            }
          }

          // Boundary wrapping in 3D volume
          if (p.x < -width * 0.7) p.x = width * 0.7;
          if (p.x > width * 0.7) p.x = -width * 0.7;
          if (p.y < -height * 0.7) p.y = height * 0.7;
          if (p.y > height * 0.7) p.y = -height * 0.7;
          if (p.z < -200) p.z = 400;
          if (p.z > 400) p.z = -200;

          // 3D Perspective Projection
          const scale = fov / (fov + p.z);
          if (scale <= 0) continue;

          const projX = cx + p.x * scale;
          const projY = cy + p.y * scale;
          const projRadius = Math.max(0.6, p.size * scale);
          const depthAlpha = Math.max(0.1, Math.min(1, p.alpha * scale));

          // Draw Glowing 3D Particle
          ctx.save();
          ctx.globalAlpha = depthAlpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = scale > 1 ? 12 : 6;

          ctx.beginPath();
          ctx.arc(projX, projY, projRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      if (parent && interactive) {
        parent.removeEventListener("mousemove", handlePointerMove);
        parent.removeEventListener("mouseleave", handlePointerLeave);
      }
      observer.disconnect();
    };
  }, [particleCount, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
