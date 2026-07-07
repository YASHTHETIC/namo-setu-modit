"use client";

import { useState } from "react";
import { useSuppliers, useCreateSupplier } from "@/lib/modit-api";
import { Plus, Search, Users, X } from "lucide-react";
import { Button, Input, Card, EmptyState, LoadingSpinner, FormRow, StatusPill, Avatar } from "@/lib/modit-ui";

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
    try { await createSupplier.mutateAsync(newSupplier as never); setShowAddModal(false); setNewSupplier({ supplier_code: "", organization_id: "" }); } catch {}
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
          {filtered.map((supplier) => (
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
                <div className="mt-4 text-xs text-[var(--text-muted)]">
                  Created: {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "—"}
                </div>
              </Card>
            </div>
          ))}
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
