'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { Button, Field, Input, PageFrame, CompactPanel } from '@/components/namo-ui';
import { useResetPassword } from '@/lib/namo-api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const resetPassword = useResetPassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    try {
      await resetPassword.mutateAsync({ token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/auth'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed. Please try again.';
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
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                New Password
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Enter your new password below
              </p>
            </div>

            <CompactPanel>
              {success ? (
                <div className="space-y-5 p-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Password updated</h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Redirecting to sign in...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 p-2">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {!token && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Invalid or missing reset token. Please use the link from your email.
                    </div>
                  )}

                  <Field label="New Password">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={!token}
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

                  <Field label="Confirm Password">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={!token}
                        className="pl-11"
                      />
                    </div>
                  </Field>

                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={resetPassword.isPending || !token}
                    onClick={() => {}}
                  >
                    {resetPassword.isPending ? 'Updating...' : 'Update Password'}
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
