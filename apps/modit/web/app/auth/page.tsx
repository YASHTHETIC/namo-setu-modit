"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, Truck, Shield, Clock } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { ModitLogo } from "@/components/modit-logo";
import { BottomNav } from "@/components/bottom-nav";

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
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #2D1B69 0%, #150726 60%, #0D0720 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(circle at 30% 70%, rgba(124,181,24,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.3), transparent 50%)",
        }} />
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />

        <div className="relative z-10">
          <ModitLogo className="h-[48px] w-auto" light />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[28px] font-extrabold text-white leading-tight">
              Materials On<br />Door
            </h2>
            <p className="mt-3 text-[14px] text-white/50 leading-relaxed">
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
                  <p className="text-[13px] font-bold text-white">{title}</p>
                  <p className="text-[11px] text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[11px] text-white/30">© 2026 MODIT. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-[#F8F6FC]">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#150726] px-6 py-3 flex items-center justify-between">
          <Link href="/"><ModitLogo className="h-[30px] w-auto" light /></Link>
          <Link href="/" className="text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">Back to home</Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-extrabold text-[#150726] tracking-tight">Sign in</h1>
              <p className="mt-2 text-[14px] text-[#6B5B83]">Access your MODIT account</p>
            </div>

            <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
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
                    <Link href="/auth/forgot-password" className="text-[12px] font-semibold text-[#7CB518] hover:underline">Forgot password?</Link>
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
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
                  ) : "Sign In"}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8E0F0]" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                  <span className="bg-white px-3 text-[#9B8CB5] font-semibold">or continue with</span>
                </div>
              </div>

              <button
                onClick={() => { window.location.href = `${env.NEXT_PUBLIC_API_BASE_URL}/auth/google`; }}
                className="w-full h-11 rounded-xl border-2 border-[#E8E0F0] bg-white text-[14px] font-semibold text-[#150726] hover:border-[#7CB518] hover:bg-[#F8F6FC] transition-all flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-6 text-center text-[14px] text-[#6B5B83]">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-bold text-[#7CB518] hover:underline">Create one</Link>
            </p>
            <p className="mt-4 text-center text-[11px] text-[#9B8CB5]">
              By signing in, you agree to our{" "}
              <Link href="#" className="underline hover:text-[#2D1B69]">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="underline hover:text-[#2D1B69]">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
