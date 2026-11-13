"use client";

import { useState, useMemo } from "react";
import { Palette } from "lucide-react";
import type { PaintShade } from "@/lib/product-data";

interface ShadePickerProps {
  shades: PaintShade[];
  selectedShade: string | null;
  onSelectShade: (name: string | null) => void;
  customColorCode: string;
  onCustomColorCodeChange: (code: string) => void;
}

export function ShadePicker({ shades, selectedShade, onSelectShade, customColorCode, onCustomColorCodeChange }: ShadePickerProps) {
  const families = useMemo(() => [...new Set(shades.map((s) => s.family))], [shades]);
  const [activeFamily, setActiveFamily] = useState(families[0]);
  const filteredShades = useMemo(() => shades.filter((s) => s.family === activeFamily), [shades, activeFamily]);

  const selectedInfo = useMemo(() => shades.find((s) => s.name === selectedShade), [shades, selectedShade]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-1">
        <Palette className="h-4 w-4 text-[var(--brand)]" />
        Select Shade
      </h4>
      {selectedInfo && (
        <p className="text-micro text-[var(--text-muted)] mb-3">
          Selected: <span className="font-semibold text-[var(--text-primary)]">{selectedInfo.name}</span>
          {" "}({selectedInfo.code})
        </p>
      )}

      {/* Shade family tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setActiveFamily("All")}
          className={`shrink-0 rounded-full px-3 py-1 text-micro font-bold transition-all cursor-pointer ${
            activeFamily === "All"
              ? "bg-[#2D1B69] text-white shadow-xs"
              : "bg-[#F0ECF9] text-[#2D1B69] hover:bg-[#DDD6EE]"
          }`}
        >
          All Shades
        </button>
        {families.map((fam) => (
          <button
            key={fam}
            onClick={() => setActiveFamily(fam)}
            className={`shrink-0 rounded-full px-3 py-1 text-micro font-bold transition-all cursor-pointer ${
              activeFamily === fam
                ? "bg-[#2D1B69] text-white shadow-xs"
                : "bg-[#F0ECF9] text-[#6B5B83] hover:bg-[#DDD6EE]"
            }`}
          >
            {fam}
          </button>
        ))}
      </div>

      {/* Shade grid (Canva style: clean circular swatches) */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto thin-scroll p-1">
        {(activeFamily === "All" ? shades : filteredShades).map((shade) => {
          const isSelected = selectedShade === shade.name;
          return (
            <button
              key={shade.name}
              type="button"
              onClick={() => onSelectShade(shade.name)}
              className={`group/shade relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#F0ECF9] ring-2 ring-[#2D1B69] shadow-sm"
                  : "hover:bg-[#F7F4FC]"
              }`}
            >
              <div
                className={`relative flex items-center justify-center rounded-full border border-black/10 transition-transform ${
                  isSelected ? "h-10 w-10 ring-2 ring-[#2D1B69] ring-offset-1 scale-105" : "h-9 w-9 group-hover/shade:scale-110 shadow-xs"
                }`}
                style={{ backgroundColor: shade.code }}
              />
              <span className="text-micro font-bold text-[#150726] leading-tight text-center truncate w-full">
                {shade.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom color code input */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-micro font-semibold text-[var(--text-primary)] mb-2">Or enter your color code</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">#</span>
            <input
              type="text"
              placeholder="E8D5B7"
              value={customColorCode.replace("#", "")}
              onChange={(e) => onCustomColorCodeChange("#" + e.target.value.replace("#", "").slice(0, 6))}
              maxLength={7}
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-white pl-7 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>
          {customColorCode && customColorCode.length === 7 && (
            <div className="h-10 w-10 rounded-lg border border-[var(--border)] flex-shrink-0" style={{ backgroundColor: customColorCode }} />
          )}
        </div>
        {customColorCode && customColorCode.length === 7 && (
          <p className="mt-1.5 text-tiny text-[var(--text-muted)]">
            Custom shade <span className="font-mono font-semibold">{customColorCode}</span> — will be tinted at store
          </p>
        )}
      </div>
    </div>
  );
}
