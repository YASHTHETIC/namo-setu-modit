"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRFQs, useCreateRFQ } from "@/lib/modit-api";
import { Plus, FileText, Calendar, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Input, Textarea, Card, EmptyState, LoadingSpinner, FormRow, StatusPill } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function RFQPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRFQ, setNewRFQ] = useState({ title: "", description: "", due_date: "" });
  const { data: rfqs, isLoading, isError, error, refetch } = useRFQs();
  const createRFQ = useCreateRFQ();
  const rfqList = rfqs ?? [];

  const handleCreateRFQ = async () => {
    if (!newRFQ.title) return;
    try { await createRFQ.mutateAsync({ title: newRFQ.title, description: newRFQ.description, due_date: newRFQ.due_date || undefined } as never); setShowCreateModal(false); setNewRFQ({ title: "", description: "", due_date: "" }); } catch {}
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Requests for Quotation</h1>
          <p className="text-[var(--text-secondary)]">Create and manage RFQs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> Create RFQ</Button>
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
      ) : rfqList.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No RFQs yet" description="Create your first RFQ to start sourcing materials" action={<Button onClick={() => setShowCreateModal(true)}>Create RFQ</Button>} />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rfqList.map((rfq) => (
            <motion.div key={rfq.id} variants={fadeUp} whileHover={{ y: -2 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">{rfq.rfq_number ?? `#${rfq.id.slice(0, 8)}`}</h3>
                  <StatusPill status={rfq.status ?? "open"} />
                </div>
                {rfq.notes && <p className="mb-3 text-sm text-[var(--text-secondary)] line-clamp-2">{rfq.notes}</p>}
                {rfq.due_date && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <Calendar className="h-3.5 w-3.5" /> Due: {new Date(rfq.due_date).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
                  Created: {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "—"}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 text-[var(--text-primary)]">Create RFQ</h2>
                <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <FormRow label="Title" required>
                  <Input value={newRFQ.title} onChange={(e) => setNewRFQ({ ...newRFQ, title: e.target.value })} placeholder="e.g. Steel and Cement for Project A" />
                </FormRow>
                <FormRow label="Notes">
                  <Textarea rows={3} value={newRFQ.description} onChange={(e) => setNewRFQ({ ...newRFQ, description: e.target.value })} placeholder="Additional notes..." />
                </FormRow>
                <FormRow label="Due Date">
                  <Input type="date" value={newRFQ.due_date} onChange={(e) => setNewRFQ({ ...newRFQ, due_date: e.target.value })} />
                </FormRow>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreateRFQ} disabled={createRFQ.isPending}>{createRFQ.isPending ? "Creating..." : "Create RFQ"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
