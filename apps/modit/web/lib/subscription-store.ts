"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";

export interface Subscription {
  id: string;
  product: Product;
  variantId?: string;
  quantity: number;
  frequency: "weekly" | "biweekly" | "monthly";
  nextDelivery: string;
  active: boolean;
  createdAt: number;
}

interface SubscriptionState {
  subscriptions: Subscription[];

  addSubscription: (product: Product, quantity: number, frequency: Subscription["frequency"], variantId?: string) => void;
  removeSubscription: (id: string) => void;
  toggleSubscription: (id: string) => void;
  getActiveCount: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      addSubscription: (product, quantity, frequency, variantId) => {
        const now = new Date();
        const days = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
        now.setDate(now.getDate() + days);
        set((state) => ({
          subscriptions: [
            ...state.subscriptions,
            {
              id: `sub-${Date.now()}`,
              product,
              variantId,
              quantity,
              frequency,
              nextDelivery: now.toISOString(),
              active: true,
              createdAt: Date.now(),
            },
          ],
        }));
      },

      removeSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }));
      },

      toggleSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, active: !s.active } : s
          ),
        }));
      },

      getActiveCount: () => get().subscriptions.filter((s) => s.active).length,
    }),
    {
      name: "modit-subscriptions",
      partialize: (state) => ({
        subscriptions: state.subscriptions,
      }),
    }
  )
);
