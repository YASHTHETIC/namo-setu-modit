"use client";

import type { ReactNode } from "react";
import { isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="border-b border-stone-100 px-6 py-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function CompactPanel({
  title,
  children,
  className = "",
}: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      {title && (
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

function renderMetricIcon(icon: LucideIcon | ReactNode) {
  if (isValidElement(icon)) return icon;
  const Icon = icon as LucideIcon;
  return <Icon className="h-4 w-4" />;
}

interface MetricTileProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaLabel?: string;
  icon: LucideIcon | ReactNode;
}

export function MetricTile({ label, value, delta, deltaLabel, icon }: MetricTileProps) {
  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600">
          {renderMetricIcon(icon)}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <strong className="text-2xl font-bold tracking-tight text-slate-900">{value}</strong>
        {delta !== undefined && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", Number(delta) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
            {Number(delta) >= 0 ? "+" : ""}{delta}{deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color,#F97316)] focus:ring-2 focus:ring-[var(--brand-color,#F97316)]/10 disabled:opacity-50 disabled:cursor-not-allowed";

export function StatusPill({
  children,
  tone = "slate",
}: { children: ReactNode; tone?: "slate" | "orange" | "teal" | "emerald" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    orange: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 ring-1 ring-orange-200/60",
    teal: "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 ring-1 ring-teal-200/60",
    emerald: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-1 ring-emerald-200/60",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Badge({
  children,
  variant = "default",
}: { children: ReactNode; variant?: "default" | "success" | "warning" | "danger" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} />;
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}

export function SectionHeader({
  label,
  title,
  subtitle,
  detail,
  action,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  detail?: string;
  action?: ReactNode;
}) {
  const description = subtitle ?? detail;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {label && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">{label}</p>
        )}
        <h2 className={cn(label ? "mt-1.5" : "", "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl")}>
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-lg text-base leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function FormRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-stone-100 px-6 py-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-stone-100 px-6 py-4", className)}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/30",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-stone-200 bg-white text-slate-700 hover:bg-stone-50 hover:border-stone-300",
    ghost: "text-slate-600 hover:bg-stone-100 hover:text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-7 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href = "#",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}) {
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/30",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-stone-200 bg-white text-slate-700 hover:bg-stone-50 hover:border-stone-300",
    ghost: "text-slate-600 hover:bg-stone-100 hover:text-slate-900",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-7 text-base",
  };

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </a>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-[100px] resize-y", className)} {...props} />;
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, className)} {...props} />;
}

export function Separator({ className = "" }: { className?: string }) {
  return <hr className={cn("border-stone-200/60", className)} />;
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
}: {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  return (
    <div className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", sizes[size])}>
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 font-semibold">
          {fallback}
        </div>
      )}
    </div>
  );
}

export function Tooltip({ children, content }: { children: ReactNode; content: string }) {
  return (
    <div className="relative inline-block group">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:mb-3 whitespace-nowrap z-10">
        {content}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-muted)]">
        {renderMetricIcon(icon)}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Divider({ className = "", children }: { className?: string; children?: ReactNode }) {
  if (children) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <hr className="flex-1 border-stone-200/60" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{children}</span>
        <hr className="flex-1 border-stone-200/60" />
      </div>
    );
  }
  return <hr className={cn("border-stone-200/60", className)} />;
}

export function Tag({ children, variant = "default", className = "" }: { children: ReactNode; variant?: "default" | "orange" | "teal" | "emerald"; className?: string }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    orange: "bg-orange-50 text-orange-700",
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
