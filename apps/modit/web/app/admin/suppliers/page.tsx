"use client";

import { useMemo, useState } from "react";
import {
  Search, Plus, X, Check, Pause, Play, Ban, ChevronDown, Star, MapPin,
  Package, IndianRupee, AlertTriangle, ShieldCheck, Clock3, MessageSquareText, Building2,
} from "lucide-react";
import { products } from "@/lib/product-data";
import {
  useSupplierStore, SUPPLIER_STATUS_LABEL, type ManagedSupplier, type SupplierStatus,
} from "@/lib/supplier-store";
import { logAdminActivity } from "@/lib/admin-activity";

type Filter = "all" | SupplierStatus;

function brandProducts(brand: string) {
  const b = brand.toLowerCase();
  return products.filter((p) => (p.brand ?? "").toLowerCase().includes(b));
}

function ScoreBar({ label, pct, display }: { label: string; pct: number; display: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-extrabold text-white tabular-nums">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: pct >= 90
              ? "linear-gradient(90deg,#7CB518,#a4e635)"
              : pct >= 70
                ? "linear-gradient(90deg,#00BCD4,#4de3ff)"
                : "linear-gradient(90deg,#E91E63,#ff6b9d)",
          }}
        />
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<SupplierStatus, { dot: string; ring: string; text: string; chip: string }> = {
  verified: { dot: "bg-[#7CB518]", ring: "ring-[#7CB518]/30", text: "text-[#7CB518]", chip: "bg-[#7CB518]/15 text-[#a4e635] border-[#7CB518]/30" },
  pending: { dot: "bg-[#FF9800]", ring: "ring-[#FF9800]/30", text: "text-[#FF9800]", chip: "bg-[#FF9800]/15 text-[#ffb020] border-[#FF9800]/30" },
  paused: { dot: "bg-[#00BCD4]", ring: "ring-[#00BCD4]/30", text: "text-[#00BCD4]", chip: "bg-[#00BCD4]/15 text-[#4de3ff] border-[#00BCD4]/30" },
  rejected: { dot: "bg-[#E91E63]", ring: "ring-[#E91E63]/30", text: "text-[#E91E63]", chip: "bg-[#E91E63]/15 text-[#ff6b9d] border-[#E91E63]/30" },
};

export default function AdminSuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const setStatus = useSupplierStore((s) => s.setStatus);
  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const updateNotes = useSupplierStore((s) => s.updateNotes);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", brand: "", city: "" });
  const [formError, setFormError] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const verified = suppliers.filter((s) => s.status === "verified").length;
    const pending = suppliers.filter((s) => s.status === "pending").length;
    const paused = suppliers.filter((s) => s.status === "paused").length;
    const avgOnTime = suppliers.length
      ? Math.round(suppliers.reduce((s, x) => s + x.scorecard.onTime, 0) / suppliers.length)
      : 0;
    return { verified, pending, paused, avgOnTime, total: suppliers.length };
  }, [suppliers]);

  const filtered = suppliers.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const act = (s: ManagedSupplier, status: SupplierStatus) => {
    const labels: Record<SupplierStatus, string> = {
      verified: "verified — products live on store",
      pending: "moved back to pending",
      paused: "PAUSED — products hidden from store",
      rejected: "rejected",
    };
    setStatus(s.id, status);
    logAdminActivity("supplier.status", `${s.code} ${s.name} ${labels[status]}`, `Brand: ${s.brand}`);
  };

  const handleAdd = () => {
    if (!form.code.trim() || !form.name.trim() || !form.brand.trim()) {
      setFormError("Code, name and catalog brand are required.");
      return;
    }
    const created = addSupplier({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      city: form.city.trim() || "—",
      since: new Date().toISOString().slice(0, 10),
    });
    logAdminActivity("supplier.add", `${created.code} ${created.name} onboarded (pending)`, `Brand: ${created.brand}`);
    setForm({ code: "", name: "", brand: "", city: "" });
    setFormError("");
    setShowAdd(false);
    setFilter("pending");
  };

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: suppliers.length },
    { id: "verified", label: "Verified", count: stats.verified },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "paused", label: "Paused", count: stats.paused },
    { id: "rejected", label: "Rejected", count: suppliers.filter((s) => s.status === "rejected").length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#2D1B69]" /> Supplier Command
          </h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">Verify, pause or onboard suppliers — pausing hides their products from the store instantly.</p>
        </div>
        <button onClick={() => { setFormError(""); setShowAdd(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245]">
          <Plus className="h-4 w-4" /> Onboard supplier
        </button>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5 rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#150726 0%,#2D1B69 60%,#1E0F4A 100%)" }}>
        {[
          { label: "Suppliers", value: stats.total, accent: "#ffffff" },
          { label: "Verified", value: stats.verified, accent: "#a4e635" },
          { label: "Pending", value: stats.pending, accent: "#ffb020" },
          { label: "Paused", value: stats.paused, accent: "#4de3ff" },
          { label: "Avg on-time", value: `${stats.avgOnTime}%`, accent: "#a4e635" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{k.label}</p>
            <p className="text-[22px] font-black tabular-nums" style={{ color: k.accent }}>{k.value}</p>
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
            placeholder="Search supplier, code, brand..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border-2 transition-all ${filter === t.id ? "border-[#2D1B69] bg-[#2D1B69] text-white" : "border-[#DDD6EE] bg-white text-[#9B8CB5] hover:border-[#C9B8E8]"}`}
          >
            {t.label} · {t.count}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {filtered.map((s) => (
          <SupplierCard
            key={s.id}
            s={s}
            expanded={expanded === s.id}
            onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
            onAct={act}
            notesDraft={notesDraft[s.id] ?? s.notes}
            onNotesChange={(v) => setNotesDraft((d) => ({ ...d, [s.id]: v }))}
            onNotesSave={() => updateNotes(s.id, notesDraft[s.id] ?? s.notes)}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-[13px] text-[#9B8CB5] py-10">No suppliers match this view.</p>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#150726]">Onboard supplier</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {([
                { k: "code", label: "Supplier code", ph: "e.g. SUP-007" },
                { k: "name", label: "Supplier name", ph: "e.g. Jaquar Bath Fittings" },
                { k: "brand", label: "Catalog brand keyword", ph: "e.g. Jaquar — must match product brands" },
                { k: "city", label: "City", ph: "e.g. Delhi NCR" },
              ] as const).map((f) => (
                <div key={f.k}>
                  <label className="block text-[11px] font-bold text-[#150726] mb-1.5">{f.label}</label>
                  <input
                    value={form[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    placeholder={f.ph}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-[13px] font-semibold focus:outline-none focus:border-[#2D1B69]"
                  />
                </div>
              ))}
            </div>
            {formError && <p className="text-[11px] text-red-500 font-semibold mt-3">{formError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button onClick={handleAdd} className="px-5 py-2.5 rounded-lg bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245]">Add as pending</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierCard({ s, expanded, onToggle, onAct, notesDraft, onNotesChange, onNotesSave }: {
  s: ManagedSupplier;
  expanded: boolean;
  onToggle: () => void;
  onAct: (s: ManagedSupplier, status: ManagedSupplier["status"]) => void;
  notesDraft: string;
  onNotesChange: (v: string) => void;
  onNotesSave: () => void;
}) {
  const st = STATUS_STYLE[s.status];
  const catalog = useMemo(() => brandProducts(s.brand), [s.brand]);
  const stockValue = catalog.reduce((sum, p) => sum + p.price * p.stockLevel, 0);
  const lowCount = catalog.filter((p) => p.stockLevel <= 50).length;
  const initials = s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2D1B69]/40" style={{ background: "linear-gradient(160deg,#150726 0%,#241245 55%,#150726 100%)", boxShadow: "0 8px 32px rgba(21,7,38,0.35)" }}>
      {/* top row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-[15px] font-black text-white" style={{ background: "linear-gradient(135deg,#7CB518,#00BCD4)" }}>
              {initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#150726] ${st.dot} ring-2 ${st.ring}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-extrabold text-white truncate">{s.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${st.chip}`}>{SUPPLIER_STATUS_LABEL[s.status]}</span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1.5">
              <span className="font-mono font-bold text-white/70">{s.code}</span> ·
              <MapPin className="h-3 w-3" /> {s.city} · since {s.since}
            </p>
          </div>
          <div className="flex items-center gap-0.5 text-[#ffb020]">
            <Star className="h-3.5 w-3.5 fill-[#ffb020]" />
            <span className="text-[14px] font-black text-white tabular-nums">{s.scorecard.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* score bars */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <ScoreBar label="On-time" pct={s.scorecard.onTime} display={`${s.scorecard.onTime}%`} />
          <ScoreBar label="Quality claims" pct={100 - s.scorecard.claims * 8} display={`${s.scorecard.claims}%`} />
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-white/50">
          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {s.scorecard.responseHrs}h response</span>
          <span>{s.scorecard.reviews.toLocaleString()} reviews</span>
          {s.status === "verified" && <span className="flex items-center gap-1 text-[#a4e635] font-bold"><ShieldCheck className="h-3 w-3" /> BIS/ISI compliant</span>}
        </div>

        {/* KPI strip */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-center">
            <p className="text-[15px] font-black text-white tabular-nums">{catalog.length}</p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center justify-center gap-1"><Package className="h-2.5 w-2.5" /> Products</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-center">
            <p className="text-[15px] font-black text-white tabular-nums">₹{(stockValue / 100000).toFixed(1)}L</p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center justify-center gap-1"><IndianRupee className="h-2.5 w-2.5" /> Stock value</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-center">
            <p className={`text-[15px] font-black tabular-nums ${lowCount > 0 ? "text-[#ffb020]" : "text-white"}`}>{lowCount}</p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center justify-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> Low stock</p>
          </div>
        </div>

        {/* actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {s.status === "pending" && (
            <>
              <button onClick={() => onAct(s, "verified")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6aa514] shadow-lg shadow-green-500/25">
                <Check className="h-3.5 w-3.5" /> Verify & go live
              </button>
              <button onClick={() => { if (confirm(`Reject ${s.name}?`)) onAct(s, "rejected"); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E91E63]/40 text-[#ff6b9d] text-[11px] font-bold hover:bg-[#E91E63]/15">
                <Ban className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {s.status === "verified" && (
            <button onClick={() => { if (confirm(`Pause ${s.name}? Their ${catalog.length} products will hide from the store.`)) onAct(s, "paused"); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#00BCD4]/40 text-[#4de3ff] text-[11px] font-bold hover:bg-[#00BCD4]/15">
              <Pause className="h-3.5 w-3.5" /> Pause supplier
            </button>
          )}
          {s.status === "paused" && (
            <button onClick={() => onAct(s, "verified")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6aa514] shadow-lg shadow-green-500/25">
              <Play className="h-3.5 w-3.5" /> Resume — restore {catalog.length} products
            </button>
          )}
          {s.status === "rejected" && (
            <button onClick={() => onAct(s, "pending")} className="px-3.5 py-2 rounded-xl border border-white/20 text-white/70 text-[11px] font-bold hover:bg-white/10">
              Reconsider → pending
            </button>
          )}
          <button onClick={onToggle} className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/10">
            {expanded ? "Less" : "Products & notes"} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* expanded */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 bg-black/20">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">Catalog under this supplier ({catalog.length})</p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {catalog.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/80 font-semibold truncate">{p.name}</span>
                <span className="text-white/50 tabular-nums whitespace-nowrap">₹{p.price.toLocaleString()} · {p.stockLevel} pcs</span>
              </div>
            ))}
            {catalog.length === 0 && <p className="text-[11px] text-white/40">No catalog products match brand “{s.brand}”.</p>}
            {catalog.length > 8 && <p className="text-[10px] text-white/40">+{catalog.length - 8} more in catalog</p>}
          </div>
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-3 mb-1.5 flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> Internal notes</p>
          <div className="flex gap-2">
            <input
              value={notesDraft}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. GSTIN verified, audit pending..."
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#7CB518]"
            />
            <button onClick={onNotesSave} className="px-3 py-2 rounded-lg bg-white/10 text-[11px] font-bold text-white hover:bg-[#7CB518]">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
