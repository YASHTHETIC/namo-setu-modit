"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { CheckCircle, XCircle } from "lucide-react";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { ModitLogo } from "@/components/modit-logo";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    !token ? "No verification token provided." : ""
  );

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL });
      const res = await client.request("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      return res as { access_token?: string };
    },
    onSuccess: (data) => {
      setStatus("success");
      if (data.access_token) {
        setAccessToken(data.access_token);
      }
    },
    onError: (err: Error) => {
      setStatus("error");
      setErrorMessage(err.message || "Verification failed. The link may have expired.");
    },
  });

  useEffect(() => {
    if (token) verifyMutation.mutate();
  }, [token]);

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
            <h1 className="text-[26px] font-extrabold text-[#150726] tracking-tight">Email Verification</h1>
          </div>

          <div className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
            <div className="space-y-4 text-center py-4">
              {status === "loading" && (
                <>
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#F0ECF9] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" />
                  </div>
                  <p className="text-[14px] text-[#6B5B83]">Verifying your email address...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#F0F9E8] flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-[#7CB518]" />
                  </div>
                  <h2 className="text-[18px] font-bold text-[#150726]">Email verified!</h2>
                  <p className="text-[13px] text-[#6B5B83]">Your account is ready to use.</p>
                  <button
                    onClick={() => router.push("/products")}
                    className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[15px] font-bold hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/25"
                  >
                    Start Shopping
                  </button>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="mx-auto h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-[18px] font-bold text-[#150726]">Verification failed</h2>
                  <p className="text-[13px] text-[#6B5B83]">{errorMessage}</p>
                  <button
                    onClick={() => router.push("/auth")}
                    className="w-full h-12 rounded-xl border-2 border-[#E8E0F0] bg-white text-[14px] font-semibold text-[#150726] hover:border-[#7CB518] hover:bg-[#F8F6FC] transition-all"
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
