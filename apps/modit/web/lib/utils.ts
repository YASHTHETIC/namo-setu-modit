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
 * maximumFractionDigits: 2}) — one name instead of the options object.
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
