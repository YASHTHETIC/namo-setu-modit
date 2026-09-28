"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SupplierStatus = "verified" | "pending" | "paused" | "rejected";

export interface SupplierScorecard {
  rating: number;
  reviews: number;
  onTime: number;
  claims: number;
  responseHrs: number;
}

export interface ManagedSupplier {
  id: string;
  code: string;
  name: string;
  /** catalog brand keyword — pausing hides these products from the store */
  brand: string;
  city: string;
  since: string;
  status: SupplierStatus;
  scorecard: SupplierScorecard;
  notes: string;
}

interface SupplierState {
  suppliers: ManagedSupplier[];
  setStatus: (id: string, status: SupplierStatus) => void;
  addSupplier: (input: Omit<ManagedSupplier, "id" | "status" | "scorecard" | "notes">) => ManagedSupplier;
  updateNotes: (id: string, notes: string) => void;
}

const seed: ManagedSupplier[] = [
  { id: "s1", code: "SUP-001", name: "Asian Paints Distributor", brand: "Asian Paints", city: "Mumbai", since: "2025-11-15", status: "verified", scorecard: { rating: 4.8, reviews: 2310, onTime: 96, claims: 0.6, responseHrs: 2 }, notes: "" },
  { id: "s2", code: "SUP-002", name: "Kajaria Ceramics Partner", brand: "Kajaria", city: "Delhi NCR", since: "2025-12-01", status: "verified", scorecard: { rating: 4.7, reviews: 1870, onTime: 94, claims: 0.8, responseHrs: 3 }, notes: "" },
  { id: "s3", code: "SUP-003", name: "Hettich India Supply", brand: "Hettich", city: "Bengaluru", since: "2026-01-10", status: "verified", scorecard: { rating: 4.6, reviews: 1240, onTime: 93, claims: 1.1, responseHrs: 4 }, notes: "" },
  { id: "s4", code: "SUP-004", name: "Crompton Greaves Trade", brand: "Crompton", city: "Chennai", since: "2026-02-20", status: "verified", scorecard: { rating: 4.5, reviews: 960, onTime: 90, claims: 1.5, responseHrs: 5 }, notes: "" },
  { id: "s5", code: "SUP-005", name: "Pidilite Fevicol Channel", brand: "Fevicol", city: "Mumbai", since: "2026-03-05", status: "verified", scorecard: { rating: 4.6, reviews: 1530, onTime: 92, claims: 1.2, responseHrs: 4 }, notes: "" },
  { id: "s6", code: "SUP-006", name: "Jaquar Bath Fittings", brand: "Jaquar", city: "Delhi NCR", since: "2026-08-20", status: "pending", scorecard: { rating: 4.2, reviews: 380, onTime: 84, claims: 2.1, responseHrs: 7 }, notes: "GSTIN verified. Awaiting warehouse audit." },
];

export const SUPPLIER_STATUS_LABEL: Record<SupplierStatus, string> = {
  verified: "Verified",
  pending: "Pending approval",
  paused: "Paused",
  rejected: "Rejected",
};

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set) => ({
      suppliers: seed,
      setStatus: (id, status) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, status } : s)),
        })),
      addSupplier: (input) => {
        const s: ManagedSupplier = {
          ...input,
          id: `s${Date.now().toString(36)}`,
          status: "pending",
          scorecard: { rating: 4.0, reviews: 0, onTime: 85, claims: 2.0, responseHrs: 8 },
          notes: "",
        };
        set((state) => ({ suppliers: [s, ...state.suppliers] }));
        return s;
      },
      updateNotes: (id, notes) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, notes } : s)),
        })),
    }),
    { name: "modit-suppliers" }
  )
);

/** Catalog brands currently paused — their products hide store-wide. */
export function pausedBrands(): string[] {
  try {
    return useSupplierStore
      .getState()
      .suppliers.filter((s) => s.status === "paused")
      .map((s) => s.brand.toLowerCase());
  } catch {
    return [];
  }
}

export function isBrandPaused(brand: string | null): boolean {
  if (!brand) return false;
  const b = brand.toLowerCase();
  return pausedBrands().some((p) => b.includes(p) || p.includes(b));
}
