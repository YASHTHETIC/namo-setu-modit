"use client";

import Link from "next/link";
import { ArrowLeft, Headset, Mail, MapPin, Clock } from "lucide-react";

const rows = [
  { icon: Mail, label: "Email us", value: "support@modit.in", href: "mailto:support@modit.in" },
  { icon: Headset, label: "In-app support chat", value: "Available after login, 7 days a week", href: "/dashboard" },
  { icon: Clock, label: "Support hours", value: "Mon–Sat, 9:00 AM – 7:00 PM IST", href: null },
  { icon: MapPin, label: "Warehouse", value: "MODIT Fulfilment Centre, Noida 201301, UP", href: null },
];

export default function ContactPage() {
  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-caption text-[#9B8CB5] hover:text-[#2D1B69]">
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-[#F0F9E8] flex items-center justify-center">
              <Headset className="h-5 w-5 text-[#7CB518]" />
            </div>
            <div>
              <h1 className="text-title-lg font-extrabold text-[#150726]">Contact Us</h1>
              <p className="text-micro text-[#9B8CB5]">Real humans, contractor-friendly hours</p>
            </div>
          </div>
          <div className="space-y-3">
            {rows.map((row) => {
              const body = (
                <>
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[#F8F6FC] flex items-center justify-center">
                    <row.icon className="h-5 w-5 text-[#2D1B69]" />
                  </div>
                  <div>
                    <p className="text-caption text-[#9B8CB5]">{row.label}</p>
                    <p className="text-body-sm font-bold text-[#150726]">{row.value}</p>
                  </div>
                </>
              );
              return row.href ? (
                <Link key={row.label} href={row.href} className="flex items-center gap-3 rounded-2xl border border-[#DDD6EE] p-4 transition-colors hover:border-[#7CB518]">
                  {body}
                </Link>
              ) : (
                <div key={row.label} className="flex items-center gap-3 rounded-2xl border border-[#DDD6EE] p-4">
                  {body}
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-body-sm text-[#6B5B83] leading-relaxed">
            For order issues, keep your order ID ready — it looks like <span className="font-bold text-[#150726]">PO-2026-XXXXXX</span> and is visible on Orders. GST invoice help, bulk quotes and contractor accounts are all handled on the same email.
          </p>
        </div>
      </div>
    </div>
  );
}
