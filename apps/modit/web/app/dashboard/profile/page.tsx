"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  User, Shield, Bell, Key, Eye, EyeOff, CheckCircle, Loader2,
} from "lucide-react";
import {
  Card, CardHeader, CardContent, Button, Input, Badge, LoadingSpinner,
} from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview", icon: User },
  { id: "sessions", label: "Sessions", icon: Key },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof tabs)[number]["id"];

function getClient() {
  return createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: getAccessToken(),
  });
}

interface UserProfile {
  id?: string;
  email?: string;
  full_name?: string;
  is_verified?: boolean;
  roles?: Array<{ name: string }>;
  last_login_at?: string;
  created_at?: string;
  mfa_enabled?: boolean;
}

function OverviewTab() {
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["modit", "profile"],
    queryFn: () => getClient().request<UserProfile>("/api/v1/auth/profile"),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--brand)] text-2xl font-bold text-white">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{user?.full_name ?? "User"}</h3>
          <p className="text-sm text-[var(--text-muted)]">{user?.email ?? ""}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={user?.is_verified ? "success" : "warning"}>
              {user?.is_verified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Role</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{user?.roles?.[0]?.name ?? "User"}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Organization</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">N/A</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Joined</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Last Login</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SessionInfo {
  id: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  expires_at?: string;
  is_current?: boolean;
}

function SessionsTab() {
  const { data: sessions, isLoading } = useQuery<SessionInfo[]>({
    queryKey: ["modit", "sessions"],
    queryFn: async () => {
      const res = await getClient().request<{ sessions: SessionInfo[] }>("/api/v1/auth/sessions");
      return res.sessions ?? [];
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Active Sessions</h3>
      {(!sessions || (sessions as SessionInfo[]).length === 0) ? (
        <p className="text-sm text-[var(--text-muted)]">No active sessions found.</p>
      ) : (
        <div className="space-y-3">
          {(sessions as SessionInfo[]).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {session.user_agent || "Unknown device"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  IP: {session.ip_address ?? "Unknown"} &middot;{" "}
                  {session.created_at ? new Date(session.created_at).toLocaleString() : ""}
                </p>
              </div>
              {session.is_current && (
                <Badge variant="success">Current</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setPasswordMsg("");
      setPasswordErr("");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      const client = getClient();
      await client.request("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
    },
    onSuccess: () => {
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      setPasswordErr(err.message || "Failed to change password.");
    },
  });

  const enable2faMutation = useMutation({
    mutationFn: async () => {
      const client = getClient();
      return client.request("/api/v1/auth/2fa/enable", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "profile"] });
    },
  });

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Change Password</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordMutation.mutate();
          }}
          className="max-w-md space-y-4"
        >
          {passwordMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{passwordMsg}</div>
          )}
          {passwordErr && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{passwordErr}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
          </Button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Two-Factor Authentication</h3>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Add an extra layer of security to your account.
        </p>
        <Button
          variant="secondary"
          onClick={() => enable2faMutation.mutate()}
          disabled={enable2faMutation.isPending}
        >
          {enable2faMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable 2FA"}
        </Button>
      </div>
    </div>
  );
}

function NotificationsPreferencesTab() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    order_updates: true,
    rfq_updates: true,
    inventory_alerts: true,
    weekly_digest: false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const client = getClient();
      await client.request("/api/v1/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ notification_preferences: prefs }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "profile"] });
    },
  });

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[var(--brand)]" : "bg-[var(--border)]"
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notification Preferences</h3>
      <div className="space-y-3">
        <Toggle
          label="Email notifications"
          checked={prefs.email_notifications}
          onChange={(v) => setPrefs({ ...prefs, email_notifications: v })}
        />
        <Toggle
          label="Push notifications"
          checked={prefs.push_notifications}
          onChange={(v) => setPrefs({ ...prefs, push_notifications: v })}
        />
        <Toggle
          label="Order updates"
          checked={prefs.order_updates}
          onChange={(v) => setPrefs({ ...prefs, order_updates: v })}
        />
        <Toggle
          label="RFQ updates"
          checked={prefs.rfq_updates}
          onChange={(v) => setPrefs({ ...prefs, rfq_updates: v })}
        />
        <Toggle
          label="Inventory alerts"
          checked={prefs.inventory_alerts}
          onChange={(v) => setPrefs({ ...prefs, inventory_alerts: v })}
        />
        <Toggle
          label="Weekly digest"
          checked={prefs.weekly_digest}
          onChange={(v) => setPrefs({ ...prefs, weekly_digest: v })}
        />
      </div>
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Preferences"}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Profile & Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage your account settings</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab nav */}
        <div className="w-full shrink-0 lg:w-56">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <Card>
            <CardContent className="pt-6">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "sessions" && <SessionsTab />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "notifications" && <NotificationsPreferencesTab />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
