/** Marketplace commission by category — Blinkit-style slab (8–12%). */
export const COMMISSION_PCT: Record<string, number> = {
  cement: 8,
  steel: 10,
  painting: 12,
  lighting: 12,
  tiling: 10,
  electrical: 12,
  hardware: 10,
  plywood: 10,
};
export const DEFAULT_COMMISSION_PCT = 10;
export const FULFILLMENT_FEE = 99;
export const FREE_FULFILLMENT_ABOVE = 5000;
export const TCS_PCT = 0.5;

export function commissionForCategory(slug: string | undefined): number {
  if (!slug) return DEFAULT_COMMISSION_PCT;
  return COMMISSION_PCT[slug] ?? DEFAULT_COMMISSION_PCT;
}

export interface SettleRow {
  id: string;
  date: string;
  status: string;
  gross: number;
  commission: number;
  fulfillment: number;
  tcs: number;
  net: number;
}

export function settleOrder(o: {
  order_number?: string;
  id: string;
  placed_at?: string;
  status: string;
  total?: number;
  items?: Array<{ unitPrice?: number; price?: number; quantity?: number; categorySlug?: string }>;
}): SettleRow {
  const gross = o.total || 0;
  let commission = 0;
  if (Array.isArray(o.items) && o.items.length > 0) {
    commission = o.items.reduce((s, it) => {
      const line = (it.unitPrice || it.price || 0) * (it.quantity || 1);
      return s + (line * commissionForCategory(it.categorySlug) / 100);
    }, 0);
  } else {
    commission = gross * DEFAULT_COMMISSION_PCT / 100;
  }
  const fulfillment = gross >= FREE_FULFILLMENT_ABOVE ? 0 : FULFILLMENT_FEE;
  const tcs = gross * TCS_PCT / 100;
  return {
    id: o.order_number || o.id,
    date: o.placed_at ? new Date(o.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—",
    status: o.status,
    gross,
    commission: Math.round(commission),
    fulfillment,
    tcs: Math.round(tcs),
    net: Math.round(gross - commission - fulfillment - tcs),
  };
}
