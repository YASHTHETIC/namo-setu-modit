"use client";

import Link from "next/link";
import { TriangleAlert, RotateCcw, Home } from "lucide-react";
import { FxBackdrop } from "@/components/fx";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <FxBackdrop tone="light" />
      <div className="relative w-full max-w-[560px] rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center sm:p-10">
        <div className="fx-float-slow mx-auto h-14 w-14 rounded-2xl bg-[#F0F9E8] flex items-center justify-center">
          <TriangleAlert className="h-7 w-7 text-[#FF9800]" />
        </div>
        <h1 className="mt-4 text-title-lg font-extrabold text-[#150726]">Something jammed on site</h1>
        <p className="mx-auto mt-2 max-w-[380px] text-body-sm text-[#6B5B83] leading-relaxed">
          This hiccup is on us, not your order. Try again — your cart and orders are safe.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="btn-shine inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2D1B69] px-5 py-3 text-body-sm font-bold text-white transition-colors hover:bg-[#150726]"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DDD6EE] px-5 py-3 text-body-sm font-bold text-[#150726] transition-colors hover:border-[#7CB518]"
          >
            <Home className="h-4 w-4 text-[#7CB518]" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
