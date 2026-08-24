"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#9B8CB5] hover:text-[#2D1B69] mb-6 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to MODIT
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[#2D1B69] flex items-center justify-center shadow-lg shadow-purple-900/20">
            <span className="text-2xl font-black text-white">M</span>
          </div>
          <h1 className="text-[24px] font-black text-[#150726]">Create your account</h1>
          <p className="mt-1 text-[13px] text-[#9B8CB5]">Join 10,000+ builders on MODIT</p>
        </div>

        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-6 shadow-sm">
          <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-4">
            {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] font-medium text-red-600">{error}</div>}
            {success && <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-[12px] font-medium text-green-600">{success}</div>}

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#150726]">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                <input type="text" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full border-2 border-[#DDD6EE] rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#150726]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full border-2 border-[#DDD6EE] rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#150726]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                  className="w-full border-2 border-[#DDD6EE] rounded-xl pl-10 pr-10 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#150726]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
                <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                  className="w-full border-2 border-[#DDD6EE] rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={registerMutation.isPending}
              className="w-full h-11 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#9B8CB5]">
            Already have an account?{" "}
            <Link href="/auth" className="font-bold text-[#2D1B69] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
