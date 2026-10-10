"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminActionType =
  | "product.update"
  | "product.reset"
  | "product.bulk_update"
  | "product.create"
  | "sale.create"
  | "sale.update"
  | "sale.toggle"
  | "sale.delete"
  | "order.status"
  | "coupon.create"
  | "coupon.update"
  | "coupon.toggle"
  | "coupon.delete"
  | "return.advance"
  | "supplier.status"
  | "supplier.add"
  | "store.create"
  | "store.restock"
  | "store.reorder"
  | "admin.unlock";

export interface AdminActivity {
  id: string;
  type: AdminActionType;
  summary: string;
  detail?: string;
  at: number;
}

interface AdminActivityState {
  entries: AdminActivity[];
  log: (type: AdminActionType, summary: string, detail?: string) => void;
  clear: () => void;
}

export const ADMIN_ACTION_LABEL: Record<AdminActionType, string> = {
  "product.update": "Price / stock updated",
  "product.reset": "Product reset to default",
  "product.bulk_update": "Bulk price update",
  "product.create": "Product added to catalog",
  "sale.create": "Sale created",
  "sale.update": "Sale updated",
  "sale.toggle": "Sale paused / activated",
  "sale.delete": "Sale deleted",
  "order.status": "Order status changed",
  "coupon.create": "Coupon created",
  "coupon.update": "Coupon updated",
  "coupon.toggle": "Coupon paused / activated",
  "coupon.delete": "Coupon deleted",
  "return.advance": "Return advanced",
  "supplier.status": "Supplier status changed",
  "supplier.add": "Supplier onboarded",
  "store.create": "Store opened",
  "store.restock": "Stock adjusted",
  "store.reorder": "AI reorder run",
  "admin.unlock": "Panel unlocked",
};

export const useAdminActivity = create<AdminActivityState>()(
  persist(
    (set) => ({
      entries: [],
      log: (type, summary, detail) =>
        set((state) => ({
          entries: [
            {
              id: `ACT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`,
              type,
              summary,
              detail,
              at: Date.now(),
            },
            ...state.entries,
          ].slice(0, 300),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "modit-admin-activity" }
  )
);

export function logAdminActivity(type: AdminActionType, summary: string, detail?: string) {
  try {
    useAdminActivity.getState().log(type, summary, detail);
  } catch {
    /* storage unavailable — ignore */
  }
}
