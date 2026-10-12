"use client";

import Link from "next/link";
import { ArrowLeft, Undo2 } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-caption text-[#9B8CB5] hover:text-[#2D1B69]">
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-[#F0F9E8] flex items-center justify-center">
              <Undo2 className="h-5 w-5 text-[#7CB518]" />
            </div>
            <div>
              <h1 className="text-title-lg font-extrabold text-[#150726]">Returns &amp; Refunds</h1>
              <p className="text-micro text-[#9B8CB5]">Last updated: October 2026</p>
            </div>
          </div>
          <div className="space-y-4 text-body-sm text-[#6B5B83] leading-relaxed">
            <section>
              <h2 className="text-body-md font-bold text-[#150726] mb-1">1. 7-day easy returns</h2>
              <p>Unused products in original packing can be returned within 7 days of delivery. Raise the request from Orders → Return, and our team approves it within 24 hours.</p>
            </section>
            <section>
              <h2 className="text-body-md font-bold text-[#150726] mb-1">2. What can&apos;t be returned</h2>
              <p>Cement or putty bags once cut open, paint once opened or tinted, and any material already used on site. Damaged-in-transit items are always covered — just share a photo.</p>
            </section>
            <section>
              <h2 className="text-body-md font-bold text-[#150726] mb-1">3. Refund timelines</h2>
              <p>Prepaid orders are refunded to the original payment source in 5–7 working days. Cash on Delivery orders are refunded to your bank account or UPI within 3–5 working days of pickup.</p>
            </section>
            <section>
              <h2 className="text-body-md font-bold text-[#150726] mb-1">4. Need help?</h2>
              <p>Write to support@modit.in with your order ID, or use the in-app support chat. Bulk and contractor orders get a dedicated manager callback.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/orders" className="inline-flex items-center gap-2 rounded-xl bg-[#2D1B69] px-5 py-2.5 text-body-sm font-bold text-white hover:bg-[#1E1245] transition-all">
                  Go to Orders
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border-2 border-[#DDD6EE] bg-white px-5 py-2.5 text-body-sm font-bold text-[#150726] hover:border-[#2D1B69] transition-all">
                  Contact support
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
