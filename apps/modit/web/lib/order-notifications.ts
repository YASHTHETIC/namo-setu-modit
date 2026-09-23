"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderEventNotification {
  id: string;
  title: string;
  body: string;
  type: "order" | "payment" | "delivery" | "return" | "rfq" | "alert" | "promo";
  orderId?: string;
  read: boolean;
  createdAt: number;
}

interface OrderNotificationState {
  events: OrderEventNotification[];
  push: (input: Omit<OrderEventNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useOrderNotificationStore = create<OrderNotificationState>()(
  persist(
    (set, get) => ({
      events: [],
      push: (input) => {
        set((state) => ({
          events: [
            {
              ...input,
              id: `EVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`,
              read: false,
              createdAt: Date.now(),
            },
            ...state.events,
          ].slice(0, 100),
        }));
      },
      markRead: (id) =>
        set((state) => ({ events: state.events.map((e) => (e.id === id ? { ...e, read: true } : e)) })),
      markAllRead: () => set((state) => ({ events: state.events.map((e) => ({ ...e, read: true })) })),
      unreadCount: () => get().events.filter((e) => !e.read).length,
    }),
    { name: "modit-order-events" }
  )
);

export function notifyOrderEvent(input: Omit<OrderEventNotification, "id" | "read" | "createdAt">) {
  try {
    useOrderNotificationStore.getState().push(input);
  } catch {
    /* storage unavailable — ignore */
  }
}
