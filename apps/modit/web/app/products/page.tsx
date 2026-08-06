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
} from "lucide-react";
import { Button, Badge, Input, DeliveryBadge, QuantitySelector } from "@/lib/modit-ui";
import { useCartStore } from "@/lib/cart-store";
import { products, categories, type Product } from "@/lib/product-data";

type SortOption = "relevance" | "price-asc" | "price-desc" | "rating" | "discount" | "newest";
type ViewMode = "grid" | "list";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(true);

  // Get unique brands from products
  const allBrands = useMemo(() => {
    const brandSet = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(brandSet).sort();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
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

    // Category
    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    // Brands
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand || ""));
    }

    // Price range
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Rating
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // In stock
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Sort
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

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-[var(--text-primary)]">Products</span>
        {selectedCategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[var(--text-primary)]">
              {categories.find((c) => c.slug === selectedCategory)?.name}
            </span>
          </>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Search in results */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Search</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search in results..."
                    className="h-9 w-full rounded-lg border border-[var(--border)] bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Category</h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                      !selectedCategory ? "bg-[var(--cyan)]/10 font-semibold text-[var(--brand)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-[var(--cyan)]/10 font-semibold text-[var(--brand)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      {cat.name}
                      <span className="ml-1 text-[var(--text-muted)]">
                        ({products.filter((p) => p.categorySlug === cat.slug).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
                    placeholder="Min"
                  />
                  <span className="text-xs text-[var(--text-muted)]">to</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
                    placeholder="Max"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[
                    { label: "Under ₹100", range: [0, 100] as [number, number] },
                    { label: "₹100 - ₹500", range: [100, 500] as [number, number] },
                    { label: "₹500 - ₹5K", range: [500, 5000] as [number, number] },
                    { label: "₹5K - ₹50K", range: [5000, 50000] as [number, number] },
                    { label: "₹50K+", range: [50000, 100000] as [number, number] },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setPriceRange(preset.range)}
                      className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:border-[var(--cyan)] hover:text-[var(--brand)] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Brand</h3>
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {allBrands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--cyan)]"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Minimum Rating</h3>
                <div className="space-y-1.5">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                        minRating === r ? "bg-[var(--cyan)]/10 text-[var(--brand)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r ? "fill-[var(--cyan)] text-[var(--brand)]" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                      <span>& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--cyan)]"
                  />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">In Stock Only</span>
                </label>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-medium text-[var(--brand)] hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort Bar */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--brand)] transition-colors lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">{filteredProducts.length}</span> results
                {search && (
                  <> for <span className="font-semibold text-[var(--text-primary)]">&ldquo;{search}&rdquo;</span></>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Discount</option>
              </select>

              <div className="hidden items-center rounded-lg border border-[var(--border)] sm:flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 ${viewMode === "grid" ? "bg-[var(--cyan)]/10 text-[var(--brand)]" : "text-[var(--text-muted)]"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 ${viewMode === "list" ? "bg-[var(--cyan)]/10 text-[var(--brand)]" : "text-[var(--text-muted)]"}`}
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
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--cyan)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
                  {categories.find((c) => c.slug === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[var(--cyan)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
                  {b}
                  <button onClick={() => toggleBrand(b)}><X className="h-3 w-3" /></button>
                </span>
              ))}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-medium text-[var(--success)]">
                  In Stock
                  <button onClick={() => setInStockOnly(false)}><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="mb-4 h-12 w-12 text-[var(--text-muted)]/30" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No products found</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Try adjusting your filters or search terms</p>
              <Button onClick={clearFilters} variant="secondary" className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addItem} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group rounded-xl border border-[var(--border)] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-100)] to-[var(--brand-50)]">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-[var(--brand)]/20" />
            </div>
          )}
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 rounded-lg bg-[#DC2626] px-2 py-0.5 text-[10px] font-bold text-white">
              {product.discount}% OFF
            </span>
          )}
          {product.seller.isVerified && (
            <span className="absolute top-2 right-2 rounded-lg bg-[var(--success-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
              <Shield className="mr-0.5 inline h-2.5 w-2.5" /> Verified
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.brand && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">{product.brand}</p>
          )}
          <h3 className="mt-1 text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-tight group-hover:text-[var(--brand)] transition-colors">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded bg-[var(--cyan)]/10 px-1.5 py-0.5">
              <span className="text-xs font-bold text-[var(--brand)]">{product.rating}</span>
              <Star className="h-2.5 w-2.5 fill-[var(--cyan)] text-[var(--brand)]" />
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">({product.reviewCount.toLocaleString()})</span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-[var(--text-primary)]">
                ₹{product.price.toLocaleString()}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-[var(--text-muted)] line-through">
                  ₹{product.mrp.toLocaleString()}
                </span>
              )}
            </div>
            {product.bulkLabel && (
              <p className="mt-1 text-[10px] font-medium text-emerald-600">
                {product.bulkLabel}
              </p>
            )}
          </div>

          <DeliveryBadge
            days={product.deliveryDays}
            freeDelivery={product.freeDelivery}
            className="mt-2"
          />

          <button
            onClick={handleAdd}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              added
                ? "bg-[var(--green)] text-[#050510]"
                : "bg-[var(--cyan)] text-white hover:bg-[var(--brand-dark)]"
            }`}
          >
            {added ? (
              <>✓ Added</>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductListCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product, qty?: number) => void }) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group flex gap-4 rounded-xl border border-[var(--border)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
        {/* Image */}
        <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-100)] to-[var(--brand-50)]">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-[var(--brand)]/20" />
            </div>
          )}
          {product.discount > 0 && (
            <span className="absolute top-1 left-1 rounded bg-[#DC2626] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {product.discount}% OFF
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              {product.brand && <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">{product.brand}</p>}
              <h3 className="mt-0.5 text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 rounded bg-[var(--cyan)]/10 px-1.5 py-0.5">
              <span className="text-xs font-bold text-[var(--brand)]">{product.rating}</span>
              <Star className="h-2.5 w-2.5 fill-[var(--cyan)] text-[var(--brand)]" />
            </div>
          </div>

          <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{product.shortDescription}</p>

          <div className="mt-3 flex items-center gap-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[var(--text-primary)]">₹{product.price.toLocaleString()}</span>
                {product.mrp > product.price && (
                  <span className="text-xs text-[var(--text-muted)] line-through">₹{product.mrp.toLocaleString()}</span>
                )}
              </div>
              {product.bulkLabel && <p className="text-[10px] font-medium text-emerald-600">{product.bulkLabel}</p>}
            </div>

            <DeliveryBadge days={product.deliveryDays} freeDelivery={product.freeDelivery} />

            <div className="ml-auto">
              <button
                onClick={handleAdd}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  added ? "bg-[var(--green)] text-[#050510]" : "bg-[var(--cyan)] text-white hover:bg-[var(--brand-dark)]"
                }`}
              >
                {added ? "✓ Added" : <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--cyan)]" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
