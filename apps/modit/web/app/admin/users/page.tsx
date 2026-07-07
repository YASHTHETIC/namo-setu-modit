"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  Users, Search, UserCheck, UserX, Eye, Shield, X, Loader2,
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

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  status: string;
  email_verified?: boolean;
  last_login_at?: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<UserRecord | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["modit", "admin-users", search],
    queryFn: async () => {
      const client = getClient();
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", "1");
      params.set("page_size", "100");
      return client.request<{ items: UserRecord[] }>(`/api/v1/admin/users?${params.toString()}`).then((r) => r.items ?? []);
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["modit", "roles"],
    queryFn: async () => {
      const client = getClient();
      return client.request<{ items: Role[] }>("/api/v1/admin/roles").then((r) => r.items ?? []);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      const client = getClient();
      await client.request(`/api/v1/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: activate ? "active" : "inactive" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-users"] });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!assignRoleUser || !selectedRoleId) return;
      const client = getClient();
      await client.request("/api/v1/admin/roles/assign", {
        method: "POST",
        body: JSON.stringify({ user_id: assignRoleUser.id, role_id: selectedRoleId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "admin-users"] });
      setAssignRoleUser(null);
      setSelectedRoleId("");
    },
  });

  const filteredUsers = users ?? [];

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredUsers.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No users found"
              description={search ? "Try a different search term." : "No users in the system."}
            />
          </CardContent>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Verified</TableHeaderCell>
                <TableHeaderCell>Last Login</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info" className="capitalize">
                      {user.role ?? "No role"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "danger"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.email_verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[var(--text-muted)]">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailUser(user)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setAssignRoleUser(user);
                          setSelectedRoleId("");
                        }}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]"
                        title="Assign role"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: user.id,
                            activate: user.status !== "active",
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className={cn(
                          "rounded-lg p-1.5 hover:bg-[var(--bg-subtle)]",
                          user.status === "active"
                            ? "text-[var(--text-muted)] hover:text-red-600"
                            : "text-[var(--text-muted)] hover:text-emerald-600"
                        )}
                        title={user.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {user.status === "active" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* User detail modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h4 text-[var(--text-primary)]">User Details</h2>
                <button
                  onClick={() => setDetailUser(null)}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar name={detailUser.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {detailUser.name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">{detailUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Status</p>
                    <Badge variant={detailUser.status === "active" ? "success" : "danger"}>
                      {detailUser.status}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Role</p>
                    <Badge variant="info">{detailUser.role ?? "No role"}</Badge>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Email Verified</p>
                    <Badge variant={detailUser.email_verified ? "success" : "warning"}>
                      {detailUser.email_verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Joined</p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {new Date(detailUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Last Login</p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {detailUser.last_login_at
                        ? new Date(detailUser.last_login_at).toLocaleString()
                        : "Never logged in"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-[var(--bg-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">User ID</p>
                    <p className="font-mono text-xs text-[var(--text-secondary)]">{detailUser.id}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={detailUser.status === "active" ? "danger" : "primary"}
                    onClick={() => {
                      toggleStatusMutation.mutate({
                        id: detailUser.id,
                        activate: detailUser.status !== "active",
                      });
                      setDetailUser(null);
                    }}
                  >
                    {detailUser.status === "active" ? "Deactivate User" : "Activate User"}
                  </Button>
                  <Button variant="secondary" onClick={() => setDetailUser(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign role modal */}
      {assignRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h4 text-[var(--text-primary)]">
                  Assign role to {assignRoleUser.name}
                </h2>
                <button
                  onClick={() => setAssignRoleUser(null)}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Select role</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Choose a role...</option>
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedRoleId || assignRoleMutation.isPending}
                  onClick={() => assignRoleMutation.mutate()}
                >
                  {assignRoleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Assign Role"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
