"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Check } from "lucide-react";
import { useServerReturns, useUpdateReturnStatus } from "@/lib/modit-api";

export default function AdminReturnsPage() {
  const { data: serverReturns = [], isLoading } = useServerReturns();
  const updateServerReturn = useUpdateReturnStatus();
  const [doneId, setDoneId] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState("");

  const rows = (serverReturns as any[]) ?? [];
  const open = rows.filter((r) => r.status === "requested");
  const inProgress = rows.filter((r) => r.status === "approved");
  const closed = rows.filter((r) => r.status === "received" || r.status === "rejected");

  const handleAction = async (id: string, status: "approved" | "rejected" | "received") => {
    setServerMsg("");
    try {
      await updateServerReturn.mutateAsync({ returnId: id, status });
      setDoneId(`${id}-${status}`);
      setTimeout(() => setDoneId(null), 1500);
      setServerMsg(`Return ${status}.`);
    } catch (e: any) {
      setServerMsg(e?.message || "Server update failed — try again.");
    }
  };

  const renderRow = (r: any) => {
    const isRequested = r.status === "requested";
    const isApproved = r.status === "approved";
    return (
      <div key={r.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-body-sm font-extrabold text-[#150726]">{r.return_number || r.id.slice(0, 12)}</p>
            <p className="text-micro text-[#9B8CB5] mt-0.5 truncate">
              {r.reason || "No reason given"} · {new Date(r.requested_at || r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-micro font-bold capitalize ${
              r.status === "requested" ? "bg-[#FCE4EC] text-[#E91E63]" : r.status === "approved" ? "bg-[#FFFBF5] text-[#FF9800]" : r.status === "received" ? "bg-[#F0F9E8] text-[#7CB518]" : "bg-[#F0ECF9] text-[#9B8CB5]"
            }`}
          >
            {r.status}
          </span>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {isRequested && (
            <>
              <button
                onClick={() => void handleAction(r.id, "approved")}
                disabled={updateServerReturn.isPending}
                className="px-4 py-2 rounded-xl bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] transition-all disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => void handleAction(r.id, "rejected")}
                disabled={updateServerReturn.isPending}
                className="px-4 py-2 rounded-xl border border-[#DDD6EE] text-caption font-bold text-[#E91E63] hover:border-[#E91E63] transition-all disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {isApproved && (
            <button
              onClick={() => void handleAction(r.id, "received")}
              disabled={updateServerReturn.isPending}
              className="px-4 py-2 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {doneId === `${r.id}-received` ? <><Check className="h-3.5 w-3.5" /> Done</> : <>Mark received</>}
            </button>
          )}
          <Link href="/admin/orders" className="ml-auto flex items-center gap-1 text-caption font-bold text-[#2D1B69] hover:underline">
            Related orders <span className="sr-only">{r.purchase_order_id}</span>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-title-lg font-extrabold text-[#150726]">Returns &amp; Refunds</h1>
      <p className="text-caption text-[#9B8CB5] mt-0.5">
        {open.length} needs action · {inProgress.length} approved · {closed.length} resolved
      </p>

      {isLoading && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <p className="text-caption text-[#9B8CB5]">Loading returns…</p>
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <RotateCcw className="h-8 w-8 text-[#E91E63] mx-auto mb-2" />
          <p className="text-body-md font-bold text-[#150726]">No return requests</p>
          <p className="text-caption text-[#9B8CB5] mt-1">When order returns are requested, they appear here.</p>
        </div>
      )}

      {open.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-caption font-black uppercase tracking-wider text-[#E91E63]">Needs action ({open.length})</h2>
          <div className="space-y-3">{open.map(renderRow)}</div>
        </>
      )}
      {inProgress.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-caption font-black uppercase tracking-wider text-[#FF9800]">Approved — awaiting pickup ({inProgress.length})</h2>
          <div className="space-y-3">{inProgress.map(renderRow)}</div>
        </>
      )}
      {closed.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-caption font-black uppercase tracking-wider text-[#9B8CB5]">Resolved ({closed.length})</h2>
          <div className="space-y-3">{closed.map(renderRow)}</div>
        </>
      )}

      {serverMsg && <p className="mt-3 text-caption font-semibold text-[#2D1B69]">{serverMsg}</p>}
    </div>
  );
}
