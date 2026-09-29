"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-[#9B8CB5] hover:text-[#2D1B69]">
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-[#F0F9E8] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#7CB518]" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-[#150726]">Privacy Policy</h1>
              <p className="text-[11px] text-[#9B8CB5]">Last updated: August 2026</p>
            </div>
          </div>
          <div className="space-y-4 text-[13px] text-[#6B5B83] leading-relaxed">
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">1. What we collect</h2>
              <p>Account details (name, phone, email), delivery addresses, GSTIN for business invoices, order history, and device push tokens if you enable notifications. Carts, wishlists and preferences stay on your device.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">2. How we use it</h2>
              <p>To fulfil and track orders, issue GST invoices, verify COD orders over OTP, send order and sale alerts you opted into, and prevent fraud. We never sell your data.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">3. Notifications</h2>
              <p>Push and in-app notifications are opt-in. You can revoke browser permission anytime; in-app history can be cleared from Notifications → Mark all read.</p>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-[#150726] mb-1">4. Your rights</h2>
              <p>Write to support@modit.in to access, correct or delete your data. GST invoices already issued are retained as required by tax law.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
