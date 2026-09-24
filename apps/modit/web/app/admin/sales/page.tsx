"use client";

import { useMemo, useState } from "react";
import { Plus, X, Zap, Power, Trash2, CalendarClock, Tag } from "lucide-react";
import { useAdminStore, type Sale, type SaleScope } from "@/lib/admin-store";
import { products } from "@/lib/product-data";
import { useCategories } from "@/lib/api-hooks";

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSalesPage() {
  const sales = useAdminStore((s) => s.sales);
  const addSale = useAdminStore((s) => s.addSale);
  const updateSale = useAdminStore((s) => s.updateSale);
  const toggleSale = useAdminStore((s) => s.toggleSale);
  const deleteSale = useAdminStore((s) => s.deleteSale);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: apiCategories = [] } = useCategories();
  const categories = (apiCategories as { slug: string; name: string }[]).length > 0
    ? (apiCategories as { slug: string; name: string }[])
    : Array.from(new Map(products.map((p) => [p.categorySlug, p.category])).entries()).map(([slug, name]) => ({ slug, name }));

  const now = Date.now();
  const statusOf = (s: Sale) => {
    if (!s.active) return { label: "Paused", cls: "bg-[#F0ECF9] text-[#9B8CB5]" };
    if (now < s.startAt) return { label: "Scheduled", cls: "bg-[#FFF4E5] text-[#FF9800]" };
    if (now > s.endAt) return { label: "Ended", cls: "bg-[#F0ECF9] text-[#9B8CB5]" };
    return { label: "LIVE", cls: "bg-[#7CB518] text-white" };
  };

  const scopeText = (s: Sale) =>
    s.scope === "all"
      ? "Entire store"
      : s.scope === "category"
        ? `${s.categorySlugs.length} categor${s.categorySlugs.length === 1 ? "y" : "ies"}`
        : `${s.productIds.length} products`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Sales & Banners</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">Schedule discounts like Blinkit/Zepto — prices drop and revert automatically, banners announce it.</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E91E63] text-white text-[12px] font-bold hover:bg-[#C2185B]">
          <Plus className="h-4 w-4" /> New sale
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sales.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
            <Zap className="h-8 w-8 text-[#FF9800] mx-auto mb-2" />
            <p className="text-[14px] font-bold text-[#150726]">No sales yet</p>
            <p className="text-[12px] text-[#9B8CB5] mt-1">Create a Diwali sale, monsoon offer or weekend deal — the store announces it automatically.</p>
          </div>
        )}
        {sales.map((s) => {
          const st = statusOf(s);
          return (
            <div key={s.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-extrabold text-[#150726]">{s.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${st.cls}`}>{st.label}</span>
                    <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-[10px] font-bold text-[#2D1B69]">
                      {s.type === "percent" ? `${s.value}% OFF` : `₹${s.value} OFF`} · {scopeText(s)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9B8CB5] mt-1 flex items-center gap-1.5 flex-wrap">
                    <CalendarClock className="h-3 w-3" />
                    {new Date(s.startAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(s.endAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    <span className="text-[#9B8CB5]">· Banner: “{s.bannerTitle}”</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleSale(s.id)} title={s.active ? "Pause" : "Activate"} className={`p-2 rounded-lg border transition-all ${s.active ? "border-[#7CB518]/40 text-[#7CB518] bg-[#F0F9E8]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}>
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setEditingId(s.id); setShowForm(true); }} className="px-3 py-2 rounded-lg bg-[#2D1B69] text-white text-[11px] font-bold hover:bg-[#1E1245]">Edit</button>
                  <button onClick={() => { if (confirm(`Delete sale "${s.name}"?`)) deleteSale(s.id); }} className="p-2 rounded-lg border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <SaleForm
          key={editingId ?? "new"}
          initial={sales.find((s) => s.id === editingId) ?? null}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSave={(data) => {
            if (editingId) updateSale(editingId, data);
            else addSale(data);
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function SaleForm({ initial, categories, onClose, onSave }: {
  initial: Sale | null;
  categories: { slug: string; name: string }[];
  onClose: () => void;
  onSave: (d: Omit<Sale, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"percent" | "flat">(initial?.type ?? "percent");
  const [value, setValue] = useState(String(initial?.value ?? 10));
  const [scope, setScope] = useState<SaleScope>(initial?.scope ?? "all");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(initial?.categorySlugs ?? []);
  const [productQuery, setProductQuery] = useState("");
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [startAt, setStartAt] = useState(toLocalInput(initial?.startAt ?? Date.now()));
  const [endAt, setEndAt] = useState(toLocalInput(initial?.endAt ?? Date.now() + 3 * 86400000));
  const [bannerTitle, setBannerTitle] = useState(initial?.bannerTitle ?? "");
  const [bannerSubtitle, setBannerSubtitle] = useState(initial?.bannerSubtitle ?? "");
  const [error, setError] = useState("");

  const matchedProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [productQuery]);

  const toggleCategory = (slug: string) =>
    setCategorySlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const handleSave = () => {
    const v = Number(value);
    if (!name.trim()) return setError("Sale name is required.");
    if (!Number.isFinite(v) || v <= 0) return setError("Discount value must be greater than 0.");
    if (type === "percent" && v > 90) return setError("Percent discount cannot exceed 90%.");
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return setError("End time must be after start time.");
    if (scope === "category" && categorySlugs.length === 0) return setError("Pick at least one category.");
    if (scope === "products" && productIds.length === 0) return setError("Add at least one product.");
    setError("");
    onSave({
      name: name.trim(),
      type,
      value: v,
      scope,
      categorySlugs,
      productIds,
      startAt: start,
      endAt: end,
      bannerTitle: bannerTitle.trim() || `${name.trim()} — up to ${type === "percent" ? `${v}% OFF` : `₹${v} OFF`}`,
      bannerSubtitle: bannerSubtitle.trim() || "Limited period offer · GST invoice available",
      active: initial?.active ?? true,
    });
  };

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-[13px] font-semibold focus:outline-none focus:border-[#E91E63]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-[#150726]">{initial ? "Edit sale" : "New sale"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
        </div>

        <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Sale name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali Dhamaka Sale" className={`${field} mb-3`} />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Discount type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["percent", "flat"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={`py-2 rounded-lg text-[12px] font-bold border-2 ${type === t ? "border-[#E91E63] bg-[#FCE8F0] text-[#E91E63]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}>
                  {t === "percent" ? "% Off" : "₹ Flat"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Value {type === "percent" ? "(%)" : "(₹)"}</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" className={field} />
          </div>
        </div>

        <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Applies to</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {((["all", "category", "products"] as const).map((sc) => (
            <button key={sc} onClick={() => setScope(sc)} className={`py-2 rounded-lg text-[12px] font-bold border-2 capitalize ${scope === sc ? "border-[#E91E63] bg-[#FCE8F0] text-[#E91E63]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}>
              {sc === "all" ? "Entire store" : sc}
            </button>
          )))}
        </div>

        {scope === "category" && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <button key={c.slug} onClick={() => toggleCategory(c.slug)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 ${categorySlugs.includes(c.slug) ? "border-[#2D1B69] bg-[#F0ECF9] text-[#2D1B69]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {scope === "products" && (
          <div className="mb-3">
            <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search products to include..." className={`${field} mb-2`} />
            {matchedProducts.map((p) => (
              <button key={p.id} onClick={() => { if (!productIds.includes(p.id)) setProductIds([...productIds, p.id]); setProductQuery(""); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F7F4FC] text-[12px] font-semibold text-[#150726] border border-transparent hover:border-[#DDD6EE] mb-1">
                + {p.name} <span className="text-[#9B8CB5] font-medium">· ₹{p.price.toLocaleString()}</span>
              </button>
            ))}
            {productIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {productIds.map((pid) => (
                  <span key={pid} className="inline-flex items-center gap-1 rounded-full bg-[#F0ECF9] px-2.5 py-1 text-[10px] font-bold text-[#2D1B69]">
                    {products.find((p) => p.id === pid)?.name.slice(0, 28) ?? pid}
                    <button onClick={() => setProductIds(productIds.filter((x) => x !== pid))} className="hover:text-[#E91E63]"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Starts at</label>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Ends at</label>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={field} />
          </div>
        </div>

        <label className="text-[11px] font-bold text-[#150726] mb-1.5 flex items-center gap-1"><Tag className="h-3 w-3" /> Banner headline</label>
        <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder="Auto-filled from sale name if empty" className={`${field} mb-3`} />
        <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Banner subtext</label>
        <input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} placeholder="Auto-filled if empty" className={`${field} mb-3`} />

        {error && <p className="text-[11px] text-red-500 font-semibold mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-[#E91E63] text-white text-[12px] font-bold hover:bg-[#C2185B]">{initial ? "Save changes" : "Launch sale"}</button>
        </div>
      </div>
    </div>
  );
}
