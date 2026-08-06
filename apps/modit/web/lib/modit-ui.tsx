"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════
// PANEL
// ═══════════════════════════════════════════════════════════════════

export function Panel({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// METRIC TILE
// ═══════════════════════════════════════════════════════════════════

export function MetricTile({
  label,
  value,
  icon,
  delta,
  deltaLabel,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: number;
  deltaLabel?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value === "number") {
      const duration = 800;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {typeof value === "number" ? displayValue.toLocaleString() : value}
          </p>
          {delta !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  delta >= 0 ? "text-emerald-600" : "text-red-500"
                )}
              >
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
              {deltaLabel && (
                <span className="text-xs text-[var(--text-muted)]">{deltaLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-bg)] text-[var(--brand)]">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════════

export function Card({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-5 border-b border-[var(--border-subtle)]", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4 border-t border-[var(--border-subtle)]", className)} {...props}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════════════

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-[var(--cta)] text-white hover:bg-[var(--cta-hover)] shadow-sm": variant === "primary",
          "bg-white text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--brand-50)]": variant === "secondary",
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]": variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
        },
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-5 text-sm": size === "md",
          "h-12 px-7 text-base": size === "lg",
        },
        className
      )}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LINK BUTTON
// ═══════════════════════════════════════════════════════════════════

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex">
      <Link
        href={href}
        className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
          {
            "bg-[var(--cta)] text-white hover:bg-[var(--cta-hover)] shadow-sm": variant === "primary",
            "bg-white text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--brand-50)]": variant === "secondary",
            "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]": variant === "ghost",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-5 text-sm": size === "md",
            "h-12 px-7 text-base": size === "lg",
          },
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BADGE / TAG
// ═══════════════════════════════════════════════════════════════════

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-[var(--brand-50)] text-[var(--brand)]": variant === "default",
          "bg-emerald-50 text-emerald-700": variant === "success",
          "bg-amber-50 text-amber-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "danger",
          "bg-blue-50 text-blue-700": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variants: Record<string, string> = {
    active: "bg-[var(--brand-50)] text-[var(--brand)]",
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-[var(--success-light)] text-[var(--success)]",
    rejected: "bg-[var(--danger-light)] text-[var(--danger)]",
    delivered: "bg-[var(--success-light)] text-[var(--success)]",
    dispatched: "bg-blue-50 text-blue-700",
    placed: "bg-blue-50 text-blue-700",
    accepted: "bg-[var(--success-light)] text-[var(--success)]",
    open: "bg-blue-50 text-blue-700",
    closed: "bg-slate-100 text-slate-600",
    cancelled: "bg-[var(--danger-light)] text-[var(--danger)]",
    paid: "bg-[var(--success-light)] text-[var(--success)]",
    in_stock: "bg-[var(--success-light)] text-[var(--success)]",
    low_stock: "bg-amber-50 text-amber-700",
    out_of_stock: "bg-[var(--danger-light)] text-[var(--danger)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[status] || "bg-slate-100 text-slate-600",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--brand-50)] text-[var(--brand)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOADING / SKELETON
// ═══════════════════════════════════════════════════════════════════

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn("rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]", {
          "h-5 w-5": size === "sm",
          "h-8 w-8": size === "md",
          "h-12 w-12": size === "lg",
        })}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-[var(--bg-subtle)] via-[var(--border)] to-[var(--bg-subtle)] bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--brand)] font-semibold text-white",
        {
          "h-8 w-8 text-xs": size === "sm",
          "h-10 w-10 text-sm": size === "md",
          "h-12 w-12 text-base": size === "lg",
        },
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════════════

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-[var(--border-subtle)]", className)} />;
}

// ═══════════════════════════════════════════════════════════════════
// FORM ROW
// ═══════════════════════════════════════════════════════════════════

export function FormRow({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════════════

export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function TableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn("border-b border-[var(--border-subtle)]", className)}>
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={cn("divide-y divide-[var(--border-subtle)]", className)}>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <tr
      className={cn(
        "transition-colors",
        hover && "hover:bg-[var(--bg-subtle)]/50",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 text-sm text-[var(--text-primary)]", className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]",
        className
      )}
    >
      {children}
    </th>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STAR RATING
// ═══════════════════════════════════════════════════════════════════

export function StarRating({
  rating,
  count,
  size = "sm",
  showCount = true,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg
            key={s}
            className={cn(
              size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
              s <= Math.round(rating) ? "fill-[var(--cta)] text-[var(--cta)]" : "fill-gray-200 text-gray-200"
            )}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className={cn("text-[var(--text-muted)]", size === "sm" ? "text-xs" : "text-sm")}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRICE DISPLAY
// ═══════════════════════════════════════════════════════════════════

export function PriceDisplay({
  price,
  mrp,
  discount,
  bulkPrice,
  bulkLabel,
  unit,
  size = "md",
}: {
  price: number;
  mrp?: number;
  discount?: number;
  bulkPrice?: number | null;
  bulkLabel?: string | null;
  unit?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-extrabold text-[var(--text-primary)]",
            size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base"
          )}
        >
          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: price % 1 === 0 ? 0 : 2 })}
        </span>
        {mrp && mrp > price && (
          <span className="text-sm text-[var(--text-muted)] line-through">
            ₹{mrp.toLocaleString("en-IN")}
          </span>
        )}
        {discount && discount > 0 && (
          <Badge variant="success" className="text-[10px] font-bold">
            {discount}% OFF
          </Badge>
        )}
      </div>
      {unit && (
        <p className="text-xs text-[var(--text-muted)] mt-0.5">per {unit}</p>
      )}
      {bulkPrice && bulkLabel && (
        <p className="text-xs font-medium text-[var(--success)] mt-1">
          {bulkLabel}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELIVERY BADGE
// ═══════════════════════════════════════════════════════════════════

export function DeliveryBadge({
  days,
  freeDelivery,
  className,
}: {
  days: number;
  freeDelivery: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      {days <= 1 ? (
        <span className="font-semibold text-[var(--success)]">Tomorrow</span>
      ) : (
        <span className="font-semibold text-[var(--text-primary)]">
          {days} days
        </span>
      )}
      {freeDelivery && (
        <span className="rounded bg-[var(--success-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--success)]">
          FREE
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// QUANTITY SELECTOR
// ═══════════════════════════════════════════════════════════════════

export function QuantitySelector({
  quantity,
  min = 1,
  max = 999,
  onChange,
  size = "md",
}: {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)]",
      size === "sm" ? "h-8" : "h-10"
    )}>
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className={cn(
          "flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors disabled:opacity-30",
          size === "sm" ? "h-8 w-7 text-xs" : "h-10 w-9 text-sm"
        )}
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
        }}
        className={cn(
          "border-x border-[var(--border)] bg-transparent text-center font-semibold text-[var(--text-primary)] focus:outline-none",
          size === "sm" ? "h-8 w-10 text-xs" : "h-10 w-14 text-sm"
        )}
      />
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className={cn(
          "flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors disabled:opacity-30",
          size === "sm" ? "h-8 w-7 text-xs" : "h-10 w-9 text-sm"
        )}
      >
        +
      </button>
    </div>
  );
}
