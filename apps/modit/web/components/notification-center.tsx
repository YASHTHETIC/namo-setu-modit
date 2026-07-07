"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

function getClient() {
  return createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: getAccessToken(),
  });
}

interface Notification {
  id: string;
  title: string;
  message: string;
  status: string;
  channel: string;
  created_at: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["modit", "notifications", "recent"],
    queryFn: async () => {
      const client = getClient();
      const res = await client.request<{ items: Notification[] }>("/api/v1/notifications?page=1&page_size=10", { method: "GET" });
      return res.items ?? [];
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.request(`/api/v1/notifications/${id}/read`, { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modit", "notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const client = getClient();
      await client.request("/api/v1/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modit", "notifications"] }),
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => n.status !== "read").length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-color,#EA580C)] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-medium text-[var(--brand-color,#EA580C)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-subtle)] ${
                    n.status !== "read" ? "bg-[var(--bg-subtle)]" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{n.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                  {n.status !== "read" && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="shrink-0 text-[var(--brand-color,#EA580C)] hover:text-[var(--text-primary)]"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
            <Link href="/notifications" className="flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--brand-color,#EA580C)] hover:underline" onClick={() => setOpen(false)}>
              View all notifications <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
