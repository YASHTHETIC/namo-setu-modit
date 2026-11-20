"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { ModitLogo } from "@/components/modit-logo";
import { ReferralModal } from "@/components/referral-modal";
import { useIsStandalone, useIsAppInstalled, usePwaInstall } from "@/lib/pwa";
import { openAppSheet } from "@/components/app-install-sheet";

/**
 * Shared site footer (all pages, including home) — 2028 Futuristic Clean Architecture:
 * ambient gradient wash, laser hairline border, airy link columns, app install triggers.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  const [showReferral, setShowReferral] = useState(false);
  const isApp = useIsStandalone();
  const isInstalled = useIsAppInstalled();
  const { canInstall, install } = usePwaInstall();

  const handleInstall = async () => {
    if (canInstall) {
      await install();
    } else {
      openAppSheet();
    }
  };

  const showAppCta = !isApp && !isInstalled;

  return (
    <>
      <footer className={`mt-10 border-t border-[#DDD6EE] bg-gradient-to-b from-[#F0ECF9] via-[#F5F2FC] to-[#EDE7F6] relative overflow-hidden ${className}`}>
        {/* Futuristic Laser Top Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#7CB518]/50 via-[#00BCD4]/50 to-transparent" />
        
        <div className="market-container py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.7fr]">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <ModitLogo className="h-[44px] w-auto drop-shadow-sm" />
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6B5B83]">
                Materials on Door — cement, paint, tiles, electricals &amp; steel with 60-minute express GPS dispatch and verified B2B GST tax invoices.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6EE] bg-white px-3.5 py-1.5 text-[#2D1B69] shadow-xs hover:border-[#7CB518] transition-colors">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#7CB518]" />
                  GST Invoices
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6EE] bg-white px-3.5 py-1.5 text-[#2D1B69] shadow-xs hover:border-[#00BCD4] transition-colors">
                  <Truck className="h-3.5 w-3.5 text-[#00BCD4]" />
                  60-Min Express
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6EE] bg-white px-3.5 py-1.5 text-[#2D1B69] shadow-xs hover:border-[#E91E63] transition-colors">
                  <RotateCcw className="h-3.5 w-3.5 text-[#E91E63]" />
                  7-Day Returns
                </span>
              </div>
              {showAppCta && (
                <div className="mt-5 hidden flex-wrap gap-2 sm:flex hide-in-app install-app-cta" data-hide-in-app="true">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-3 rounded-2xl border border-[#DDD6EE] bg-white px-4 py-2.5 transition-all hover:border-[#2D1B69] hover:shadow-md hover:scale-102 active:scale-95 cursor-pointer"
                  >
                    <Download className="h-5 w-5 text-[#7CB518]" />
                    <span className="text-left leading-tight">
                      <span className="block text-tiny font-black uppercase tracking-wider text-[#9B8CB5]">Download</span>
                      <span className="block text-body-sm font-extrabold text-[#150726]">MODIT App</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#150726]">Shop</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#6B5B83]">
                <li><Link href="/products" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">All Products</Link></li>
                <li><Link href="/rfq" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Bulk Quote (RFQ)</Link></li>
                <li><Link href="/calculator" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Material Calculator</Link></li>
                <li><Link href="/projects" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#150726]">Categories</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#6B5B83]">
                <li><Link href="/products?category=cement" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Cement</Link></li>
                <li><Link href="/products?category=painting" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Paints</Link></li>
                <li><Link href="/products?category=lighting" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Lighting</Link></li>
                <li><Link href="/products?category=tiling" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Tiles</Link></li>
                <li><Link href="/products?category=electrical" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Electricals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#150726]">Account</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#6B5B83]">
                <li><Link href="/dashboard" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Dashboard</Link></li>
                <li><Link href="/orders" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Orders</Link></li>
                <li><Link href="/cart" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Cart</Link></li>
                <li><Link href="/wishlist" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Wishlist</Link></li>
                <li><Link href="/notifications" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#150726]">Support</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#6B5B83]">
                <li><Link href="/auth" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Login</Link></li>
                <li><Link href="/auth/register" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Create account</Link></li>
                <li><Link href="/dashboard/profile" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Profile settings</Link></li>
                <li><Link href="/payment/history" className="transition-colors hover:text-[#2D1B69] hover:translate-x-1 inline-block">Payment history</Link></li>
                {showAppCta && (
                  <li className="hidden sm:block hide-in-app install-app-cta" data-hide-in-app="true">
                    <button onClick={handleInstall} className="transition-colors hover:text-[#2D1B69]">
                      Get the app
                    </button>
                  </li>
                )}
                <li><button onClick={() => setShowReferral(true)} className="font-extrabold text-[#5A8010] transition-colors hover:text-[#2D1B69]">Refer &amp; Earn ₹200</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-[#DDD6EE] pt-6 text-sm text-[#9B8CB5] md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 MODIT. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="transition-colors hover:text-[#2D1B69]">Terms</Link>
              <Link href="/privacy" className="transition-colors hover:text-[#2D1B69]">Privacy</Link>
              <Link href="/shipping" className="transition-colors hover:text-[#2D1B69]">Shipping</Link>
              <Link href="/returns" className="transition-colors hover:text-[#2D1B69]">Returns</Link>
              <Link href="/contact" className="transition-colors hover:text-[#2D1B69]">Contact</Link>
              <Link href="/supplier/apply" className="transition-colors hover:text-[#2D1B69]">Sell on MODIT</Link>
            </div>
          </div>
        </div>
      </footer>

      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />
    </>
  );
}
