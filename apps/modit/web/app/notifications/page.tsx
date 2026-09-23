"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Bell, Check, CheckCheck, Filter, Trash2 } from "lucide-react";
import {
  Card, CardContent, Button, Badge, LoadingSpinner, EmptyState,
} from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useOrderNotificationStore } from "@/lib/order-notifications";

function getClient() {
  return createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: getAccessToken(),
  });
}

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  type?: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["modit", "notifications", "all", filter],
    queryFn: async () => {
      const client = getClient();
      const res = await client.request<{ items: Notification[] }>("/api/v1/notifications?page=1&page_size=100");
      const all = res.items ?? [];
      return filter === "unread" ? all.filter((n) => !n.read) : all;
    },
  });

  // Local order-event notifications (order placed, returns, RFQs, stock alerts)
  const localEvents = useOrderNotificationStore((s) => s.events);
  const markLocalRead = useOrderNotificationStore((s) => s.markRead);
  const markAllLocalRead = useOrderNotificationStore((s) => s.markAllRead);
  const localAsNotifications: Notification[] = localEvents.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.body,
    read: e.read,
    created_at: new Date(e.createdAt).toISOString(),
    type: e.type,
  }));
  const combined = [...localAsNotifications, ...(notifications ?? [])];
  const visible = filter === "unread" ? combined.filter((n) => !n.read) : combined;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.request(`/api/v1/notifications/${id}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const client = getClient();
      await client.request("/api/v1/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "notifications"] });
    },
  });

  const unreadCount = combined.filter((n) => !n.read).length ?? 0;

  const handleMarkRead = (id: string) => {
    if (id.startsWith("EVT-")) markLocalRead(id);
    else markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllLocalRead();
    markAllReadMutation.mutate();
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Notifications</h1>
          <p className="text-[var(--text-secondary)]">Stay updated on your activities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === "unread"
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              )}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : visible.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title="No notifications"
              description={filter === "unread" ? "All caught up! No unread notifications." : "You don't have any notifications yet."}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors",
                !notification.read && "border-l-4 border-l-[var(--brand)]"
              )}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    notification.read
                      ? "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      : "bg-[var(--brand-bg)] text-[var(--brand)]"
                  )}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "text-sm text-[var(--text-primary)]",
                      !notification.read && "font-semibold"
                    )}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
