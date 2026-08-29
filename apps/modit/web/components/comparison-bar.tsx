"use client";

import Link from "next/link";
import { X, GitCompareArrows } from "lucide-react";
import { useComparisonStore } from "@/lib/comparison-store";

export function ComparisonBar() {
  const { items, removeFromCompare, clearCompare } = useComparisonStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
      <div className="max-w-[600px] mx-auto bg-[#150726] rounded-2xl border border-white/10 p-3 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {items.map((product) => (
              <div key={product.id} className="relative flex-shrink-0">
                <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover bg-white/10 border border-white/20" />
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#E91E63] flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
            {items.length < 4 && (
              <div className="h-10 w-10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-white/30">+</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clearCompare} className="text-[10px] text-white/40 hover:text-[#E91E63] transition-colors">
              Clear
            </button>
            <Link
              href="/compare"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6A9C14] transition-all"
            >
              <GitCompareArrows className="h-3 w-3" />
              Compare ({items.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
