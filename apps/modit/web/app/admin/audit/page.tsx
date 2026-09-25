"use client";

import { useState } from "react";
import { FileText, Search, Trash2 } from "lucide-react";
import { useAdminActivity, ADMIN_ACTION_LABEL, type AdminActionType } from "@/lib/admin-activity";

const TYPE_COLORS: Record<string, string> = {
  "product.update": "bg-[#E8F9FC] text-[#00BCD4]",
  "product.reset": "bg-[#F0ECF9] text-[#9B8CB5]",
  "product.bulk_update": "bg-[#E8F9FC] text-[#00BCD4]",
  "sale.create": "bg-[#FCE8F0] text-[#E91E63]",
  "sale.update": "bg-[#FCE8F0] text-[#E91E63]",
  "sale.toggle": "bg-[#FFF4E5] text-[#FF9800]",
  "sale.delete": "bg-[#F0ECF9] text-[#9B8CB5]",
  "order.status": "bg-[#F0F9E8] text-[#7CB518]",
  "coupon.create": "bg-[#F0ECF9] text-[#2D1B69]",
  "coupon.update": "bg-[#F0ECF9] text-[#2D1B69]",
  "coupon.toggle": "bg-[#FFF4E5] text-[#FF9800]",
  "coupon.delete": "bg-[#F0ECF9] text-[#9B8CB5]",
  "return.advance": "bg-[#FCE8F0] text-[#C2185B]",
  "admin.unlock": "bg-[#F0ECF9] text-[#2D1B69]",
};

export default function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const entries = useAdminActivity((s) => s.entries);
  const clear = useAdminActivity((s) => s.clear);

  const filtered = entries.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return e.summary.toLowerCase().includes(q) || (e.detail ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const groups = new Map<string, typeof entries>();
  filtered.forEach((e) => {
    const day = new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Activity Log</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">{entries.length} staff actions recorded · who changed what, when</p>
        </div>
        {entries.length > 0 && (
          <button onClick={() => { if (confirm("Clear the activity log?")) clear(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DDD6EE] text-[11px] font-bold text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40">
            <Trash2 className="h-3.5 w-3.5" /> Clear log
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-[#DDD6EE] bg-white px-3 py-2.5 text-[12px] font-bold text-[#6B5B83] focus:outline-none focus:border-[#2D1B69]">
          <option value="">All actions</option>
          {(Object.keys(ADMIN_ACTION_LABEL) as AdminActionType[]).map((t) => (
            <option key={t} value={t}>{ADMIN_ACTION_LABEL[t]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <FileText className="h-8 w-8 text-[#9B8CB5] mx-auto mb-2" />
          <p className="text-[14px] font-bold text-[#150726]">No activity yet</p>
          <p className="text-[12px] text-[#9B8CB5] mt-1">Price edits, sales, order updates, coupons and returns will appear here automatically.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {Array.from(groups.entries()).map(([day, list]) => (
            <div key={day}>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#9B8CB5] mb-2">{day}</p>
              <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
                {list.map((e, idx) => (
                  <div key={e.id} className={`px-4 py-3 ${idx > 0 ? "border-t border-[#F0ECF9]" : ""}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[e.type] ?? "bg-[#F0ECF9] text-[#9B8CB5]"}`}>
                        {ADMIN_ACTION_LABEL[e.type]}
                      </span>
                      <span className="text-[11px] text-[#9B8CB5] tabular-nums">
                        {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-[#150726] mt-1">{e.summary}</p>
                    {e.detail && <p className="text-[11px] text-[#6B5B83] mt-0.5">{e.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
