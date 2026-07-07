"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  FileText, ChevronDown, ChevronUp, Filter, Calendar, Search,
} from "lucide-react";
import {
  Card, CardContent, Button, Badge, Table, TableHead, TableBody,
  TableRow, TableCell, TableHeaderCell, LoadingSpinner, EmptyState, Input,
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

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
  login: "bg-purple-50 text-purple-700",
  logout: "bg-slate-100 text-slate-600",
};

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["modit", "audit-logs", entityType, action, dateFrom, dateTo, page],
    queryFn: async () => {
      const client = getClient();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(perPage));
      if (entityType) params.set("entity_type", entityType);
      if (action) params.set("action", action);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      return client.request<{ items: AuditLog[]; total: number }>(`/api/v1/admin/audit-logs?${params.toString()}`);
    },
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Audit Logs</h1>
        <p className="text-[var(--text-secondary)]">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="">All entities</option>
                <option value="user">User</option>
                <option value="product">Product</option>
                <option value="order">Order</option>
                <option value="supplier">Supplier</option>
                <option value="project">Project</option>
                <option value="role">Role</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Action</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="">All actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEntityType("");
                setAction("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No audit logs"
              description="No activities match your filters."
            />
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                  <TableHeaderCell>Entity</TableHeaderCell>
                  <TableHeaderCell>Entity ID</TableHeaderCell>
                  <TableHeaderCell>IP</TableHeaderCell>
                  <TableHeaderCell className="w-10"> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <>
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.user_name || "System"}</p>
                          {log.user_email && (
                            <p className="text-xs text-[var(--text-muted)]">{log.user_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "capitalize",
                            ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{log.entity_type}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {log.entity_id?.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[var(--text-muted)]">
                          {log.ip_address ?? "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                        >
                          {expandedId === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow key={`${log.id}-expanded`}>
                        <TableCell colSpan={7}>
                          <div className="rounded-xl bg-[var(--bg-subtle)] p-4 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-muted)]">Entity ID</p>
                              <p className="font-mono text-sm text-[var(--text-primary)]">{log.entity_id}</p>
                            </div>
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)]">Changes</p>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(log.changes).map(([field, change]) => (
                                    <div key={field} className="flex items-center gap-2 text-sm">
                                      <span className="font-medium text-[var(--text-primary)]">{field}:</span>
                                      <span className="text-red-500 line-through">{String(change.old)}</span>
                                      <span className="text-[var(--text-muted)]">&rarr;</span>
                                      <span className="text-emerald-600">{String(change.new)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)]">Metadata</p>
                                <pre className="mt-1 rounded-lg bg-[var(--bg-card)] p-2 text-xs text-[var(--text-secondary)] overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
