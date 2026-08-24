"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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
      setAccessToken(data.access_token);
      router.push("/products");
    },
    onError: (err: Error) => {
      setError(err.message || "Invalid email or password");
    },
  });

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col">
      {/* Top bar */}
      <div className="w-full bg-[#150726] py-3 px-6 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <img src="/modit-logo.png" alt="MODIT" className="h-[28px] w-auto" />
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-extrabold text-[#150726] tracking-tight">Sign in</h1>
            <p className="mt-2 text-[14px] text-[#6B5B83]">Access your MODIT account</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate();
              }}
              className="space-y-4"
            >
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-[#150726]">Password</label>
                  <Link href="/auth/forgot-password" className="text-[12px] font-semibold text-[#7CB518] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E0F0]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                <span className="bg-white px-3 text-[#9B8CB5] font-semibold">or continue with</span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={() => { window.location.href = `${env.NEXT_PUBLIC_API_BASE_URL}/auth/google`; }}
              className="w-full h-11 rounded-xl border-2 border-[#E8E0F0] bg-white text-[14px] font-semibold text-[#150726] hover:border-[#7CB518] hover:bg-[#F8F6FC] transition-all flex items-center justify-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-[14px] text-[#6B5B83]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-bold text-[#7CB518] hover:underline">Create one</Link>
          </p>

          {/* Footer links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-[11px] text-[#9B8CB5]">
              By signing in, you agree to our{" "}
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
