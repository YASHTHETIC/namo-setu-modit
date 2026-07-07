'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { Button, Field, Input, PageFrame, CompactPanel } from '@/components/namo-ui';
import { useForgotPassword } from '@/lib/namo-api';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword.mutateAsync(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed. Please try again.';
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
                <KeyRound className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Reset Password
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <CompactPanel>
              {submitted ? (
                <div className="space-y-5 p-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Check your email</h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      If email exists, reset link sent. Please check your inbox.
                    </p>
                  </div>
                  <Button variant="primary" className="w-full" onClick={() => setSubmitted(false)}>
                    Send again
                  </Button>
                </div>
              ) : (
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

                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={forgotPassword.isPending}
                    onClick={() => {}}
                  >
                    {forgotPassword.isPending ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              )}
            </CompactPanel>

            <p className="mt-6 text-center">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </PageFrame>
    </NamoShell>
  );
}
