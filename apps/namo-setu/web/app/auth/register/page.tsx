'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { Button, Field, Input, PageFrame, CompactPanel } from '@/components/namo-ui';
import { useRegister } from '@/lib/namo-api';
import { setAccessToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const result = await register.mutateAsync({ email, password, full_name: fullName });
      setAccessToken(result.access_token);
      router.push('/auth/verify-email');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
                <UserPlus className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Create Account
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Begin your sacred journey with Namo Setu
              </p>
            </div>

            <CompactPanel>
              <form onSubmit={handleSubmit} className="space-y-5 p-2">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Field label="Full Name">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-11"
                    />
                  </div>
                </Field>

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
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
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
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-11"
                    />
                  </div>
                </Field>

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={register.isPending}
                  onClick={() => {}}
                >
                  {register.isPending ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </CompactPanel>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link href="/auth" className="font-semibold text-orange-600 hover:text-orange-700">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </PageFrame>
    </NamoShell>
  );
}
