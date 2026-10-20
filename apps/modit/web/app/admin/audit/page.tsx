"use client";

import { useMemo, useState } from "react";
import { FileText, Search, Trash2, Cloud, HardDrive } from "lucide-react";
import { useAdminActivity, ADMIN_ACTION_LABEL, type AdminActivity } from "@/lib/admin-activity";
import { useAuditLogs } from "@/lib/modit-api";
import { Stagger } from "@/components/fx";

/** Server action strings come from inside the platform (media/org uploads etc).
 * Humanize known ones; fall back to a readable form of the raw action. */
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
  };
  if (known[action]) return known[action];
  return action
    .replace(/_/g, " ")
    .replace(/\./g, " · ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TimelineEntry {
  id: string;
  type: string;
  summary: string;
  detail?: string;
  at: number; // local epoch ms
  source: "server" | "local";
  actor?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  "product.update": "bg-[#E8F9FC] text-[#00BCD4]",
  "product.reset": "bg-[#F0ECF9] text-[#9B8CB5]",
  "product.bulk_update": "bg-[#E8F9FC] text-[#00BCD4]",
  "sale.create": "bg-[#FCE4EC] text-[#E91E63]",
  "sale.update": "bg-[#FCE4EC] text-[#E91E63]",
  "sale.toggle": "bg-[#FFFBF5] text-[#FF9800]",
  "sale.delete": "bg-[#F0ECF9] text-[#9B8CB5]",
  "order.status": "bg-[#F0F9E8] text-[#7CB518]",
  "coupon.create": "bg-[#F0ECF9] text-[#2D1B69]",
  "coupon.update": "bg-[#F0ECF9] text-[#2D1B69]",
  "coupon.toggle": "bg-[#FFFBF5] text-[#FF9800]",
  "coupon.delete": "bg-[#F0ECF9] text-[#9B8CB5]",
  "return.advance": "bg-[#FCE4EC] text-[#C2185B]",
  "supplier.status": "bg-[#E8F9FC] text-[#00838F]",
  "supplier.add": "bg-[#F0F9E8] text-[#5a8010]",
  "admin.unlock": "bg-[#F0ECF9] text-[#2D1B69]",
};

export default function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const localEntries = useAdminActivity((s) => s.entries);
  const clear = useAdminActivity((s) => s.clear);
  const audit = useAuditLogs(1, 50);
  const serverOffline = audit.isError;

  // One merged timeline: authoritative server rows first, then this device's
  // row cache (entries the API does not record yet, e.g. price edits).
  const entries: TimelineEntry[] = useMemo(() => {
    const server: TimelineEntry[] = (audit.data?.logs ?? []).map((l) => ({
      id: `srv-${l.id}`,
      type: l.action,
      summary: serverActionLabel(l.action),
      detail: `${l.entity_type} ${l.entity_id}${l.after_json ? " · changed" : " · queried"}`,
      at: new Date(l.created_at).getTime(),
      source: "server" as const,
      actor: l.actor_user_id,
    }));
    const local: TimelineEntry[] = localEntries.map((e: AdminActivity) => ({
      id: e.id,
      type: e.type,
      summary: e.summary,
      detail: e.detail,
      at: e.at,
      source: "local" as const,
    }));
    return [...server, ...local].sort((a, b) => b.at - a.at);
  }, [audit.data, localEntries]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.type));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = entries.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return e.summary.toLowerCase().includes(q) || (e.detail ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const groups = new Map<string, TimelineEntry[]>();
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
            {audit.data?.total ?? 0} server events · {localEntries.length} on-this-device · who changed what, when
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!serverOffline && (
            <span className="flex items-center gap-1 rounded-full bg-[#F0F9E8] px-3 py-2 text-tiny font-bold text-[#5a8010]">
              <Cloud className="h-3.5 w-3.5" /> Synced with server
            </span>
          )}
          {localEntries.length > 0 && (
            <button onClick={() => { if (confirm("Clear on-this-device entries?")) clear(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DDD6EE] text-micro font-bold text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40">
              <Trash2 className="h-3.5 w-3.5" /> Clear local
            </button>
          )}
        </div>
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
            <option key={t} value={t}>{ADMIN_ACTION_LABEL[t as keyof typeof ADMIN_ACTION_LABEL] ?? serverActionLabel(t)}</option>
          ))}
        </select>
      </div>

      {serverOffline && (
        <p className="mt-3 rounded-xl border border-[#FF9800]/30 bg-[#FFFBF5] px-4 py-2.5 text-caption font-semibold text-[#B45309]">
          Server log unreachable — showing on-this-device entries only.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <FileText className="h-8 w-8 text-[#9B8CB5] mx-auto mb-2" />
          <p className="text-body-md font-bold text-[#150726]">No activity yet</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Store events (uploads, org changes) and staff actions will appear here automatically.</p>
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
                        {ADMIN_ACTION_LABEL[e.type as keyof typeof ADMIN_ACTION_LABEL] ?? serverActionLabel(e.type)}
                      </span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-tiny font-bold ${e.source === "server" ? "bg-[#F0F9E8] text-[#5a8010]" : "bg-[#FFFBF5] text-[#B45309]"}`}>
                        {e.source === "server" ? <><Cloud className="h-3 w-3" /> Server</> : <><HardDrive className="h-3 w-3" /> This device</>}
                      </span>
                      <span className="text-micro text-[#9B8CB5] tabular-nums">
                        {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      {e.actor && <span className="text-micro text-[#9B8CB5]">· actor {e.actor.slice(0, 8)}{e.actor.length > 8 ? "…" : ""}</span>}
                    </div>
                    <p className="text-body-sm font-bold text-[#150726] mt-1">{e.summary}</p>
                    {e.detail && <p className="text-micro text-[#6B5B83] mt-0.5">{e.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
