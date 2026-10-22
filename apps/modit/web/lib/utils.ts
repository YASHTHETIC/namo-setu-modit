import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Single money formatter for the whole funnel (display layer only).
 * Values are rupees — no paise math here. Use everywhere instead of
 * ad-hoc toLocaleString / /100 so cart, checkout, orders and history agree.
 */
export function formatINR(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * Paise-exact formatter for server totals (GST/grand can carry paise).
 * Same output as toLocaleString("en-IN", {minimumFractionDigits: 2,
 * maximumFractionDigits: 2}) - one name instead of the options object.
 */
export function formatINR2(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0.00";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Single digit-scrubber for numeric inputs (pincode, phone, OTP, PIN).
 * One pattern instead of copy-pasted replace(/\D/g, "").slice(...) chains.
 */
export function onlyDigits(value: string | null | undefined, maxLength?: number): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

/**
 * Canonical product URL: prefer the human slug (stable across the static
 * catalog and the API, works even when the API detail endpoint is down),
 * fall back to the id (API UUIDs).
 */
export function productLink(p: { slug?: string | null; id: string }): string {
  return `/products/${p.slug || p.id}`;
}

/** JSON-LD body safe for embedding in a <script> tag: escapes '<' and the
 * line-separator characters (U+2028/U+2029) so catalog strings can never
 * break out of the tag into a stored-XSS sink. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
