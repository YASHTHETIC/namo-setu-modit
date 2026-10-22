"use client";

import { useEffect, useState } from "react";
import { Search, Pencil, EyeOff, Eye, Check, X, Upload, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts, useUpdateProduct, getModitApi, useCategories, useBrands, useUnits, useWarehouses, useCreateProduct } from "@/lib/modit-api";
import { useSupplierApplications } from "@/lib/supplier-api";
import { useToast } from "@foundation/ui";

/** One server catalog row as the admin console consumes it. */
interface AdminProductRow {
  id: string;
  sku: string;
  name: string;
  brand?: { name?: string } | null;
  mrp: number | null;
  list_price: number;
  stock_units: number;
  is_active: boolean;
  supplier_id: string | null;
}

export default function AdminProductsPage() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminProductRow | null>(null);
  const [bulkRows, setBulkRows] = useState<{ sku: string; name: string; price?: number; mrp?: number; matched: boolean; id?: string }[] | null>(null);
  const [bulkError, setBulkError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();
  const applications = useSupplierApplications();

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [queryInput]);

  const pageSize = 100;
  const { data, isLoading, isError, error } = useProducts({ search: query || undefined, page, page_size: pageSize });
  const updateProduct = useUpdateProduct();

  const items: AdminProductRow[] = (data?.items as AdminProductRow[] | undefined) ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? Math.max(1, Math.ceil(total / pageSize));

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
          setBulkError("CSV must have a 'sku' column. Format: sku,price,mrp");
          return;
        }
        const priceIdx = header.indexOf("price");
        const mrpIdx = header.indexOf("mrp");
        const skuCount = items.filter((p) => !query).length;
        const localMap = new Map(items.map((p) => [p.sku.toUpperCase(), p]));
        const parsed = lines.slice(1, 501).map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const sku = (cols[skuIdx] || "").toUpperCase();
          const local = localMap.get(sku);
          const num = (i: number) => (i >= 0 && cols[i] !== "" && Number.isFinite(Number(cols[i])) ? Number(cols[i]) : undefined);
          return {
            sku,
            name: local?.name ?? "— match on apply —",
            price: priceIdx >= 0 ? num(priceIdx) : undefined,
            mrp: mrpIdx >= 0 ? num(mrpIdx) : undefined,
            matched: Boolean(local) || skuCount === 0,
            id: local?.id,
          };
        });
        setBulkRows(parsed);
      } catch {
        setBulkError("Could not read this file. Upload a simple comma-separated CSV.");
      }
    };
    reader.readAsText(file);
  };

  const applyBulk = async () => {
    if (!bulkRows) return;
    let matched = 0;
    let patched = 0;
    const rows = bulkRows.filter((r) => r.sku);
    const api = getModitApi();
    for (const r of rows) {
      try {
        const res = await api.listProducts({ search: r.sku, page_size: 50 });
        const match = (res.items ?? []).find((it: any) => it.sku?.toUpperCase() === r.sku);
        if (!match) continue;
        matched += 1;
        const payload: Record<string, unknown> = {};
        if (r.price !== undefined && r.price > 0) payload.list_price = r.price;
        if (r.mrp !== undefined && r.mrp > 0) payload.mrp = r.mrp;
        if (Object.keys(payload).length === 0) continue;
        await api.updateProduct(match.id, payload);
        patched += 1;
      } catch {
        // keep going — count failures as patches skipped
      }
    }
    toast.success(
      "Bulk update done",
      `${patched} of ${rows.length} SKUs updated on the server${patched < matched ? ` · ${matched - patched} server updates skipped` : ""}`,
    );
    setBulkRows(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726]">Products &amp; Pricing</h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">
            {isLoading ? "Loading…" : `${total} live in the server catalog · edits publish to buyers instantly`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B8CB5]" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search name, SKU, description..."
            className="w-full rounded-xl border border-[#DDD6EE] bg-white pl-9 pr-3 py-2.5 text-body-sm focus:outline-none focus:border-[#2D1B69]"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-shine flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
        <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#DDD6EE] text-[#2D1B69] text-caption font-bold hover:border-[#2D1B69] cursor-pointer bg-white">
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
      {bulkError && <p className="mt-2 text-caption font-bold text-red-500">{bulkError}</p>}

      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fx-table w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#F7F4FC] text-tiny uppercase tracking-wider text-[#9B8CB5]">
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
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-caption text-[#9B8CB5]">Loading products…</td></tr>
              )}
              {!isLoading && isError && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-caption font-bold text-red-500">{(error as Error)?.message || "Could not load products."}</td></tr>
              )}
              {!isLoading && !isError && items.map((p) => {
                const discount = p.mrp && p.mrp > p.list_price
                  ? Math.round(((p.mrp - p.list_price) / p.mrp) * 100)
                  : 0;
                return (
                  <tr key={p.id} className="border-t border-[#F0ECF9] hover:bg-[#F7F4FC]">
                    <td className="px-4 py-3">
                      <p className="text-body-sm font-bold text-[#150726] max-w-[280px] truncate">{p.name}</p>
                      <p className="text-tiny text-[#9B8CB5]">{p.sku}{p.brand?.name ? ` · ${p.brand.name}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-[#6B5B83]">{p.mrp ? `₹${p.mrp.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-4 py-3 text-body-sm font-extrabold text-[#150726]">₹{p.list_price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-body-sm font-bold text-[#E91E63]">{discount}%</td>
                    <td className="px-4 py-3 text-body-sm text-[#6B5B83] tabular-nums">{p.stock_units.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F9E8] px-2 py-0.5 text-tiny font-bold text-[#7CB518]"><Eye className="h-3 w-3" /> Live</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0ECF9] px-2 py-0.5 text-tiny font-bold text-[#9B8CB5]"><EyeOff className="h-3 w-3" /> Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2D1B69] text-white text-micro font-bold hover:bg-[#1E1245]">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-caption text-[#9B8CB5]">{query ? "No products match that search." : "No products in the catalog yet."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F0ECF9]">
            <p className="text-micro text-[#9B8CB5]">Page {page} of {pages} · {total} products</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-[#DDD6EE] text-[#2D1B69] disabled:opacity-40 disabled:text-[#9B8CB5]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((n) => Math.min(pages, n + 1))}
                disabled={page >= pages}
                className="p-2 rounded-lg border border-[#DDD6EE] text-[#2D1B69] disabled:opacity-40 disabled:text-[#9B8CB5]"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditProductModal
          product={editing}
          saving={updateProduct.isPending}
          suppliers={(applications.data ?? []).filter((a) => a.status === "approved")}
          onClose={() => setEditing(null)}
          onSave={(id, patch, supplierId) => {
            if (supplierId !== undefined && supplierId !== (editing.supplier_id ?? null)) {
              patch.supplier_id = supplierId;
            }
            if (Object.keys(patch).length === 0) {
              setEditing(null);
              return;
            }
            updateProduct.mutate(
              { id, payload: patch },
              {
                onSuccess: () => {
                  toast.success("Published", "Buyers see this immediately.");
                  setEditing(null);
                },
                onError: (e: Error) => {
                  toast.error("Save failed", e.message);
                },
              },
            );
          }}
        />
      )}

      {bulkRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setBulkRows(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-body-lg font-bold text-[#150726]">Bulk upload preview</h2>
              <button onClick={() => setBulkRows(null)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-caption text-[#9B8CB5] mb-3">
              {bulkRows.length} rows queued · each SKU is matched on the server when applied; unmatched rows are skipped
            </p>
            <div className="rounded-xl border border-[#DDD6EE] overflow-hidden mb-4 max-h-72 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F7F4FC] text-tiny uppercase tracking-wider text-[#9B8CB5]">
                    <th className="px-3 py-2 font-bold">SKU</th>
                    <th className="px-3 py-2 font-bold text-right">Price</th>
                    <th className="px-3 py-2 font-bold text-right">MRP</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.slice(0, 50).map((r, i) => (
                    <tr key={`${r.sku}-${i}`} className="border-t border-[#F0ECF9]">
                      <td className="px-3 py-2 text-micro font-bold text-[#150726]">{r.sku}</td>
                      <td className="px-3 py-2 text-micro text-right font-semibold">{r.price ?? "—"}</td>
                      <td className="px-3 py-2 text-micro text-right font-semibold">{r.mrp ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-micro text-[#9B8CB5] mb-3">CSV format: <span className="font-mono font-bold text-[#2D1B69]">sku,price,mrp</span> — e.g. CE1-XXXX,365,395</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBulkRows(null)} className="px-4 py-2.5 rounded-lg text-caption font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button onClick={applyBulk} disabled={bulkRows.length === 0} className="px-5 py-2.5 rounded-lg bg-[#7CB518] text-white text-caption font-bold hover:bg-[#5a8010] disabled:opacity-50 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Apply to {bulkRows.length} rows
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function EditProductModal({ product, suppliers, saving, onClose, onSave }: {
  product: AdminProductRow;
  suppliers: { supplier_id: string; supplier_code: string; business_name: string }[];
  saving?: boolean;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>, supplierId: string | null | undefined) => void;
}) {
  const [price, setPrice] = useState(String(product.list_price));
  const [mrp, setMrp] = useState(product.mrp != null ? String(product.mrp) : "");
  const [hidden, setHidden] = useState(!product.is_active);
  const [supplierId, setSupplierId] = useState(product.supplier_id ?? "");
  const [error, setError] = useState("");

  const num = (v: string) => {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? undefined : n;
  };

  const handleSave = () => {
    setError("");
    const p = num(price);
    const m = num(mrp);
    if (p === undefined || p <= 0) {
      setError("Enter a valid selling price.");
      return;
    }
    if (m !== undefined && m < p) {
      setError("MRP cannot be below the selling price.");
      return;
    }
    const patch: Record<string, unknown> = {};
    if (p !== product.list_price) patch.list_price = p;
    if ((m ?? null) !== (product.mrp ?? null)) patch.mrp = m ?? null;
    const nowHidden = hidden;
    if (nowHidden !== !product.is_active) patch.is_active = !nowHidden;
    onSave(product.id, patch, supplierId === "" ? null : supplierId || undefined);
  };

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-sm font-semibold focus:outline-none focus:border-[#2D1B69]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-body-lg font-bold text-[#150726]">Edit product</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-caption text-[#9B8CB5] mb-4">{product.name} · {product.sku}</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-micro font-bold text-[#150726] mb-1.5">Selling price (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={field} />
          </div>
          <div>
            <label className="block text-micro font-bold text-[#150726] mb-1.5">MRP (₹, optional)</label>
            <input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" placeholder="None" className={field} />
          </div>
          <div className="col-span-2">
            <label className="block text-micro font-bold text-[#150726] mb-1.5">Supplier (hub catalog)</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={field}>
              <option value="">Store-direct (no supplier)</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.business_name} ({s.supplier_code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-tiny text-[#9B8CB5]">Only verified suppliers are listed. Save applies it to the buyer catalog too.</p>
          </div>
          <div className="col-span-2">
            <p className="text-tiny text-[#9B8CB5]">
              Current stock: <span className="font-bold text-[#150726]">{product.stock_units.toLocaleString("en-IN")} units</span> across all stores. Adjust per store in Stores &amp; Stock.
            </p>
          </div>
        </div>

        <button onClick={() => setHidden(!hidden)} className={`mt-3 w-full flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition-all ${hidden ? "border-[#E91E63]/40 bg-[#FCE4EC]" : "border-[#DDD6EE]"}`}>
          <span className="text-caption font-bold text-[#150726] flex items-center gap-2">
            {hidden ? <EyeOff className="h-4 w-4 text-[#E91E63]" /> : <Eye className="h-4 w-4 text-[#7CB518]" />}
            {hidden ? "Hidden from store" : "Visible on store"}
          </span>
          <span className={`text-tiny font-bold px-2 py-0.5 rounded-full ${hidden ? "bg-[#E91E63] text-white" : "bg-[#F0F9E8] text-[#7CB518]"}`}>{hidden ? "HIDDEN" : "LIVE"}</span>
        </button>

        {error && <p className="mt-3 text-caption font-bold text-[#E91E63]">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-caption font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#7CB518] text-white text-caption font-bold hover:bg-[#5a8010] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";
}

/** Create a product straight in the server catalog (source of truth for checkout). */
function AddProductModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: units = [] } = useUnits();
  const { data: warehouses = [] } = useWarehouses();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-sm font-semibold focus:outline-none focus:border-[#2D1B69] bg-white";
  const label = "block text-micro font-bold text-[#150726] mb-1.5";

  const handleCreate = () => {
    setError("");
    const orgId = warehouses[0]?.organization_id;
    if (!orgId) {
      setError("No store found — open a store first (Stores & Stock) or run the seeder.");
      return;
    }
    if (name.trim().length < 3) {
      setError("Give the product a proper name (3+ characters).");
      return;
    }
    if (!categoryId || !unitId) {
      setError("Pick a category and a unit.");
      return;
    }
    const listPrice = Number(price);
    if (!Number.isFinite(listPrice) || listPrice <= 0) {
      setError("Enter a valid selling price.");
      return;
    }
    const mrpNum = mrp.trim() === "" ? undefined : Number(mrp);
    if (mrpNum !== undefined && (!Number.isFinite(mrpNum) || mrpNum < listPrice)) {
      setError("MRP must be empty or above the selling price.");
      return;
    }
    const catCode = (categories.find((c: any) => c.id === categoryId)?.slug ?? "gen").slice(0, 3).toUpperCase();
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);
    const sku = `${catCode}-${stamp}`;
    createProduct.mutate(
      {
        organization_id: orgId,
        brand_id: brandId || null,
        category_id: categoryId,
        unit_id: unitId,
        sku,
        name: name.trim(),
        slug: `${slugify(name)}-${stamp.toLowerCase()}`,
        description: desc.trim() || null,
        mrp: mrpNum ?? null,
        list_price: Math.round(listPrice),
      },
      {
        onSuccess: (p: any) => {
          toast.success("Product added", `${name.trim()} (SKU ${p?.sku ?? sku}) is live in the catalog.`);
          onClose();
        },
        onError: (e: any) => setError(e?.message || "Could not add product."),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-body-lg font-bold text-[#150726]">Add product</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-caption text-[#9B8CB5] mb-4">Goes straight into the server catalog — stock is set per store in Stores &amp; Stock.</p>

        <div className="space-y-3">
          <div>
            <label className={label}>Product name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UltraTech Super 53 Grade, 50kg" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={field}>
                <option value="">Select…</option>
                {(categories as any[]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Unit</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={field}>
                <option value="">Select…</option>
                {(units as any[]).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Brand (optional)</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={field}>
              <option value="">No brand</option>
              {(brands as any[]).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Selling price (₹)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="e.g. 370" className={field} />
            </div>
            <div>
              <label className={label}>MRP (₹, optional)</label>
              <input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" placeholder="e.g. 395" className={field} />
            </div>
          </div>
          <div>
            <label className={label}>Description (optional)</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short spec line" className={field} />
          </div>
        </div>

        {error && <p className="mt-3 text-caption font-bold text-[#E91E63]">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-caption font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={createProduct.isPending}
            className="px-5 py-2.5 rounded-lg bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> {createProduct.isPending ? "Adding…" : "Add to catalog"}
          </button>
        </div>
      </div>
    </div>
  );
}
