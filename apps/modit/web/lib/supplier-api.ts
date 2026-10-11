"use client";

import { useQuery } from "@tanstack/react-query";
import { createApiClient, createModitApi } from "@foundation/api-client";

import { getAccessToken } from "./auth";
import { env } from "./env";

function getSupplierApi() {
  return createModitApi(
    createApiClient({
      baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
      accessToken: getAccessToken(),
      timeout: 8000,
      maxRetries: 1,
      retryDelay: 300,
    })
  );
}

const opts = { retry: false, staleTime: 30_000, gcTime: 60_000 } as const;

export function useSupplierMe(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "me"],
    queryFn: () => getSupplierApi().supplierMe(),
    enabled,
    ...opts,
  });
}

export function useSupplierProducts(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "products"],
    queryFn: () => getSupplierApi().supplierProducts({ page: 1, page_size: 200 }),
    enabled,
    ...opts,
  });
}

export function useSupplierOrders(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "orders"],
    queryFn: () => getSupplierApi().supplierOrders(),
    enabled,
    ...opts,
  });
}

export function useSupplierSummary(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "summary"],
    queryFn: () => getSupplierApi().supplierSummary(),
    enabled,
    ...opts,
  });
}

export function useSupplierPayouts(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "payouts"],
    queryFn: () => getSupplierApi().supplierPayouts(),
    enabled,
    ...opts,
  });
}
