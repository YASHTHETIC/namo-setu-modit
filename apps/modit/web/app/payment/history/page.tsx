"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  CreditCard,
  Search,
  Calendar,
} from "lucide-react";
import {
  Panel,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "captured" | "refunded" | "failed";
  description: string;
  created_at: string;
  receipt_url?: string;
}

const statusFilters = ["all", "pending", "captured", "refunded"] as const;

const statusVariant: Record<string, "success" | "warning" | "default" | "danger"> = {
  pending: "warning",
  captured: "success",
  refunded: "default",
  failed: "danger",
};

export default function ModitPaymentHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["modit", "payments-history", statusFilter],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await client.request<{ items: Payment[]; total: number }>(
        `/api/v1/payments/history?${params.toString()}`,
        { method: "GET" }
      );
      return data;
    },
  });

  const filteredPayments =
    payments?.items?.filter(
      (p) =>
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  const totalAmount =
    payments?.items?.reduce((sum, p) => (p.status === "captured" ? sum + p.amount : sum), 0) ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          Finance
        </p>
        <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Payment History
        </h2>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-[var(--text-muted)]">
          Track all your purchase and supplier payments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Paid
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Transactions
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {payments?.items?.length ?? 0}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Successful
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {payments?.items?.filter((p) => p.status === "captured").length ?? 0}
          </p>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search by description or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="No payments found"
            description="Your payment history will appear here."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Transaction</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {payment.id.slice(0, 12)}...
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{payment.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(payment.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[payment.status] ?? "default"}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </main>
  );
}
