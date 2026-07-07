"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  CreditCard,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  PageFrame,
  SectionHeader,
  Panel,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
} from "@/components/namo-ui";
import { NamoShell } from "@/components/namo-shell";
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

const statusBadge: Record<string, { variant: "default" | "success" | "warning" | "danger" }> = {
  pending: { variant: "warning" },
  captured: { variant: "success" },
  refunded: { variant: "default" },
  failed: { variant: "danger" },
};

export default function PaymentHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["namo", "payments-history", statusFilter],
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
    <NamoShell>
    <PageFrame>
      <SectionHeader
        label="Donations"
        title="Payment History"
        subtitle="View all your donations and payments to temples."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Donated</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Payments</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{payments?.items?.length ?? 0}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Successful</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {payments?.items?.filter((p) => p.status === "captured").length ?? 0}
          </p>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-6 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

        <div className="divide-y divide-stone-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description="Your donation history will appear here."
            />
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-stone-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{payment.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {new Date(payment.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="font-mono text-xs text-slate-400">{payment.id.slice(0, 12)}...</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge[payment.status]?.variant ?? "default"}>
                    {payment.status}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-900">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </PageFrame>
    </NamoShell>
  );
}
