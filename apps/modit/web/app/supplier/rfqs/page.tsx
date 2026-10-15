"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Gavel } from "lucide-react";
import { useSupplierMe, useSupplierRfqs, useSupplierRfqDetail, useQuoteRFQ } from "@/lib/supplier-api";
import { useToast } from "@foundation/ui";

export default function SupplierRFQInbox() {
  const toast = useToast();
  const me = useSupplierMe();
  const inbox = useSupplierRfqs(Boolean(me.data?.is_verified));
  const quote = useQuoteRFQ();
  const [openId, setOpenId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [quotingId, setQuotingId] = useState<string | null>(null);

  if (me.isLoading || inbox.isLoading) {
    return <p className="text-body-sm font-bold text-[#9B8CB5]">Loading RFQs.</p>;
  }
  if (me.data && !me.data.is_verified) {
    return (
      <div className="rounded-2xl border border-[#FF9800]/40 bg-[#FFF8E1] p-6 text-center">
        <p className="text-title-md font-extrabold text-[#150726]">Application under review</p>
        <p className="text-caption text-[#6B5B83] mt-1">RFQ quoting unlocks after verification.</p>
      </div>
    );
  }
  if (inbox.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-body-sm text-red-700">
        Could not load RFQs. <button className="font-bold underline" onClick={() => inbox.refetch()}>Retry</button>
      </div>
    );
  }

  const rows = inbox.data ?? [];

  const submitQuote = async (rfqId: string, items: Array<{ product_id: string; requested_quantity: number }>) => {
    const lines = [];
    for (const it of items) {
      const v = parseFloat(prices[`${rfqId}:${it.product_id}`] ?? "");
      if (!(v > 0)) {
        toast.error("Enter a price", "Every line needs a unit price above zero.");
        return;
      }
      lines.push({ product_id: it.product_id, quantity: it.requested_quantity, unit_price: v });
    }
    setQuotingId(rfqId);
    try {
      const res = await quote.mutateAsync({ rfqId, payload: { lines } });
      toast.success("Quote sent", `${res.quotation_number} — ₹${res.grand_total.toLocaleString("en-IN")}`);
      setOpenId(null);
    } catch (e) {
      toast.error("Quote failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setQuotingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-md font-extrabold text-[#150726]">RFQ Inbox</h1>
        <p className="text-caption text-[#9B8CB5]">Open buyer requests — quote every line to compete.</p>
      </div>
      {rows.length === 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center">
          <FileText className="h-10 w-10 text-[#9B8CB5] mx-auto mb-2" />
          <p className="text-body-md font-bold text-[#150726]">No open RFQs right now</p>
          <p className="text-caption text-[#9B8CB5] mt-1">New buyer requests appear here instantly.</p>
        </div>
      )}
      {rows.map((r) => (
        <div key={r.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
          <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="w-full text-left">
            <div className="flex items-center justify-between gap-2">
              <p className="text-body-sm font-extrabold text-[#150726]">{r.rfq_number}</p>
              <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-tiny font-bold text-[#2D1B69]">{r.status}</span>
            </div>
            {r.notes && <p className="text-caption text-[#6B5B83] mt-1 line-clamp-2">{r.notes}</p>}
            <p className="text-tiny text-[#9B8CB5] mt-1">
              {r.items_count} items · {r.quotes_count} quotes{r.due_date ? ` · due ${new Date(r.due_date).toLocaleDateString("en-IN")}` : ""}
            </p>
          </button>
          {openId === r.id && (
            <QuoteForm
              rfqId={r.id}
              prices={prices}
              setPrices={setPrices}
              quoting={quotingId === r.id}
              onSubmit={submitQuote}
            />
          )}
        </div>
      ))}
      <Link href="/supplier" className="text-caption font-bold text-[#2D1B69] hover:underline">← Back to hub</Link>
    </div>
  );
}

function QuoteForm({ rfqId, prices, setPrices, quoting, onSubmit }: {
  rfqId: string;
  prices: Record<string, string>;
  setPrices: (f: (p: Record<string, string>) => Record<string, string>) => void;
  quoting: boolean;
  onSubmit: (rfqId: string, items: Array<{ product_id: string; requested_quantity: number }>) => void;
}) {
  const { data: detail } = useSupplierRfqDetail(rfqId);
  const items = detail?.items ?? [];
  return (
    <div className="mt-3 pt-3 border-t border-[#F0ECF9] space-y-2">
      {items.map((it: any) => (
        <div key={it.product_id} className="flex items-center gap-2">
          <span className="flex-1 min-w-0 font-mono text-tiny text-[#6B5B83] truncate">{it.product_id.slice(0, 24)}</span>
          <span className="text-tiny font-bold text-[#150726] whitespace-nowrap">× {it.requested_quantity}</span>
          <input
            type="number"
            min={0}
            value={prices[`${rfqId}:${it.product_id}`] ?? ""}
            onChange={(e) => setPrices((p) => ({ ...p, [`${rfqId}:${it.product_id}`]: e.target.value }))}
            placeholder="₹/unit"
            className="w-28 h-10 rounded-lg border border-[#DDD6EE] px-2 text-caption font-bold text-[#150726] focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
      ))}
      {items.length === 0 && <p className="text-tiny text-[#9B8CB5]">Loading items…</p>}
      <button
        disabled={quoting || items.length === 0}
        onClick={() => onSubmit(rfqId, items)}
        className="flex items-center gap-1.5 rounded-xl bg-[#7CB518] text-white text-caption font-bold px-4 py-2.5 hover:bg-[#6A9C14] disabled:opacity-50 transition-all"
      >
        <Gavel className="h-4 w-4" /> {quoting ? "Sending…" : "Send Quote"}
      </button>
    </div>
  );
}
