"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Check, ChevronRight } from "lucide-react";
import {
  useReturnStore, RETURN_STATUS_LABEL, RETURN_NEXT, refundAmount, type ReturnStatus, type ReturnRequest,
} from "@/lib/return-store";
import { notifyOrderEvent } from "@/lib/order-notifications";
import { logAdminActivity } from "@/lib/admin-activity";

export default function AdminReturnsPage() {
  const returns = useReturnStore((s) => s.returns);
  const advanceReturn = useReturnStore((s) => s.advanceReturn);
  const [doneId, setDoneId] = useState<string | null>(null);

  const handleAdvance = (id: string, orderId: string, status: ReturnStatus, label: string, note: string) => {
    advanceReturn(id, status, note);
    logAdminActivity("return.advance", `Return ${id} → ${RETURN_STATUS_LABEL[status]}`, `Order ${orderId}`);
    notifyOrderEvent({
      title: `Return ${RETURN_STATUS_LABEL[status].toLowerCase()}`,
      body: `Return ${id} for order ${orderId}: ${note}`,
      type: "return",
      orderId,
    });
    setDoneId(`${id}-${status}`);
    setTimeout(() => setDoneId(null), 1500);
  };

  const open = returns.filter((r) => !["refunded", "rejected"].includes(r.status));
  const closed = returns.filter((r) => ["refunded", "rejected"].includes(r.status));

  return (
    <div>
      <h1 className="text-[20px] font-extrabold text-[#150726]">Returns & Refunds</h1>
      <p className="text-[12px] text-[#9B8CB5] mt-0.5">
        {open.length} open · {closed.length} resolved · advancing a return notifies the buyer instantly
      </p>

      {returns.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <RotateCcw className="h-8 w-8 text-[#E91E63] mx-auto mb-2" />
          <p className="text-[14px] font-bold text-[#150726]">No return requests</p>
          <p className="text-[12px] text-[#9B8CB5] mt-1">When buyers request returns from delivered orders, they appear here.</p>
        </div>
      )}

      {open.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-[12px] font-black uppercase tracking-wider text-[#E91E63]">Needs action ({open.length})</h2>
          <div className="space-y-3">
            {open.map((r) => (
              <ReturnCard key={r.id} ret={r} doneId={doneId} onAdvance={handleAdvance} />
            ))}
          </div>
        </>
      )}

      {closed.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-[12px] font-black uppercase tracking-wider text-[#9B8CB5]">Resolved ({closed.length})</h2>
          <div className="space-y-3">
            {closed.map((r) => (
              <ReturnCard key={r.id} ret={r} doneId={doneId} onAdvance={handleAdvance} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReturnCard({ ret, doneId, onAdvance }: {
  ret: ReturnRequest;
  doneId: string | null;
  onAdvance: (id: string, orderId: string, status: ReturnStatus, label: string, note: string) => void;
}) {
  const next = RETURN_NEXT[ret.status];
  return (
    <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-extrabold text-[#150726]">{ret.id}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${["refunded"].includes(ret.status) ? "bg-[#F0F9E8] text-[#7CB518]" : ret.status === "rejected" ? "bg-[#F0ECF9] text-[#9B8CB5]" : "bg-[#FCE8F0] text-[#E91E63]"}`}>
            {RETURN_STATUS_LABEL[ret.status]}
          </span>
        </div>
        <Link href={`/orders/${ret.orderId}`} className="flex items-center gap-1 text-[12px] font-bold text-[#2D1B69] hover:underline">
          {ret.orderId} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-2 text-[12px] text-[#6B5B83]">
        <p><span className="font-bold text-[#150726]">Reason:</span> {ret.reason}{ret.detail ? ` — ${ret.detail}` : ""}</p>
        <p className="mt-0.5"><span className="font-bold text-[#150726]">Items:</span> {ret.items.map((i) => `${i.name} × ${i.quantity}`).join("; ")}</p>
        <p className="mt-0.5">
          <span className="font-bold text-[#150726]">Refund:</span> ₹{refundAmount(ret).toLocaleString("en-IN")} → {ret.refundMethod === "source" ? "original source" : ret.refundTarget}
          {" · "}<span className="font-bold text-[#150726]">Phone:</span> {ret.phone}
        </p>
      </div>

      {next.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {next.map((n) => (
            <button
              key={n.status}
              onClick={() => onAdvance(ret.id, ret.orderId, n.status, n.label, n.note)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${n.status === "rejected" ? "border-2 border-[#DDD6EE] text-[#9B8CB5] hover:border-[#E91E63] hover:text-[#E91E63]" : "bg-[#7CB518] text-white hover:bg-[#6aa514]"}`}
            >
              {doneId === `${ret.id}-${n.status}` ? <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Done</span> : n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
