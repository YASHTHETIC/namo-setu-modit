"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Apple } from "lucide-react";
import { ModitLogo } from "@/components/modit-logo";
import { openAppSheet } from "@/components/app-install-sheet";
import { ReferralModal } from "@/components/referral-modal";

/**
 * Shared site footer (all pages, including home).
 * Extra bottom padding keeps the fixed bottom nav clear of the legal row.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  const [showReferral, setShowReferral] = useState(false);

  return (
    <>
      <footer className={`mt-6 border-t border-white/5 relative overflow-hidden ${className}`} style={{ background: "linear-gradient(to bottom, #150726, #150726)", color: "rgba(255,255,255,0.5)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[var(--brand)]/30 to-transparent" />
        <div className="market-container py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <ModitLogo className="h-[42px] w-auto" light={true} />
              </div>
              <p className="mt-4 max-w-md text-sm leading-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                A production-grade procurement platform for building materials, supplier sourcing, bulk orders, and enterprise checkout.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>GST invoices</span>
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>Verified suppliers</span>
                <span className="rounded-full px-3 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>Project workflows</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={openAppSheet}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 transition-colors hover:!text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)" }}
                >
                  <Play className="h-5 w-5" style={{ color: "rgba(255,255,255,0.85)" }} />
                  <span className="text-left leading-tight">
                    <span className="block text-tiny font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Install on</span>
                    <span className="block text-body-sm font-bold" style={{ color: "#FFFFFF" }}>Android</span>
                  </span>
                </button>
                <button
                  onClick={openAppSheet}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 transition-colors hover:!text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)" }}
                >
                  <Apple className="h-5 w-5" style={{ color: "rgba(255,255,255,0.85)" }} />
                  <span className="text-left leading-tight">
                    <span className="block text-tiny font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Install on</span>
                    <span className="block text-body-sm font-bold" style={{ color: "#FFFFFF" }}>iPhone</span>
                  </span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Marketplace</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/products" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Products</Link></li>
                <li><Link href="/rfq" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">RFQ</Link></li>
                <li><Link href="/calculator" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Material Calculator</Link></li>
                <li><Link href="/projects" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Account</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/dashboard" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/orders" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Orders</Link></li>
                <li><Link href="/cart" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Cart</Link></li>
                <li><Link href="/notifications" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Support</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <li><Link href="/auth" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Login</Link></li>
                <li><Link href="/auth/register" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Create account</Link></li>
                <li><Link href="/dashboard/profile" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Profile settings</Link></li>
                <li><Link href="/payment/history" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Payment history</Link></li>
                <li><button onClick={openAppSheet} style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Get the app</button></li>
                <li><button onClick={() => setShowReferral(true)} style={{ color: "rgba(255,255,255,0.5)" }} className="hover:!text-white transition-colors">Refer & Earn ₹200</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 text-sm md:flex-row md:items-center md:justify-between" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p>&copy; 2026 MODIT. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Terms</Link>
              <Link href="/privacy" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Privacy</Link>
              <Link href="/shipping" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Shipping</Link>
              <Link href="/returns" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Returns</Link>
              <Link href="/contact" className="hover:!text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />
    </>
  );
}
