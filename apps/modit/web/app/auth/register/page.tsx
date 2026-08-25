"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, User, Truck, Shield, Clock } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { ModitLogo } from "@/components/modit-logo";

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #2D1B69 0%, #150726 60%, #0D0720 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(circle at 30% 70%, rgba(124,181,24,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(233,30,99,0.3), transparent 50%)",
        }} />
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10"><ModitLogo className="h-[48px] w-auto" light /></div>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[28px] font-extrabold text-white leading-tight">Join 10,000+<br />builders today</h2>
            <p className="mt-3 text-[14px] text-white/50 leading-relaxed">Create your account and start ordering construction materials at the best prices with 60-minute delivery.</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Truck, title: "Free Delivery", desc: "On orders above ₹5,000" },
              { icon: Shield, title: "GST Invoice", desc: "For every order you place" },
              { icon: Clock, title: "Bulk Pricing", desc: "Best rates for bulk orders" },
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
        <div className="relative z-10"><p className="text-[11px] text-white/30">© 2026 MODIT. All rights reserved.</p></div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-[#F8F6FC]">
        <div className="lg:hidden bg-[#150726] px-6 py-3 flex items-center justify-between">
          <Link href="/"><ModitLogo className="h-[30px] w-auto" light /></Link>
          <Link href="/" className="text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">Back to home</Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-extrabold text-[#150726] tracking-tight">Create account</h1>
              <p className="mt-2 text-[14px] text-[#6B5B83]">Join 10,000+ builders on MODIT</p>
            </div>
            <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-bold text-red-500">!</span></div>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-[13px] font-medium text-green-600 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-bold text-green-500">✓</span></div>
                    {success}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input type="text" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-11 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#150726]">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                    <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="w-full border-2 border-[#E8E0F0] rounded-xl pl-11 pr-4 py-3 text-[14px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={registerMutation.isPending} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                  {registerMutation.isPending ? <span className="flex items-center justify-center gap-2"><span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</span> : "Create Account"}
                </button>
              </form>
            </div>
            <p className="mt-6 text-center text-[14px] text-[#6B5B83]">Already have an account? <Link href="/auth" className="font-bold text-[#7CB518] hover:underline">Sign in</Link></p>
            <p className="mt-4 text-center text-[11px] text-[#9B8CB5]">By creating an account, you agree to our <Link href="#" className="underline hover:text-[#2D1B69]">Terms</Link> and <Link href="#" className="underline hover:text-[#2D1B69]">Privacy Policy</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
