"use client";

import { useMemo, useState } from "react";
import { FileText, Search, Cloud } from "lucide-react";
import { useAuditLogs } from "@/lib/modit-api";
import { Stagger } from "@/components/fx";

function serverActionLabel(action: string): string {
  const known: Record<string, string> = {
    "media.upload": "Media uploaded",
    "media.upload_image": "Image uploaded",
    "media.upload_document": "Document uploaded",
    "media.upload_url": "Image added from URL",
    "media.batch_upload": "Batch upload",
    "media.upload_temple_image": "Temple image uploaded",
    "media.upload_product_image": "Product image uploaded",
    "organization.create": "Organization created",
    "modit.product.create": "Product created",
    "modit.product.update": "Product updated",
    "modit.product.delete": "Product deleted",
    "modit.order.status": "Order status changed",
    "modit.inventory.create": "Stock recorded",
    "modit.inventory.update": "Stock updated",
    "modit.coupon.create": "Coupon created",
    "modit.coupon.update": "Coupon updated",
    "modit.coupon.delete": "Coupon deleted",
    "modit.staff.claim": "Staff access claimed",
  };
  if (known[action]) return known[action];
  return action
    .replace(/_/g, " ")
    .replace(/\./g, " · ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TYPE_COLORS: Record<string, string> = {
  "modit.product.create": "bg-[#F0F9E8] text-[#5a8010]",
  "modit.product.update": "bg-[#E8F9FC] text-[#00BCD4]",
  "modit.product.delete": "bg-[#FCE4EC] text-[#E91E63]",
  "modit.order.status": "bg-[#F0F9E8] text-[#7CB518]",
  "modit.inventory.create": "bg-[#F0F9E8] text-[#5a8010]",
  "modit.inventory.update": "bg-[#E8F9FC] text-[#00838F]",
  "media.upload": "bg-[#E8F9FC] text-[#00BCD4]",
  "organization.create": "bg-[#F0F9E8] text-[#5a8010]",
};

export default function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const audit = useAuditLogs(page, pageSize);
  const serverOffline = audit.isError;

  const entries = useMemo(() => {
    return (audit.data?.logs ?? []).map((l) => ({
      id: l.id,
      type: l.action,
      summary: serverActionLabel(l.action),
      detail: `${l.entity_type} ${l.entity_id}`,
      at: new Date(l.created_at).getTime(),
      actor: l.actor_user_id,
      changed: Boolean(l.after_json),
    }));
  }, [audit.data]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.type));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = entries.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return e.summary.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q);
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
          <h1 className="text-title-lg font-extrabold text-[#150726]">Activity Log</h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">
            {audit.data?.total ?? 0} server events · who changed what, when
          </p>
        </div>
        {!serverOffline && (
          <span className="flex items-center gap-1 rounded-full bg-[#F0F9E8] px-3 py-2 text-tiny font-bold text-[#5a8010]">
            <Cloud className="h-3.5 w-3.5" /> Synced with server
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-body-sm focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-[#DDD6EE] bg-white px-3 py-2.5 text-caption font-bold text-[#6B5B83] focus:outline-none focus:border-[#2D1B69]">
          <option value="">All actions</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{serverActionLabel(t)}</option>
          ))}
        </select>
      </div>

      {serverOffline && (
        <p className="mt-3 rounded-xl border border-[#FF9800]/30 bg-[#FFFBF5] px-4 py-2.5 text-caption font-semibold text-[#B45309]">
          Server log unreachable — cannot show audit history right now.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <FileText className="h-8 w-8 text-[#9B8CB5] mx-auto mb-2" />
          <p className="text-body-md font-bold text-[#150726]">No activity found</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Staff actions (product edits, stock changes, order updates) are recorded here automatically.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <Stagger step={70}>
          {Array.from(groups.entries()).map(([day, list]) => (
            <div key={day}>
              <p className="text-micro font-black uppercase tracking-wider text-[#9B8CB5] mb-2">{day}</p>
              <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
                {list.map((e, idx) => (
                  <div key={e.id} className={`px-4 py-3 ${idx > 0 ? "border-t border-[#F0ECF9]" : ""}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-tiny font-bold ${TYPE_COLORS[e.type] ?? "bg-[#F0ECF9] text-[#2D1B69]"}`}>
                        {serverActionLabel(e.type)}
                      </span>
                      {e.changed && (
                        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-tiny font-bold bg-[#F0F9E8] text-[#5a8010]">
                          changed
                        </span>
                      )}
                      <span className="text-micro text-[#9B8CB5] tabular-nums">
                        {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      {e.actor && <span className="text-micro text-[#9B8CB5]">· actor {e.actor.slice(0, 8)}{e.actor.length > 8 ? "…" : ""}</span>}
                    </div>
                    <p className="text-body-sm font-bold text-[#150726] mt-1">{e.summary}</p>
                    <p className="text-micro text-[#6B5B83] mt-0.5">{e.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          </Stagger>
          {audit.data && audit.data.total > page * pageSize && (
            <div className="flex justify-center gap-3">
              {page > 1 && (
                <button
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  className="px-5 py-2.5 rounded-xl border border-[#DDD6EE] bg-white text-caption font-bold text-[#2D1B69] hover:border-[#2D1B69]"
                >
                  Newer events
                </button>
              )}
              <button
                onClick={() => setPage((n) => n + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]"
              >
                Older events
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
