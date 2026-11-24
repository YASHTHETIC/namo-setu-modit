"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Search, X, ChevronRight, Sparkles, Truck, Package } from "lucide-react";
import Link from "next/link";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/search-suggestions";
import { products } from "@/lib/product-data";
import { haptic } from "@/lib/haptics";

/**
 * NeuralSearch — God-level AI-powered instant search.
 *
 * • Neural (fuzzy) matching across product names, brands, categories
 * • Instant dropdown with thumbnail previews as you type
 * • Category quick-chips below the input
 * • Arrow-key navigation + Enter to open product
 * • Haptic tick on each suggestion highlight (mobile feel)
 * • Reduced-motion safe (dropdown still appears, no animation)
 */
interface NeuralSearchProps {
  className?: string;
  placeholder?: string;
}

export function NeuralSearch({ className = "", placeholder = "Search materials, brands, categories…" }: NeuralSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(() => getSearchSuggestions(query, products, 8), [query]);

  const open = focused && suggestions.length > 0;

  const selectSuggestion = useCallback((s: SearchSuggestion) => {
    setQuery("");
    setFocused(false);
    setHighlighted(-1);
    haptic("success");
    window.location.href = `/products?search=${encodeURIComponent(s.query)}`;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((p) => Math.min(p + 1, suggestions.length - 1));
        haptic("tick");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((p) => Math.max(p - 1, -1));
        haptic("tick");
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlighted >= 0) {
          selectSuggestion(suggestions[highlighted]);
        } else if (query.trim()) {
          window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
        }
      } else if (e.key === "Escape") {
        setFocused(false);
        setHighlighted(-1);
      }
    },
    [open, query, highlighted, suggestions, selectSuggestion],
  );

  const scrollToHighlighted = useCallback(() => {
    if (!dropdownRef.current || highlighted < 0) return;
    const node = dropdownRef.current.children[highlighted] as HTMLElement | undefined;
    if (node) {
      const rect = node.getBoundingClientRect();
      const parentRect = dropdownRef.current.getBoundingClientRect();
      if (rect.bottom > parentRect.bottom) dropdownRef.current.scrollTop += rect.bottom - parentRect.bottom;
      if (rect.top < parentRect.top) dropdownRef.current.scrollTop += rect.top - parentRect.top;
    }
  }, [dropdownRef, highlighted]);

  useEffect(() => {
    scrollToHighlighted();
  }, [highlighted, scrollToHighlighted]);

  // Category chips (neural quick-filters)
  const CATEGORY_CHIPS = [
    { label: "Cement", slug: "cement", icon: Package },
    { label: "Paint", slug: "painting", icon: Truck },
    { label: "Lighting", slug: "lighting", icon: Package },
    { label: "Tiles", slug: "tiling", icon: Truck },
    { label: "Electrical", slug: "electrical", icon: Package },
  ];

  return (
    <div className={`relative w-full ${className}`}>
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7CB518] pointer-events-none">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
            setHighlighted(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Keep dropdown open briefly for click selection
            setTimeout(() => setFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-8 py-3 sm:py-3.5 rounded-2xl border border-white/30 bg-white/80 backdrop-blur text-[#150726] font-bold placeholder:text-[#9B8CB5]/70 focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/20 transition-all shadow-lg"
          autoComplete="off"
          spellCheck={false}
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFocused(false);
              setHighlighted(-1);
              inputRef.current?.blur();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#E91E63] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Neural dropdown */}
      {open && (
        <ul
          ref={dropdownRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-[0_24px_48px_-16px_rgba(0,0,0,0.35)] overflow-hidden max-h-[420px] overflow-y-auto"
        >
          <li className="px-4 py-2.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F8CB46]" />
              <span className="text-tiny font-black text-[#2D1B69] uppercase tracking-wider">Neural matches</span>
            </div>
          </li>
          {suggestions.map((s, i) => (
            <li
              key={s.query}
              role="option"
              aria-selected={highlighted === i}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => selectSuggestion(s)}
              className={`px-4 py-3 cursor-pointer border-b border-white/5 last:border-0 transition-all ${
                highlighted === i
                  ? "bg-[#F0ECF9] text-[#2D1B69] font-black"
                  : "text-[#150726]/90 hover:bg-white/50 hover:text-[#2D1B69]"
              }`}
            >
              <div className="flex items-center gap-3">
                {s.image ? (
                  <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-white/20 bg-[#F0ECF9]">
                    <Image src={s.image} alt={s.text} fill className="object-cover" sizes="40px" loading="lazy" />
                  </div>
                ) : (
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center border border-white/20 bg-[#F0ECF9] text-[#7CB518] font-black">
                    <Package className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-bold truncate">{s.text}</p>
                  {s.category && (
                    <p className="text-tiny text-[#9B8CB5] truncate">{s.category}</p>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#9B8CB5] flex-shrink-0" />
              </div>
            </li>
          ))}
          {suggestions.length === 0 && query.trim() && (
            <li className="px-4 py-4 text-center text-tiny text-[#9B8CB5] font-bold">
              No neural matches for “{query}”. Try cement, paint, tiles or lighting.
            </li>
          )}
        </ul>
      )}

      {/* Category quick-chips (shown when empty/focused) */}
      {!open && focused && query.trim() === "" && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-tiny font-black text-[#9B8CB5] uppercase tracking-wider">Neural quick-jump</span>
          {CATEGORY_CHIPS.map(({ label, slug, icon: Icon }) => (
            <button
              key={slug}
              type="button"
              onClick={() => {
                setQuery("");
                setFocused(false);
                haptic("tick");
                window.location.href = `/products?category=${slug}`;
              }}
              className="px-3 py-1.5 rounded-full text-tiny font-bold border border-white/20 bg-white/80 text-[#2D1B69] hover:bg-[#7CB518] hover:text-white transition-all shadow-sm"
            >
              <Icon className="h-3 w-3 mr-1" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
