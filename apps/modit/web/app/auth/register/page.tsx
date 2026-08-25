"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const registerMutation = useMutation({
    mutationFn: async () => {
      setError("");
      setSuccess("");
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      const res = await client.request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      return res as { access_token?: string; message?: string };
    },
    onSuccess: (data) => {
      if (data.access_token) {
        setAccessToken(data.access_token);
        router.push("/products");
      } else {
        setSuccess("Account created! Check your email to verify your account.");
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Registration failed");
    },
  });

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col">
      {/* Slim accent bar */}
      <div className="w-full h-1 bg-gradient-to-r from-[#2D1B69] via-[#7CB518] to-[#E91E63]" />

      {/* Top nav */}
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

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Logo + Title */}
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-extrabold text-[#150726] tracking-tight">Create account</h1>
            <p className="mt-2 text-[14px] text-[#6B5B83]">Join 10,000+ builders on MODIT</p>
          </div>

          {/* Register Card */}
          <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-red-500">!</span>
                  </div>
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-[13px] font-medium text-green-600 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-green-500">✓</span>
                  </div>
                  {success}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#150726]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                  <input type="text" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#150726]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#150726]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                  <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#150726]">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                  <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                    className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={registerMutation.isPending}
                className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {registerMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>
          </div>

          {/* Sign in link */}
          <p className="mt-6 text-center text-[14px] text-[#6B5B83]">
            Already have an account?{" "}
            <Link href="/auth" className="font-bold text-[#7CB518] hover:underline">Sign in</Link>
          </p>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#9B8CB5]">
              By creating an account, you agree to our{" "}
              <Link href="#" className="underline hover:text-[#2D1B69]">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="underline hover:text-[#2D1B69]">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
