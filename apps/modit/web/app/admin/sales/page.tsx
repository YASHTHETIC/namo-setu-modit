"use client";

import Link from "next/link";
import { Zap, Ticket, Tag } from "lucide-react";

/**
 * Honest stub: the scheduled "sale engine" these screens used to simulate is
 * not built — sale rows used to live only in the browser and never moved a
 * single price, banner or order. Pricing truth today:
 *  - Product prices/Live-Hidden: Products & Pricing (server PATCH)
 *  - Coupon offers validated server-side at checkout: Coupons
 * A server-backed campaign scheduler can replace this screen when built.
 */
export default function AdminSalesPage() {
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FF9800]" /> Sales & Banners
          </h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">
            Scheduled sale campaigns are not part of the platform yet — nothing here previously changed real prices.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#DDD6EE] bg-white p-8 max-w-2xl">
        <div className="h-12 w-12 rounded-2xl bg-[#F0F9E8] flex items-center justify-center mb-4">
          <Zap className="h-6 w-6 text-[#5a8010]" />
        </div>
        <p className="text-body-md font-extrabold text-[#150726]">Run promotions the honest way today</p>
        <p className="text-caption text-[#5C4A7A] mt-1 leading-relaxed">
          Discounts are real right now through two server-backed tools:
        </p>
        <div className="mt-4 grid gap-2">
          <Link
            href="/admin/products"
            className="rounded-xl border border-[#DDD6EE] bg-white p-3 flex items-center gap-3 hover:border-[#2D1B69]/40 transition-colors"
          >
            <span className="h-9 w-9 rounded-lg bg-[#F0ECF9] flex items-center justify-center"><Tag className="h-4 w-4 text-[#2D1B69]" /></span>
            <span>
              <span className="block text-body-sm font-bold text-[#150726]">Products & Pricing</span>
              <span className="block text-micro text-[#9B8CB5]">Set price, MRP and Live/Hidden per product — buyers always see exactly what they pay.</span>
            </span>
          </Link>
          <Link
            href="/admin/coupons"
            className="rounded-xl border border-[#DDD6EE] bg-white p-3 flex items-center gap-3 hover:border-[#2D1B69]/40 transition-colors"
          >
            <span className="h-9 w-9 rounded-lg bg-[#F8CB46]/20 flex items-center justify-center"><Ticket className="h-4 w-4 text-[#B45309]" /></span>
            <span>
              <span className="block text-body-sm font-bold text-[#150726]">Coupons</span>
              <span className="block text-micro text-[#9B8CB5]">Checkout-validated offer codes — flat, percent or free shipping — with usage limits.</span>
            </span>
          </Link>
        </div>
        <p className="text-micro text-[#9B8CB5] mt-4">
          A scheduled sale engine (auto price drops, banners, reverts) would need server-side campaign storage and will be built deliberately, not faked.
        </p>
      </div>

      {/* Legacy client-side sale previews (browser-only) were removed: they
          never affected the storefront and would mislead staff. */}
      <p className="text-micro text-[#9B8CB5] mt-4">Previously created browser-only sale previews have been deleted — verify your current prices on the products list.</p>
    </div>
  );
}
