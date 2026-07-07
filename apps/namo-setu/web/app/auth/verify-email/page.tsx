'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { Button, PageFrame, CompactPanel } from '@/components/namo-ui';
import { useVerifyEmail } from '@/lib/namo-api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token && status === 'idle') {
      setStatus('verifying');
      verifyEmail.mutateAsync(token)
        .then(() => setStatus('success'))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Verification failed';
          setErrorMessage(message);
          setStatus('error');
        });
    }
  }, [token, status, verifyEmail]);

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
                <MailCheck className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Email Verification
              </h1>
            </div>

            <CompactPanel>
              <div className="space-y-5 p-2 text-center">
                {status === 'verifying' && (
                  <>
                    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--brand-color,#F97316)] mx-auto" />
                    <p className="text-sm text-[var(--text-secondary)]">Verifying your email...</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Email verified</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Your email has been verified successfully. You can now access all features.
                      </p>
                    </div>
                    <Link href="/auth">
                      <Button variant="primary" className="w-full">
                        Continue to Sign In
                      </Button>
                    </Link>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto">
                      <XCircle className="h-7 w-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Verification failed</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {errorMessage || 'The verification link is invalid or has expired.'}
                      </p>
                    </div>
                    <Link href="/auth">
                      <Button variant="primary" className="w-full">
                        Go to Sign In
                      </Button>
                    </Link>
                  </>
                )}

                {!token && status === 'idle' && (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mx-auto">
                      <XCircle className="h-7 w-7 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Invalid link</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        This verification link is invalid or missing a token.
                      </p>
                    </div>
                    <Link href="/auth">
                      <Button variant="primary" className="w-full">
                        Go to Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
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
