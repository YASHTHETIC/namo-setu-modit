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
          addresses: state.addresses.map((a) => {
            if (a.id !== id) return a;
            const updated = { ...a, ...updates };
            if (updates.isDefault === true) {
              return updated;
            }
            return updated;
          }).map((a) => {
            if (updates?.isDefault === true && a.id !== id) {
              return { ...a, isDefault: false };
            }
            return a;
          }),
        }));
      },

      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          const hasDefault = filtered.some((a) => a.isDefault);
          const finalAddresses = !hasDefault && filtered.length > 0
            ? filtered.map((a, i) => i === 0 ? { ...a, isDefault: true } : a)
            : filtered;
          return {
            addresses: finalAddresses,
            selectedAddressId:
              state.selectedAddressId === id
                ? finalAddresses[0]?.id ?? null
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
