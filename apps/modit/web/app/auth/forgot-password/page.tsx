"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, CheckCircle } from "lucide-react";
import { env } from "@/lib/env";
import { ModitLogo } from "@/components/modit-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async () => {
      setError("");
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      await client.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message || "Failed to send reset email"),
  });

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col">
      <div className="w-full h-1 bg-gradient-to-r from-[#2D1B69] via-[#7CB518] to-[#E91E63]" />

      <div className="w-full bg-[#150726] px-6 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ModitLogo className="h-[32px] w-auto" light />
          </Link>
          <Link href="/" className="text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">
            Back to home
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <div className="relative inline-flex mb-6">
              <div className="absolute -inset-8 bg-gradient-to-br from-[#2D1B69]/10 to-[#7CB518]/10 rounded-full blur-2xl" />
              <div className="relative bg-white rounded-2xl px-8 py-5 shadow-lg shadow-purple-900/5 border border-[#E8E0F0]">
                <ModitLogo className="h-[48px] w-auto" />
              </div>
            </div>
            <h1 className="text-[26px] font-extrabold text-[#150726] tracking-tight">
              {success ? "Check your email" : "Forgot password?"}
            </h1>
            <p className="mt-2 text-[14px] text-[#6B5B83]">
              {success
                ? `We sent a reset link to ${email}`
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-[#F0F9E8] flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-[#7CB518]" />
                </div>
                <p className="text-[13px] text-[#6B5B83]">
                  The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
                </p>
                <button
                  onClick={() => { setSuccess(false); setEmail(""); }}
                  className="w-full h-12 rounded-xl border-2 border-[#E8E0F0] bg-white text-[14px] font-semibold text-[#150726] hover:border-[#7CB518] hover:bg-[#F8F6FC] transition-all"
                >
                  Send another email
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); forgotMutation.mutate(); }} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-red-500">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : "Send reset link"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/auth" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B5B83] hover:text-[#7CB518] transition-colors">
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
