"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StockAlert {
  productId: string;
  productName: string;
  email: string;
  createdAt: number;
}

interface StockAlertState {
  alerts: StockAlert[];
  addAlert: (productId: string, productName: string, email: string) => void;
  hasAlert: (productId: string) => boolean;
  removeAlert: (productId: string) => void;
}

export const useStockAlertStore = create<StockAlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      addAlert: (productId, productName, email) => {
        const existing = get().alerts.find((a) => a.productId === productId);
        if (existing) {
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.productId === productId ? { ...a, email, createdAt: Date.now() } : a
            ),
          }));
        } else {
          set((state) => ({
            alerts: [...state.alerts, { productId, productName, email, createdAt: Date.now() }],
          }));
        }
      },
      hasAlert: (productId) => get().alerts.some((a) => a.productId === productId),
      removeAlert: (productId) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.productId !== productId) })),
    }),
    { name: "modit-stock-alerts" }
  )
);