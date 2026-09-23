"use client";

import { useState } from "react";
import { X, Check, RotateCcw, Minus, Plus } from "lucide-react";
import { useReturnStore, RETURN_REASONS, type ReturnItem } from "@/lib/return-store";
import { useCreateReturn } from "@/lib/modit-api";
import { notifyOrderEvent } from "@/lib/order-notifications";

export interface ReturnableItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCode: string;
}

interface ReturnModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  items: ReturnableItem[];
  onSubmitted?: (returnId: string) => void;
}

export function ReturnModal({ open, onClose, orderId, items, onSubmitted }: ReturnModalProps) {
  const [selected, setSelected] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.sku, i.quantity]))
  );
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [refundMethod, setRefundMethod] = useState<"source" | "bank" | "upi">("source");
  const [refundTarget, setRefundTarget] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [returnId, setReturnId] = useState("");
  const [error, setError] = useState("");

  const createReturnLocal = useReturnStore((s) => s.createReturn);
  const createReturnApi = useCreateReturn();

  if (!open) return null;

  const toggleItem = (sku: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[sku] > 0) next[sku] = 0;
      else {
        const item = items.find((i) => i.sku === sku);
        next[sku] = item ? item.quantity : 1;
      }
      return next;
    });
  };

  const setQty = (sku: string, qty: number) => {
    const item = items.find((i) => i.sku === sku);
    if (!item) return;
    setSelected((prev) => ({ ...prev, [sku]: Math.max(0, Math.min(qty, item.quantity)) }));
  };

  const chosen: ReturnItem[] = items
    .filter((i) => (selected[i.sku] ?? 0) > 0)
    .map((i) => ({ sku: i.sku, name: i.name, quantity: selected[i.sku], unitPrice: i.unitPrice }));

  const refundTotal = chosen.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const valid =
    chosen.length > 0 &&
    phone.replace(/\D/g, "").length === 10 &&
    (refundMethod === "source" || refundTarget.trim().length >= 4);

  const handleSubmit = async () => {
    if (!valid) {
      setError("Select at least one item, enter a valid 10-digit phone, and add refund details.");
      return;
    }
    setError("");
    const req = createReturnLocal({
      orderId,
      items: chosen,
      reason,
      detail: detail.trim(),
      refundMethod,
      refundTarget: refundMethod === "source" ? "Original payment source" : refundTarget.trim(),
      phone: phone.replace(/\D/g, ""),
    });
    try {
      await createReturnApi.mutateAsync({
        order_id: orderId,
        items: chosen,
        reason,
        notes: detail.trim() || undefined,
      } as never);
    } catch {
      /* backend unavailable — request stays local and syncs later */
    }
    notifyOrderEvent({
      title: "Return requested",
      body: `${req.id} raised for order ${orderId} — estimated refund ₹${refundTotal.toLocaleString("en-IN")}.`,
      type: "return",
      orderId,
    });
    setReturnId(req.id);
    setSubmitted(true);
    onSubmitted?.(req.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-[#DDD6EE] animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-14 w-14 rounded-full bg-[#7CB518]/15 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-[#7CB518]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#150726]">Return Request Submitted</h3>
            <p className="text-[12px] text-[#9B8CB5] mt-1">Request ID: <span className="font-bold text-[#2D1B69]">{returnId}</span></p>
            <p className="text-[12px] text-[#9B8CB5] mt-1">Our team will schedule a pickup within 48 hours. Track it on this order page.</p>
            <button onClick={onClose} className="mt-5 px-5 py-2.5 rounded-lg bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6aa514]">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#150726] flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#E91E63]" /> Request Return / Refund
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-[11px] text-[#9B8CB5] mb-4">Order <span className="font-bold text-[#2D1B69]">{orderId}</span> — 7-day easy returns on delivered items.</p>

            <p className="text-[11px] font-bold text-[#150726] mb-2">Select items to return</p>
            <div className="space-y-2 mb-4">
              {items.map((item) => {
                const qty = selected[item.sku] ?? 0;
                const active = qty > 0;
                return (
                  <div key={item.sku} className={`rounded-xl border-2 p-3 transition-all ${active ? "border-[#E91E63]/40 bg-[#FCE8F0]/40" : "border-[#F0ECF9] bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleItem(item.sku)}
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? "bg-[#E91E63] border-[#E91E63]" : "border-[#DDD6EE] bg-white"}`}
                      >
                        {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#150726] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#9B8CB5]">{item.quantity} {item.unitCode} × ₹{item.unitPrice.toLocaleString()}</p>
                      </div>
                      {active && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setQty(item.sku, qty - 1)} className="h-6 w-6 rounded-md border border-[#DDD6EE] flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                          <span className="text-[12px] font-bold w-6 text-center">{qty}</span>
                          <button onClick={() => setQty(item.sku, qty + 1)} className="h-6 w-6 rounded-md border border-[#DDD6EE] flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-[#150726] mb-2">Reason</p>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#E91E63] mb-3 bg-white">
              {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <p className="text-[11px] font-bold text-[#150726] mb-2">Details <span className="font-medium text-[#9B8CB5]">(optional)</span></p>
            <textarea rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Describe the issue, attach photos at pickup..." className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#E91E63] resize-none mb-3" />

            <p className="text-[11px] font-bold text-[#150726] mb-2">Refund to</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                { id: "source", label: "Original source" },
                { id: "bank", label: "Bank account" },
                { id: "upi", label: "UPI ID" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setRefundMethod(m.id)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-bold border-2 transition-all ${refundMethod === m.id ? "border-[#E91E63] bg-[#FCE8F0] text-[#E91E63]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {refundMethod !== "source" && (
              <input
                value={refundTarget}
                onChange={(e) => setRefundTarget(e.target.value)}
                placeholder={refundMethod === "bank" ? "Account no. + IFSC (e.g. 5010023XXXXX, HDFC0001234)" : "UPI ID (e.g. name@upi)"}
                className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#E91E63] mb-3"
              />
            )}

            <p className="text-[11px] font-bold text-[#150726] mb-2">Contact phone <span className="text-red-500">*</span></p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit mobile for pickup coordination"
              className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#E91E63] mb-3"
            />

            {refundTotal > 0 && (
              <div className="rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 px-4 py-3 mb-3 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#6B5B83]">Estimated refund</span>
                <span className="text-[15px] font-extrabold text-[#5f8f12]">₹{refundTotal.toLocaleString("en-IN")}</span>
              </div>
            )}

            {error && <p className="text-[11px] text-red-500 font-semibold mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!valid || createReturnApi.isPending}
                className="px-4 py-2.5 rounded-lg bg-[#E91E63] text-white text-[12px] font-bold hover:bg-[#C2185B] disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {createReturnApi.isPending ? "Submitting..." : "Submit Return"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}