"use client";

import { useQuery } from "@tanstack/react-query";
import { useProducts as useApiProducts, useProduct as useApiProduct, useCategories as useApiCategories } from "./modit-api";
import { products as staticProducts, categories as staticCategories, getProductById, searchProducts, type Product, type Category } from "./product-data";

const fastQueryOpts = { retry: false, staleTime: 30_000, gcTime: 60_000 } as const;

function isArray(a: unknown): a is unknown[] {
  return Array.isArray(a);
}

export function useProducts(params?: { search?: string; category_id?: string; brand_id?: string; page?: number }) {
  const apiQuery = useApiProducts(params);
  const apiProducts = isArray(apiQuery.data) ? apiQuery.data as Product[] : [];

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
      if (params?.category_id) {
        const catId = params.category_id;
        result = result.filter((p) => p.categorySlug === catId || p.category.toLowerCase() === catId.toLowerCase());
      }
      if (params?.brand_id) {
        const brandId = params.brand_id;
        result = result.filter((p) => p.brandSlug === brandId);
      }
      return result;
    },
    ...fastQueryOpts,
    enabled: apiQuery.isError || (apiQuery.isSuccess && apiProducts.length === 0),
  });

  if (apiQuery.isSuccess && apiProducts.length > 0) {
    return { ...apiQuery, data: apiProducts, isFromApi: true };
  }
  if (fallbackQuery.isSuccess) {
    return { ...apiQuery, data: fallbackQuery.data, isFromApi: false, isSuccess: true, isPending: false };
  }
  return { ...apiQuery, data: staticProducts, isFromApi: false };
}

export function useProduct(productId: string | undefined) {
  const apiQuery = useApiProduct(productId);
  const apiProduct = apiQuery.data as Product | undefined;

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
  const apiCategories = isArray(apiQuery.data) ? (apiQuery.data as unknown as Category[]) : [];

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
  const apiQuery = useApiProducts({ search: query });
  const apiResults = isArray(apiQuery.data) ? apiQuery.data as Product[] : [];

  const fallbackResults = query.length >= 2 ? searchProducts(query) : [];

  if (apiQuery.isSuccess && apiResults.length > 0) {
    return { data: apiResults.slice(0, 8), isFromApi: true };
  }
  return { data: fallbackResults.slice(0, 8), isFromApi: false };
}

export { staticProducts, staticCategories, searchProducts };
export type { Product, Category };
