"use client";

const OTP_TTL_MS = 5 * 60 * 1000;
const store = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface OtpResult {
  ok: boolean;
  /** In demo mode the code is returned so it can be shown on screen. A real SMS gateway replaces this. */
  demoCode?: string;
  error?: string;
}

/**
 * Request a one-time passcode for a phone number.
 * Demo mode (no SMS gateway configured): returns the code so the UI can display it.
 * Production: wire SMS_GATEWAY_URL / SMS_API_KEY here to send via SMS instead.
 */
export function requestOtp(phone: string): OtpResult {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const code = randomCode();
  store.set(digits, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  const gateway = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SMS_GATEWAY_URL : undefined;
  if (gateway) {
    // TODO: POST { phone, code } to the SMS gateway. Fire-and-forget from client is
    // intentionally avoided — move this to a server action when a gateway is configured.
    return { ok: true };
  }
  return { ok: true, demoCode: code };
}

export function verifyOtp(phone: string, code: string): { ok: boolean; error?: string } {
  const digits = phone.replace(/\D/g, "");
  const entry = store.get(digits);
  if (!entry) return { ok: false, error: "No OTP requested for this number. Tap Resend." };
  if (Date.now() > entry.expiresAt) {
    store.delete(digits);
    return { ok: false, error: "OTP expired. Please request a new one." };
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    store.delete(digits);
    return { ok: false, error: "Too many attempts. Please request a new OTP." };
  }
  if (entry.code !== code.trim()) return { ok: false, error: "Incorrect OTP. Please try again." };
  store.delete(digits);
  return { ok: true };
}

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}