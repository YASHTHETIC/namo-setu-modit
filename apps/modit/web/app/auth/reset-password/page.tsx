"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { env } from "@/lib/env";

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
      await client.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
    },
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message || "Failed to reset password"),
  });

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col">
      <div className="w-full bg-[#150726] py-3 px-6 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <img src="/modit-logo.png" alt="MODIT" className="h-[28px] w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-extrabold text-[#150726] tracking-tight">
              {success ? "Password reset" : "Reset password"}
            </h1>
            <p className="mt-2 text-[14px] text-[#6B5B83]">
              {success ? "Your password has been updated" : "Enter your new password below"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
            {!token ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-[13px] text-red-500">Invalid or missing reset token.</p>
                <button
                  onClick={() => router.push("/auth/forgot-password")}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all"
                >
                  Request new reset link
                </button>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-[#7CB518]" />
                </div>
                <p className="text-[13px] text-[#6B5B83]">You can now sign in with your new password.</p>
                <button
                  onClick={() => router.push("/auth")}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all"
                >
                  Sign in
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-red-500">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : "Reset password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
