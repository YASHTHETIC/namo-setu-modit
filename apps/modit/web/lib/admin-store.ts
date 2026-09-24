"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductOverride {
  price?: number;
  mrp?: number;
  bulkPrice?: number | null;
  bulkMinQty?: number | null;
  stockLevel?: number;
  inStock?: boolean;
  hidden?: boolean;
}

export type SaleScope = "all" | "category" | "products";

export interface Sale {
  id: string;
  name: string;
  type: "percent" | "flat";
  /** percent 1-90, or flat rupees off */
  value: number;
  scope: SaleScope;
  categorySlugs: string[];
  productIds: string[];
  startAt: number;
  endAt: number;
  bannerTitle: string;
  bannerSubtitle: string;
  active: boolean;
  createdAt: number;
}

export interface OrderStatusOverride {
  orderId: string;
  status: string;
  updatedAt: number;
}

interface AdminState {
  overrides: Record<string, ProductOverride>;
  sales: Sale[];
  orderStatuses: Record<string, OrderStatusOverride>;

  setOverride: (productId: string, patch: ProductOverride) => void;
  clearOverride: (productId: string) => void;
  resetAllOverrides: () => void;

  addSale: (sale: Omit<Sale, "id" | "createdAt">) => Sale;
  updateSale: (id: string, patch: Partial<Sale>) => void;
  toggleSale: (id: string) => void;
  deleteSale: (id: string) => void;

  setOrderStatus: (orderId: string, status: string) => void;
}

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "dispatched",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      overrides: {},
      sales: [],
      orderStatuses: {},

      setOverride: (productId, patch) =>
        set((state) => ({
          overrides: { ...state.overrides, [productId]: { ...state.overrides[productId], ...patch } },
        })),
      clearOverride: (productId) =>
        set((state) => {
          const next = { ...state.overrides };
          delete next[productId];
          return { overrides: next };
        }),
      resetAllOverrides: () => set({ overrides: {} }),

      addSale: (sale) => {
        const full: Sale = {
          ...sale,
          id: `SALE-${Date.now().toString(36).toUpperCase()}`,
          createdAt: Date.now(),
        };
        set((state) => ({ sales: [full, ...state.sales] }));
        return full;
      },
      updateSale: (id, patch) =>
        set((state) => ({ sales: state.sales.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      toggleSale: (id) =>
        set((state) => ({ sales: state.sales.map((s) => (s.id === id ? { ...s, active: !s.active } : s)) })),
      deleteSale: (id) => set((state) => ({ sales: state.sales.filter((s) => s.id !== id) })),

      setOrderStatus: (orderId, status) =>
        set((state) => ({
          orderStatuses: { ...state.orderStatuses, [orderId]: { orderId, status, updatedAt: Date.now() } },
        })),
    }),
    { name: "modit-admin" }
  )
);

export function getActiveSaleAt(sales: Sale[], now: number): Sale | null {
  return (
    sales.find((s) => s.active && now >= s.startAt && now <= s.endAt) ?? null
  );
}

export function getUpcomingSaleAt(sales: Sale[], now: number): Sale | null {
  const upcoming = sales
    .filter((s) => s.active && s.startAt > now)
    .sort((a, b) => a.startAt - b.startAt);
  return upcoming[0] ?? null;
}
