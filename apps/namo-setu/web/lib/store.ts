import { create } from "zustand";

type ShellMode = "overview" | "operations";

interface ShellState {
  viewMode: ShellMode;
  sidebarOpen: boolean;
  setViewMode: (mode: ShellMode) => void;
  toggleSidebar: () => void;
}

export const useShellStore = create<ShellState>((set) => ({
  viewMode: "overview",
  sidebarOpen: true,
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
