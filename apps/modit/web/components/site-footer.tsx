"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Apple } from "lucide-react";
import { ModitLogo } from "@/components/modit-logo";
import { openAppSheet } from "@/components/app-install-sheet";
import { ReferralModal } from "@/components/referral-modal";

/**
 * Shared site footer (all pages, including home) — Blinkit-style light
 * architecture in MODIT colors: lavender wash, brand-purple headings,
 * airy link columns, app buttons, legal row.
 * Extra bottom padding keeps the fixed bottom nav clear of the legal row.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  const [showReferral, setShowReferral] = useState(false);

  return (
    <>
      <footer className={`mt-6 border-t border-[#DDD6EE] bg-[#F0ECF9] ${className}`}>
        {/* Same 1440 edge as every home section — footer columns line up
            with the content above instead of a narrower box */}
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <ModitLogo className="h-[42px] w-auto" />
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#6B5B83]">
                Construction materials at your doorstep — cement, paint, tiles, lights and more, with same-day dispatch and GST invoices.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-[#DDD6EE] bg-white px-3 py-1.5 text-[#2D1B69]">GST invoices</span>
                <span className="rounded-full border border-[#DDD6EE] bg-white px-3 py-1.5 text-[#2D1B69]">Verified suppliers</span>
                <span className="rounded-full border border-[#DDD6EE] bg-white px-3 py-1.5 text-[#2D1B69]">7-day replacement</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={openAppSheet}
                  className="flex items-center gap-2.5 rounded-xl border border-[#DDD6EE] bg-white px-3.5 py-2 transition-all hover:border-[#2D1B69]"
                >
                  <Play className="h-5 w-5 text-[#2D1B69]" />
                  <span className="text-left leading-tight">
                    <span className="block text-tiny font-semibold uppercase tracking-wider text-[#9B8CB5]">Install on</span>
                    <span className="block text-body-sm font-bold text-[#150726]">Android</span>
                  </span>
                </button>
                <button
                  onClick={openAppSheet}
                  className="flex items-center gap-2.5 rounded-xl border border-[#DDD6EE] bg-white px-3.5 py-2 transition-all hover:border-[#2D1B69]"
                >
                  <Apple className="h-5 w-5 text-[#2D1B69]" />
                  <span className="text-left leading-tight">
                    <span className="block text-tiny font-semibold uppercase tracking-wider text-[#9B8CB5]">Install on</span>
                    <span className="block text-body-sm font-bold text-[#150726]">iPhone</span>
                  </span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#150726]">Shop</h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B5B83]">
                <li><Link href="/products" className="transition-colors hover:text-[#2D1B69]">All Products</Link></li>
                <li><Link href="/rfq" className="transition-colors hover:text-[#2D1B69]">Bulk Quote (RFQ)</Link></li>
                <li><Link href="/calculator" className="transition-colors hover:text-[#2D1B69]">Material Calculator</Link></li>
                <li><Link href="/projects" className="transition-colors hover:text-[#2D1B69]">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#150726]">Categories <Link href="/products" className="ml-1 text-xs font-semibold text-[#5A8010] hover:underline">see all</Link></h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B5B83]">
                <li><Link href="/products?category=cement" className="transition-colors hover:text-[#2D1B69]">Cement</Link></li>
                <li><Link href="/products?category=painting" className="transition-colors hover:text-[#2D1B69]">Paints</Link></li>
                <li><Link href="/products?category=lighting" className="transition-colors hover:text-[#2D1B69]">Lighting</Link></li>
                <li><Link href="/products?category=tiling" className="transition-colors hover:text-[#2D1B69]">Tiles</Link></li>
                <li><Link href="/products?category=electrical" className="transition-colors hover:text-[#2D1B69]">Electricals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#150726]">Account</h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B5B83]">
                <li><Link href="/dashboard" className="transition-colors hover:text-[#2D1B69]">Dashboard</Link></li>
                <li><Link href="/orders" className="transition-colors hover:text-[#2D1B69]">Orders</Link></li>
                <li><Link href="/cart" className="transition-colors hover:text-[#2D1B69]">Cart</Link></li>
                <li><Link href="/wishlist" className="transition-colors hover:text-[#2D1B69]">Wishlist</Link></li>
                <li><Link href="/notifications" className="transition-colors hover:text-[#2D1B69]">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#150726]">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B5B83]">
                <li><Link href="/auth" className="transition-colors hover:text-[#2D1B69]">Login</Link></li>
                <li><Link href="/auth/register" className="transition-colors hover:text-[#2D1B69]">Create account</Link></li>
                <li><Link href="/dashboard/profile" className="transition-colors hover:text-[#2D1B69]">Profile settings</Link></li>
                <li><Link href="/payment/history" className="transition-colors hover:text-[#2D1B69]">Payment history</Link></li>
                <li><button onClick={openAppSheet} className="transition-colors hover:text-[#2D1B69]">Get the app</button></li>
                <li><button onClick={() => setShowReferral(true)} className="font-semibold text-[#5A8010] transition-colors hover:text-[#2D1B69]">Refer & Earn ₹200</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#DDD6EE] pt-6 text-sm text-[#9B8CB5] md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 MODIT. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="transition-colors hover:text-[#2D1B69]">Terms</Link>
              <Link href="/privacy" className="transition-colors hover:text-[#2D1B69]">Privacy</Link>
              <Link href="/shipping" className="transition-colors hover:text-[#2D1B69]">Shipping</Link>
              <Link href="/returns" className="transition-colors hover:text-[#2D1B69]">Returns</Link>
              <Link href="/contact" className="transition-colors hover:text-[#2D1B69]">Contact</Link>
              <Link href="/supplier" className="transition-colors hover:text-[#2D1B69]">Sell on MODIT</Link>
            </div>
          </div>
        </div>
      </footer>

      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />
    </>
  );
}
