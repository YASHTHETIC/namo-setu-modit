"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button, Card, CardContent } from "@/lib/modit-ui";
import { setAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

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

  useState(() => {
    if (token) {
      verifyMutation.mutate();
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl font-bold text-white shadow-lg">
            M
          </div>
          <h1 className="text-h2 text-[var(--text-primary)]">Email Verification</h1>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--brand)]" />
                  <p className="text-sm text-[var(--text-muted)]">
                    Verifying your email address...
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Email verified!
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Your email has been verified successfully.
                  </p>
                  <Button className="w-full" onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </>
              )}

              {status === "error" && (
                <>
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Verification failed
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">{errorMessage}</p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => router.push("/auth")}
                  >
                    Back to sign in
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
