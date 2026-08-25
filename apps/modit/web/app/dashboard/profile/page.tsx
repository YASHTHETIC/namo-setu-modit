"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  User, Shield, Bell, Key, Eye, EyeOff, CheckCircle, Loader2,
} from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" />
      </div>
    );
  }

  const infoItems = [
    { label: "Role", value: user?.roles?.[0]?.name ?? "User", color: "#2D1B69", bg: "#F0ECF9" },
    { label: "Organization", value: "N/A", color: "#00BCD4", bg: "#E0F7FA" },
    { label: "Joined", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A", color: "#7CB518", bg: "#F0F9E8" },
    { label: "Last Login", value: user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A", color: "#E91E63", bg: "#FCE4EC" },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D1B69] to-[#150726] text-2xl font-bold text-white shadow-lg shadow-purple-900/20">
            {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#7CB518] flex items-center justify-center border-2 border-white">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-[18px] font-bold text-[#150726]">{user?.full_name ?? "User"}</h3>
          <p className="text-[13px] text-[#9B8CB5]">{user?.email ?? ""}</p>
          <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${user?.is_verified ? "bg-[#F0F9E8] text-[#7CB518]" : "bg-[#FFF3E0] text-[#FF9800]"}`}>
              {user?.is_verified ? "Verified" : "Unverified"}
            </span>
            {user?.mfa_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-[#F0ECF9] text-[#2D1B69]">
                <Shield className="h-3 w-3" /> 2FA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {infoItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: item.bg }}>
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B8CB5]">{item.label}</p>
                <p className="text-[13px] font-bold text-[#150726] mt-0.5">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E0F0] border-t-[#7CB518]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-bold text-[#150726]">Active Sessions</h3>
      {(!sessions || (sessions as SessionInfo[]).length === 0) ? (
        <div className="py-8 text-center">
          <Key className="h-8 w-8 text-[#9B8CB5]/30 mx-auto mb-2" />
          <p className="text-[13px] text-[#9B8CB5]">No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(sessions as SessionInfo[]).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#150726] truncate">
                  {session.user_agent || "Unknown device"}
                </p>
                <p className="text-[11px] text-[#9B8CB5] mt-0.5">
                  IP: {session.ip_address ?? "Unknown"} · {session.created_at ? new Date(session.created_at).toLocaleString() : ""}
                </p>
              </div>
              {session.is_current && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-[#F0F9E8] text-[#7CB518]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse" /> Current
                </span>
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
        <h3 className="mb-4 text-[14px] font-bold text-[#150726]">Change Password</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordMutation.mutate();
          }}
          className="max-w-md space-y-4"
        >
          {passwordMsg && (
            <div className="rounded-xl bg-[#F0F9E8] border border-[#C5E1A5] p-3 text-[13px] font-medium text-[#7CB518] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" /> {passwordMsg}
            </div>
          )}
          {passwordErr && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] font-medium text-red-600 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-red-500">!</span>
              </div>
              {passwordErr}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#150726]">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full border-2 border-[#E8E0F0] rounded-xl pl-4 pr-11 py-3 text-[13px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#150726]">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full border-2 border-[#E8E0F0] rounded-xl pl-4 pr-11 py-3 text-[13px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CB5] hover:text-[#2D1B69] transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#150726]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter password"
              className="w-full border-2 border-[#E8E0F0] rounded-xl px-4 py-3 text-[13px] text-[#150726] placeholder:text-[#B8A9CC] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full h-11 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#F0ECF9] flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#2D1B69]" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#150726]">Two-Factor Authentication</h3>
            <p className="text-[12px] text-[#9B8CB5]">Add an extra layer of security</p>
          </div>
        </div>
        <button
          onClick={() => enable2faMutation.mutate()}
          disabled={enable2faMutation.isPending}
          className="h-10 rounded-xl border-2 border-[#2D1B69] bg-white text-[13px] font-bold text-[#2D1B69] hover:bg-[#F0ECF9] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {enable2faMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {enable2faMutation.isPending ? "Enabling..." : "Enable 2FA"}
        </button>
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
    description,
    checked,
    onChange,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow">
      <div>
        <span className="text-[13px] font-bold text-[#150726]">{label}</span>
        {description && <p className="text-[11px] text-[#9B8CB5] mt-0.5">{description}</p>}
      </div>
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[#7CB518]" : "bg-[#DDD6EE]"
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
      <h3 className="text-[14px] font-bold text-[#150726]">Notification Preferences</h3>
      <div className="space-y-2">
        <Toggle
          label="Email notifications"
          description="Receive updates via email"
          checked={prefs.email_notifications}
          onChange={(v) => setPrefs({ ...prefs, email_notifications: v })}
        />
        <Toggle
          label="Push notifications"
          description="Browser push alerts"
          checked={prefs.push_notifications}
          onChange={(v) => setPrefs({ ...prefs, push_notifications: v })}
        />
        <Toggle
          label="Order updates"
          description="Status changes and delivery"
          checked={prefs.order_updates}
          onChange={(v) => setPrefs({ ...prefs, order_updates: v })}
        />
        <Toggle
          label="RFQ updates"
          description="Quotes and responses"
          checked={prefs.rfq_updates}
          onChange={(v) => setPrefs({ ...prefs, rfq_updates: v })}
        />
        <Toggle
          label="Inventory alerts"
          description="Low stock warnings"
          checked={prefs.inventory_alerts}
          onChange={(v) => setPrefs({ ...prefs, inventory_alerts: v })}
        />
        <Toggle
          label="Weekly digest"
          description="Summary of activity"
          checked={prefs.weekly_digest}
          onChange={(v) => setPrefs({ ...prefs, weekly_digest: v })}
        />
      </div>
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="h-11 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saveMutation.isPending ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1B69] to-[#150726] p-6 text-white">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#7CB518]/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-[#E91E63]/20 blur-2xl" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-[#7CB518]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7CB518]">Account</span>
          </div>
          <h1 className="text-[22px] font-extrabold">Profile & Settings</h1>
          <p className="mt-1 text-[13px] text-white/60">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab nav */}
        <div className="w-full shrink-0 lg:w-56">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#DDD6EE] bg-white p-1.5 lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-[#2D1B69] text-white shadow-lg shadow-purple-900/20"
                      : "text-[#9B8CB5] hover:bg-[#F0ECF9] hover:text-[#2D1B69]"
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
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-6">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "sessions" && <SessionsTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsPreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
