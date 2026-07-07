"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button, Input, Card, CardContent, LoadingSpinner } from "@/lib/modit-ui";
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
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
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
        router.push("/dashboard");
      } else {
        setSuccess("Account created! Check your email to verify your account.");
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Registration failed");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl font-bold text-white shadow-lg">
            M
          </div>
          <h1 className="text-h2 text-[var(--text-primary)]">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Join MODIT Construction Procurement
          </p>
        </div>

        <Card>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate();
              }}
              className="space-y-4"
            >
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">
                  {success}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <LoadingSpinner size="sm" /> : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              Already have an account?{" "}
              <Link
                href="/auth"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
