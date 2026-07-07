import React from "react";
import { cn } from "@foundation/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rounded";
}

export function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    text: "rounded-sm h-4",
    circular: "rounded-full",
    rounded: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" variant="rounded" />
        <Skeleton className="h-8 w-20" variant="rounded" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-5 w-full" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-6 w-16" variant="rounded" />
        <Skeleton className="h-4 w-12" variant="text" />
      </div>
      <Skeleton className="h-10 w-full" variant="rounded" />
    </div>
  );
}

export function TempleCardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-8 w-8" variant="circular" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-slate-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" variant="text" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b border-slate-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
          <Skeleton className="h-12 w-12" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/2" variant="text" />
          </div>
          <Skeleton className="h-8 w-20" variant="rounded" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" variant="text" />
        <Skeleton className="h-10 w-full" variant="rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" variant="text" />
        <Skeleton className="h-24 w-full" variant="rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" variant="text" />
        <Skeleton className="h-10 w-full" variant="rounded" />
      </div>
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-32" variant="rounded" />
        <Skeleton className="h-10 w-24" variant="rounded" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <Skeleton className="h-8 w-8" variant="circular" />
            <Skeleton className="h-8 w-20" variant="text" />
            <Skeleton className="h-4 w-16" variant="text" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-6 w-40 mb-4" variant="text" />
        <Skeleton className="h-64 w-full" variant="rounded" />
      </div>
      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-6 w-32 mb-4" variant="text" />
        <ListSkeleton items={3} />
      </div>
    </div>
  );
}
