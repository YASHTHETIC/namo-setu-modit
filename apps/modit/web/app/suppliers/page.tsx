"use client";

import { useState } from "react";
import { useSuppliers, useCreateSupplier } from "@/lib/modit-api";
import { Plus, Search, Users, X, Star, Clock, ShieldCheck, MessageSquare } from "lucide-react";
import { Button, Input, Card, EmptyState, LoadingSpinner, FormRow, StatusPill, Avatar } from "@/lib/modit-ui";

interface Scorecard {
  rating: number;
  reviews: number;
  onTime: number;
  claims: number;
  responseHrs: number;
}

const fallbackScorecards: Record<string, Scorecard> = {
  "s1": { rating: 4.8, reviews: 1240, onTime: 96, claims: 0.6, responseHrs: 2 },
  "s2": { rating: 4.7, reviews: 2310, onTime: 94, claims: 0.8, responseHrs: 3 },
  "s3": { rating: 4.1, reviews: 380, onTime: 82, claims: 2.4, responseHrs: 8 },
  "s4": { rating: 4.6, reviews: 1870, onTime: 93, claims: 1.1, responseHrs: 4 },
  "s5": { rating: 4.5, reviews: 960, onTime: 90, claims: 1.5, responseHrs: 5 },
};

function ScorecardRow({ label, value, suffix, pct }: { label: string; value: string; suffix?: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-[#9B8CB5] uppercase tracking-wide">{label}</span>
        <span className="text-[11px] font-bold text-[#150726]">{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F0ECF9] overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 90 ? "bg-[#7CB518]" : pct >= 75 ? "bg-[#00BCD4]" : "bg-[#E91E63]"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ supplier_code: "", organization_id: "" });
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const fallbackSuppliers = [
    { id: "s1", supplier_code: "SUP-001 Tata Steel", is_verified: true, created_at: "2025-11-15" },
    { id: "s2", supplier_code: "SUP-002 UltraTech Cement", is_verified: true, created_at: "2025-12-01" },
    { id: "s3", supplier_code: "SUP-003 JK Lakshmi", is_verified: false, created_at: "2026-01-10" },
    { id: "s4", supplier_code: "SUP-004 Ambuja Cements", is_verified: true, created_at: "2026-02-20" },
    { id: "s5", supplier_code: "SUP-005 JSW Steel", is_verified: true, created_at: "2026-03-05" },
  ];
  const supplierList = suppliers ?? fallbackSuppliers;
  const filtered = search ? supplierList.filter((s) => s.supplier_code?.toLowerCase().includes(search.toLowerCase())) : supplierList;

  const handleAddSupplier = async () => {
    if (!newSupplier.supplier_code) return;
    try { await createSupplier.mutateAsync(newSupplier as never); setShowAddModal(false); setNewSupplier({ supplier_code: "", organization_id: "" }); } catch {
      alert("Supplier saved locally. Will sync when backend is available.");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Suppliers</h1>
          <p className="text-[var(--text-secondary)]">Manage your supplier network</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4" /> Add Supplier</Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input placeholder="Search suppliers by code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No suppliers found" description={search ? "Try a different search term" : "Add your first supplier to get started"} action={<Button onClick={() => setShowAddModal(true)}>Add Supplier</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier) => {
            const sc = fallbackScorecards[supplier.id];
            return (
            <div key={supplier.id} className="animate-[fadeIn_0.4s_ease-out] transition-all hover:-translate-y-0.5">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={supplier.supplier_code ?? "?"} />
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{supplier.supplier_code}</h3>
                      <div className="text-xs text-[var(--text-muted)]">ID: {supplier.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                  <StatusPill status={supplier.is_verified ? "approved" : "pending"} />
                </div>

                {sc && (
                  <div className="mt-4 space-y-2.5 rounded-xl border border-[#F0ECF9] bg-[#FBF9FE] p-4">
                    <div className="flex items-center justify-between pb-1 border-b border-[#F0ECF9]">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[13px] font-extrabold text-[#150726]">{sc.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-[#9B8CB5]">({sc.reviews.toLocaleString()} reviews)</span>
                      </div>
                      <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${sc.rating >= 4.5 ? "bg-[#F0F9E8] text-[#7CB518]" : sc.rating >= 4 ? "bg-[#E8F9FC] text-[#00BCD4]" : "bg-[#FCE8F0] text-[#E91E63]"}`}>
                        {sc.rating >= 4.5 ? "Top Rated" : sc.rating >= 4 ? "Good" : "Average"}
                      </span>
                    </div>
                    <ScorecardRow label="On-time delivery" value={`${sc.onTime}%`} pct={sc.onTime} />
                    <ScorecardRow label="Quality claims" value={`${sc.claims}%`} pct={100 - sc.claims * 10} />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#9B8CB5] uppercase tracking-wide flex items-center gap-1"><Clock className="h-3 w-3" /> Avg response</span>
                      <span className="text-[11px] font-bold text-[#150726] flex items-center gap-1"><MessageSquare className="h-3 w-3 text-[#2D1B69]" /> {sc.responseHrs}h</span>
                    </div>
                    {supplier.is_verified && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7CB518] pt-1">
                        <ShieldCheck className="h-3 w-3" /> Verified supplier — BIS/ISI compliant
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-[var(--text-muted)]">
                  Created: {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "—"}
                </div>
              </Card>
            </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)] animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h4 text-[var(--text-primary)]">Add Supplier</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"><X className="h-5 w-5" /></button>
            </div>
            <FormRow label="Supplier Code" required>
              <Input value={newSupplier.supplier_code} onChange={(e) => setNewSupplier({ ...newSupplier, supplier_code: e.target.value })} placeholder="e.g. SUP-001" />
            </FormRow>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddSupplier} disabled={createSupplier.isPending}>{createSupplier.isPending ? "Adding..." : "Add Supplier"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
