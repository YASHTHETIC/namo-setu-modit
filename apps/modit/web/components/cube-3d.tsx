"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Box } from "lucide-react";

interface CubeFace {
  name: string;
  category: string;
  slug: string;
  image: string;
  color: string;
  tag: string;
}

const CUBE_FACES: CubeFace[] = [
  {
    name: "Ambuja Cement",
    category: "Cement",
    slug: "cement",
    image: "/products/cement/Ambuja Cement.png",
    color: "#2D1B69",
    tag: "High Grade",
  },
  {
    name: "Asian Paints",
    category: "Painting",
    slug: "painting",
    image: "/products/painting/Asian Paint.png",
    color: "#7CB518",
    tag: "Weatherproof",
  },
  {
    name: "Philips AstraSpot",
    category: "Lighting",
    slug: "lighting",
    image: "/products/lighting/Philips AstraSpot Next LED COB light.webp",
    color: "#00BCD4",
    tag: "COB LED",
  },
  {
    name: "Dr. Fixit 101",
    category: "Tiling",
    slug: "tiling",
    image: "/products/tiling/Dr Fixit.png",
    color: "#E91E63",
    tag: "Waterproof",
  },
  {
    name: "Designer Granite",
    category: "Tiles",
    slug: "tiles",
    image: "/products/tiles/Blue-Granite.png",
    color: "#2D1B69",
    tag: "Premium",
  },
  {
    name: "Havells FRLS Wire",
    category: "Electrical",
    slug: "electrical",
    image: "/products/electrical/0020082_havells-25-sq-mm-180-mtr-frls-house-wire_600-Photoroom.png",
    color: "#F8CB46",
    tag: "Fire Resistant",
  },
];

/**
 * 2028 Pure CSS 3D Revolving Material Showcase Cube.
 * Uses perspective, preserve-3d, rotateX/Y/Z, and translateZ for true hardware-accelerated 3D geometry.
 */
export function Cube3D() {
  const [activeFace, setActiveFace] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [manualRotation, setManualRotation] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop subtle pointer parallax tilt on the 3D scene
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setManualRotation({
      x: -py * 24,
      y: px * 32,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setManualRotation(null);
    setIsHovered(false);
  }, []);

  // Update active face indicator periodically
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveFace((prev) => (prev + 1) % CUBE_FACES.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Cube half-dimension: 60px on mobile, 75px on desktop
  // Half of cube width (120px / 2 = 60px, 150px / 2 = 75px)
  const tzSm = 60;
  const tzLg = 75;

  const currentFace = CUBE_FACES[activeFace];

  return (
    <div className="relative flex flex-col items-center">
      {/* 3D Scene Viewport */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={handlePointerLeave}
        className="cube-3d-scene relative h-[150px] w-[150px] sm:h-[180px] sm:w-[180px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {/* Ambient 3D Ground Shadow Ring */}
        <div
          aria-hidden="true"
          className="absolute -bottom-6 w-36 h-10 sm:w-44 sm:h-12 rounded-full bg-black/40 blur-xl transition-all duration-500 scale-90"
        />

        {/* The 3D Cube Container */}
        <div
          className={`cube-3d-box relative h-[120px] w-[120px] sm:h-[150px] sm:w-[150px] ${
            isHovered ? "scale-105" : ""
          }`}
          style={{
            transform: manualRotation
              ? `rotateX(${manualRotation.x}deg) rotateY(${manualRotation.y}deg)`
              : undefined,
          }}
        >
          {/* Face 1: FRONT (Ambuja Cement) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateY(0deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#2D1B69]/10 px-2 py-0.5 text-tiny font-black text-[#2D1B69]">
                {CUBE_FACES[0].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#7CB518]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[0].image}
                alt={CUBE_FACES[0].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[0].tag}
            </span>
          </div>

          {/* Face 2: BACK (Asian Paints) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateY(180deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#7CB518]/15 px-2 py-0.5 text-tiny font-black text-[#5A8010]">
                {CUBE_FACES[1].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#7CB518]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[1].image}
                alt={CUBE_FACES[1].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[1].tag}
            </span>
          </div>

          {/* Face 3: RIGHT (Philips Lighting) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateY(90deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#00BCD4]/15 px-2 py-0.5 text-tiny font-black text-[#00838F]">
                {CUBE_FACES[2].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#00BCD4]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[2].image}
                alt={CUBE_FACES[2].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[2].tag}
            </span>
          </div>

          {/* Face 4: LEFT (Dr. Fixit Tiling) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateY(-90deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#E91E63]/15 px-2 py-0.5 text-tiny font-black text-[#AD1457]">
                {CUBE_FACES[3].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#E91E63]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[3].image}
                alt={CUBE_FACES[3].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[3].tag}
            </span>
          </div>

          {/* Face 5: TOP (Designer Granite Tiles) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateX(90deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#2D1B69]/10 px-2 py-0.5 text-tiny font-black text-[#2D1B69]">
                {CUBE_FACES[4].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#2D1B69]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[4].image}
                alt={CUBE_FACES[4].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[4].tag}
            </span>
          </div>

          {/* Face 6: BOTTOM (Havells Electrical Wire) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 p-2 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between backface-hidden specular-sheen"
            style={{
              transform: `rotateX(-90deg) translateZ(${tzLg}px)`,
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[#F8CB46]/20 px-2 py-0.5 text-tiny font-black text-[#B45309]">
                {CUBE_FACES[5].category}
              </span>
              <Sparkles className="h-3 w-3 text-[#F8CB46]" />
            </div>
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 my-auto">
              <Image
                src={CUBE_FACES[5].image}
                alt={CUBE_FACES[5].name}
                width={80}
                height={80}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <span className="text-tiny font-black text-[#150726] truncate max-w-full">
              {CUBE_FACES[5].tag}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3D HUD Badge */}
      <div className="mt-2 flex items-center gap-1.5 rounded-full bg-[#150726]/90 border border-white/20 px-3 py-1 shadow-glass-specular backdrop-blur-md">
        <Box className="h-3 w-3 text-[#00BCD4] animate-spin" style={{ animationDuration: "8s" }} />
        <Link
          href={`/products?category=${currentFace.slug}`}
          className="text-tiny font-black text-white hover:text-[#7CB518] transition-colors flex items-center gap-1 uppercase tracking-wider"
        >
          <span>3D {currentFace.category}</span>
          <span className="text-[#F8CB46]">· {currentFace.tag}</span>
        </Link>
      </div>
    </div>
  );
}
