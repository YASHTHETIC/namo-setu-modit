"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Coupon {
  code: string;
  description: string;
  discountType: "percentage" | "flat" | "free_shipping";
  discountValue: number;
  maxDiscount?: number;
  minOrder: number;
  validTill: string;
  usageLimit: number;
  usedCount: number;
  category?: string;
  brand?: string;
  active: boolean;
}

interface CouponState {
  appliedCoupon: Coupon | null;
  couponError: string;

  availableCoupons: Coupon[];

  applyCoupon: (code: string, orderTotal: number) => { success: boolean; message: string };
  removeCoupon: () => void;
  getDiscount: (subtotal: number) => number;
  getBestCoupon: (subtotal: number) => Coupon | null;
}

const defaultCoupons: Coupon[] = [
  { code: "FIRST100", description: "₹100 off on first order", discountType: "flat", discountValue: 100, minOrder: 1000, validTill: "2026-12-31", usageLimit: 1, usedCount: 0, active: true },
  { code: "BULK10", description: "10% off on orders above ₹5000", discountType: "percentage", discountValue: 10, maxDiscount: 500, minOrder: 5000, validTill: "2026-12-31", usageLimit: 5, usedCount: 0, active: true },
  { code: "CEMENT50", description: "₹50 off on cement orders", discountType: "flat", discountValue: 50, minOrder: 2000, validTill: "2026-12-31", usageLimit: 3, usedCount: 0, category: "cement", active: true },
  { code: "PAINT15", description: "15% off on paints", discountType: "percentage", discountValue: 15, maxDiscount: 300, minOrder: 1000, validTill: "2026-12-31", usageLimit: 3, usedCount: 0, category: "painting", active: true },
  { code: "FREESHIP", description: "Free delivery on all orders", discountType: "free_shipping", discountValue: 0, minOrder: 0, validTill: "2026-12-31", usageLimit: 10, usedCount: 0, active: true },
  { code: "MONSOON20", description: "20% off on waterproofing", discountType: "percentage", discountValue: 20, maxDiscount: 400, minOrder: 1500, validTill: "2026-09-30", usageLimit: 2, usedCount: 0, category: "tiling", active: true },
  { code: "LIGHT200", description: "₹200 off on lighting above ₹3000", discountType: "flat", discountValue: 200, minOrder: 3000, validTill: "2026-12-31", usageLimit: 2, usedCount: 0, category: "lighting", active: true },
];

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      appliedCoupon: null,
      couponError: "",
      availableCoupons: defaultCoupons,

      applyCoupon: (code, orderTotal) => {
        const coupon = get().availableCoupons.find(
          (c) => c.code.toUpperCase() === code.toUpperCase() && c.active
        );
        if (!coupon) {
          set({ couponError: "Invalid coupon code" });
          return { success: false, message: "Invalid coupon code" };
        }
        if (orderTotal < coupon.minOrder) {
          const msg = `Minimum order of ₹${coupon.minOrder} required`;
          set({ couponError: msg });
          return { success: false, message: msg };
        }
        if (coupon.usedCount >= coupon.usageLimit) {
          const msg = "Coupon usage limit reached";
          set({ couponError: msg });
          return { success: false, message: msg };
        }
        if (new Date(coupon.validTill) < new Date()) {
          const msg = "Coupon has expired";
          set({ couponError: msg });
          return { success: false, message: msg };
        }
        set({ appliedCoupon: coupon, couponError: "" });
        return { success: true, message: `Coupon "${coupon.code}" applied!` };
      },

      removeCoupon: () => set({ appliedCoupon: null, couponError: "" }),

      getDiscount: (subtotal) => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        switch (coupon.discountType) {
          case "flat":
            return Math.min(coupon.discountValue, subtotal);
          case "percentage": {
            const disc = Math.round((subtotal * coupon.discountValue) / 100);
            return coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
          }
          case "free_shipping":
            return 0;
          default:
            return 0;
        }
      },

      getBestCoupon: (subtotal) => {
        const coupons = get().availableCoupons.filter(
          (c) => c.active && subtotal >= c.minOrder && c.usedCount < c.usageLimit
        );
        if (coupons.length === 0) return null;
        return coupons.reduce((best, c) => {
          const bestDisc =
            best.discountType === "flat"
              ? best.discountValue
              : Math.min(
                  Math.round((subtotal * best.discountValue) / 100),
                  best.maxDiscount ?? Infinity
                );
          const curDisc =
            c.discountType === "flat"
              ? c.discountValue
              : Math.min(
                  Math.round((subtotal * c.discountValue) / 100),
                  c.maxDiscount ?? Infinity
                );
          return curDisc > bestDisc ? c : best;
        });
      },
    }),
    {
      name: "modit-coupons",
      partialize: (state) => ({
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
