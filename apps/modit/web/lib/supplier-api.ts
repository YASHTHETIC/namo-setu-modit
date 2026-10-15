"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function supplierApply(payload: {
  business_name: string; contact_name: string; email: string; phone: string;
  password: string; gstin: string; pan: string; city: string; pincode: string;
  categories: string[]; brands: string[];
}) {
  return getSupplierApi().supplierApply(payload);
}

export function useSupplierApplications(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "applications"],
    queryFn: () => getSupplierApi().listSupplierApplications(),
    enabled,
    ...opts,
  });
}

export function useDecideApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, action }: { supplierId: string; action: "approve" | "reject" }) =>
      getSupplierApi().decideSupplierApplication(supplierId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modit", "supplier", "applications"] }),
  });
}

export function useSupplierRfqs(enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "rfqs"],
    queryFn: () => getSupplierApi().supplierRfqs(),
    enabled,
    ...opts,
  });
}

export function useSupplierRfqDetail(rfqId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["modit", "supplier", "rfq", rfqId],
    queryFn: () => getSupplierApi().getRFQ(rfqId!),
    enabled: Boolean(rfqId) && enabled,
    ...opts,
  });
}

export function useQuoteRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfqId, payload }: {
      rfqId: string;
      payload: {
        lines: Array<{ product_id: string; quantity: number; unit_price: number }>;
        valid_until?: string | null; terms_and_conditions?: string | null;
      };
    }) => getSupplierApi().quoteRFQ(rfqId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modit", "supplier", "rfqs"] }),
  });
}
