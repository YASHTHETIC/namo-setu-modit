"use client";

import { useState } from "react";
import {
  Search, X, Check, Ban, ChevronDown, MapPin, MessageSquareText, Building2,
  ShieldCheck, Package, Mail, Phone, FileText, Inbox,
} from "lucide-react";
import {
  useSupplierApplications, useDecideApplication,
} from "@/lib/supplier-api";
import { useProducts } from "@/lib/modit-api";
import { formatINR } from "@/lib/utils";
import { useToast } from "@foundation/ui";
import Link from "next/link";

/* Server truth only: rows come from GET /supplier/applications (the real
 * Sell-on-MODIT intake + approved suppliers). Statuses/facts mirror what the
 * API stores — no seeded demo suppliers, no invented scorecards. "Pause"
 * needs a server-side paused state; until that exists, revoke = reject. */

type ApplicationRow = {
  supplier_id: string;
  supplier_code: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  city: string;
  pincode: string;
  categories: string[];
  brands: string[];
  status: "pending" | "approved" | "rejected";
};

type Filter = "all" | ApplicationRow["status"];

const STATUS_TRY: Record<string, string> = {
  pending: "Pending review",
  approved: "Verified",
  verified: "Verified",
  rejected: "Rejected",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "S";
}

function statusVisual(status: string) {
  const key = status === "approved" || status === "verified" ? "approved" : status === "pending" ? "pending" : "rejected";
  return {
    key,
    label: STATUS_TRY[status] ?? status,
    chip:
      key === "approved"
        ? "bg-[#7CB518]/15 text-[#5a8010] border-[#7CB518]/30"
        : key === "pending"
          ? "bg-[#FF9800]/15 text-[#b36400] border-[#FF9800]/30"
          : "bg-[#E91E63]/15 text-[#b01946] border-[#E91E63]/30",
    dot: key === "approved" ? "bg-[#7CB518]" : key === "pending" ? "bg-[#FF9800]" : "bg-[#E91E63]",
    isApproved: key === "approved",
  };
}

export default function AdminSuppliersPage() {
  const applications = useSupplierApplications();
  const decide = useDecideApplication();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ row: ApplicationRow; action: "approve" | "reject" } | null>(null);

  const rows = (applications.data ?? []) as unknown as ApplicationRow[];

  const stats = {
    total: rows.length,
    approved: rows.filter((r) => r.status === "approved").length,
    pending: rows.filter((r) => r.status === "pending").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (
        r.business_name.toLowerCase().includes(q) ||
        r.supplier_code.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.gstin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const runDecision = (row: ApplicationRow, action: "approve" | "reject") => {
    decide.mutate({ supplierId: row.supplier_id, action }, {
      onSuccess: () => {
        toast.success(
          action === "approve" ? "Supplier verified" : "Verification revoked",
          `${row.business_name} is now ${action === "approve" ? "live with a working login" : "marked rejected"}.`,
        );
        setConfirming(null);
      },
      onError: (e) => toast.error("Failed", e instanceof Error ? e.message : "Try again."),
    });
  };

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "approved", label: "Verified", count: stats.approved },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#2D1B69]" /> Supplier Command
          </h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">
            Every supplier came through the live Sell-on-MODIT form. Verify to activate their login — revoke to lock it.
          </p>
        </div>
        <Link
          href="/supplier/apply"
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]"
        >
          <Inbox className="h-4 w-4" /> Onboard via application form
        </Link>
      </div>

      {applications.isError && (
        <div className="mt-4 rounded-2xl border border-[#E91E63]/40 bg-[#FFF5F8] p-4 flex flex-wrap items-center gap-3">
          <p className="text-caption font-bold text-[#B45309]">
            {applications.error instanceof Error ? applications.error.message : "Could not load suppliers."}
          </p>
          <button onClick={() => { void applications.refetch(); }} className="px-3 py-1.5 rounded-lg bg-[#2D1B69] text-white text-micro font-bold hover:bg-[#1E1245]">Retry</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#150726 0%,#2D1B69 60%,#150726 100%)" }}>
        {[
          { label: "Suppliers", value: stats.total, accent: "#ffffff" },
          { label: "Verified", value: stats.approved, accent: "#7cb518" },
          { label: "Pending", value: stats.pending, accent: "#ff9800" },
          { label: "Rejected", value: stats.rejected, accent: "#e91e63" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <p className="text-tiny font-bold text-white/40 uppercase tracking-widest">{k.label}</p>
            <p className="text-title-lg font-black tabular-nums" style={{ color: k.accent }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="mt-4 flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search supplier, code, GSTIN, city..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-body-sm focus:outline-none focus:border-[#2D1B69]"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]"><X className="h-4 w-4" /></button>
          )}
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-2 rounded-xl text-micro font-bold border-2 transition-all ${filter === t.id ? "border-[#2D1B69] bg-[#2D1B69] text-white" : "border-[#DDD6EE] bg-white text-[#9B8CB5] hover:border-[#C9B8E8]"}`}
          >
            {t.label} · {t.count}
          </button>
        ))}
      </div>

      {/* Cards */}
      {applications.isLoading && (
        <p className="text-center text-body-sm text-[#9B8CB5] py-10">Loading suppliers…</p>
      )}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {filtered.map((row) => (
          <SupplierCard
            key={row.supplier_id}
            row={row}
            expanded={expanded === row.supplier_id}
            onToggle={() => setExpanded(expanded === row.supplier_id ? null : row.supplier_id)}
            onAct={(action) => setConfirming({ row, action })}
            busy={decide.isPending}
          />
        ))}
      </div>
      {!applications.isLoading && filtered.length === 0 && (
        <p className="text-center text-body-sm text-[#9B8CB5] py-10">No suppliers match this view.</p>
      )}

      {/* Action confirm */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setConfirming(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body-lg font-bold text-[#150726]">{confirming.action === "approve" ? "Verify & go live" : "Revoke verification"}</h2>
              <button onClick={() => setConfirming(null)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-caption text-[#5C4A7A]">
              {confirming.action === "approve"
                ? `${confirming.row.business_name} (${confirming.row.supplier_code}) gets an active supplier login and their products can go live.`
                : `${confirming.row.business_name} (${confirming.row.supplier_code}) loses their supplier login and cannot sell until re-verified.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirming(null)} className="px-4 py-2.5 rounded-lg text-caption font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button
                disabled={decide.isPending}
                onClick={() => runDecision(confirming.row, confirming.action)}
                className={`px-5 py-2.5 rounded-lg text-white text-caption font-bold disabled:opacity-50 ${confirming.action === "approve" ? "bg-[#7CB518] hover:bg-[#6A9C14]" : "bg-[#E91E63] hover:bg-[#C2185B]"}`}
              >
                {decide.isPending ? "Working…" : confirming.action === "approve" ? "Verify" : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierCard({ row, expanded, onToggle, onAct, busy }: {
  row: ApplicationRow;
  expanded: boolean;
  onToggle: () => void;
  onAct: (action: "approve" | "reject") => void;
  busy: boolean;
}) {
  const st = statusVisual(row.status);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2D1B69]/40" style={{ background: "linear-gradient(160deg,#150726 0%,#150726 55%,#150726 100%)", boxShadow: "0 8px 32px rgba(21,7,38,0.35)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-body-lg font-black text-white" style={{ background: "linear-gradient(135deg,#7CB518,#00BCD4)" }}>
              {initials(row.business_name)}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#150726] ${st.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-body-md font-extrabold text-white truncate">{row.business_name || "Unnamed business"}</p>
              <span className={`rounded-full px-2 py-0.5 text-tiny font-black uppercase tracking-wider border ${st.chip}`}>{st.label}</span>
            </div>
            <p className="text-micro text-white/50 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-white/70">{row.supplier_code}</span>
              {(row.city || row.pincode) && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {row.city}{row.pincode ? ` · ${row.pincode}` : ""}</span>
              )}
            </p>
          </div>
          {st.isApproved && (
            <span className="flex items-center gap-1 text-[#7cb518] text-tiny font-bold shrink-0"><ShieldCheck className="h-3.5 w-3.5" /> Active login</span>
          )}
        </div>

        {/* Registration facts (from the application form — no invented scorecards) */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {row.gstin && (
            <p className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-micro text-white/80 flex items-center gap-1.5 truncate">
              <FileText className="h-3 w-3 text-white/40 shrink-0" /> GSTIN {row.gstin}
            </p>
          )}
          {row.email && (
            <p className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-micro text-white/80 flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 text-white/40 shrink-0" /> {row.email}
            </p>
          )}
          {row.phone && (
            <p className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-micro text-white/80 flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 text-white/40 shrink-0" /> {row.phone}
            </p>
          )}
          {row.contact_name && (
            <p className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-micro text-white/80 flex items-center gap-1.5 truncate">
              <MessageSquareText className="h-3 w-3 text-white/40 shrink-0" /> {row.contact_name}
            </p>
          )}
        </div>

        {/* Catalog scope */}
        {(row.categories.length > 0 || row.brands.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.categories.slice(0, 5).map((c) => (
              <span key={`c-${c}`} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-tiny font-bold text-white/60">{c}</span>
            ))}
            {row.brands.slice(0, 5).map((b) => (
              <span key={`b-${b}`} className="rounded-full bg-[#F8CB46]/10 border border-[#F8CB46]/25 px-2 py-0.5 text-tiny font-bold text-[#F8CB46]">{b}</span>
            ))}
          </div>
        )}

        <SupplierProductStats supplierId={row.supplier_id} isApproved={st.isApproved} />

        {/* actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {st.key === "pending" && (
            <>
              <button
                disabled={busy}
                onClick={() => onAct("approve")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7CB518] text-white text-micro font-bold hover:bg-[#5a8010] shadow-lg shadow-green-500/25 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Verify & go live
              </button>
              <button
                disabled={busy}
                onClick={() => onAct("reject")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E91E63]/40 text-[#e91e63] text-micro font-bold hover:bg-[#E91E63]/15 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {st.key === "approved" && (
            <button
              disabled={busy}
              onClick={() => onAct("reject")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#00BCD4]/40 text-[#00bcd4] text-micro font-bold hover:bg-[#00BCD4]/15 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" /> Revoke verification
            </button>
          )}
          {st.key === "rejected" && (
            <button
              disabled={busy}
              onClick={() => onAct("approve")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7CB518] text-white text-micro font-bold hover:bg-[#5a8010] shadow-lg shadow-green-500/25 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Verify after rejection
            </button>
          )}
          <button onClick={onToggle} className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-micro font-bold text-white/60 hover:text-white hover:bg-white/10">
            {expanded ? "Less" : "Catalog on store"} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && <SupplierCatalog supplierId={row.supplier_id} />}
    </div>
  );
}

function SupplierProductStats({ supplierId, isApproved }: { supplierId: string; isApproved: boolean }) {
  // Real link between this supplier profile and their catalog rows
  // (Product.supplier_id) — the storefront product count, not a guess.
  const catalog = useProducts({ supplier_id: supplierId, page_size: 1 });
  const total = catalog.data?.total ?? null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-center">
        <p className="text-body-lg font-black text-white tabular-nums">{total ?? (catalog.isLoading ? "…" : "—")}</p>
        <p className="text-tiny font-bold text-white/40 uppercase tracking-widest flex items-center justify-center gap-1"><Package className="h-2.5 w-2.5" /> Linked products</p>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-center">
        <p className={`text-body-lg font-black tabular-nums ${isApproved ? "text-[#7cb518]" : "text-white"}`}>{isApproved ? "Yes" : "No"}</p>
        <p className="text-tiny font-bold text-white/40 uppercase tracking-widest">Can sell</p>
      </div>
    </div>
  );
}

function SupplierCatalog({ supplierId }: { supplierId: string }) {
  const catalog = useProducts({ supplier_id: supplierId, page_size: 8 });
  const items = catalog.data?.items ?? [];
  return (
    <div className="border-t border-white/10 px-4 py-3 bg-black/20">
      <p className="text-tiny font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
        <Package className="h-3 w-3" /> Catalog on store {typeof catalog.data?.total === "number" ? `(${catalog.data.total})` : ""}
      </p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto">
        {items.map((p) => {
          const row = p as unknown as { id: string; name: string; price?: number; list_price?: number };
          return (
            <Link key={row.id} href={`/products/${row.id}`} target="_blank" className="flex items-center justify-between gap-2 text-micro hover:bg-white/5 rounded-md px-1 py-0.5">
              <span className="text-white/80 font-semibold truncate">{row.name}</span>
              <span className="text-white/50 tabular-nums whitespace-nowrap">{formatINR(row.price ?? row.list_price ?? 0)}</span>
            </Link>
          );
        })}
        {catalog.isLoading && <p className="text-micro text-white/40">Loading linked products…</p>}
        {!catalog.isLoading && items.length === 0 && (
          <p className="text-micro text-white/40">No products linked to this supplier profile yet.</p>
        )}
      </div>
    </div>
  );
}
