"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
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
      await client.request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    },
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message || "Failed to send reset email"),
  });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #2D1B69 0%, #150726 60%, #0D0720 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 70%, rgba(124,181,24,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.3), transparent 50%)" }} />
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10"><ModitLogo className="h-[48px] w-auto" light /></div>
        <div className="relative z-10">
          <h2 className="text-[28px] font-extrabold text-white leading-tight">Reset your<br />password</h2>
          <p className="mt-3 text-[14px] text-white/50 leading-relaxed">We&apos;ll send you a secure link to reset your password and get you back to ordering.</p>
        </div>
        <div className="relative z-10"><p className="text-[11px] text-white/30">© 2026 MODIT. All rights reserved.</p></div>
      </div>

      <div className="flex-1 flex flex-col bg-[#F8F6FC]">
        <div className="lg:hidden bg-[#150726] px-6 py-3 flex items-center justify-between">
          <Link href="/"><ModitLogo className="h-[30px] w-auto" light /></Link>
          <Link href="/" className="text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">Back to home</Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-extrabold text-[#150726] tracking-tight">{success ? "Check your email" : "Forgot password?"}</h1>
              <p className="mt-2 text-[14px] text-[#6B5B83]">{success ? `We sent a reset link to ${email}` : "Enter your email and we'll send you a reset link"}</p>
            </div>
            <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
              {success ? (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#F0F9E8] flex items-center justify-center"><CheckCircle className="h-8 w-8 text-[#7CB518]" /></div>
                  <p className="text-[13px] text-[#6B5B83]">The link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
                  <button onClick={() => { setSuccess(false); setEmail(""); }} className="w-full h-12 rounded-xl border-2 border-[#E8E0F0] bg-white text-[14px] font-semibold text-[#150726] hover:border-[#7CB518] hover:bg-[#F8F6FC] transition-all">Send another email</button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); forgotMutation.mutate(); }} className="space-y-4">
                  {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-bold text-red-500">!</span></div>{error}</div>}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-[#150726]">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                      <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={forgotMutation.isPending} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    {forgotMutation.isPending ? <span className="flex items-center justify-center gap-2"><span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span> : "Send reset link"}
                  </button>
                </form>
              )}
              <div className="mt-6 text-center">
                <Link href="/auth" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B5B83] hover:text-[#7CB518] transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
