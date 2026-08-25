"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { env } from "@/lib/env";
import { ModitLogo } from "@/components/modit-logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      setError("");
      if (!token) throw new Error("No reset token provided");
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      await client.request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
    },
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message || "Failed to reset password"),
  });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #2D1B69 0%, #150726 60%, #0D0720 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 70%, rgba(124,181,24,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.3), transparent 50%)" }} />
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10"><ModitLogo className="h-[48px] w-auto" light /></div>
        <div className="relative z-10">
          <h2 className="text-[28px] font-extrabold text-white leading-tight">Create a new<br />password</h2>
          <p className="mt-3 text-[14px] text-white/50 leading-relaxed">Choose a strong password to keep your account secure.</p>
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
              <h1 className="text-[28px] font-extrabold text-[#150726] tracking-tight">{success ? "Password reset" : "Reset password"}</h1>
              <p className="mt-2 text-[14px] text-[#6B5B83]">{success ? "Your password has been updated" : "Enter your new password below"}</p>
            </div>
            <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
              {!token ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-[13px] text-red-500">Invalid or missing reset token.</p>
                  <button onClick={() => router.push("/auth/forgot-password")} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all">Request new reset link</button>
                </div>
              ) : success ? (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#F0F9E8] flex items-center justify-center"><CheckCircle className="h-8 w-8 text-[#7CB518]" /></div>
                  <p className="text-[13px] text-[#6B5B83]">You can now sign in with your new password.</p>
                  <button onClick={() => router.push("/auth")} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all">Sign in</button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }} className="space-y-4">
                  {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-bold text-red-500">!</span></div>{error}</div>}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-[#150726]">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                      <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">{showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}</button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-[#150726]">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                      <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={resetMutation.isPending} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    {resetMutation.isPending ? <span className="flex items-center justify-center gap-2"><span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</span> : "Reset password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" /></div>}><ResetPasswordForm /></Suspense>;
}
