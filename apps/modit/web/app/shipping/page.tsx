"use client";

import Link from "next/link";
import { ArrowLeft, Truck, RotateCcw } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-[#9B8CB5] hover:text-[#2D1B69]">
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-[#E8F9FC] flex items-center justify-center">
              <Truck className="h-5 w-5 text-[#00BCD4]" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-[#150726]">Shipping & Returns</h1>
              <p className="text-[11px] text-[#9B8CB5]">Delivery, tracking, returns and refunds</p>
            </div>
          </div>
          <div className="space-y-4 text-[13px] text-[#6B5B83] leading-relaxed">
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">1. Delivery</h2>
              <p>Standard delivery timelines are shown per product (pincode-checked). Orders above ₹5,000 ship free; a ₹99 fulfillment fee applies below that. Track every order live from Orders → order detail, which auto-refreshes.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">2. Bulk & site delivery</h2>
              <p>Full-truck and high-volume site deliveries are scheduled with our logistics team after order confirmation. Keep the site contact reachable on the delivery day.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1 flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-[#E91E63]" /> 3. Returns (7 days)</h2>
              <p>Delivered items can be returned within 7 days from Orders → Return: pick items, give a reason, choose refund to source, bank or UPI. Pickup is scheduled within 48 hours; refunds complete in 3–5 working days after quality check.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">4. Non-returnable</h2>
              <p>Custom-cut, tinted-to-order and site-consumed materials cannot be returned unless damaged on arrival (report within 24 hours with photos).</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
