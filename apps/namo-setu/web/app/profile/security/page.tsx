'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, Eye, EyeOff, Copy, CheckCircle2 } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { PageFrame, SectionHeader, CompactPanel, Button, Field, Input, StatusPill } from '@/components/namo-ui';
import { useChangePassword, useEnableTwoFactor, useDisableTwoFactor } from '@/lib/namo-api';

export default function SecurityPage() {
  const changePassword = useChangePassword();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ secret: string; qr_code_url: string; recovery_codes: string[] } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePassword.mutateAsync({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      const result = await enableTwoFactor.mutateAsync();
      setTwoFaSetup(result);
    } catch (err: unknown) {
      console.error('Failed to enable 2FA:', err);
    }
  };

  const handleConfirmTwoFactor = async () => {
    if (!twoFaCode) return;
    try {
      await disableTwoFactor.mutateAsync(twoFaCode);
      setTwoFaEnabled(true);
      setTwoFaSetup(null);
      setTwoFaCode('');
    } catch (err: unknown) {
      console.error('Failed to confirm 2FA:', err);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFaCode) return;
    try {
      await disableTwoFactor.mutateAsync(twoFaCode);
      setTwoFaEnabled(false);
      setTwoFaCode('');
    } catch (err: unknown) {
      console.error('Failed to disable 2FA:', err);
    }
  };

  const copyRecoveryCodes = () => {
    if (twoFaSetup) {
      navigator.clipboard.writeText(twoFaSetup.recovery_codes.join('\n'));
      setCopiedRecovery(true);
      setTimeout(() => setCopiedRecovery(false), 2000);
    }
  };

  return (
    <NamoShell>
      <PageFrame>
        <SectionHeader
          label="Security"
          title="Security Settings"
          subtitle="Manage your password and two-factor authentication"
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CompactPanel title="Change Password">
              <form onSubmit={handlePasswordChange} className="space-y-5">
                {passwordError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Password changed successfully
                  </div>
                )}

                <Field label="Current Password">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
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
                      className="pl-11"
                    />
                  </div>
                </Field>

                <Field label="Confirm New Password">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
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
                  disabled={changePassword.isPending}
                  onClick={() => {}}
                >
                  {changePassword.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CompactPanel>
          </motion.div>

          {/* Two-Factor Authentication */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CompactPanel title="Two-Factor Authentication">
              <div className="space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {twoFaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <StatusPill tone={twoFaEnabled ? 'emerald' : 'slate'}>
                    {twoFaEnabled ? 'Active' : 'Inactive'}
                  </StatusPill>
                </div>

                {!twoFaEnabled && !twoFaSetup && (
                  <Button variant="primary" onClick={handleEnableTwoFactor} disabled={enableTwoFactor.isPending}>
                    <Shield className="h-4 w-4" />
                    {enableTwoFactor.isPending ? 'Setting up...' : 'Enable 2FA'}
                  </Button>
                )}

                {twoFaSetup && (
                  <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Scan this QR code with your authenticator app:
                    </p>
                    <div className="flex justify-center">
                      <img
                        src={twoFaSetup.qr_code_url}
                        alt="2FA QR Code"
                        className="h-48 w-48 rounded-xl border border-[var(--border)]"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Manual entry key:</p>
                      <code className="block rounded-lg bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] break-all">
                        {twoFaSetup.secret}
                      </code>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                    >
                      {showRecoveryCodes ? 'Hide' : 'Show'} Recovery Codes
                    </Button>

                    {showRecoveryCodes && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-[var(--text-muted)]">Recovery codes (save these):</p>
                          <button
                            onClick={copyRecoveryCodes}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                          >
                            {copiedRecovery ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedRecovery ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {twoFaSetup.recovery_codes.map((code) => (
                            <code key={code} className="rounded-lg bg-[var(--bg-card)] p-2 text-xs text-center text-[var(--text-primary)]">
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    <Field label="Enter verification code">
                      <Input
                        type="text"
                        placeholder="6-digit code"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        maxLength={6}
                      />
                    </Field>
                    <Button variant="primary" onClick={handleConfirmTwoFactor} disabled={disableTwoFactor.isPending}>
                      Confirm & Enable
                    </Button>
                  </div>
                )}

                {twoFaEnabled && (
                  <div className="space-y-3">
                    <Field label="Enter code to disable 2FA">
                      <Input
                        type="text"
                        placeholder="6-digit code"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        maxLength={6}
                      />
                    </Field>
                    <Button
                      variant="danger"
                      onClick={handleDisableTwoFactor}
                      disabled={disableTwoFactor.isPending || !twoFaCode}
                    >
                      Disable 2FA
                    </Button>
                  </div>
                )}
              </div>
            </CompactPanel>
          </motion.div>
        </div>
      </PageFrame>
    </NamoShell>
  );
}
