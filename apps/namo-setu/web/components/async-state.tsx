"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

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

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-blue-500">ℹ</span>
        <span>{message || "Data is loading from the server..."}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-blue-600 hover:text-blue-800 underline">
          Retry
        </button>
      )}
    </div>
  );
}
