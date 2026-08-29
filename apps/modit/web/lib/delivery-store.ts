"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeliverySlot {
  id: string;
  label: string;
  time: string;
  cutoff: string;
  type: "express" | "standard" | "scheduled";
  fee: number;
  available: boolean;
}

interface DeliveryState {
  selectedSlotId: string | null;
  slots: DeliverySlot[];
  expressMinutes: number;

  selectSlot: (id: string) => void;
  getSelected: () => DeliverySlot | null;
  getExpressSlots: () => DeliverySlot[];
  getScheduledSlots: () => DeliverySlot[];
}

const defaultSlots: DeliverySlot[] = [
  { id: "express-30", label: "Express 30 min", time: "30 min", cutoff: "Now", type: "express", fee: 49, available: true },
  { id: "express-60", label: "Express 60 min", time: "60 min", cutoff: "Now", type: "express", fee: 0, available: true },
  { id: "standard-2hr", label: "Standard 2 hrs", time: "2 hours", cutoff: "Order by 6 PM", type: "standard", fee: 0, available: true },
  { id: "scheduled-morning", label: "Tomorrow Morning", time: "8 AM - 12 PM", cutoff: "Order by 10 PM", type: "scheduled", fee: 0, available: true },
  { id: "scheduled-afternoon", label: "Tomorrow Afternoon", time: "12 PM - 4 PM", cutoff: "Order by 2 PM", type: "scheduled", fee: 0, available: true },
  { id: "scheduled-evening", label: "Tomorrow Evening", time: "4 PM - 8 PM", cutoff: "Order by 6 PM", type: "scheduled", fee: 0, available: true },
];

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      selectedSlotId: "express-60",
      slots: defaultSlots,
      expressMinutes: 60,

      selectSlot: (id) => set({ selectedSlotId: id }),

      getSelected: () => {
        const state = get();
        return state.slots.find((s) => s.id === state.selectedSlotId) ?? state.slots[1];
      },

      getExpressSlots: () => get().slots.filter((s) => s.type === "express"),

      getScheduledSlots: () => get().slots.filter((s) => s.type === "scheduled" || s.type === "standard"),
    }),
    {
      name: "modit-delivery",
      partialize: (state) => ({
        selectedSlotId: state.selectedSlotId,
      }),
    }
  )
);
