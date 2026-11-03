"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone, KeyRound, X, CheckCircle2, ArrowRight } from "lucide-react";
import { createApiClient } from "@foundation/api-client";
import { setAccessToken } from "@/lib/auth";
import { fetchLivePincode } from "@/lib/pincode-context";
import { env } from "@/lib/env";
import { onlyDigits } from "@/lib/utils";
import { useAuthReady } from "@/lib/use-auth";
import { isStandalone } from "@/lib/pwa";

/**
 * Mobile post-install & first-visit Phone Verification (Blinkit-style).
 * Prompts buyers on mobile / installed PWA to verify their phone number
 * via 6-digit OTP for real-time delivery alerts, GST invoices, and 1-tap checkout.
 */
export function PhoneVerificationModal() {
  const pathname = usePathname();
  const loggedIn = useAuthReady();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Never interrupt ops dashboards or dedicated auth pages
    if (pathname.startsWith("/admin") || pathname.startsWith("/supplier") || pathname.startsWith("/auth")) {
      return;
    }

    if (loggedIn) {
      setOpen(false);
      return;
    }

    // Check if dismissed in this browser session
    try {
      if (sessionStorage.getItem("modit_phone_login_dismissed")) {
        return;
      }
    } catch {
      /* ignore */
    }

    // Trigger on installed standalone PWA or mobile storefront after initial render
    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || isStandalone());
    if (isMobile) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loggedIn, pathname]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("modit_phone_login_dismissed", "true");
    } catch {
      /* ignore */
    }
  };

  const digits = onlyDigits(phone);
  const validPhone = digits.length === 10;

  const handleSendOtp = async () => {
    setError("");
    if (!validPhone) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      await client.request("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone: digits }),
      });
      setSent(true);
      setCode("");
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP. Try demo number.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const codeDigits = onlyDigits(code);
    if (codeDigits.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setBusy(true);
    try {
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      const res = (await client.request("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: digits, code: codeDigits }),
      })) as { access_token: string };

      setAccessToken(res.access_token);
      setVerified(true);

      // Background cart & pincode sync
      try {
        void import("@/lib/server-cart").then((m) => m.syncCartOnLogin());
      } catch { /* offline cart stays */ }
      try {
        void fetchLivePincode().then((pin) => {
          if (pin) localStorage.setItem("modit_pincode", pin);
        });
      } catch { /* ignore */ }

      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP.");
    } finally {
      setBusy(false);
    }
  };

  if (!open || loggedIn) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={handleDismiss}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#150726] flex items-center justify-center shadow-md">
              <span className="text-[#7CB518] text-xl font-black">M</span>
            </div>
            <div>
              <h3 className="text-body-lg font-black text-[#150726] leading-tight">
                {verified ? "Verified Successfully!" : sent ? "Enter OTP" : "Login with Mobile"}
              </h3>
              <p className="text-caption text-[#7B6A99]">
                {verified ? "Welcome to MODIT" : "Materials On Door in 60 mins"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="rounded-full p-2 text-[#9B8CB5] hover:bg-[#F7F4FC] hover:text-[#150726] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {verified ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-[#047857]" />
            </div>
            <p className="text-body-md font-bold text-[#150726]">Phone Number Verified!</p>
            <p className="text-caption text-[#6B5B83]">Your cart, orders, and delivery addresses are now synced.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-caption font-semibold text-red-600 flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-micro font-bold shrink-0">!</span>
                {error}
              </div>
            )}

            {!sent ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-caption font-bold text-[#150726]">Mobile Number</label>
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("9999900001");
                        setError("");
                      }}
                      className="text-micro font-bold text-[#7CB518] hover:underline"
                    >
                      Fill Demo Number
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-md font-extrabold text-[#150726]">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(onlyDigits(e.target.value))}
                      placeholder="98765 43210"
                      autoFocus
                      className="w-full h-12 rounded-xl border-2 border-[#E8E0F0] pl-14 pr-4 text-body-lg font-bold text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={busy || !validPhone}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:bg-[#6A9C14] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {busy ? "Sending OTP..." : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-micro text-center text-[#9B8CB5]">
                  We will send a 6-digit verification code via SMS.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-caption font-bold text-[#150726]">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setCode("");
                        setError("");
                      }}
                      className="text-micro font-bold text-[#2D1B69] hover:underline"
                    >
                      Change Number ({phone})
                    </button>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(onlyDigits(e.target.value))}
                    placeholder="123456"
                    autoFocus
                    className="w-full h-12 text-center tracking-[0.35em] rounded-xl border-2 border-[#E8E0F0] px-4 text-title-md font-black text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={busy || onlyDigits(code).length !== 6}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:bg-[#6A9C14] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {busy ? "Verifying..." : "Verify & Continue"}
                </button>

                <div className="flex items-center justify-between text-micro text-[#6B5B83]">
                  <span>Didn&apos;t receive code?</span>
                  {cooldown > 0 ? (
                    <span className="font-bold text-[#9B8CB5]">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={busy}
                      className="font-bold text-[#7CB518] hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="pt-2 border-t border-[#F0ECF9] text-center">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-caption font-bold text-[#7B6A99] hover:text-[#150726] transition-colors py-1 px-3"
              >
                Skip for now & explore catalog →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
