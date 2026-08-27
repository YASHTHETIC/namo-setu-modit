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
        <p className="text-[11px] text-[var(--text-muted)] mb-3">
          Selected: <span className="font-semibold text-[var(--text-primary)]">{selectedInfo.name}</span>
          {" "}({selectedInfo.code})
        </p>
      )}

      {/* Shade family tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {families.map((fam) => (
          <button
            key={fam}
            onClick={() => { setActiveFamily(fam); onSelectShade(null); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeFamily === fam
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--brand-50)]"
            }`}
          >
            {fam}
          </button>
        ))}
      </div>

      {/* Shade grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {filteredShades.map((shade) => (
          <button
            key={shade.name}
            onClick={() => onSelectShade(shade.name)}
            className={`group/shade relative flex flex-col items-center gap-1 rounded-lg p-2 transition-all ${
              selectedShade === shade.name
                ? "ring-2 ring-[var(--brand)] ring-offset-2 bg-[var(--brand-50)]"
                : "hover:bg-[var(--bg-subtle)]"
            }`}
          >
            <div
              className="h-8 w-8 rounded-full border border-black/10 shadow-sm group-hover/shade:scale-110 transition-transform"
              style={{ backgroundColor: shade.code }}
            />
            <span className="text-[8px] font-medium text-[var(--text-muted)] leading-tight text-center truncate w-full">
              {shade.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom color code input */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-2">Or enter your color code</p>
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
          <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
            Custom shade <span className="font-mono font-semibold">{customColorCode}</span> — will be tinted at store
          </p>
        )}
      </div>
    </div>
  );
}
