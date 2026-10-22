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
  const [itemDrafts, setItemDrafts] = useState<Array<{ product_id: string; requested_quantity: number; name?: string }>>([]);
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
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]">{it.product_name ?? `#${String(it.product_id).slice(0, 8)}`}</span>
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
                  <div key={`${d.product_id}:${i}`} className="flex items-center justify-between rounded-lg bg-[var(--bg-subtle)] px-3 py-1.5 text-sm mb-1.5">
                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]">{d.name ?? d.product_id.slice(0, 20)}</span>
                    <div className="flex items-center gap-0.5">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setItemDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, requested_quantity: Math.max(1, x.requested_quantity - 1) } : x)))}
                        className="px-1.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[var(--text-primary)] tabular-nums">{d.requested_quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => setItemDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, requested_quantity: x.requested_quantity + 1 } : x)))}
                        className="px-1.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        +
                      </button>
                      <button
                        aria-label="Remove item"
                        onClick={() => setItemDrafts((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-1 rounded p-0.5 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <RFQItemSearch
                  onAdd={(p) => setItemDrafts((d) => [...d, { product_id: p.id, requested_quantity: 1, name: p.name }])}
                />
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

/** Type-to-search product picker backed by the live catalog. Picking a result
 * adds it with the chosen quantity — buyers never need to know internal IDs. */
function RFQItemSearch({ onAdd }: { onAdd: (p: { id: string; name: string }) => void }) {
  const [term, setTerm] = useState("");
  const { data } = useSearchProducts(term.trim());
  const active = term.trim().length >= 2;
  const options: Array<{ id: string; name: string; price?: number }> = active ? ((data ?? []) as any).slice(0, 6) : [];
  return (
    <div className="relative">
      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products to add…" />
      {active && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
          {options.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onAdd({ id: p.id, name: p.name });
                setTerm("");
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-primary)]">{p.name}</span>
              {typeof p.price === "number" && (
                <span className="shrink-0 text-tiny font-bold text-[var(--brand)]">₹{p.price.toLocaleString("en-IN")}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {active && options.length === 0 && (
        <p className="mt-1 text-tiny text-[var(--text-muted)]">No products matched — try another term.</p>
      )}
    </div>
  );
}

function AddItemRow({ rfqId, onAdded }: { rfqId: string; onAdded: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const addItems = useAddRFQItems();
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-tiny font-semibold text-[var(--text-secondary)]">Quantity</span>
        <div className="flex items-center rounded-lg border border-[var(--border)]">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-2.5 py-1 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            −
          </button>
          <span className="min-w-8 text-center text-xs font-bold text-[var(--text-primary)] tabular-nums">{qty}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="px-2.5 py-1 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <RFQItemSearch
        onAdd={async (p) => {
          try {
            await addItems.mutateAsync({ rfqId, lines: [{ product_id: p.id, requested_quantity: qty }] } as never);
            onAdded();
            toast.success("Item added", `${p.name} × ${qty}`);
          } catch (e) {
            toast.error("Could not add", e instanceof Error ? e.message : "Try again.");
          }
        }}
      />
    </div>
  );
}
