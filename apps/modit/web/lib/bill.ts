"use client";

import { useCartStore } from "./cart-store";
import { useCouponStore } from "./coupon-store";

export interface Bill {
  count: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  gst: number;
  couponDiscount: number;
  isFreeShipping: boolean;
  shipping: number;
  total: number;
}

/** Single bill math for drawer/cart/checkout estimates (mirrors the server:
 *  free shipping only when the POST-discount subtotal clears ₹5000). */
export function computeBill(): Bill {
  const cart = useCartStore.getState();
  const coupon = useCouponStore.getState();
  const items = cart.items;
  const subtotal = cart.getCartTotal();
  const mrpTotal = cart.getCartMRP();
  const gst = cart.getCartGST();
  const couponDiscount = coupon.getDiscount(subtotal);
  const isFreeShipping = coupon.appliedCoupon?.discountType === "free_shipping";
  const shipping = subtotal - couponDiscount >= 5000 ? 0 : 250;
  const effectiveShipping = isFreeShipping ? 0 : shipping;
  return {
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    mrpTotal,
    savings: Math.max(0, mrpTotal - subtotal),
    gst,
    couponDiscount,
    isFreeShipping,
    shipping: effectiveShipping,
    total: Math.max(0, subtotal + gst + effectiveShipping - couponDiscount),
  };
}
