"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Eye, RotateCw, Maximize2, Sparkles, Layers, Box, Grid3X3, Ruler } from "lucide-react";

interface Calculator3DPreviewProps {
  tab: "paint" | "tiles" | "concrete" | "steel";
  // Paint
  area?: number;
  height?: number;
  coats?: number;
  wallOnly?: boolean;
  primerLitres?: number;
  // Tiles
  tileArea?: number;
  tileLen?: number;
  tileWid?: number;
  tilesCount?: number;
  wastage?: number;
  // Concrete
  slabL?: number;
  slabW?: number;
  slabT?: number;
  grade?: string;
  volumeCuM?: number;
  cementBags?: number;
  // Steel
  steelDia?: number;
  steelLen?: number;
  weightPerMeter?: number;
  totalWeightKg?: number;
}

export function Calculator3DPreview({
  tab,
  area = 120,
  height = 10,
  coats = 2,
  wallOnly = true,
  primerLitres = 4,
  tileArea = 100,
  tileLen = 24,
  tileWid = 24,
  tilesCount = 28,
  wastage = 10,
  slabL = 10,
  slabW = 10,
  slabT = 4,
  grade = "M20",
  volumeCuM = 0.94,
  cementBags = 8,
  steelDia = 12,
  steelLen = 48,
  weightPerMeter = 0.888,
  totalWeightKg = 42.6,
}: Calculator3DPreviewProps) {
  // Interactive rotation tracking
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(-35);
  const [autoRotate, setAutoRotate] = useState(true);
  const isDraggingRef = useRef(false);
  const lastCoordRef = useRef({ x: 0, y: 0 });

  // Reset angle to default isometric
  const handleResetAngle = () => {
    setRotX(25);
    setRotY(-35);
  };

  // Subtle orbital auto-rotation when user isn't interacting
  useEffect(() => {
    if (!autoRotate) return;
    let animId: number;
    const loop = () => {
      setRotY((prev) => (prev + 0.25) % 360);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastCoordRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastCoordRef.current.x;
    const deltaY = e.clientY - lastCoordRef.current.y;
    lastCoordRef.current = { x: e.clientX, y: e.clientY };

    setRotY((y) => y + deltaX * 0.6);
    setRotX((x) => Math.max(-10, Math.min(75, x - deltaY * 0.6)));
  }, []);

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  // Room side length approximation: sqrt(area)
  const roomSide = Math.round(Math.sqrt(area));

  return (
    <div className="card-2028 specular-sheen rounded-2xl border border-[#DDD6EE] bg-gradient-to-b from-white to-[#F8F6FC] p-4 shadow-sm overflow-hidden select-none">
      {/* 3D Viewport Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DDD6EE]/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#2D1B69]/10 border border-[#2D1B69]/20 flex items-center justify-center text-[#2D1B69]">
            {tab === "paint" && <Box className="h-4 w-4 text-[#2D1B69]" />}
            {tab === "tiles" && <Grid3X3 className="h-4 w-4 text-[#2D1B69]" />}
            {tab === "concrete" && <Layers className="h-4 w-4 text-[#2D1B69]" />}
            {tab === "steel" && <Ruler className="h-4 w-4 text-[#2D1B69]" />}
          </div>
          <div>
            <h4 className="text-body-sm font-extrabold text-[#150726] flex items-center gap-1.5">
              <span>3D Real-Time Spatial Dimension Model</span>
              <span className="text-micro font-bold bg-[#7CB518]/15 text-[#5A8010] px-2 py-0.5 rounded-full border border-[#7CB518]/30">
                Interactive
              </span>
            </h4>
            <p className="text-micro text-[#9B8CB5]">Drag to orbit 360° · Precision isometric view</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all cursor-pointer ${
              autoRotate
                ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                : "bg-white text-[#9B8CB5] border-[#DDD6EE] hover:text-[#150726]"
            }`}
            title="Toggle orbit rotation"
          >
            {autoRotate ? "Orbiting" : "Paused"}
          </button>
          <button
            type="button"
            onClick={handleResetAngle}
            className="p-1 rounded-lg bg-white border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#150726] hover:bg-[#F0ECF9] transition-all cursor-pointer"
            title="Reset isometric angle"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div
        className="relative h-56 w-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden perspective-1000"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Holographic background cyber grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2D1B69_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 3D Scene Root */}
        <div
          className="relative transform-3d transition-transform duration-75"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* TAB 1: PAINT — 3D Cutaway Architectural Room Box */}
          {tab === "paint" && (
            <div className="relative w-40 h-32 transform-3d">
              {/* Floor Surface */}
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-tr from-[#DDD6EE] to-[#F0ECF9] border border-[#2D1B69]/30 shadow-inner flex items-center justify-center"
                style={{
                  transform: "rotateX(90deg) translateZ(64px)",
                }}
              >
                <div className="text-micro font-bold text-[#2D1B69]/60">
                  {roomSide} ft × {roomSide} ft Floor
                </div>
              </div>

              {/* Back Wall */}
              <div
                className="absolute inset-0 rounded-lg border border-[#2D1B69]/40 flex flex-col items-center justify-center transition-colors duration-300 shadow-sm"
                style={{
                  transform: "translateZ(-80px)",
                  backgroundColor:
                    coats === 1
                      ? "rgba(124, 181, 24, 0.20)"
                      : coats === 2
                      ? "rgba(124, 181, 24, 0.40)"
                      : "rgba(124, 181, 24, 0.65)",
                }}
              >
                <span className="text-micro font-extrabold text-[#150726] bg-white/80 px-2 py-0.5 rounded shadow-xs">
                  Back Wall · {coats} Coats
                </span>
                <span className="text-micro text-[#150726]/70 mt-1 font-bold">
                  H: {height} ft
                </span>
              </div>

              {/* Left Wall */}
              <div
                className="absolute inset-0 rounded-lg border border-[#2D1B69]/40 flex items-center justify-center transition-colors duration-300"
                style={{
                  transform: "rotateY(90deg) translateZ(-80px)",
                  backgroundColor:
                    coats === 1
                      ? "rgba(0, 188, 212, 0.15)"
                      : coats === 2
                      ? "rgba(0, 188, 212, 0.35)"
                      : "rgba(0, 188, 212, 0.55)",
                }}
              >
                <span className="text-micro font-extrabold text-[#150726] bg-white/80 px-2 py-0.5 rounded shadow-xs rotate-90">
                  Left Wall
                </span>
              </div>

              {/* Right Wall */}
              <div
                className="absolute inset-0 rounded-lg border border-[#2D1B69]/40 flex items-center justify-center transition-colors duration-300"
                style={{
                  transform: "rotateY(90deg) translateZ(80px)",
                  backgroundColor:
                    coats === 1
                      ? "rgba(0, 188, 212, 0.15)"
                      : coats === 2
                      ? "rgba(0, 188, 212, 0.35)"
                      : "rgba(0, 188, 212, 0.55)",
                }}
              >
                <span className="text-micro font-extrabold text-[#150726] bg-white/80 px-2 py-0.5 rounded shadow-xs -rotate-90">
                  Right Wall
                </span>
              </div>

              {/* Optional Ceiling Plane */}
              {!wallOnly && (
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-tr from-[#F8CB46]/20 to-[#F8CB46]/40 border border-[#F8CB46]/50 border-dashed flex items-center justify-center"
                  style={{
                    transform: "rotateX(90deg) translateZ(-64px)",
                  }}
                >
                  <span className="text-micro font-extrabold text-[#150726] bg-white/90 px-1.5 py-0.5 rounded">
                    Ceiling Included
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TILES — 3D Tiled Floor Grid with Real Spacing */}
          {tab === "tiles" && (
            <div
              className="relative w-44 h-44 rounded-xl bg-white border-2 border-[#2D1B69] p-1 shadow-xl transform-3d"
              style={{
                transform: "rotateX(55deg) translateZ(10px)",
              }}
            >
              {/* Tile grid subdivisions */}
              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1 p-1 bg-[#DDD6EE]/60 rounded-lg">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded bg-gradient-to-tr from-white to-[#F0ECF9] border border-[#2D1B69]/20 shadow-xs flex items-center justify-center hover:bg-[#7CB518]/20 transition-colors"
                  >
                    <span className="text-micro text-[#2D1B69]/60 font-semibold">{tileLen}&quot;</span>
                  </div>
                ))}
              </div>

              {/* Floating Tile Count Badge in 3D */}
              <div
                className="absolute -top-6 -right-6 pointer-events-none"
                style={{ transform: "translateZ(30px) rotateX(-55deg)" }}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[#7CB518] px-2.5 py-1 text-micro font-black text-white shadow-cyber-green">
                  <Sparkles className="h-3 w-3" />
                  {tilesCount} Tiles · +{wastage}% Waste
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CONCRETE — 3D Slab Prism */}
          {tab === "concrete" && (
            <div className="relative w-40 h-28 transform-3d">
              {/* Slab Top Face */}
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-tr from-[#9B8CB5] to-[#C9B8E8] border border-[#2D1B69]/50 shadow-md flex flex-col items-center justify-center p-2"
                style={{ transform: "rotateX(60deg) translateZ(30px)" }}
              >
                <span className="text-micro font-black text-[#150726]">
                  {slabL} ft × {slabW} ft Slab
                </span>
                <span className="text-micro font-bold text-[#2D1B69] bg-white/70 px-2 py-0.5 rounded mt-0.5">
                  Grade: {grade}
                </span>
              </div>

              {/* Slab Front Thickness Edge */}
              <div
                className="absolute left-0 right-0 h-8 rounded-b-md bg-[#2D1B69] text-white border-t border-white/20 flex items-center justify-between px-3"
                style={{
                  top: "calc(50% + 22px)",
                  transform: "translateZ(20px)",
                }}
              >
                <span className="text-micro font-extrabold text-[#7CB518]">Thickness: {slabT}&quot;</span>
                <span className="text-micro text-white/80 font-bold">{volumeCuM} m³</span>
              </div>
            </div>
          )}

          {/* TAB 4: STEEL — 3D TMT Rebar Cylinder */}
          {tab === "steel" && (
            <div
              className="relative w-44 h-12 rounded-full bg-gradient-to-r from-[#150726] via-[#9B8CB5] to-[#150726] border-2 border-white/40 shadow-xl flex items-center justify-between px-4 transform-3d"
              style={{
                transform: "rotateZ(-15deg) rotateX(40deg) translateZ(15px)",
              }}
            >
              {/* Ribbed textured lines across bar */}
              <div className="absolute inset-0 rounded-full flex justify-around items-center opacity-30 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-full w-1 bg-white" />
                ))}
              </div>
              <span className="relative z-10 text-micro font-black text-white bg-[#0b0318]/80 px-2 py-0.5 rounded border border-white/10">
                Ø {steelDia} mm Fe-550D
              </span>
              <span className="relative z-10 text-micro font-bold text-[#F8CB46] bg-[#0b0318]/80 px-2 py-0.5 rounded border border-white/10">
                {steelLen} m Bar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Live Dimension Telemetry Readout */}
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#DDD6EE]/60 pt-3 text-center">
        {tab === "paint" && (
          <>
            <div className="rounded-xl bg-[#F0ECF9] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Est. Primer</span>
              <span className="text-body-sm font-black text-[#2D1B69]">~{primerLitres} L</span>
            </div>
            <div className="rounded-xl bg-[#F0F9E8] p-2">
              <span className="text-micro font-bold text-[#5A8010] block uppercase">Coat Finish</span>
              <span className="text-body-sm font-black text-[#7CB518]">{coats} Layers</span>
            </div>
            <div className="rounded-xl bg-white border border-[#DDD6EE] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Total Area</span>
              <span className="text-body-sm font-black text-[#150726]">{area} sq ft</span>
            </div>
          </>
        )}

        {tab === "tiles" && (
          <>
            <div className="rounded-xl bg-[#F0ECF9] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Tile Size</span>
              <span className="text-body-sm font-black text-[#2D1B69]">{tileLen}&quot; × {tileWid}&quot;</span>
            </div>
            <div className="rounded-xl bg-[#F0F9E8] p-2">
              <span className="text-micro font-bold text-[#5A8010] block uppercase">Total Required</span>
              <span className="text-body-sm font-black text-[#7CB518]">{tilesCount} Tiles</span>
            </div>
            <div className="rounded-xl bg-white border border-[#DDD6EE] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Waste Added</span>
              <span className="text-body-sm font-black text-[#150726]">+{wastage}%</span>
            </div>
          </>
        )}

        {tab === "concrete" && (
          <>
            <div className="rounded-xl bg-[#F0ECF9] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Volume</span>
              <span className="text-body-sm font-black text-[#2D1B69]">{volumeCuM} m³</span>
            </div>
            <div className="rounded-xl bg-[#F0F9E8] p-2">
              <span className="text-micro font-bold text-[#5A8010] block uppercase">Cement Needed</span>
              <span className="text-body-sm font-black text-[#7CB518]">{cementBags} Bags</span>
            </div>
            <div className="rounded-xl bg-white border border-[#DDD6EE] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Slab Matrix</span>
              <span className="text-body-sm font-black text-[#150726]">{slabT}&quot; Depth</span>
            </div>
          </>
        )}

        {tab === "steel" && (
          <>
            <div className="rounded-xl bg-[#F0ECF9] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Unit Mass</span>
              <span className="text-body-sm font-black text-[#2D1B69]">{weightPerMeter} kg/m</span>
            </div>
            <div className="rounded-xl bg-[#F0F9E8] p-2">
              <span className="text-micro font-bold text-[#5A8010] block uppercase">Total Weight</span>
              <span className="text-body-sm font-black text-[#7CB518]">{totalWeightKg} kg</span>
            </div>
            <div className="rounded-xl bg-white border border-[#DDD6EE] p-2">
              <span className="text-micro font-bold text-[#9B8CB5] block uppercase">Length</span>
              <span className="text-body-sm font-black text-[#150726]">{steelLen} m</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
