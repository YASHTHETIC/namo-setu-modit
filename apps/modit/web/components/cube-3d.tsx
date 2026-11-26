"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Box, RotateCw, CheckCircle2 } from "lucide-react";

interface CubeFace {
  name: string;
  category: string;
  slug: string;
  image: string;
  color: string;
  tag: string;
  rotX: number;
  rotY: number;
  specs: {
    primary: string;
    secondary: string;
    metric: string;
  };
}

const CUBE_FACES: CubeFace[] = [
  {
    name: "Ambuja Cement",
    category: "Cement",
    slug: "cement",
    image: "/products/cement/Ambuja Cement.png",
    color: "#2D1B69",
    tag: "High Grade",
    rotX: 0,
    rotY: 0,
    specs: {
      primary: "IS 1489 · 53 Grade OPC",
      secondary: "High early compressive strength",
      metric: "53 MPa @ 28d",
    },
  },
  {
    name: "Asian Paints",
    category: "Painting",
    slug: "painting",
    image: "/products/painting/Asian Paint.png",
    color: "#7CB518",
    tag: "Weatherproof",
    rotX: 0,
    rotY: 180,
    specs: {
      primary: "Tractor Acrylic Emulsion",
      secondary: "Smooth eggshell matt finish",
      metric: "140 sq.ft/L",
    },
  },
  {
    name: "Philips AstraSpot",
    category: "Lighting",
    slug: "lighting",
    image: "/products/lighting/Philips AstraSpot Next LED COB light.webp",
    color: "#00BCD4",
    tag: "COB LED",
    rotX: 0,
    rotY: -90,
    specs: {
      primary: "COB LED Deep Recessed",
      secondary: "EyeComfort low glare CRI > 85",
      metric: "1800 Lumens",
    },
  },
  {
    name: "Dr. Fixit 101",
    category: "Tiling",
    slug: "tiling",
    image: "/products/tiling/Dr Fixit.png",
    color: "#E91E63",
    tag: "Waterproof",
    rotX: 0,
    rotY: 90,
    specs: {
      primary: "LW+ Waterproofing Integral",
      secondary: "Corrosion inhibitor & plasticity",
      metric: "200ml / bag",
    },
  },
  {
    name: "Designer Granite",
    category: "Tiles",
    slug: "tiles",
    image: "/products/tiles/Blue-Granite.png",
    color: "#2D1B69",
    tag: "Premium",
    rotX: -90,
    rotY: 0,
    specs: {
      primary: "Royal Blue Mirror Granite",
      secondary: "Pre-polished heavy architectural slab",
      metric: "2.65 g/cm³",
    },
  },
  {
    name: "Havells FRLS Wire",
    category: "Electrical",
    slug: "electrical",
    image: "/products/electrical/0020082_havells-25-sq-mm-180-mtr-frls-house-wire_600-Photoroom.png",
    color: "#F8CB46",
    tag: "Fire Resistant",
    rotX: 90,
    rotY: 0,
    specs: {
      primary: "FRLS Flame Retardant Low Smoke",
      secondary: "99.97% pure electrolytic copper",
      metric: "1100V Rated",
    },
  },
];

/**
 * 2028 Pure CSS 3D Revolving Material Showcase Cube.
 * Features 360 orbital auto-spin, pointer parallax, touch-swipe gestures,
 * interactive face-snap selection, holographic orbital rings, and real-time engineering telemetry HUD.
 */
export function Cube3D() {
  const [activeFace, setActiveFace] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [manualRotation, setManualRotation] = useState<{ x: number; y: number } | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop subtle pointer parallax tilt on the 3D scene
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || isSnapping) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setManualRotation({
      x: -py * 24,
      y: px * 32,
    });
  }, [isSnapping]);

  const handlePointerLeave = useCallback(() => {
    if (!isSnapping) {
      setManualRotation(null);
    }
    setIsHovered(false);
  }, [isSnapping]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchRotRef = useRef<{ x: number; y: number }>({ x: -14, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovered(true);
    setIsSnapping(false);
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    setManualRotation({
      x: Math.max(-40, Math.min(40, touchRotRef.current.x - dy * 0.4)),
      y: touchRotRef.current.y + dx * 0.6,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (manualRotation) {
      touchRotRef.current = manualRotation;
    }
    setTimeout(() => setIsHovered(false), 2000);
  }, [manualRotation]);

  // Snap directly to a face when clicked
  const snapToFace = (idx: number) => {
    const face = CUBE_FACES[idx];
    setIsSnapping(true);
    setActiveFace(idx);
    setManualRotation({ x: face.rotX, y: face.rotY });
  };

  const resumeAutoOrbit = () => {
    setIsSnapping(false);
    setManualRotation(null);
  };

  // Face indicator remains stable and updates only when user interacts or clicks a chip

  // Cube half-dimension: 75px on desktop (150px / 2)
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cube-3d-scene relative h-[150px] w-[150px] sm:h-[180px] sm:w-[180px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
      >
        {/* Holographic Orbital Rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 sm:-inset-6 rounded-full border border-dashed border-[#00BCD4]/30 opacity-60 animate-spin-slow"
          style={{ transform: "rotateX(75deg) rotateZ(0deg)", animationDuration: "18s" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-8 sm:-inset-10 rounded-full border border-[#7CB518]/25 opacity-40 animate-spin-slow"
          style={{ transform: "rotateX(75deg) rotateZ(45deg)", animationDuration: "26s", animationDirection: "reverse" }}
        />

        {/* Ambient 3D Ground Shadow Ring */}
        <div
          aria-hidden="true"
          className="absolute -bottom-6 w-36 h-10 sm:w-44 sm:h-12 rounded-full bg-black/50 blur-xl transition-all duration-500 scale-90"
        />

        {/* The 3D Cube Container */}
        <div
          className={`cube-3d-box relative h-[150px] w-[150px] scale-[0.88] sm:scale-100 ${
            isHovered ? "!scale-105" : ""
          } ${isSnapping ? "transition-transform duration-700 ease-out" : ""}`}
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
                priority
                quality={85}
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
                quality={85}
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
                quality={85}
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
                quality={85}
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
                quality={85}
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
                quality={85}
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

      {/* Interactive 3D HUD & Face Snap Controls */}
      <div className="mt-2.5 flex flex-col items-center gap-1.5 w-full max-w-[290px]">
        {/* Category Snap Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {CUBE_FACES.map((face, idx) => (
            <button
              key={face.slug}
              type="button"
              onClick={() => snapToFace(idx)}
              className={`px-2 py-0.5 rounded-full text-tiny font-black transition-all cursor-pointer ${
                activeFace === idx && isSnapping
                  ? "bg-[#7CB518] text-white shadow-cyber-green scale-105"
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              {face.category}
            </button>
          ))}
          {isSnapping && (
            <button
              type="button"
              onClick={resumeAutoOrbit}
              className="p-1 rounded-full bg-[#00BCD4]/20 text-[#00BCD4] hover:bg-[#00BCD4]/30 transition-all cursor-pointer"
              title="Resume Orbit"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Real-Time Engineering Telemetry Spec HUD */}
        <div className="w-full rounded-xl bg-black/60 border border-white/15 p-2 backdrop-blur-md shadow-glass-specular flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00BCD4] shadow-[0_0_8px_#00BCD4] flex-shrink-0" />
              <span className="text-micro font-black text-white truncate">{currentFace.specs.primary}</span>
            </div>
            <p className="text-tiny text-white/70 truncate mt-0.5">{currentFace.specs.secondary}</p>
          </div>
          <Link
            href={`/products?category=${currentFace.slug}`}
            className="flex-shrink-0 text-tiny font-black text-[#F8CB46] bg-[#F8CB46]/10 hover:bg-[#F8CB46]/20 px-2 py-1 rounded border border-[#F8CB46]/30 tabular-nums transition-colors"
          >
            {currentFace.specs.metric}
          </Link>
        </div>
      </div>
    </div>
  );
}
