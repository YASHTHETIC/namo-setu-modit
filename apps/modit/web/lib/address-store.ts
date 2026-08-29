"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
  type: "site" | "home" | "warehouse" | "office";
}

interface AddressState {
  addresses: Address[];
  selectedAddressId: string | null;

  addAddress: (addr: Omit<Address, "id">) => void;
  updateAddress: (id: string, addr: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefault: (id: string) => void;
  selectAddress: (id: string) => void;
  getSelected: () => Address | null;
  getDefault: () => Address | null;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [
        {
          id: "a1",
          label: "Site Office",
          name: "Rajesh Kumar",
          phone: "+91 98765 43210",
          line1: "42, MG Road, Near Metro Station",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          isDefault: true,
          type: "site",
        },
        {
          id: "a2",
          label: "Warehouse",
          name: "Rajesh Kumar",
          phone: "+91 98765 43210",
          line1: "15, Industrial Area Phase 2",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400070",
          isDefault: false,
          type: "warehouse",
        },
      ],
      selectedAddressId: "a1",

      addAddress: (addr) => {
        const id = `a${Date.now()}`;
        set((state) => ({
          addresses: [
            ...state.addresses.map((a) =>
              addr.isDefault ? { ...a, isDefault: false } : a
            ),
            { ...addr, id },
          ],
          selectedAddressId: addr.isDefault ? id : state.selectedAddressId,
        }));
      },

      updateAddress: (id, updates) => {
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0].isDefault = true;
          }
          return {
            addresses: filtered,
            selectedAddressId:
              state.selectedAddressId === id
                ? filtered[0]?.id ?? null
                : state.selectedAddressId,
          };
        });
      },

      setDefault: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        }));
      },

      selectAddress: (id) => set({ selectedAddressId: id }),

      getSelected: () => {
        const state = get();
        return (
          state.addresses.find((a) => a.id === state.selectedAddressId) ??
          state.addresses.find((a) => a.isDefault) ??
          state.addresses[0] ??
          null
        );
      },

      getDefault: () => {
        return get().addresses.find((a) => a.isDefault) ?? get().addresses[0] ?? null;
      },
    }),
    {
      name: "modit-addresses",
      partialize: (state) => ({
        addresses: state.addresses,
        selectedAddressId: state.selectedAddressId,
      }),
    }
  )
);
