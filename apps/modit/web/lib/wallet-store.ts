"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  orderId?: string;
  createdAt: number;
}

interface WalletState {
  balance: number;
  points: number;
  transactions: WalletTransaction[];
  referralCode: string;
  referralCount: number;

  addBalance: (amount: number, description: string, orderId?: string) => void;
  deductBalance: (amount: number, description: string, orderId?: string) => void;
  addPoints: (points: number, description: string) => void;
  redeemPoints: (points: number) => boolean;
  getTransactionHistory: () => WalletTransaction[];
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Launch-safe: real balances live server-side. Start at zero so the
      // storefront never shows stub money; points accrue from real orders.
      balance: 0,
      points: 0,
      referralCode: "MODIT2026",
      referralCount: 0,
      transactions: [],

      addBalance: (amount, description, orderId) => {
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `t${Date.now()}`,
              type: "credit",
              amount,
              description,
              orderId,
              createdAt: Date.now(),
            },
            ...state.transactions,
          ],
        }));
      },

      deductBalance: (amount, description, orderId) => {
        set((state) => {
          if (state.balance < amount) return state;
          return {
            balance: state.balance - amount,
            transactions: [
              {
                id: `t${Date.now()}`,
                type: "debit",
                amount,
                description,
                orderId,
                createdAt: Date.now(),
              },
              ...state.transactions,
            ],
          };
        });
      },

      addPoints: (points, description) => {
        set((state) => ({
          points: state.points + points,
          transactions: [
            {
              id: `t${Date.now()}`,
              type: "credit",
              amount: points,
              description,
              createdAt: Date.now(),
            },
            ...state.transactions,
          ],
        }));
      },

      redeemPoints: (points) => {
        const state = get();
        if (state.points < points) return false;
        set({
          points: state.points - points,
          balance: state.balance + points,
          transactions: [
            {
              id: `t${Date.now()}`,
              type: "credit",
              amount: points,
              description: "Points redeemed",
              createdAt: Date.now(),
            },
            ...state.transactions,
          ],
        });
        return true;
      },

      getTransactionHistory: () => get().transactions,
    }),
    {
      // v2 key: drops pre-launch stub balances (₹500/250pts) from old devices.
      name: "modit-wallet-v2",
      partialize: (state) => ({
        balance: state.balance,
        points: state.points,
        transactions: state.transactions.slice(0, 50),
        referralCode: state.referralCode,
        referralCount: state.referralCount,
      }),
    }
  )
);
