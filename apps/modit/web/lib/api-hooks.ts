"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProducts as useApiProducts, useProduct as useApiProduct, useCategories as useApiCategories, useBrands as useApiBrands, useUnits as useApiUnits } from "./modit-api";
import { products as staticProducts, categories as staticCategories, getProductById, searchProducts, type Product, type Category } from "./product-data";

const fastQueryOpts = { retry: false, staleTime: 30_000, gcTime: 60_000 } as const;

function isArray(a: unknown): a is unknown[] {
  return Array.isArray(a);
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseSpecs(specJson: unknown): Record<string, string> {
  if (!specJson || typeof specJson !== "string") return {};
  try {
    const v = JSON.parse(specJson);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, string>;
  } catch { /* free-text specs stay out of the table */ }
  return {};
}

/** Imported catalog rows sometimes carry HTML entities — decode for display. */
function cleanName(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CatalogLookups {
  categoriesById: Record<string, { name: string; slug: string }>;
  brandsById: Record<string, { name: string; slug: string }>;
  unitsById: Record<string, { name: string; code: string; symbol: string | null }>;
}

/**
 * Flat `ProductRead` rows carry only `category_id` / `brand_id` / `unit_id`
 * UUIDs. Resolve them through the catalog dictionaries so counts, filters
 * and brand/unit labels work even when the list endpoint has not been
 * upgraded to enriched rows yet. Enriched rows (nested objects) always win;
 * lookups are a pure fallback. Query keys match the shared hooks, so
 * react-query dedupes — no duplicate requests.
 */
export function useCatalogLookups(): CatalogLookups {
  const { data: rawCategories } = useApiCategories();
  const { data: rawBrands } = useApiBrands();
  const { data: rawUnits } = useApiUnits();

  return useMemo(() => {
    const categoriesById: CatalogLookups["categoriesById"] = {};
    if (isArray(rawCategories)) {
      for (const c of rawCategories as any[]) {
        if (c?.id && c?.slug) categoriesById[String(c.id)] = { name: String(c.name ?? c.slug), slug: String(c.slug) };
      }
    }
    const brandsById: CatalogLookups["brandsById"] = {};
    if (isArray(rawBrands)) {
      for (const b of rawBrands as any[]) {
        if (b?.id && b?.slug) brandsById[String(b.id)] = { name: String(b.name ?? b.slug), slug: String(b.slug) };
      }
    }
    const unitsById: CatalogLookups["unitsById"] = {};
    if (isArray(rawUnits)) {
      for (const u of rawUnits as any[]) {
        if (u?.id) unitsById[String(u.id)] = { name: String(u.name ?? ""), code: String(u.code ?? ""), symbol: (u.symbol as string | null) ?? null };
      }
    }
    return { categoriesById, brandsById, unitsById };
  }, [rawCategories, rawBrands, rawUnits]);
}

/**
 * Backend list rows are ProductDetailRead (enriched: brand/category/unit/
 * gst/images nested); older cached rows may be flat ProductRead (ids only).
 * The storefront renders the static `Product` shape, so map here — the
 * single place every listing page funnels through. Never let an unmapped
 * row through: `price===undefined` wipes the whole grid because the
 * price-range filter (`p.price >= 0`) is false for every row.
 */
export function mapApiProductToFrontend(p: any, lookups?: CatalogLookups): Product | null {
  if (!p || typeof p !== "object" || !p.id || !p.name) return null;
  const priceRaw = p.list_price ?? p.price;
  const price = Number(priceRaw);
  if (!Number.isFinite(price)) return null;
  const mrpRaw = p.mrp ?? priceRaw;
  const mrp = Number(mrpRaw);
  const safeMrp = Number.isFinite(mrp) ? mrp : price;

  const lookupBrand = (p.brand_id != null && lookups?.brandsById[String(p.brand_id)]) || null;
  const lookupCategory = (p.category_id != null && lookups?.categoriesById[String(p.category_id)]) || null;
  const lookupUnit = (p.unit_id != null && lookups?.unitsById[String(p.unit_id)]) || null;

  const brandName: string | null =
    p.brand?.name ?? (typeof p.brand === "string" ? p.brand : null) ?? lookupBrand?.name ?? null;
  const brandSlug: string | null =
    p.brand?.slug ?? lookupBrand?.slug ?? (brandName ? slugify(brandName) : null);
  const categoryName: string =
    p.category?.name ?? (typeof p.category === "string" ? p.category : null) ?? lookupCategory?.name ?? "";
  const categorySlug: string =
    p.category?.slug ?? lookupCategory?.slug ?? (categoryName ? slugify(categoryName) : "") ?? "";
  const subName: string | null =
    p.sub_category?.name ?? p.subCategory ?? (typeof p.sub_category === "string" ? p.sub_category : null) ?? null;
  const subSlug: string | null =
    p.sub_category?.slug ?? p.subCategorySlug ?? (subName ? slugify(subName) : null);
  const unitName: string =
    p.unit?.name ?? (typeof p.unit === "string" ? p.unit : null) ?? lookupUnit?.name ?? "";
  const unitCode: string = p.unit?.code ?? lookupUnit?.code ?? p.unitCode ?? "";
  const unitSymbol: string | null = p.unit?.symbol ?? lookupUnit?.symbol ?? p.unitSymbol ?? null;

  const name = cleanName(String(p.name));

  let images: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    if (typeof p.images[0] === "string") {
      images = p.images as string[];
    } else {
      const sorted = [...p.images].sort(
        (a: any, b: any) =>
          Number(b?.is_primary ?? 0) - Number(a?.is_primary ?? 0) ||
          Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0)
      );
      images = sorted.map((img: any) => `/api/v1/media/${img.media_id}`).filter(Boolean);
    }
  }

  // Backend has no tags column — derive search tokens so client-side
  // search (`p.tags.some`) keeps working on API rows.
  const derivedTags = Array.isArray(p.tags) && p.tags.length > 0
    ? (p.tags as string[])
    : [
        categorySlug,
        brandSlug,
        ...name.toLowerCase().split(/[^a-z0-9]+/).filter((t: string) => t.length > 2),
      ].filter(Boolean) as string[];

  return {
    id: String(p.id),
    name,
    slug: String(p.slug ?? p.id),
    sku: String(p.sku ?? ""),
    description: cleanName(String(p.description ?? "")),
    shortDescription: cleanName(String(p.description ?? p.shortDescription ?? "")),
    brand: brandName,
    brandSlug,
    category: categoryName,
    categorySlug,
    subCategory: subName,
    subCategorySlug: subSlug,
    unit: unitName,
    unitCode: String(unitCode),
    unitSymbol,
    price,
    mrp: safeMrp,
    discount: safeMrp > price ? Math.round(((safeMrp - price) / safeMrp) * 100) : (Number(p.discount) || 0),
    bulkPrice: p.bulkPrice ?? null,
    bulkMinQty: p.bulkMinQty ?? null,
    bulkLabel: p.bulkLabel ?? null,
    gstRate: Number(p.gst?.rate_percent ?? p.gstRate ?? 18),
    gstCode: String(p.gst?.code ?? p.gstCode ?? "GST 18%"),
    rating: Number(p.rating ?? 4.5),
    reviewCount: Number(p.reviewCount ?? 0),
    inStock: p.is_active ?? p.inStock ?? true,
    stockLevel: Number(p.stockLevel ?? 999),
    moq: Number(p.moq ?? 1),
    deliveryDays: Number(p.deliveryDays ?? 1),
    freeDelivery: p.freeDelivery ?? true,
    seller: p.seller ?? { name: "MODIT Verified", rating: 4.5, isVerified: true },
    images,
    specifications: p.specifications ?? parseSpecs(p.specification_json),
    features: Array.isArray(p.features) ? p.features : [],
    tags: derivedTags,
  };
}

function mapApiCategoryToFrontend(c: any): any {
  if (!c || typeof c !== "object" || !c.slug) return null;
  const staticMatch = staticCategories.find((s) => s.slug === c.slug);
  return {
    id: c.id,
    name: c.name ?? c.slug,
    slug: c.slug,
    description: c.description ?? staticMatch?.description ?? "",
    icon: (c as any).icon ?? staticMatch?.icon ?? c.slug,
    productCount: Number((c as any).productCount ?? 0),
    subCategories: Array.isArray((c as any).subCategories) ? (c as any).subCategories : (staticMatch?.subCategories ?? []),
  };
}

export function useProducts(params?: { search?: string; category_id?: string; brand_id?: string; category_slug?: string; brand_slug?: string; page?: number; page_size?: number }) {
  const apiQuery = useApiProducts(params);
  const lookups = useCatalogLookups();
  const raw = apiQuery.data as Product[] | { items?: unknown[]; did_you_mean?: string | null } | undefined;
  const rawItems = isArray(raw) ? raw : (raw?.items ?? []);
  const didYouMean = isArray(raw) ? null : (raw?.did_you_mean ?? null);
  // Map + drop unusable rows (missing price/name). A non-empty but fully
  // unusable API page must NOT win over the static fallback — that is the
  // exact "0 results with a full DB" failure.
  const apiProducts = useMemo(
    () => rawItems.map((p) => mapApiProductToFrontend(p, lookups)).filter((p): p is Product => p !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiQuery.data, lookups]
  );

  const fallbackQuery = useQuery({
    queryKey: ["fallback", "products", params],
    queryFn: () => {
      let result = [...staticProducts];
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      const catFilter = params?.category_slug || params?.category_id;
      if (catFilter) {
        const catId = catFilter;
        result = result.filter((p) => p.categorySlug === catId || p.category.toLowerCase() === catId.toLowerCase());
      }
      const brandFilter = params?.brand_slug || params?.brand_id;
      if (brandFilter) {
        const brandId = brandFilter;
        result = result.filter((p) => p.brandSlug === brandId);
      }
      return result;
    },
    ...fastQueryOpts,
    enabled: apiQuery.isError || (apiQuery.isSuccess && apiProducts.length === 0),
  });

  if (apiQuery.isSuccess && apiProducts.length > 0) {
    return { ...apiQuery, data: apiProducts, didYouMean, isFromApi: true };
  }
  if (fallbackQuery.isSuccess) {
    return { ...apiQuery, data: fallbackQuery.data, didYouMean: null, isFromApi: false, isSuccess: true, isPending: false };
  }
  return { ...apiQuery, data: staticProducts, didYouMean: null, isFromApi: false };
}

export function useProduct(productId: string | undefined) {
  const apiQuery = useApiProduct(productId);
  const lookups = useCatalogLookups();
  const rawProduct = apiQuery.data as unknown;
  const apiProduct = (Array.isArray(rawProduct) ? null : mapApiProductToFrontend(rawProduct as any, lookups)) ?? undefined;

  const fallbackQuery = useQuery({
    queryKey: ["fallback", "product", productId],
    queryFn: () => productId ? getProductById(productId) ?? null : null,
    ...fastQueryOpts,
    enabled: apiQuery.isError || (apiQuery.isSuccess && !apiProduct),
  });

  if (apiQuery.isSuccess && apiProduct) {
    return { ...apiQuery, data: apiProduct, isFromApi: true };
  }
  if (fallbackQuery.isSuccess) {
    return { ...apiQuery, data: fallbackQuery.data, isFromApi: false, isSuccess: true, isPending: false };
  }
  return { ...apiQuery, data: productId ? getProductById(productId) ?? null : null, isFromApi: false };
}

export function useCategories() {
  const apiQuery = useApiCategories();
  const rawCategories = isArray(apiQuery.data) ? (apiQuery.data as unknown[]) : [];
  const apiCategories = rawCategories
    .map(mapApiCategoryToFrontend)
    .filter((c): c is Category => c !== null);

  const fallbackQuery = useQuery({
    queryKey: ["fallback", "categories"],
    queryFn: () => staticCategories,
    ...fastQueryOpts,
    enabled: apiQuery.isError || (apiQuery.isSuccess && apiCategories.length === 0),
  });

  if (apiQuery.isSuccess && apiCategories.length > 0) {
    return { ...apiQuery, data: apiCategories, isFromApi: true };
  }
  if (fallbackQuery.isSuccess) {
    return { ...apiQuery, data: fallbackQuery.data, isFromApi: false, isSuccess: true, isPending: false };
  }
  return { ...apiQuery, data: staticCategories, isFromApi: false };
}

export function useSearchProducts(query: string) {
  // Debounce network search: instant local results while typing,
  // one API request 150ms after the user pauses.
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);
  const apiQuery = useApiProducts(debounced ? { search: debounced } : undefined);
  const lookups = useCatalogLookups();
  const raw = apiQuery.data as unknown;
  const rawItems: unknown[] = isArray(raw) ? raw : (((raw as any)?.items ?? []) as unknown[]);
  const apiResults = rawItems
    .map((p) => mapApiProductToFrontend(p, lookups))
    .filter((p): p is Product => p !== null);

  const fallbackResults = query.length >= 2 ? searchProducts(query) : [];

  if (apiQuery.isSuccess && apiResults.length > 0) {
    return { data: apiResults.slice(0, 8), isFromApi: true };
  }
  return { data: fallbackResults.slice(0, 8), isFromApi: false };
}

export { staticProducts, staticCategories, searchProducts };
export type { Product, Category };
