"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  Shield, Plus, Pencil, Trash2, Users, X, Loader2, Check,
} from "lucide-react";
import {
  Card, CardHeader, CardContent, Button, Input, Badge, Table, TableHead,
  TableBody, TableRow, TableCell, TableHeaderCell, LoadingSpinner, EmptyState,
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

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  user_count?: number;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

const AVAILABLE_PERMISSIONS = [
  "products:read", "products:write", "products:delete",
  "orders:read", "orders:write", "orders:delete",
  "suppliers:read", "suppliers:write", "suppliers:delete",
  "projects:read", "projects:write", "projects:delete",
  "inventory:read", "inventory:write", "inventory:delete",
  "analytics:read",
  "users:read", "users:write", "users:delete",
  "roles:read", "roles:write", "roles:delete",
  "audit:read",
  "settings:read", "settings:write",
];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["modit", "roles"],
    queryFn: async () => {
      const client = getClient();
      return client.request<{ items: Role[] }>("/api/v1/admin/roles").then((r) => r.items ?? []);
    },
  });

  const { data: users } = useQuery({
    queryKey: ["modit", "users"],
    queryFn: async () => {
      const client = getClient();
      return client.request<{ items: User[] }>("/api/v1/admin/users").then((r) => r.items ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setError("");
      const client = getClient();
      await client.request("/api/v1/admin/roles", {
        method: "POST",
        body: JSON.stringify({ name: roleName, description: roleDesc, permissions: selectedPermissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "roles"] });
      setShowCreate(false);
      resetForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      setError("");
      if (!editingRole) return;
      const client = getClient();
      await client.request(`/api/v1/admin/roles/${editingRole.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: roleName, description: roleDesc, permissions: selectedPermissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "roles"] });
      setEditingRole(null);
      resetForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.request(`/api/v1/admin/roles/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "roles"] });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!assigningRole || !selectedUserId) return;
      const client = getClient();
      await client.request("/api/v1/admin/roles/assign", {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUserId, role_id: assigningRole.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "users"] });
      setAssigningRole(null);
      setSelectedUserId("");
    },
  });

  function resetForm() {
    setRoleName("");
    setRoleDesc("");
    setSelectedPermissions([]);
    setError("");
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description ?? "");
    setSelectedPermissions(role.permissions ?? []);
    setShowCreate(false);
  }

  function togglePermission(perm: string) {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  const permissionGroups = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    const [resource] = perm.split(":");
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Role Management</h1>
          <p className="text-[var(--text-secondary)]">Manage roles and permissions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreate(true);
            setEditingRole(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Roles list */}
        <Card>
          {rolesLoading ? (
            <LoadingSpinner />
          ) : !roles || roles.length === 0 ? (
            <CardContent>
              <EmptyState
                icon={<Shield className="h-8 w-8" />}
                title="No roles"
                description="Create your first role to get started."
                action={
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4" /> Create Role
                  </Button>
                }
              />
            </CardContent>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Permissions</TableHeaderCell>
                  <TableHeaderCell>Users</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-[var(--text-muted)]">{role.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.slice(0, 3).map((p) => (
                          <Badge key={p} variant="info" className="text-[10px]">
                            {p}
                          </Badge>
                        ))}
                        {(role.permissions?.length ?? 0) > 3 && (
                          <Badge variant="default" className="text-[10px]">
                            +{(role.permissions?.length ?? 0) - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                        <Users className="h-3.5 w-3.5" />
                        {role.user_count ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(role)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAssigningRole(role)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]"
                          title="Assign to user"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete role "${role.name}"?`)) {
                              deleteMutation.mutate(role.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create/Edit sidebar */}
        {(showCreate || editingRole) && (
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-h4 text-[var(--text-primary)]">
                  {editingRole ? "Edit Role" : "Create Role"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setEditingRole(null);
                    resetForm();
                  }}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editingRole ? updateMutation.mutate() : createMutation.mutate();
                }}
                className="space-y-4"
              >
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Name</label>
                  <Input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Editor"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Description</label>
                  <Input
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Permissions</label>
                  {Object.entries(permissionGroups).map(([resource, perms]) => (
                    <div key={resource} className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        {resource}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((perm) => {
                          const active = selectedPermissions.includes(perm);
                          return (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => togglePermission(perm)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                                active
                                  ? "bg-[var(--brand)] text-white"
                                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                              )}
                            >
                              {active && <Check className="h-3 w-3" />}
                              {perm.split(":")[1]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingRole ? (
                    "Save Changes"
                  ) : (
                    "Create Role"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Assign role modal */}
        {assigningRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-h4 text-[var(--text-primary)]">
                    Assign &ldquo;{assigningRole.name}&rdquo; to user
                  </h2>
                  <button
                    onClick={() => setAssigningRole(null)}
                    className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Select user</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
                    >
                      <option value="">Choose a user...</option>
                      {users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedUserId || assignRoleMutation.isPending}
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
    </div>
  );
}
