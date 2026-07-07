'use client';

import { motion } from 'framer-motion';
import { Monitor, Smartphone, Globe, Clock, Trash2, LogOut } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { PageFrame, SectionHeader, CompactPanel, Button, StatusPill } from '@/components/namo-ui';
import { useSessions, useRevokeSession, useRevokeAllOtherSessions } from '@/lib/namo-api';

function getDeviceIcon(deviceInfo: string | null) {
  if (!deviceInfo) return Globe;
  const lower = deviceInfo.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return Smartphone;
  return Monitor;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function SessionsPage() {
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOthers = useRevokeAllOtherSessions();
  const sessions = sessionsQuery.data ?? [];

  return (
    <NamoShell>
      <PageFrame>
        <SectionHeader
          label="Security"
          title="Active Sessions"
          subtitle="Manage devices where you're signed in"
          action={
            sessions.filter((s) => !s.is_current).length > 0 && (
              <Button
                variant="danger"
                size="sm"
                disabled={revokeAllOthers.isPending}
                onClick={() => revokeAllOthers.mutate()}
              >
                <LogOut className="h-4 w-4" />
                Revoke All Others
              </Button>
            )
          }
        />

        {sessionsQuery.isLoading && <LoadingState label="Loading sessions..." />}
        {sessionsQuery.isError && (
          <ErrorState message="Unable to load sessions." onRetry={() => sessionsQuery.refetch()} />
        )}

        <div className="space-y-4">
          {sessions.map((session, i) => {
            const DeviceIcon = getDeviceIcon(session.device_info);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CompactPanel>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50">
                        <DeviceIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {session.device_info || 'Unknown device'}
                          </span>
                          {session.is_current && (
                            <StatusPill tone="emerald">Current</StatusPill>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          {session.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ip_address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(session.last_active)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokeSession.isPending}
                        onClick={() => revokeSession.mutate(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CompactPanel>
              </motion.div>
            );
          })}

          {!sessionsQuery.isLoading && sessions.length === 0 && (
            <CompactPanel>
              <div className="py-12 text-center">
                <Monitor className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">No active sessions</p>
              </div>
            </CompactPanel>
          )}
        </div>
      </PageFrame>
    </NamoShell>
  );
}
