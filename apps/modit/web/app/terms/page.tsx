"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-[#9B8CB5] hover:text-[#2D1B69]">
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-[#F0ECF9] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#2D1B69]" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-[#150726]">Terms of Service</h1>
              <p className="text-[11px] text-[#9B8CB5]">Last updated: August 2026</p>
            </div>
          </div>
          <div className="space-y-4 text-[13px] text-[#6B5B83] leading-relaxed">
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">1. About MODIT</h2>
              <p>MODIT (“Materials On Door”) is a B2B marketplace for construction materials. By placing an order you agree to these terms. Prices are in INR and include GST breakup shown at checkout and on your invoice.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">2. Orders & pricing</h2>
              <p>Bulk tier prices apply automatically when your quantity crosses the stated minimum. Sale prices are time-bound and revert automatically when the sale ends. We reserve the right to cancel orders with manifest pricing errors, with a full refund.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">3. Payments</h2>
              <p>We accept UPI, cards, netbanking (Razorpay), Cash on Delivery with OTP-verified mobile numbers, and Net-30 credit terms for verified business accounts. Credit orders are subject to GSTIN verification and an assigned credit limit.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">4. Delivery & inspection</h2>
              <p>Inspect goods at delivery and note shortages or damage on the delivery challan. Claims raised later are handled under the returns policy.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">5. Contact</h2>
              <p>For disputes or questions: support@modit.in. Subject to the jurisdiction of courts in your billing state.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
