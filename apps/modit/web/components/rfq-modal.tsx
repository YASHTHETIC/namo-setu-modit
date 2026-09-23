"use client";

import { useState } from "react";
import { useCreateRFQ } from "@/lib/modit-api";
import { X, Send, Check } from "lucide-react";
import { notifyOrderEvent } from "@/lib/order-notifications";

interface RFQModalProps {
  open: boolean;
  onClose: () => void;
  productName?: string;
  sku?: string;
}

export function RFQModal({ open, onClose, productName, sku }: RFQModalProps) {
  const [title, setTitle] = useState(productName ? `Quote for ${productName}` : "");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createRFQ = useCreateRFQ();

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      await createRFQ.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
      } as never);
      notifyOrderEvent({
        title: "Quote request sent",
        body: `"${title.trim()}" sent to verified sellers — expect responses within 24 hours. Track it under Requests for Quotation.`,
        type: "rfq",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle(productName ? `Quote for ${productName}` : "");
        setDescription("");
        setQuantity("");
        setDueDate("");
        onClose();
      }, 1800);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#DDD6EE] animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-14 w-14 rounded-full bg-[#7CB518]/15 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-[#7CB518]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#150726]">Quote Request Submitted</h3>
            <p className="text-[12px] text-[#9B8CB5] mt-1">Our suppliers will respond within 24 hours. Track it under Requests for Quotation.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-[#150726]">Request Quote / Contact Seller</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            {sku && (
              <div className="rounded-lg bg-[#F7F4FC] px-3 py-2 mb-4 text-[11px] text-[#9B8CB5]">
                Product SKU: <span className="font-semibold text-[#2D1B69]">{sku}</span> — send your quantity, site and deadline to get the best bulk rate.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Title <span className="text-red-500">*</span></label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={Boolean(productName)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69] disabled:bg-[#F7F4FC]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Estimated Qty</label>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500 bags"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Needed By</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Details</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Delivery site, required grade, packaging preferences..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69] resize-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || createRFQ.isPending}
                className="px-4 py-2.5 rounded-lg bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6aa514] disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" /> {createRFQ.isPending ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}