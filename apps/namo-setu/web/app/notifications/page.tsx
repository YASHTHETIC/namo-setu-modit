'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { PageFrame, SectionHeader, CompactPanel, Button, StatusPill, Select } from '@/components/namo-ui';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/namo-api';
import { cn } from '@/lib/utils';

function formatNotificationTime(dateStr: string) {
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notificationsQuery = useNotifications({
    page,
    page_size: 10,
    channel: channel || undefined,
    unread_only: unreadOnly || undefined,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const totalPages = notificationsQuery.data?.pages ?? 1;
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;

  return (
    <NamoShell>
      <PageFrame>
        <SectionHeader
          label="Notifications"
          title="Notifications"
          subtitle="Stay updated on your bookings and activity"
          action={
            unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )
          }
        />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Channel:</label>
            <Select
              value={channel}
              onChange={(e) => { setChannel(e.target.value); setPage(1); }}
              className="w-40"
            >
              <option value="">All channels</option>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
            </Select>
          </div>

          <button
            onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
              unreadOnly
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <Bell className="h-4 w-4" />
            Unread only
          </button>
        </motion.div>

        {/* Notifications List */}
        {notificationsQuery.isLoading && <LoadingState label="Loading notifications..." />}
        {notificationsQuery.isError && (
          <ErrorState message="Unable to load notifications." onRetry={() => notificationsQuery.refetch()} />
        )}

        <div className="space-y-3">
          {notifications.map((notification, i) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <CompactPanel>
                <div
                  className={cn(
                    'flex items-start gap-4 p-5 cursor-pointer transition-colors hover:bg-[var(--bg-subtle)] rounded-2xl',
                    !notification.is_read && 'bg-orange-50/30'
                  )}
                  onClick={() => {
                    if (!notification.is_read) markRead.mutate(notification.id);
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                    {notification.channel === 'email' ? (
                      <Mail className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn('text-sm', !notification.is_read ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]')}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-[var(--text-muted)]">{formatNotificationTime(notification.created_at)}</span>
                      <StatusPill tone={notification.channel === 'email' ? 'orange' : 'teal'}>
                        {notification.channel === 'email' ? 'Email' : 'In-App'}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              </CompactPanel>
            </motion.div>
          ))}

          {!notificationsQuery.isLoading && notifications.length === 0 && (
            <CompactPanel>
              <div className="py-16 text-center">
                <Bell className="mx-auto h-14 w-14 text-[var(--text-muted)]" />
                <p className="mt-4 text-lg font-semibold text-[var(--text-secondary)]">No notifications</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {unreadOnly ? "You're all caught up!" : 'Notifications will appear here'}
                </p>
              </div>
            </CompactPanel>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PageFrame>
    </NamoShell>
  );
}
