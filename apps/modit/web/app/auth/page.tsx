"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, Truck, Shield, Clock, Phone, KeyRound } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { fetchLivePincode } from "@/lib/pincode-context";
import { env } from "@/lib/env";
import { onlyDigits } from "@/lib/utils";
import { ModitLogo } from "@/components/modit-logo";
import { BottomNav } from "@/components/bottom-nav";
import { FxBackdrop } from "@/components/fx";
import { Reveal } from "@/components/reveal";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DDD6EE] border-t-[#2D1B69]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/products";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"otp" | "email">("otp");

  const handleAuthSuccess = (data: { access_token: string }) => {
    setAccessToken(data.access_token);
    // Cross-device cart: merge guest cart up, union server rows down.
    try {
      void import("@/lib/server-cart").then((m) => m.syncCartOnLogin());
    } catch { /* offline — local cart stays */ }
    // Auto-fetch delivery location right after login (best effort)
    try {
      void fetchLivePincode().then((pin) => {
        if (pin) {
          try {
            localStorage.setItem("modit_pincode", pin);
          } catch { /* ignore */ }
        }
      });
    } catch { /* geolocation unavailable */ }
    router.push(next.startsWith("/") ? next : "/products");
  };

  const loginMutation = useMutation({
    mutationFn: async () => {
      setError("");
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      const res = await client.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return res as { access_token: string };
    },
    onSuccess: (data) => {
      handleAuthSuccess(data);
    },
    onError: (err: Error) => {
      setError(err.message || "Invalid email or password");
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
        <FxBackdrop tone="dark" />
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(circle at 30% 70%, rgba(124,181,24,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.3), transparent 50%)",
        }} />
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />

        <div className="relative z-10">
          <ModitLogo className="h-[48px] w-auto" light />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-display font-extrabold text-white leading-tight">
              Materials On<br />Door
            </h2>
            <p className="mt-3 text-body-md text-white/50 leading-relaxed">
              Construction materials delivered to your site in 60 minutes. Cement, paint, lighting, tiling — all at the lowest prices.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Truck, title: "60-Min Delivery", desc: "Superfast delivery to your site" },
              { icon: Shield, title: "100% Genuine", desc: "Verified products & suppliers" },
              { icon: Clock, title: "Live Tracking", desc: "Track your orders in real-time" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-[#7CB518]" />
                </div>
                <div>
                  <p className="text-body-sm font-bold text-white">{title}</p>
                  <p className="text-micro text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-micro text-white/30">© 2026 MODIT. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-[#F8F6FC]">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#150726] px-6 py-3 flex items-center justify-between">
          <Link href="/"><ModitLogo className="h-[30px] w-auto" light /></Link>
          <Link href="/" className="text-caption font-semibold text-white/50 hover:text-white/80 transition-colors">Back to home</Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <Reveal variant="zoom" className="w-full max-w-[420px]">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-display font-extrabold text-[#150726] tracking-tight">Sign in</h1>
              <p className="mt-2 text-body-md text-[#6B5B83]">Access your MODIT account</p>
            </div>

            {/* Mobile OTP first (Blinkit-style), email as fallback */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[#F0ECF9] p-1">
              {(["otp", "email"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2 text-body-sm font-bold transition-all ${
                    mode === m ? "bg-white text-[#2D1B69] shadow-sm" : "text-[#9B8CB5]"
                  }`}
                >
                  {m === "otp" ? "Mobile OTP" : "Email"}
                </button>
              ))}
            </div>

            {mode === "otp" ? (
              <OtpForm onSuccess={handleAuthSuccess} />
            ) : (
              <>
            <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-body-sm font-medium text-red-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-micro font-bold text-red-500">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-body-sm font-semibold text-[#150726]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-body-md text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-body-sm font-semibold text-[#150726]">Password</label>
                    <Link href="/auth/forgot-password" className="text-caption font-semibold text-[#7CB518] hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-body-md text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="btn-shine w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-lg font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-body-md text-[#6B5B83]">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-bold text-[#7CB518] hover:underline">Create one</Link>
            </p>
              <p className="mt-4 text-center text-micro text-[#9B8CB5]">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[#2D1B69]">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-[#2D1B69]">Privacy Policy</Link>
            </p>
              </>
            )}
          </div>
          </Reveal>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/** Blinkit-style mobile OTP login-or-signup. One flow — no name/email needed. */
function OtpForm({ onSuccess }: { onSuccess: (data: { access_token: string }) => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const digits = onlyDigits(phone);
  const validPhone = digits.length === 10;

  const send = async () => {
    setError("");
    if (!validPhone) {
      setError("Enter a valid 10-digit mobile number.");
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
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError("");
    if (onlyDigits(code).length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      const res = (await client.request("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: digits, code: onlyDigits(code) }),
      })) as { access_token: string };
      onSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-body-lg text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all";

  return (
    <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-body-sm font-medium text-red-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-micro font-bold text-red-500">!</span>
            </div>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-body-sm font-semibold text-[#150726]">Mobile number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-body-md font-bold text-[#150726]">+91</div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(onlyDigits(e.target.value, 10));
                setSent(false);
                setError("");
              }}
              className={`${field} pl-[70px] tabular-nums tracking-wider`}
            />
          </div>
        </div>

        {sent && (
          <div className="space-y-1.5">
            <label className="block text-body-sm font-semibold text-[#150726]">6-digit code</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(onlyDigits(e.target.value, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") verify();
                }}
                className={`${field} text-center tracking-[0.4em] font-extrabold tabular-nums`}
              />
            </div>
          </div>
        )}

        {!sent ? (
          <button
            onClick={send}
            disabled={busy || !validPhone}
            className="btn-shine w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-lg font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
        ) : (
          <button
            onClick={verify}
            disabled={busy || onlyDigits(code).length !== 6}
            className="btn-shine w-full h-12 rounded-xl bg-[#2D1B69] text-white text-body-lg font-bold hover:bg-[#150726] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {busy ? "Verifying…" : "Verify & Continue"}
          </button>
        )}

        {sent && (
          <button
            onClick={send}
            disabled={busy || cooldown > 0}
            className="w-full text-center text-caption font-bold text-[#7CB518] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        )}

        <p className="text-micro text-[#9B8CB5] text-center leading-relaxed">
          No password needed — new numbers get an account automatically.
        </p>
      </div>
    </div>
  );
}
