"use client";

import React, { useState, useMemo } from "react";
import { Truck, ShieldCheck, Weight, Navigation, Zap, CheckCircle2, ChevronRight, Scale, AlertCircle } from "lucide-react";

interface Truckload3DSimulatorProps {
  initialBags?: number;
  initialSteelKg?: number;
  className?: string;
  onSelectFleet?: (fleetName: string) => void;
}

interface FleetTier {
  id: string;
  name: string;
  category: string;
  maxPayloadKg: number;
  wheelCount: number;
  transitSpeed: string;
  clearance: string;
  color: string;
}

const FLEET_TIERS: FleetTier[] = [
  {
    id: "mini",
    name: "Tata Ace Mini Fleet",
    category: "Last-Mile Rapid Courier",
    maxPayloadKg: 1200,
    wheelCount: 4,
    transitSpeed: "45-60 min",
    clearance: "Narrow Alley Access (6ft)",
    color: "#7CB518",
  },
  {
    id: "pickup",
    name: "Bolero Maxi Commercial",
    category: "Medium Site Shifter",
    maxPayloadKg: 3500,
    wheelCount: 4,
    transitSpeed: "60-90 min",
    clearance: "Standard Urban Gate (10ft)",
    color: "#00BCD4",
  },
  {
    id: "eicher",
    name: "Eicher Pro 6-Wheeler",
    category: "Heavy Commercial Transit",
    maxPayloadKg: 9500,
    wheelCount: 6,
    transitSpeed: "90-120 min",
    clearance: "Arterial Road Ready (14ft)",
    color: "#F8CB46",
  },
  {
    id: "hauler",
    name: "BharatBenz Multi-Axle Hauler",
    category: "Bulk Mill Direct Dispatch",
    maxPayloadKg: 25000,
    wheelCount: 10,
    transitSpeed: "Scheduled Batch Delivery",
    clearance: "Highway & Major Sites (20ft)",
    color: "#E91E63",
  },
];

export function Truckload3DSimulator({
  initialBags = 40,
  initialSteelKg = 500,
  className = "",
  onSelectFleet,
}: Truckload3DSimulatorProps) {
  const [cementBags, setCementBags] = useState<number>(initialBags);
  const [steelKg, setSteelKg] = useState<number>(initialSteelKg);
  const [tileBoxes, setTileBoxes] = useState<number>(15);
  const [manualFleet, setManualFleet] = useState<string | null>(null);

  // Payload computation
  // Cement: 50 kg per bag, Tiles: 22 kg per box, Steel: kg
  const totalWeightKg = useMemo(() => {
    return Math.round(cementBags * 50 + steelKg + tileBoxes * 22);
  }, [cementBags, steelKg, tileBoxes]);

  const totalMetricTons = (totalWeightKg / 1000).toFixed(2);

  // Auto-recommended fleet tier based on total mass
  const autoTier = useMemo(() => {
    if (totalWeightKg <= 1200) return FLEET_TIERS[0];
    if (totalWeightKg <= 3500) return FLEET_TIERS[1];
    if (totalWeightKg <= 9500) return FLEET_TIERS[2];
    return FLEET_TIERS[3];
  }, [totalWeightKg]);

  const activeTier = manualFleet
    ? FLEET_TIERS.find((f) => f.id === manualFleet) || autoTier
    : autoTier;

  const loadPercentage = Math.min(
    100,
    Math.round((totalWeightKg / activeTier.maxPayloadKg) * 100)
  );

  const isOverload = totalWeightKg > activeTier.maxPayloadKg;

  return (
    <div
      className={`card-2028 specular-sheen rounded-3xl border border-white/15 bg-gradient-to-b from-[#0b0318] via-[#150726] to-[#0b0318] p-5 sm:p-6 shadow-[0_20px_50px_rgba(21,7,38,0.6)] text-white overflow-hidden relative ${className}`}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: activeTier.color }}
      />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#00BCD4]/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#7CB518]/15 border border-[#7CB518]/30 flex items-center justify-center text-[#7CB518] shadow-cyber-green">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-micro font-black tracking-wider text-[#7CB518] uppercase">
              2028 Smart Logistics Engine
            </span>
            <h3 className="text-title-md font-black tracking-tight text-white flex items-center gap-2">
              <span>3D Fleet &amp; Truckload Simulator</span>
              <span className="text-tiny font-extrabold bg-white/10 text-[#00BCD4] px-2 py-0.5 rounded-full border border-[#00BCD4]/30">
                MoRTH Compliant
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-caption font-extrabold text-white/70">Total Mass:</span>
          <span className="text-title-md font-black text-[#F8CB46] tabular-nums">
            {totalMetricTons} T
          </span>
          <span className="text-micro font-bold text-white/50">({totalWeightKg.toLocaleString("en-IN")} kg)</span>
        </div>
      </div>

      {/* Interactive Controls & Payload Steppers */}
      <div className="relative z-10 my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cement Bags */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-micro font-extrabold uppercase text-white/70">Cement (50kg)</span>
            <span className="text-caption font-black text-[#7CB518]">{cementBags * 50} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={cementBags}
              onChange={(e) => setCementBags(Number(e.target.value))}
              className="w-full accent-[#7CB518] cursor-pointer"
            />
            <span className="text-body-sm font-black w-10 text-right tabular-nums">{cementBags}</span>
          </div>
        </div>

        {/* Steel TMT */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-micro font-extrabold uppercase text-white/70">Fe-550D Steel</span>
            <span className="text-caption font-black text-[#00BCD4]">{steelKg} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={steelKg}
              onChange={(e) => setSteelKg(Number(e.target.value))}
              className="w-full accent-[#00BCD4] cursor-pointer"
            />
            <span className="text-body-sm font-black w-14 text-right tabular-nums">{steelKg}</span>
          </div>
        </div>

        {/* Tiles Boxes */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-micro font-extrabold uppercase text-white/70">Tiles (22kg box)</span>
            <span className="text-caption font-black text-[#F8CB46]">{tileBoxes * 22} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={tileBoxes}
              onChange={(e) => setTileBoxes(Number(e.target.value))}
              className="w-full accent-[#F8CB46] cursor-pointer"
            />
            <span className="text-body-sm font-black w-10 text-right tabular-nums">{tileBoxes}</span>
          </div>
        </div>
      </div>

      {/* 3D Isometric Truck Wireframe Stage */}
      <div className="relative z-10 my-4 h-52 w-full rounded-2xl bg-[#150726]/60 border border-white/10 p-4 flex items-center justify-center overflow-hidden perspective-800">
        {/* Holographic grid ground */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#00BCD4_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 3D Truck Model Container */}
        <div
          className="relative w-64 h-32 transform-3d transition-transform duration-500 select-none"
          style={{ transform: "rotateX(54deg) rotateZ(-22deg) scale(1.05)" }}
        >
          {/* Truck Cargo Bed Base Plate */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#2D1B69] via-[#150726] to-[#0b0318] border-2 border-white/30 shadow-[0_0_30px_rgba(0,188,212,0.3)] flex items-center justify-center">
            {/* Cargo Payload Grid / Physical Stack */}
            <div
              className="relative w-40 h-24 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all duration-500"
              style={{
                backgroundColor: isOverload ? "rgba(233,30,99,0.35)" : "rgba(124,181,24,0.25)",
                borderColor: isOverload ? "#E91E63" : "#7CB518",
                transform: `translateZ(${Math.max(10, Math.min(36, loadPercentage * 0.36))}px)`,
              }}
            >
              <span className="text-micro font-black text-white px-2 py-0.5 rounded bg-black/60 border border-white/20">
                Payload Stack: {loadPercentage}%
              </span>
              <span className="text-micro font-bold text-[#F8CB46] mt-1">
                {totalWeightKg} kg
              </span>
            </div>
          </div>

          {/* Front Driver Cabin (3D Pop) */}
          <div
            className="absolute -left-12 top-2 w-12 h-20 rounded-l-2xl bg-gradient-to-r from-[#7CB518] to-[#5A8010] border border-white/40 shadow-cyber-green flex items-center justify-center text-white"
            style={{ transform: "translateZ(20px)" }}
          >
            {/* Windshield */}
            <div className="w-8 h-12 rounded-l-lg bg-[#00BCD4]/50 border border-white/40 shadow-inner" />
          </div>

          {/* Left Headlight Laser Beam */}
          <div
            className="absolute -left-24 top-4 w-12 h-4 bg-gradient-to-l from-[#F8CB46] to-transparent opacity-80 blur-xs rounded-full pointer-events-none"
            style={{ transform: "translateZ(10px)" }}
          />

          {/* Axle Wheels (Floating 3D Cylinders) */}
          <div
            className="absolute -bottom-3 left-2 w-6 h-6 rounded-full bg-black border-2 border-white/40 shadow-md"
            style={{ transform: "rotateX(90deg) translateZ(8px)" }}
          />
          <div
            className="absolute -bottom-3 right-6 w-6 h-6 rounded-full bg-black border-2 border-white/40 shadow-md"
            style={{ transform: "rotateX(90deg) translateZ(8px)" }}
          />
        </div>

        {/* Load Status Overlay Card */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
              isOverload
                ? "bg-[#E91E63]/20 border-[#E91E63] text-[#E91E63]"
                : "bg-[#7CB518]/20 border-[#7CB518] text-[#7CB518]"
            }`}
          >
            {isOverload ? <AlertCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <span className="text-tiny font-black uppercase tracking-wider">
              {isOverload ? "Overload Alert — Select Larger Fleet" : "Optimal Axle Weight"}
            </span>
          </div>
          <span className="text-micro text-white/70 mt-1 font-bold">
            Max Limit: {activeTier.maxPayloadKg.toLocaleString("en-IN")} kg
          </span>
        </div>
      </div>

      {/* Fleet Recommendation Selector */}
      <div className="relative z-10 pt-2 border-t border-white/10">
        <p className="text-micro font-extrabold uppercase text-white/50 mb-2.5">
          Select Vehicle Category:
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {FLEET_TIERS.map((tier) => {
            const isSelected = activeTier.id === tier.id;
            const fits = totalWeightKg <= tier.maxPayloadKg;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setManualFleet(tier.id);
                  onSelectFleet?.(tier.name);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "bg-white/15 border-white shadow-cyber-green scale-102"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                {isSelected && (
                  <span
                    className="absolute top-0 right-0 w-2 h-full"
                    style={{ backgroundColor: tier.color }}
                  />
                )}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-tiny font-black text-white truncate">{tier.name}</span>
                  {tier.id === autoTier.id && (
                    <span className="text-tiny font-black bg-[#7CB518] text-white px-1.5 py-0.2 rounded shadow-xs">
                      Best Fit
                    </span>
                  )}
                </div>
                <p className="text-micro text-white/70 line-clamp-1">{tier.category}</p>
                <div className="mt-2 flex items-center justify-between text-micro font-extrabold">
                  <span className={fits ? "text-[#7CB518]" : "text-[#E91E63]"}>
                    Cap: {(tier.maxPayloadKg / 1000).toFixed(1)}T
                  </span>
                  <span className="text-white/60">{tier.transitSpeed}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
