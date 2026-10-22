"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  Users, Search, UserCheck, UserX, Eye, Shield, X, Loader2, AlertCircle,
} from "lucide-react";
import {
  Card, CardHeader, CardContent, Button, Input, Badge, Table, TableHead,
  TableBody, TableRow, TableCell, TableHeaderCell, LoadingSpinner, EmptyState, Avatar,
} from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

function getClient() {
  return createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: getAccessToken(),
  });
}

interface RoleRef {
  id: string;
  name: string;
}

/** Row shape returned by GET /admin/users (admin_extended). */
interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles: RoleRef[] | null;
}

/** Richer lookup shape from GET /admin/users/{id}. */
interface UserDetail extends UserRecord {
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  sessions: { id: string; ip_address: string | null; expires_at: string; is_revoked: boolean }[];
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  user_count?: number;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignUser, setAssignUser] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["modit", "admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", "1");
      params.set("page_size", "100");
      return getClient().request<{ items: UserRecord[]; total: number }>(`/admin/users?${params.toString()}`);
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["modit", "roles"],
    queryFn: async () => {
      return getClient().request<Role[]>("/admin/roles");
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["modit", "admin-user", detailId],
    enabled: Boolean(detailId),
    queryFn: async () => getClient().request<UserDetail>(`/admin/users/${detailId}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      await getClient().request(`/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ is_active: activate }),
      });
    },
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-user"] });
    },
    onError: (err: Error) => setActionError(err.message || "Could not update user status."),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!assignUser || !selectedRole) return;
      await getClient().request("/admin/roles/assign", {
        method: "POST",
        body: JSON.stringify({ user_id: assignUser.id, role_name: selectedRole }),
      });
    },
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-user"] });
      setAssignUser(null);
      setSelectedRole("");
    },
    onError: (err: Error) => setActionError(err.message || "Could not assign role."),
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">User Management</h1>
          <p className="text-[var(--text-secondary)]">Manage platform users and roles</p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent>
          <form
            className="relative flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search users by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
            <Button type="submit" variant="secondary" className="shrink-0">Search</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {isError && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Users unavailable — server unreachable or you lack the user-manage permission.
          </CardContent>
        </Card>
      )}
      {actionError && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No users found"
              description={search ? "Try a different search term." : "No users in the system yet."}
            />
          </CardContent>
        ) : (
          <>
            <CardContent className="pb-0 pt-4">
              <p className="text-xs text-[var(--text-muted)]">
                Showing {users.length} of {total} user{total === 1 ? "" : "s"}
                {search ? ` matching “${search}”` : ""}
              </p>
            </CardContent>
            <Table className="fx-table">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Verified</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name || user.email} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{user.full_name || "(no name)"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles ?? []).length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">No role</span>
                        ) : (
                          (user.roles ?? []).map((r) => (
                            <Badge key={r.id} variant="info">
                              {r.name.replace(/_/g, " ")}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "success" : "danger"}>
                        {user.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(user.id)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAssignUser(user);
                            setSelectedRole("");
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]"
                          title="Assign role"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: user.id, activate: !user.is_active })}
                          disabled={toggleStatusMutation.isPending}
                          className={cn(
                            "rounded-lg p-1.5 hover:bg-[var(--bg-subtle)]",
                            user.is_active
                              ? "text-[var(--text-muted)] hover:text-red-600"
                              : "text-[var(--text-muted)] hover:text-emerald-600"
                          )}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      {/* User detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h4 text-[var(--text-primary)]">User Details</h2>
                <button
                  onClick={() => setDetailId(null)}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {!detail ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={detail.full_name || detail.email} size="lg" />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {detail.full_name || "(no name)"}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">{detail.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Status</p>
                      <Badge variant={detail.is_active ? "success" : "danger"}>
                        {detail.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Roles</p>
                      <div className="flex flex-wrap gap-1">
                        {(detail.roles ?? []).length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">No role</span>
                        ) : (
                          (detail.roles ?? []).map((r) => (
                            <Badge key={r.id} variant="info">{r.name}</Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">2FA</p>
                      <Badge variant={detail.mfa_enabled ? "success" : "default"}>
                        {detail.mfa_enabled ? "Enabled" : "Off"}
                      </Badge>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Joined</p>
                      <p className="text-sm text-[var(--text-primary)]">
                        {detail.created_at ? new Date(detail.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">Last Login</p>
                      <p className="text-sm text-[var(--text-primary)]">
                        {detail.last_login_at
                          ? new Date(detail.last_login_at).toLocaleString()
                          : "Never logged in"}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-[var(--bg-subtle)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">
                        Active sessions: {(detail.sessions ?? []).filter((s) => !s.is_revoked).length}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-secondary)]">{detail.id}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={detail.is_active ? "danger" : "primary"}
                      onClick={() => {
                        toggleStatusMutation.mutate({ id: detail.id, activate: !detail.is_active });
                        setDetailId(null);
                      }}
                    >
                      {detail.is_active ? "Deactivate User" : "Activate User"}
                    </Button>
                    <Button variant="secondary" onClick={() => setDetailId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign role modal */}
      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h4 text-[var(--text-primary)]">
                  Assign role
                </h2>
                <button
                  onClick={() => setAssignUser(null)}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  {assignUser.full_name || assignUser.email} ·{" "}
                  {(assignUser.roles ?? []).map((r) => r.name).join(", ") || "no roles"}
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Select role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Choose a role...</option>
                    {(roles ?? []).map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-muted)]">
                    One role per step — assign again to add more.
                  </p>
                </div>
                {assignRoleMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Assigning…
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={!selectedRole || assignRoleMutation.isPending}
                  onClick={() => assignRoleMutation.mutate()}
                >
                  Assign Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
