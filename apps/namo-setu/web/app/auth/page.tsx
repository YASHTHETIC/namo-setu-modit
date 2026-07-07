'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { Button, Field, Input, PageFrame, CompactPanel } from '@/components/namo-ui';
import { useLogin } from '@/lib/namo-api';
import { setAccessToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login.mutateAsync({ email, password });
      setAccessToken(result.access_token);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  };

  return (
    <NamoShell>
      <PageFrame>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 shadow-2xl shadow-orange-500/25 mx-auto">
                <LogIn className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Sign in to continue your sacred journey
              </p>
            </div>

            <CompactPanel>
              <form onSubmit={handleSubmit} className="space-y-5 p-2">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Field label="Email">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11"
                    />
                  </div>
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20" />
                    Remember me
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={login.isPending}
                >
                  {login.isPending ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative my-6">
                  <hr className="border-[var(--border)]" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-card)] px-3 text-xs text-[var(--text-muted)]">
                    or continue with
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`;
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </Button>
              </form>
            </CompactPanel>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-orange-600 hover:text-orange-700">
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </PageFrame>
    </NamoShell>
  );
}
