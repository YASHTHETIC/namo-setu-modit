"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  Truck,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingCart,
  Zap,
  Heart,
  Tag,
  TrendingDown,
} from "lucide-react";
import { Button, Badge, Input, DeliveryBadge, QuantitySelector } from "@/lib/modit-ui";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { products, categories, type Product } from "@/lib/product-data";

type SortOption = "relevance" | "price-asc" | "price-desc" | "rating" | "discount" | "newest";
type ViewMode = "grid" | "list";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string; border: string; light: string; icon: string }> = {
  cement:   { bg: "linear-gradient(135deg, #F0ECF9, #E8E0F7)", text: "#2D1B69", accent: "#7CB518", border: "#C9B8E8", light: "#F5F2FC", icon: "bg-purple-100 text-purple-700" },
  painting: { bg: "linear-gradient(135deg, #F0F9E8, #E8F5D8)", text: "#3D6B0E", accent: "#7CB518", border: "#C5E1A5", light: "#F5FCF0", icon: "bg-green-100 text-green-700" },
  lighting: { bg: "linear-gradient(135deg, #E0F7FA, #F0FCFD)", text: "#00838F", accent: "#00BCD4", border: "#B2EBF2", light: "#F0FFFE", icon: "bg-cyan-100 text-cyan-700" },
  tiling:   { bg: "linear-gradient(135deg, #FCE4EC, #F8BBD0)", text: "#AD1457", accent: "#E91E63", border: "#F48FB1", light: "#FFF0F3", icon: "bg-pink-100 text-pink-700" },
};

function getCatColor(slug: string) {
  return CATEGORY_COLORS[slug] || CATEGORY_COLORS.cement;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSearch(searchParams.get("search") || searchParams.get("q") || "");
  }, [searchParams]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(true);

  const allBrands = useMemo(() => {
    const brandSet = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(brandSet).sort();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand || ""));
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        result.sort((a, b) => b.discount - a.discount);
        break;
    }

    return result;
  }, [search, selectedCategory, selectedBrands, priceRange, minRating, inStockOnly, sort]);

  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setMinRating(0);
    setInStockOnly(false);
  }, []);

  const hasActiveFilters = search || selectedCategory || selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000 || minRating > 0 || inStockOnly;

  const catColor = selectedCategory ? getCatColor(selectedCategory) : null;

  return (
    <div
      className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6"
      style={{
        background: selectedCategory
          ? `linear-gradient(180deg, ${catColor!.light} 0%, ${catColor!.bg.match(/#[A-Fa-f0-9]+/)?.[0] || '#FFFBF5'}33 200px, #FFF8F0 500px)`
          : 'linear-gradient(180deg, #FFFBF5 0%, #FFF8F0 200px, #FFF5E8 500px)',
        minHeight: '100vh',
      }}
    >
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-[var(--text-primary)]">Products</span>
        {selectedCategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold" style={{ color: catColor?.accent }}>
              {categories.find((c) => c.slug === selectedCategory)?.name}
            </span>
          </>
        )}
        {search && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[var(--text-muted)]">&ldquo;{search}&rdquo;</span>
          </>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="hidden w-64 shrink-0 lg:block">
            <div
              className="sticky top-24 space-y-0 overflow-hidden rounded-2xl border shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              style={{
                borderColor: catColor?.border || '#FED7AA',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFCF8 100%)',
              }}
            >
              {/* Sidebar Header */}
              <div
                className="px-5 py-4 border-b"
                style={{
                  background: catColor?.bg || 'linear-gradient(135deg, #FED7AA, #FEF3E2)',
                  borderColor: catColor?.border || '#FED7AA',
                }}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" style={{ color: catColor?.accent || '#2D1B69' }} />
                  <h3 className="text-sm font-black" style={{ color: catColor?.text || '#9A3412' }}>Filters</h3>
                  {hasActiveFilters && (
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: catColor?.accent || '#2D1B69' }}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Search in results */}
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#2D1B69]">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search in results..."
                      className="h-10 w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 transition-all text-[#150726] focus:border-[#2D1B69] focus:ring-[#2D1B69]/10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#2D1B69]">Category</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="flex items-center w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all"
                      style={
                        !selectedCategory
                          ? { background: catColor?.bg || 'linear-gradient(135deg, #FED7AA, #FEF3E2)', color: catColor?.accent || '#2D1B69', border: `1px solid ${catColor?.border || '#FED7AA'}`, boxShadow: `0 2px 8px ${catColor?.accent || '#2D1B69'}15` }
                          : { color: 'var(--text-secondary)' }
                      }
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ background: catColor?.accent || '#2D1B69' }} />
                      All Categories
                    </button>
                    {categories.map((cat) => {
                      const cc = getCatColor(cat.slug);
                      const isActive = selectedCategory === cat.slug;
                      const count = products.filter((p) => p.categorySlug === cat.slug).length;
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className="flex items-center w-full rounded-xl px-3 py-2.5 text-left text-xs transition-all"
                          style={
                            isActive
                              ? { background: cc.bg, color: cc.text, fontWeight: 700, border: `1px solid ${cc.border}`, boxShadow: `0 2px 8px ${cc.accent}15` }
                              : { color: 'var(--text-secondary)', fontWeight: 500 }
                          }
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                            style={{ background: cc.accent, opacity: isActive ? 1 : 0.4 }}
                          />
                          <span className="flex-1">{cat.name}</span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              background: isActive ? `${cc.accent}18` : 'rgba(0,0,0,0.04)',
                              color: isActive ? cc.accent : 'var(--text-muted)',
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#2D1B69]">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="h-9 w-full rounded-lg border border-[#DDD6EE] bg-white px-2.5 text-xs font-medium focus:outline-none focus:ring-2 transition-all focus:border-[#2D1B69] focus:ring-[#2D1B69]/10"
                      placeholder="Min"
                    />
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">TO</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="h-9 w-full rounded-lg border border-[#DDD6EE] bg-white px-2.5 text-xs font-medium focus:outline-none focus:ring-2 transition-all focus:border-[#2D1B69] focus:ring-[#2D1B69]/10"
                      placeholder="Max"
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      { label: "Under ₹100", range: [0, 100] as [number, number] },
                      { label: "₹100-500", range: [100, 500] as [number, number] },
                      { label: "₹500-5K", range: [500, 5000] as [number, number] },
                      { label: "₹5K-50K", range: [5000, 50000] as [number, number] },
                      { label: "₹50K+", range: [50000, 100000] as [number, number] },
                    ].map((preset) => {
                      const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                      return (
                        <button
                          key={preset.label}
                          onClick={() => setPriceRange(preset.range)}
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold transition-all border"
                          style={
                            isActive
                              ? { background: catColor?.bg || '#FED7AA', color: catColor?.accent || '#2D1B69', borderColor: catColor?.border || '#FED7AA', boxShadow: `0 1px 4px ${catColor?.accent || '#2D1B69'}12` }
                              : { background: 'white', color: 'var(--text-muted)', borderColor: '#F0EBE3' }
                          }
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#2D1B69]">Brand</h3>
                  <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                    {allBrands.map((brand) => {
                      const isSelected = selectedBrands.includes(brand);
                      return (
                        <label key={brand} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 transition-all hover:bg-white/80">
                          <div
                            className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                            style={{
                              borderColor: isSelected ? (catColor?.accent || '#2D1B69') : '#D1D5DB',
                              background: isSelected ? (catColor?.accent || '#2D1B69') : 'white',
                            }}
                          >
                            {isSelected && (
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs ${isSelected ? 'font-bold' : 'font-medium'}`} style={{ color: isSelected ? (catColor?.accent || '#2D1B69') : 'var(--text-secondary)' }}>
                            {brand}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#2D1B69]">Minimum Rating</h3>
                  <div className="space-y-1">
                    {[4, 3, 2, 1].map((r) => {
                      const isActive = minRating === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setMinRating(minRating === r ? 0 : r)}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all w-full"
                          style={
                            isActive
                              ? { background: catColor?.bg || '#FED7AA', color: catColor?.accent || '#2D1B69', fontWeight: 700, border: `1px solid ${catColor?.border || '#FED7AA'}` }
                              : { color: 'var(--text-secondary)' }
                          }
                        >
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= r ? "" : "fill-gray-200 text-gray-200"}`} style={s <= r ? { fill: catColor?.accent || '#2D1B69', color: catColor?.accent || '#2D1B69' } : {}} />
                            ))}
                          </div>
                          <span>& Up</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In Stock */}
                <div
                  className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 transition-all"
                  style={{
                    background: inStockOnly ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'transparent',
                    border: inStockOnly ? '1px solid #A7F3D0' : '1px solid transparent',
                  }}
                  onClick={() => setInStockOnly(!inStockOnly)}
                >
                  <div
                    className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      borderColor: inStockOnly ? '#10B981' : '#D1D5DB',
                      background: inStockOnly ? '#10B981' : 'white',
                    }}
                  >
                    {inStockOnly && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${inStockOnly ? 'font-bold text-emerald-700' : 'font-medium text-[var(--text-secondary)]'}`}>
                    In Stock Only
                  </span>
                </div>

                {/* Clear */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full rounded-xl py-2.5 text-xs font-black transition-all border-2 border-dashed border-[#DDD6EE] text-[#E91E63] bg-[#FCE4EC] hover:bg-[#F8BBD0]"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort Bar */}
          <div
            className="mb-4 flex items-center justify-between rounded-2xl border px-5 py-3.5"
            style={{
              borderColor: catColor?.border || '#DDD6EE',
              background: 'white',
              boxShadow: '0 2px 12px rgba(26,10,51,0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all lg:hidden border-[#C9B8E8] bg-[#F0ECF9] text-[#2D1B69] hover:bg-[#E8E0F7]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-black text-[var(--text-primary)]">{filteredProducts.length}</span> results
                {search && (
                  <> for <span className="font-bold" style={{ color: catColor?.accent || '#2D1B69' }}>&ldquo;{search}&rdquo;</span></>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border bg-white px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 transition-all border-[#DDD6EE] text-[var(--text-secondary)] focus:border-[#2D1B69] focus:ring-[#2D1B69]/10"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Discount</option>
              </select>

              <div className="hidden items-center rounded-xl border sm:flex border-[#DDD6EE]">
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2 transition-all"
                  style={{
                    background: viewMode === 'grid' ? '#F0ECF9' : 'white',
                    color: viewMode === 'grid' ? '#2D1B69' : 'var(--text-muted)',
                  }}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 transition-all"
                  style={{
                    background: viewMode === 'list' ? '#F0ECF9' : 'white',
                    color: viewMode === 'list' ? '#2D1B69' : 'var(--text-muted)',
                  }}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedCategory && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border shadow-sm"
                  style={{
                    background: catColor?.bg,
                    color: catColor?.text,
                    borderColor: catColor?.border,
                  }}
                >
                  {categories.find((c) => c.slug === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory("")} className="ml-0.5 rounded-full p-0.5 hover:bg-white/60 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border shadow-sm"
                  style={{
                    background: catColor?.bg || '#FED7AA',
                    color: catColor?.text || '#9A3412',
                    borderColor: catColor?.border || '#FED7AA',
                  }}
                >
                  {b}
                  <button onClick={() => toggleBrand(b)} className="ml-0.5 rounded-full p-0.5 hover:bg-white/60 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                  In Stock
                  <button onClick={() => setInStockOnly(false)} className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100/60 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid/List */}
          {filteredProducts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-[#DDD6EE]"
              style={{
                background: 'white',
                boxShadow: '0 2px 12px rgba(26,10,51,0.04)',
              }}
            >
              <div
                className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F0ECF9]"
              >
                <Package className="h-10 w-10 text-[#9B8CB5]" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">No products found</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xs">Try adjusting your filters or search terms to find what you&apos;re looking for</p>
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl px-6 py-3 text-xs font-black text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-[#2D1B69] hover:bg-[#1E1245]"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addItem} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductListCard key={product.id} product={product} onAddToCart={addItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product, qty?: number) => void }) {
  const [added, setAdded] = useState(false);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const wishlisted = isWishlisted(product.id);
  const catColor = getCatColor(product.categorySlug);
  const savingsPercent = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className="group relative rounded-2xl bg-white transition-all duration-300 overflow-hidden"
      style={{
        border: '1px solid #DDD6EE',
        boxShadow: '0 1px 3px rgba(26,10,51,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(45,27,105,0.12), 0 2px 8px rgba(45,27,105,0.06)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#C9B8E8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(26,10,51,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#DDD6EE';
      }}
    >
      {/* Category accent stripe at top */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${catColor.accent}, ${catColor.accent}AA, ${catColor.accent}44)` }} />

      {/* Image */}
      <div className="relative h-52 overflow-hidden" style={{ background: catColor.bg }}>
        <Link href={`/products/${product.id}`} className="absolute inset-0 z-[1]">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16" style={{ color: catColor.accent, opacity: 0.15 }} />
            </div>
          )}
          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
          style={{
            background: wishlisted ? '#FEE2E2' : 'rgba(255,255,255,0.92)',
            boxShadow: wishlisted ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          }}
          title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`h-4 w-4 transition-all ${wishlisted ? "fill-red-500 text-red-500 scale-110" : "text-gray-400"}`} />
        </button>

        {/* Discount badge */}
        {product.discount > 0 && (
          <span
            className="absolute top-3 right-3 z-[2] flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              boxShadow: '0 3px 12px rgba(220,38,38,0.35)',
            }}
          >
            <TrendingDown className="h-3 w-3" />
            {savingsPercent}% OFF
          </span>
        )}

        {/* Verified badge */}
        {product.seller.isVerified && (
          <span
            className="absolute bottom-3 left-3 z-[2] flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
              color: '#065F46',
              border: '1px solid #A7F3D0',
            }}
          >
            <Shield className="h-2.5 w-2.5" /> Verified Supplier
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Category + Brand row */}
        <div className="flex items-center gap-2 mb-1.5">
          {product.brand && (
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
              style={{
                background: catColor.bg,
                color: catColor.text,
              }}
            >
              {product.brand}
            </span>
          )}
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: `${catColor.accent}0A`,
              color: catColor.accent,
            }}
          >
            {product.category}
          </span>
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-tight hover:text-[var(--brand)] transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1 bg-[#F0ECF9] border border-[#DDD6EE]"
          >
            <span className="text-xs font-black text-[#7CB518]">{product.rating}</span>
            <Star className="h-3 w-3" style={{ fill: '#7CB518', color: '#7CB518' }} />
          </div>
          <span className="text-[10px] font-medium text-[var(--text-muted)]">({product.reviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Price */}
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              ₹{product.price.toLocaleString()}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-[var(--text-muted)] line-through font-medium">
                ₹{product.mrp.toLocaleString()}
              </span>
            )}
          </div>
          {product.bulkLabel && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-emerald-600" />
              <p className="text-[10px] font-bold text-emerald-600">
                {product.bulkLabel}
              </p>
            </div>
          )}
        </div>

        <DeliveryBadge
          days={product.deliveryDays}
          freeDelivery={product.freeDelivery}
          className="mt-2.5"
        />

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black transition-all duration-300"
          style={
            added
              ? {
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                }
              : {
                  background: 'linear-gradient(135deg, #7CB518, #6A9C14)',
                  color: 'white',
                  boxShadow: '0 3px 12px rgba(124,181,24,0.30)',
                }
          }
          onMouseEnter={(e) => {
            if (!added) e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,181,24,0.40)';
            if (!added) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            if (!added) e.currentTarget.style.boxShadow = '0 3px 12px rgba(124,181,24,0.30)';
            if (!added) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {added ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ProductListCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product, qty?: number) => void }) {
  const [added, setAdded] = useState(false);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const wishlisted = isWishlisted(product.id);
  const catColor = getCatColor(product.categorySlug);
  const savingsPercent = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className="group flex gap-0 rounded-2xl bg-white overflow-hidden transition-all duration-300 border border-[#DDD6EE]"
      style={{
        boxShadow: '0 1px 3px rgba(26,10,51,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(45,27,105,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#C9B8E8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(26,10,51,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#DDD6EE';
      }}
    >
      {/* Left color accent */}
      <div className="w-1.5 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${catColor.accent}, ${catColor.accent}88, ${catColor.accent}44)` }} />

      {/* Image */}
      <div className="relative h-44 w-44 flex-shrink-0 overflow-hidden" style={{ background: catColor.bg }}>
        <Link href={`/products/${product.id}`} className="absolute inset-0 z-[1]">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12" style={{ color: catColor.accent, opacity: 0.15 }} />
            </div>
          )}
        </Link>
        <button
          onClick={handleWishlist}
          className="absolute top-2 left-2 z-[2] flex h-8 w-8 items-center justify-center rounded-full transition-all"
          style={{
            background: wishlisted ? '#FEE2E2' : 'rgba(255,255,255,0.92)',
            boxShadow: wishlisted ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          }}
          title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
        {product.discount > 0 && (
          <span
            className="absolute top-2 right-2 z-[2] flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
            }}
          >
            <TrendingDown className="h-3 w-3" />
            {savingsPercent}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {product.brand && (
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: catColor.bg, color: catColor.text }}
                >
                  {product.brand}
                </span>
              )}
              <span
                className="rounded-md px-2 py-0.5 text-[9px] font-bold"
                style={{ background: `${catColor.accent}0A`, color: catColor.accent }}
              >
                {product.category}
              </span>
            </div>
            <Link href={`/products/${product.id}`}>
              <h3 className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors cursor-pointer">
                {product.name}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{product.shortDescription}</p>
          </div>

          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1 flex-shrink-0 bg-[#F0ECF9] border border-[#DDD6EE]"
          >
            <span className="text-xs font-black text-[#7CB518]">{product.rating}</span>
            <Star className="h-3 w-3" style={{ fill: '#7CB518', color: '#7CB518' }} />
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-center gap-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-primary)]">₹{product.price.toLocaleString()}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-[var(--text-muted)] line-through font-medium">₹{product.mrp.toLocaleString()}</span>
              )}
            </div>
            {product.bulkLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <Tag className="h-3 w-3 text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-600">{product.bulkLabel}</p>
              </div>
            )}
          </div>

          <DeliveryBadge days={product.deliveryDays} freeDelivery={product.freeDelivery} />

          <div className="ml-auto">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black transition-all duration-300"
              style={
                added
                  ? { background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }
                  : {
                      background: 'linear-gradient(135deg, #7CB518, #6A9C14)',
                      color: 'white',
                      boxShadow: '0 3px 12px rgba(124,181,24,0.30)',
                    }
              }
              onMouseEnter={(e) => {
                if (!added) e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,181,24,0.40)';
              }}
              onMouseLeave={(e) => {
                if (!added) e.currentTarget.style.boxShadow = '0 3px 12px rgba(124,181,24,0.30)';
              }}
            >
              {added ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--cyan)]" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
