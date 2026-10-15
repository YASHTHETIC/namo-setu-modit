"use client";

import { useState } from "react";
import Link from "next/link";
import { useRFQs, useCreateRFQ, useRFQ, useAddRFQItems, useAwardRFQ } from "@/lib/modit-api";
import { useCurrentUser } from "@/lib/use-current-user";
import { useSearchProducts } from "@/lib/api-hooks";
import { Plus, FileText, Calendar, X, CheckCircle2, Trophy } from "lucide-react";
import { Button, Input, Textarea, Card, EmptyState, LoadingSpinner, FormRow, StatusPill } from "@/lib/modit-ui";
import { useToast } from "@foundation/ui";

export default function RFQPage() {
  const toast = useToast();
  const { data: me } = useCurrentUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRFQ, setNewRFQ] = useState({ notes: "", due_date: "" });
  const [itemDrafts, setItemDrafts] = useState<Array<{ product_id: string; requested_quantity: number }>>([]);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: rfqs, isLoading, isError, refetch } = useRFQs();
  const createRFQ = useCreateRFQ();
  const { data: detail, refetch: refetchDetail } = useRFQ(selectedId ?? "");
  const addItems = useAddRFQItems();
  const award = useAwardRFQ();

  const handleCreateRFQ = async () => {
    try {
      const created: any = await createRFQ.mutateAsync({
        notes: newRFQ.notes || undefined,
        due_date: newRFQ.due_date || undefined,
        items: itemDrafts,
      } as never);
      setShowCreateModal(false);
      setNewRFQ({ notes: "", due_date: "" });
      setItemDrafts([]);
      setSelectedId(created?.id ?? null);
      toast.success("RFQ created", "Suppliers can now quote on it.");
    } catch (e) {
      toast.error("Could not create", e instanceof Error ? e.message : "Try again.");
    }
  };

  const addDraftLine = () => {
    if (!sku.trim() || qty <= 0) return;
    setItemDrafts((d) => [...d, { product_id: sku.trim(), requested_quantity: qty }]);
    setSku("");
    setQty(1);
  };

  const handleAward = async (quotationId: string) => {
    if (!selectedId) return;
    if (!confirm("Award this quote? A purchase order will be created.")) return;
    try {
      const res: any = await award.mutateAsync({ rfqId: selectedId, quotationId });
      toast.success("Awarded", `Purchase order ${res.order_number} created.`);
      refetchDetail();
      refetch();
    } catch (e) {
      toast.error("Award failed", e instanceof Error ? e.message : "Try again.");
    }
  };

  const isOwner = detail && me?.id && detail.requested_by_user_id === me.id;
  const quotes = [...(detail?.quotations ?? [])].sort((a: any, b: any) => a.grand_total - b.grand_total);

  return (
    <div className="fx-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Requests for Quotation</h1>
          <p className="text-[var(--text-secondary)]">Create RFQs, compare supplier quotes, award in one click</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> Create RFQ</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold text-[var(--text-primary)]">Could not load RFQs</p>
          <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : !rfqs || rfqs.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No RFQs yet" description="Create your first RFQ to start sourcing materials" action={<Button onClick={() => setShowCreateModal(true)}>Create RFQ</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rfqs.map((rfq: any) => (
            <button key={rfq.id} onClick={() => setSelectedId(selectedId === rfq.id ? null : rfq.id)} className="text-left animate-[fadeIn_0.4s_ease-out] transition-all hover:-translate-y-0.5">
              <Card className={`p-6 ${selectedId === rfq.id ? "ring-2 ring-[var(--brand)]" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">{rfq.rfq_number ?? `#${String(rfq.id).slice(0, 8)}`}</h3>
                  <StatusPill status={rfq.status ?? "open"} />
                </div>
                {rfq.notes && <p className="mb-3 text-sm text-[var(--text-secondary)] line-clamp-2">{rfq.notes}</p>}
                {rfq.due_date && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <Calendar className="h-3.5 w-3.5" /> Due: {new Date(rfq.due_date).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
                  Created: {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "-"}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selectedId && detail && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Requested items ({detail.items?.length ?? 0})</h3>
            <div className="space-y-2">
              {(detail.items ?? []).map((it: any) => (
                <div key={it.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">{it.product_id.slice(0, 18)}</span>
                  <span className="font-bold text-[var(--text-primary)]">× {it.requested_quantity}</span>
                </div>
              ))}
              {(!detail.items || detail.items.length === 0) && (
                <p className="text-sm text-[var(--text-muted)]">No items yet — add the first below.</p>
              )}
            </div>
            {isOwner && detail.status !== "awarded" && (
              <AddItemRow rfqId={selectedId} onAdded={() => refetchDetail()} />
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quotes ({quotes.length}) — cheapest first</h3>
            {quotes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No quotes yet. Verified suppliers see this RFQ in their hub.</p>
            ) : (
              <div className="space-y-2">
                {quotes.map((q: any, i: number) => (
                  <div key={q.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${i === 0 ? "border-[#7CB518] bg-[#F0F9E8]" : "border-[var(--border)]"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        ₹{Number(q.grand_total).toLocaleString("en-IN")}
                        {i === 0 && <span className="ml-2 rounded-full bg-[#7CB518] px-2 py-0.5 text-tiny font-bold text-white">BEST</span>}
                      </p>
                      <p className="text-tiny text-[var(--text-muted)]">{q.quotation_number} · {q.status}</p>
                    </div>
                    {isOwner && detail.status !== "awarded" && q.status === "sent" && (
                      <button
                        onClick={() => handleAward(q.id)}
                        disabled={award.isPending}
                        className="flex items-center gap-1 rounded-lg bg-[#2D1B69] px-3 py-1.5 text-micro font-bold text-white hover:bg-[#1E1245] disabled:opacity-50"
                      >
                        <Trophy className="h-3 w-3" /> Award
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {detail.status === "awarded" && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#7CB518]">
                <CheckCircle2 className="h-4 w-4" /> Awarded — purchase order created.
              </p>
            )}
          </Card>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)] animate-[scaleIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h4 text-[var(--text-primary)]">Create RFQ</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <FormRow label="Notes">
                <Textarea rows={3} value={newRFQ.notes} onChange={(e) => setNewRFQ({ ...newRFQ, notes: e.target.value })} placeholder="e.g. 50 bags cement + 10 steel bars for site A" />
              </FormRow>
              <FormRow label="Due Date">
                <Input type="date" value={newRFQ.due_date} onChange={(e) => setNewRFQ({ ...newRFQ, due_date: e.target.value })} />
              </FormRow>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Items ({itemDrafts.length})</p>
                {itemDrafts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-subtle)] px-3 py-1.5 text-sm mb-1.5">
                    <span className="font-mono text-xs">{d.product_id.slice(0, 20)}</span>
                    <span className="font-bold">× {d.requested_quantity}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Product ID or SKU" />
                  <Input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20" />
                  <Button variant="secondary" onClick={addDraftLine}>Add</Button>
                </div>
                <p className="mt-1 text-tiny text-[var(--text-muted)]">Tip: open a product — its ID is the last part of the page address.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateRFQ} disabled={createRFQ.isPending}>{createRFQ.isPending ? "Creating..." : "Create RFQ"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddItemRow({ rfqId, onAdded }: { rfqId: string; onAdded: () => void }) {
  const toast = useToast();
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const addItems = useAddRFQItems();
  return (
    <div className="mt-3 flex gap-2">
      <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Product ID" />
      <Input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20" />
      <Button
        variant="secondary"
        disabled={addItems.isPending}
        onClick={async () => {
          try {
            await addItems.mutateAsync({ rfqId, lines: [{ product_id: sku.trim(), requested_quantity: qty }] });
            setSku("");
            setQty(1);
            onAdded();
          } catch (e) {
            toast.error("Could not add", e instanceof Error ? e.message : "Unknown product?");
          }
        }}
      >
        Add
      </Button>
    </div>
  );
}
