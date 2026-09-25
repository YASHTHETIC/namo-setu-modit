"use client";

import { useMemo, useState } from "react";
import { Search, Pencil, EyeOff, Eye, RotateCcw, Check, X, Upload } from "lucide-react";
import { products, type Product } from "@/lib/product-data";
import { useAdminStore, type ProductOverride } from "@/lib/admin-store";
import { resolveProduct } from "@/lib/pricing";
import { logAdminActivity } from "@/lib/admin-activity";

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [bulkRows, setBulkRows] = useState<{ sku: string; name: string; price?: number; mrp?: number; stock?: number; matched: boolean; id?: string }[] | null>(null);
  const [bulkError, setBulkError] = useState("");
  const overrides = useAdminStore((s) => s.overrides);
  const setOverride = useAdminStore((s) => s.setOverride);
  const clearOverride = useAdminStore((s) => s.clearOverride);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        )
      : products;
    return list.slice(0, 60);
  }, [query]);

  const handleBulkFile = (file: File) => {
    setBulkError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setBulkError("CSV needs a header row plus at least one product row.");
          return;
        }
        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const skuIdx = header.indexOf("sku");
        if (skuIdx === -1) {
          setBulkError("CSV must have a 'sku' column. Format: sku,price,mrp,stock");
          return;
        }
        const priceIdx = header.indexOf("price");
        const mrpIdx = header.indexOf("mrp");
        const stockIdx = header.indexOf("stock");
        const parsed = lines.slice(1, 501).map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const sku = (cols[skuIdx] || "").toUpperCase();
          const match = products.find((p) => p.sku.toUpperCase() === sku || p.id.toLowerCase() === sku.toLowerCase());
          const num = (i: number) => (i >= 0 && cols[i] !== "" && Number.isFinite(Number(cols[i])) ? Number(cols[i]) : undefined);
          return {
            sku,
            name: match?.name ?? "— not found —",
            price: priceIdx >= 0 ? num(priceIdx) : undefined,
            mrp: mrpIdx >= 0 ? num(mrpIdx) : undefined,
            stock: stockIdx >= 0 ? num(stockIdx) : undefined,
            matched: Boolean(match),
            id: match?.id,
          };
        });
        setBulkRows(parsed);
      } catch {
        setBulkError("Could not read this file. Upload a simple comma-separated CSV.");
      }
    };
    reader.readAsText(file);
  };

  const applyBulk = () => {
    if (!bulkRows) return;
    let count = 0;
    bulkRows.forEach((r) => {
      if (!r.matched || !r.id) return;
      const patch: ProductOverride = {};
      if (r.price !== undefined && r.price > 0) patch.price = Math.round(r.price);
      if (r.mrp !== undefined && r.mrp > 0) patch.mrp = Math.round(r.mrp);
      if (r.stock !== undefined && r.stock >= 0) {
        patch.stockLevel = Math.round(r.stock);
        patch.inStock = r.stock > 0;
      }
      if (Object.keys(patch).length > 0) {
        setOverride(r.id, patch);
        count += 1;
      }
    });
    logAdminActivity("product.bulk_update", `Bulk update applied to ${count} products`, "via CSV upload");
    setBulkRows(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Products & Pricing</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">
            {products.length} products · {Object.keys(overrides).length} customized · edits go live instantly
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, brand..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
        <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#DDD6EE] text-[#2D1B69] text-[12px] font-bold hover:border-[#2D1B69] cursor-pointer bg-white">
          <Upload className="h-4 w-4" /> Bulk upload
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleBulkFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {bulkError && <p className="mt-2 text-[12px] font-bold text-red-500">{bulkError}</p>}

      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#F7F4FC] text-[10px] uppercase tracking-wider text-[#9B8CB5]">
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">MRP</th>
                <th className="px-4 py-3 font-bold">Selling price</th>
                <th className="px-4 py-3 font-bold">Discount</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const r = resolveProduct(p);
                const edited = Boolean(overrides[p.id]);
                return (
                  <tr key={p.id} className="border-t border-[#F0ECF9] hover:bg-[#FBF9FE]">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-bold text-[#150726] max-w-[280px] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#9B8CB5]">{p.sku} · {p.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6B5B83]">₹{r.mrp.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] font-extrabold text-[#150726]">
                      ₹{r.price.toLocaleString()}
                      {r.onSale && <span className="ml-1.5 rounded bg-[#7CB518] px-1.5 py-0.5 text-[9px] font-bold text-white">SALE</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#E91E63]">{r.discount}%</td>
                    <td className="px-4 py-3 text-[13px] text-[#6B5B83]">{r.stockLevel}</td>
                    <td className="px-4 py-3">
                      {r.hidden ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0ECF9] px-2 py-0.5 text-[10px] font-bold text-[#9B8CB5]"><EyeOff className="h-3 w-3" /> Hidden</span>
                      ) : edited ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F9FC] px-2 py-0.5 text-[10px] font-bold text-[#00BCD4]"><Check className="h-3 w-3" /> Custom</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F9E8] px-2 py-0.5 text-[10px] font-bold text-[#7CB518]"><Eye className="h-3 w-3" /> Live</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        {edited && (
                          <button onClick={() => { clearOverride(p.id); logAdminActivity("product.reset", `${p.name} reset to default`); }} title="Reset to default" className="p-2 rounded-lg border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2D1B69] text-white text-[11px] font-bold hover:bg-[#1E1245]">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 60 && !query && (
          <p className="px-4 py-3 text-[11px] text-[#9B8CB5] border-t border-[#F0ECF9]">Showing first 60 — use search to find a specific product.</p>
        )}
      </div>

      {editing && (
        <EditProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            setOverride(editing.id, patch);
            logAdminActivity(
              "product.update",
              `${editing.name} updated`,
              `Price ₹${patch.price?.toLocaleString()} · MRP ₹${patch.mrp?.toLocaleString()} · Stock ${patch.stockLevel}${patch.hidden ? " · HIDDEN" : ""}`
            );
            setEditing(null);
          }}
        />
      )}

      {bulkRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setBulkRows(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[15px] font-bold text-[#150726]">Bulk upload preview</h2>
              <button onClick={() => setBulkRows(null)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-[12px] text-[#9B8CB5] mb-3">
              {bulkRows.filter((r) => r.matched).length} of {bulkRows.length} SKUs matched · only matched rows will update
            </p>
            <div className="rounded-xl border border-[#DDD6EE] overflow-hidden mb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F7F4FC] text-[10px] uppercase tracking-wider text-[#9B8CB5]">
                    <th className="px-3 py-2 font-bold">SKU</th>
                    <th className="px-3 py-2 font-bold">Product</th>
                    <th className="px-3 py-2 font-bold text-right">Price</th>
                    <th className="px-3 py-2 font-bold text-right">MRP</th>
                    <th className="px-3 py-2 font-bold text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.slice(0, 50).map((r) => (
                    <tr key={r.sku} className={`border-t border-[#F0ECF9] ${r.matched ? "" : "bg-red-50/50"}`}>
                      <td className="px-3 py-2 text-[11px] font-bold text-[#150726]">{r.sku}</td>
                      <td className="px-3 py-2 text-[11px] text-[#6B5B83] max-w-[160px] truncate">{r.name}</td>
                      <td className="px-3 py-2 text-[11px] text-right font-semibold">{r.price ?? "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-right font-semibold">{r.mrp ?? "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-right font-semibold">{r.stock ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[#9B8CB5] mb-3">CSV format: <span className="font-mono font-bold text-[#2D1B69]">sku,price,mrp,stock</span> — e.g. CEM-ACC-50,365,395,120</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBulkRows(null)} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button onClick={applyBulk} disabled={bulkRows.filter((r) => r.matched).length === 0} className="px-5 py-2.5 rounded-lg bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6aa514] disabled:opacity-50 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Apply to {bulkRows.filter((r) => r.matched).length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: ProductOverride) => void }) {
  const existing = useAdminStore((s) => s.overrides[product.id]);
  const [price, setPrice] = useState(String(existing?.price ?? product.price));
  const [mrp, setMrp] = useState(String(existing?.mrp ?? product.mrp));
  const [bulkPrice, setBulkPrice] = useState(existing?.bulkPrice != null ? String(existing.bulkPrice) : product.bulkPrice != null ? String(product.bulkPrice) : "");
  const [bulkMinQty, setBulkMinQty] = useState(existing?.bulkMinQty != null ? String(existing.bulkMinQty) : product.bulkMinQty != null ? String(product.bulkMinQty) : "");
  const [stock, setStock] = useState(String(existing?.stockLevel ?? product.stockLevel));
  const [hidden, setHidden] = useState(existing?.hidden ?? false);

  const num = (v: string) => {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? undefined : n;
  };

  const handleSave = () => {
    const p = num(price) ?? product.price;
    const m = num(mrp) ?? product.mrp;
    onSave({
      price: Math.max(1, Math.min(p, m)),
      mrp: Math.max(1, m),
      bulkPrice: bulkPrice.trim() === "" ? null : num(bulkPrice) ?? null,
      bulkMinQty: bulkMinQty.trim() === "" ? null : num(bulkMinQty) ?? null,
      stockLevel: Math.max(0, num(stock) ?? product.stockLevel),
      inStock: (num(stock) ?? product.stockLevel) > 0,
      hidden,
    });
  };

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-[13px] font-semibold focus:outline-none focus:border-[#2D1B69]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-bold text-[#150726]">Edit product</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-[12px] text-[#9B8CB5] mb-4">{product.name} · {product.sku}</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Selling price (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">MRP (₹)</label>
            <input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Bulk price (₹)</label>
            <input value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} inputMode="numeric" placeholder="Optional" className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Bulk min qty</label>
            <input value={bulkMinQty} onChange={(e) => setBulkMinQty(e.target.value)} inputMode="numeric" placeholder="Optional" className={field} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Stock level</label>
            <input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" className={field} />
          </div>
        </div>

        <button onClick={() => setHidden(!hidden)} className={`mt-3 w-full flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition-all ${hidden ? "border-[#E91E63]/40 bg-[#FCE8F0]" : "border-[#DDD6EE]"}`}>
          <span className="text-[12px] font-bold text-[#150726] flex items-center gap-2">
            {hidden ? <EyeOff className="h-4 w-4 text-[#E91E63]" /> : <Eye className="h-4 w-4 text-[#7CB518]" />}
            {hidden ? "Hidden from store" : "Visible on store"}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hidden ? "bg-[#E91E63] text-white" : "bg-[#F0F9E8] text-[#7CB518]"}`}>{hidden ? "HIDDEN" : "LIVE"}</span>
        </button>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6aa514] flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Save & publish
          </button>
        </div>
      </div>
    </div>
  );
}
