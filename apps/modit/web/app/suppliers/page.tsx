"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSuppliers, useCreateSupplier } from "@/lib/modit-api";
import { Plus, Search, CheckCircle, Users, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Input, Card, EmptyState, LoadingSpinner, FormRow, StatusPill, Avatar } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ supplier_code: "", organization_id: "" });
  const { data: suppliers, isLoading, isError, error, refetch } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const supplierList = suppliers ?? [];
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

      {isLoading ? <LoadingSpinner /> : isError ? (
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-900">Failed to load data</h3>
              <p className="mt-1 text-sm text-red-700/80">{error?.message || "Please try again later"}</p>
            </div>
            <button onClick={() => refetch()} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-all hover:bg-red-700">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No suppliers found" description={search ? "Try a different search term" : "Add your first supplier to get started"} action={<Button onClick={() => setShowAddModal(true)}>Add Supplier</Button>} />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier) => (
            <motion.div key={supplier.id} variants={fadeUp} whileHover={{ y: -2 }}>
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
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
