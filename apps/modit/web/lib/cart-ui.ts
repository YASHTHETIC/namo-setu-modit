"use client";

import { create } from "zustand";

interface CartUiState {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

/** Blinkit-style quick cart: one drawer opened from every cart entry point. */
export const useCartUi = create<CartUiState>()((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
