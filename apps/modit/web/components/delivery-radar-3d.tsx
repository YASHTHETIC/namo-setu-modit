"use client";

import React, { useEffect, useState } from "react";
import { Truck, MapPin, Warehouse, Zap, CheckCircle2, ShieldCheck, Navigation } from "lucide-react";

interface DeliveryRadar3DProps {
  status: string;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  deliveryNumber?: string;
}

export function DeliveryRadar3D({
  status,
  distanceKm,
  etaMinutes,
  deliveryNumber,
}: DeliveryRadar3DProps) {
  const isDelivered = status === "delivered";
  const [pulse, setPulse] = useState(0);

  // Smooth transit animation position (0 to 1 along route)
  const [transitProgress, setTransitProgress] = useState(0.55);

  useEffect(() => {
    if (isDelivered) {
      setTransitProgress(1);
      return;
    }
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
      setTransitProgress((prev) => {
        const next = prev + 0.002;
        return next > 0.9 ? 0.2 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isDelivered]);

  // Coordinates along curved path from (x: 40, y: 150) to (x: 260, y: 50)
  // Parametric bezier interpolation: P(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const p0 = { x: 45, y: 145 };
  const p1 = { x: 140, y: 160 }; // curve control point
  const p2 = { x: 255, y: 55 };

  const t = Math.min(Math.max(transitProgress, 0.05), 0.95);
  const curX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const curY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b0318] via-[#150726] to-[#0b0318] border border-white/10 p-4 shadow-glass-elevated">
      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#00BCD4]/15 border border-[#00BCD4]/30 flex items-center justify-center">
            <Navigation className="h-3.5 w-3.5 text-[#00BCD4] animate-spin-slow" />
          </div>
          <div>
            <span className="text-micro font-black tracking-wider text-[#00BCD4] uppercase">
              2028 GPS Telemetry Radar
            </span>
            <p className="text-tiny font-bold text-white/90">
              {deliveryNumber ? `Unit #${deliveryNumber}` : "Express Fleet Link"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7CB518]" />
          </span>
          <span className="text-micro font-bold text-[#7CB518]">
            {isDelivered ? "DELIVERED" : "LIVE RADAR"}
          </span>
        </div>
      </div>

      {/* 3D Isometric Radar Grid Canvas */}
      <div className="relative h-48 w-full overflow-hidden my-2 flex items-center justify-center perspective-800">
        <div
          className="relative w-[300px] h-[200px] transform-3d transition-transform duration-700 select-none"
          style={{
            transform: "rotateX(52deg) rotateZ(-20deg) scale(0.95)",
          }}
        >
          {/* Cyber Isometric Floor Grid */}
          <div className="absolute inset-0 rounded-2xl border border-[#00BCD4]/25 bg-[#150726]/60 backdrop-blur-xs shadow-[0_0_30px_rgba(0,188,212,0.15)]">
            <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00BCD4" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7CB518" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#00BCD4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F8CB46" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#radarGrid)" />

              {/* Concentric radar rings centered on truck */}
              <circle cx={curX} cy={curY} r="18" fill="none" stroke="#00BCD4" strokeWidth="0.75" strokeDasharray="3 3" className="animate-spin-slow" />
              <circle cx={curX} cy={curY} r="35" fill="none" stroke="#00BCD4" strokeWidth="0.5" opacity="0.5" />

              {/* Transit route spline */}
              <path
                d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
            </svg>
          </div>

          {/* Point A: MODIT Warehouse Hub */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${p0.x}px`, top: `${p0.y}px` }}
          >
            <div className="h-8 w-8 rounded-xl bg-[#2D1B69] border border-[#7CB518] shadow-cyber-green flex items-center justify-center text-white">
              <Warehouse className="h-4 w-4 text-[#7CB518]" />
            </div>
            <span className="mt-1 px-1.5 py-0.5 rounded text-micro font-bold bg-[#0b0318]/90 text-white border border-white/10 whitespace-nowrap">
              Hub #04
            </span>
          </div>

          {/* Point B: Destination Jobsite */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${p2.x}px`, top: `${p2.y}px` }}
          >
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-[#00BCD4]/40 animate-ping" />
              <div className="relative h-8 w-8 rounded-full bg-[#00BCD4] border-2 border-white shadow-cyber-cyan flex items-center justify-center text-[#150726]">
                <MapPin className="h-4 w-4 fill-current" />
              </div>
            </div>
            <span className="mt-1 px-1.5 py-0.5 rounded text-micro font-bold bg-[#0b0318]/90 text-[#00BCD4] border border-[#00BCD4]/30 whitespace-nowrap">
              Your Site
            </span>
          </div>

          {/* Moving 3D Vehicle Node */}
          {!isDelivered && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-200"
              style={{
                left: `${curX}px`,
                top: `${curY}px`,
                transform: "translate(-50%, -50%) translateZ(12px)",
              }}
            >
              <div className="relative">
                <span className="absolute -inset-2 rounded-xl bg-[#7CB518]/30 animate-pulse" />
                <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7CB518] to-[#5A8010] border-2 border-white text-white shadow-[0_0_15px_rgba(124,181,24,0.7)] flex items-center justify-center">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <span className="mt-1 px-1.5 py-0.2 rounded text-micro font-black bg-[#7CB518] text-white shadow-xs whitespace-nowrap">
                {distanceKm ? `${distanceKm} km` : "En Route"}
              </span>
            </div>
          )}

          {/* If delivered, show delivery stamp */}
          {isDelivered && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{
                left: `${p2.x}px`,
                top: `${p2.y - 12}px`,
                transform: "translate(-50%, -50%) translateZ(15px)",
              }}
            >
              <div className="h-10 w-10 rounded-full bg-[#7CB518] border-2 border-white text-white shadow-cyber-green flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Metrics Strip */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
        <div className="rounded-xl bg-white/5 p-2 border border-white/5">
          <p className="text-micro font-bold text-white/50 uppercase">Distance</p>
          <p className="text-body-sm font-black text-white">
            {isDelivered ? "0 km" : distanceKm ? `${distanceKm} km` : "2.4 km"}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-2 border border-white/5">
          <p className="text-micro font-bold text-white/50 uppercase">Est. Arrival</p>
          <p className="text-body-sm font-black text-[#7CB518]">
            {isDelivered ? "Delivered" : etaMinutes ? `~${etaMinutes} min` : "45 min"}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-2 border border-white/5">
          <p className="text-micro font-bold text-white/50 uppercase">Telemetry</p>
          <p className="text-body-sm font-black text-[#00BCD4] flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" />
            <span>5G Mesh</span>
          </p>
        </div>
      </div>
    </div>
  );
}
