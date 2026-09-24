"use client";

import { create } from "zustand";

interface AdminAuthState {
  unlocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
}

function expectedPin(): string {
  const envPin =
    typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_ADMIN_PIN : undefined;
  return envPin || "1234";
}

export function getAdminPinHint(): string {
  return typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_PIN
    ? "Enter the staff PIN to continue."
    : "Demo PIN: 1234 (set NEXT_PUBLIC_ADMIN_PIN for a private PIN)";
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  unlocked:
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("modit-admin-unlocked") === "1",
  unlock: (pin) => {
    if (pin.trim() === expectedPin()) {
      try {
        sessionStorage.setItem("modit-admin-unlocked", "1");
      } catch {
        /* ignore */
      }
      set({ unlocked: true });
      return true;
    }
    return false;
  },
  lock: () => {
    try {
      sessionStorage.removeItem("modit-admin-unlocked");
    } catch {
      /* ignore */
    }
    set({ unlocked: false });
  },
}));
