'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Mail, Smartphone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, useNotificationsUnread, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/namo-api';
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadQuery = useNotificationsUnread();
  const notificationsQuery = useNotifications({ page_size: 5 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadQuery.data?.unread_count ?? 0;
  const notifications = notificationsQuery.data?.items ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-color,#F97316)] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notificationsQuery.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-orange-500" />
                </div>
              )}

              {!notificationsQuery.isLoading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">No notifications yet</p>
                </div>
              )}

              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkRead(notification.id)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-subtle)]',
                    !notification.is_read && 'bg-orange-50/50'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100">
                    {notification.channel === 'email' ? (
                      <Mail className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm leading-snug', !notification.is_read ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                View all notifications
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
