"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-16 text-center shadow-[var(--shadow-sm)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <motion.div
          className="h-10 w-10 rounded-full border-[3px] border-[var(--border)] border-t-[var(--brand-color,#F97316)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
    </motion.div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
          <div className="skeleton mb-4 h-40 w-full rounded-xl" />
          <div className="skeleton mb-2 h-5 w-3/4 rounded-lg" />
          <div className="skeleton mb-4 h-4 w-1/2 rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  onBack,
  title = "Something went wrong",
}: {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  title?: string;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-900">{title}</h3>
          <p className="mt-2 text-sm text-red-700/80">{message}</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition-all hover:bg-red-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </button>
          )}
          {onRetry && (
            <motion.button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
