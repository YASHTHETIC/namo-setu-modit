"use client";

import { useMemo, useState } from "react";
import {
  Warehouse, Plus, X, AlertTriangle, Sparkles, Package,
  MapPin, Check, RefreshCw,
} from "lucide-react";
import {
  useWarehouses, useCreateWarehouse, useInventory, useUpdateInventory,
  useInventoryAlerts, useInventoryAnalytics, useAISmartReorder,
} from "@/lib/modit-api";
import { logAdminActivity } from "@/lib/admin-activity";
import { useToast } from "@foundation/ui";

const inputCls =
  "w-full rounded-xl border border-[#DDD6EE] bg-white px-3 py-2.5 text-body-sm text-[#150726] focus:outline-none focus:border-[#2D1B69]";

export default function AdminStoresPage() {
  const toast = useToast();
  const { data: warehouses = [], isLoading: whLoading } = useWarehouses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const [reorderResult, setReorderResult] = useState<{ suggestions: Record<string, any>[]; total: number } | null>(null);

  const selected = warehouses.find((w) => w.id === selectedId) ?? warehouses[0] ?? null;
  const { data: inventory = [] } = useInventory(selected?.id);
  const { data: alerts = [] } = useInventoryAlerts();
  const { data: analytics } = useInventoryAnalytics();
  const createWarehouse = useCreateWarehouse();
  const updateInventory = useUpdateInventory();
  const smartReorder = useAISmartReorder();

  const [form, setForm] = useState({ name: "", code: "", address: "", pincode: "", lat: "", lng: "" });
  const [formError, setFormError] = useState("");

  const storeAlerts = useMemo(
    () => (selected ? alerts.filter((a) => a.warehouse_id === selected.id) : alerts),
    [alerts, selected]
  );

  const handleCreate = () => {
    setFormError("");
    if (!form.name.trim() || !form.code.trim() || !form.address.trim() || !form.pincode.trim()) {
      setFormError("Name, code, address and pincode are required.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setFormError("Pincode must be 6 digits.");
      return;
    }
    const anchor = warehouses[0];
    if (!anchor) {
      setFormError("No store exists yet — run the catalog seeder on the server first.");
      return;
    }
    createWarehouse.mutate(
      {
        organization_id: anchor.organization_id,
        city_id: anchor.city_id,
        warehouse_code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        address_line1: form.address.trim(),
        pincode: form.pincode.trim(),
        latitude: form.lat ? Number(form.lat) : null,
        longitude: form.lng ? Number(form.lng) : null,
      },
      {
        onSuccess: (w: any) => {
          logAdminActivity("store.create", `Store "${form.name.trim()}" opened (${form.pincode.trim()})`, w?.id);
          toast.success("Store opened", `${form.name.trim()} is now live for dispatch.`);
          setShowCreate(false);
          setForm({ name: "", code: "", address: "", pincode: "", lat: "", lng: "" });
          setSelectedId(w?.id ?? null);
        },
        onError: (e: any) => setFormError(e?.message || "Could not create store."),
      }
    );
  };

  const saveQty = (invId: string, label: string) => {
    const raw = qtyEdits[invId];
    const qty = raw === undefined || raw === "" ? NaN : Number(raw);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("Invalid quantity", "Enter 0 or more.");
      return;
    }
    updateInventory.mutate(
      { id: invId, payload: { quantity_on_hand: Math.floor(qty) } },
      {
        onSuccess: () => {
          logAdminActivity("store.restock", `Stock set to ${Math.floor(qty)} (${label})`, selected?.name);
          toast.success("Stock updated", `${label} → ${Math.floor(qty)} units.`);
          setQtyEdits((m) => {
            const next = { ...m };
            delete next[invId];
            return next;
          });
        },
        onError: (e: any) => toast.error("Update failed", e?.message || "Try again."),
      }
    );
  };

  const runReorder = () => {
    if (!selected) return;
    setReorderResult(null);
    smartReorder.mutate(
      { organization_id: selected.organization_id, warehouse_id: selected.id },
      {
        onSuccess: (res: any) => {
          setReorderResult({
            suggestions: (res?.reorder_suggestions ?? []) as Record<string, any>[],
            total: Number(res?.total_estimated_cost ?? 0),
          });
          logAdminActivity("store.reorder", `AI reorder run for ${selected.name}`, `${res?.reorder_suggestions?.length ?? 0} suggestions`);
        },
        onError: (e: any) => toast.error("Reorder failed", e?.message || "Try again."),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726]">Stores & Stock</h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">Dark-store ops — warehouses, live inventory, alerts and AI reorders.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]"
        >
          <Plus className="h-4 w-4" /> New store
        </button>
      </div>

      {/* KPI strip */}
      {analytics && (
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "SKUs stocked", value: analytics.total_products.toLocaleString("en-IN") },
            { label: "Low stock", value: analytics.low_stock_count.toLocaleString("en-IN") },
            { label: "Out of stock", value: analytics.out_of_stock_count.toLocaleString("en-IN") },
            { label: "Stock value", value: `₹${(analytics.total_value / 100000).toFixed(2)}L` },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
              <p className="text-micro font-bold text-[#9B8CB5] uppercase tracking-wide">{k.label}</p>
              <p className="text-title-lg font-extrabold text-[#150726] mt-1 tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Store picker */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {whLoading && <p className="text-caption text-[#9B8CB5]">Loading stores…</p>}
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedId(w.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-body-sm font-bold transition-all ${
              (selected?.id ?? "") === w.id
                ? "border-[#2D1B69] bg-[#2D1B69] text-white shadow-md"
                : "border-[#DDD6EE] bg-white text-[#6B5B83] hover:border-[#2D1B69]/40"
            }`}
          >
            <Warehouse className="h-4 w-4" />
            {w.name}
            <span className={`text-tiny font-semibold ${(selected?.id ?? "") === w.id ? "text-white/60" : "text-[#9B8CB5]"}`}>
              {w.pincode}
            </span>
          </button>
        ))}
        {!whLoading && warehouses.length === 0 && (
          <p className="text-caption text-[#9B8CB5]">No stores yet — run the catalog seeder, then open your first store above.</p>
        )}
      </div>

      {selected && (
        <div className="mt-3 rounded-2xl border border-[#DDD6EE] bg-white p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F0ECF9] flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-[#2D1B69]" />
          </div>
          <div className="min-w-0">
            <p className="text-body-md font-extrabold text-[#150726]">{selected.name}</p>
            <p className="text-caption text-[#6B5B83] truncate">{selected.address_line1}, {selected.pincode}</p>
            <p className="text-micro text-[#9B8CB5] mt-0.5">
              Code {selected.warehouse_code}
              {selected.latitude != null && selected.longitude != null
                ? ` · geo ${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)} — hyperlocal dispatch ON`
                : " · no geo-tag — add lat/lng for hyperlocal dispatch"}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {storeAlerts.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#FF9800]/30 bg-white p-4">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FF9800]" /> Needs restock ({storeAlerts.length})
          </h2>
          <div className="mt-3 space-y-2">
            {storeAlerts.slice(0, 8).map((a, i) => (
              <div key={`${a.product_id}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFBF5] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-caption font-bold text-[#150726] truncate">{a.product_name}</p>
                  <p className="text-micro text-[#9B8CB5]">{a.current_stock} left · reorder at {a.reorder_level} · {a.warehouse_name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#FF9800]/15 px-2 py-0.5 text-tiny font-black text-[#FF9800] uppercase">{a.alert_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI reorder */}
      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2D1B69]" /> AI smart reorder
          </h2>
          <button
            onClick={runReorder}
            disabled={!selected || smartReorder.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${smartReorder.isPending ? "animate-spin" : ""}`} />
            {smartReorder.isPending ? "Thinking…" : selected ? `Suggest for ${selected.name}` : "Select a store"}
          </button>
        </div>
        {reorderResult && (
          <div className="mt-3">
            <p className="text-caption text-[#6B5B83]">
              {reorderResult.suggestions.length} suggestions · est. <span className="font-extrabold text-[#150726]">₹{reorderResult.total.toLocaleString("en-IN")}</span>
            </p>
            <div className="mt-2 space-y-2">
              {reorderResult.suggestions.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F4FC] px-3 py-2.5">
                  <p className="text-caption font-bold text-[#150726] truncate">
                    {String(s.product_name ?? s.name ?? s.product_id ?? s.sku ?? `Item ${i + 1}`)}
                  </p>
                  <p className="text-caption font-extrabold text-[#2D1B69] shrink-0 tabular-nums">
                    × {String(s.suggested_quantity ?? s.quantity ?? s.reorder_qty ?? "?")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inventory table */}
      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
        <div className="p-4 pb-2 flex items-center gap-2">
          <Package className="h-4 w-4 text-[#2D1B69]" />
          <h2 className="text-body-md font-bold text-[#150726]">Live inventory{selected ? ` — ${selected.name}` : ""}</h2>
          <span className="ml-auto text-micro font-bold text-[#9B8CB5]">{inventory.length} SKUs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead>
              <tr className="bg-[#F7F4FC] text-tiny uppercase tracking-wider text-[#9B8CB5]">
                <th className="px-4 py-3 font-bold">SKU / Product</th>
                <th className="px-4 py-3 font-bold">On hand</th>
                <th className="px-4 py-3 font-bold">Reserved</th>
                <th className="px-4 py-3 font-bold">Reorder at</th>
                <th className="px-4 py-3 font-bold text-right">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {inventory.slice(0, 100).map((row) => {
                const low = row.quantity_on_hand <= row.reorder_level;
                return (
                  <tr key={row.id} className="border-t border-[#F0ECF9] hover:bg-[#F7F4FC]">
                    <td className="px-4 py-3">
                      <p className="text-body-sm font-bold text-[#150726] font-mono">{row.product_id.slice(0, 8)}…</p>
                      <p className={`text-tiny font-bold ${low ? "text-[#E91E63]" : "text-[#9B8CB5]"}`}>
                        {row.status}{low ? " · LOW" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body-md font-extrabold text-[#150726] tabular-nums">{row.quantity_on_hand}</td>
                    <td className="px-4 py-3 text-body-sm text-[#6B5B83] tabular-nums">{row.reserved_quantity}</td>
                    <td className="px-4 py-3 text-body-sm text-[#6B5B83] tabular-nums">{row.reorder_level}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min={0}
                          placeholder={String(row.quantity_on_hand)}
                          value={qtyEdits[row.id] ?? ""}
                          onChange={(e) => setQtyEdits((m) => ({ ...m, [row.id]: e.target.value }))}
                          className="w-20 rounded-lg border border-[#DDD6EE] px-2 py-1.5 text-body-sm text-right focus:outline-none focus:border-[#2D1B69]"
                        />
                        <button
                          onClick={() => saveQty(row.id, row.product_id.slice(0, 8))}
                          disabled={updateInventory.isPending}
                          className="p-2 rounded-lg bg-[#F0F9E8] text-[#5a8010] hover:bg-[#7CB518] hover:text-white disabled:opacity-50"
                          title="Save quantity"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr className="border-t border-[#F0ECF9]">
                  <td colSpan={5} className="px-4 py-8 text-center text-caption text-[#9B8CB5]">
                    No inventory rows for this store yet — the seeder fills 5000 units per product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create store modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#150726]/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-body-md font-extrabold text-[#150726]">Open a new store</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-[#9B8CB5] hover:bg-[#F0ECF9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              <input placeholder="Store name — e.g. Indirapuram" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-2.5">
                <input placeholder="Code — e.g. GZB-02" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} />
                <input placeholder="Pincode — 6 digits" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" className={inputCls} />
              </div>
              <input placeholder="Address line" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-2.5">
                <input placeholder="Latitude (optional)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} inputMode="decimal" className={inputCls} />
                <input placeholder="Longitude (optional)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} inputMode="decimal" className={inputCls} />
              </div>
              <p className="text-micro text-[#9B8CB5]">Geo-tagged stores get hyperlocal dispatch (nearest-store routing). Org & city inherit from your first store.</p>
              {formError && <p className="text-caption font-bold text-[#E91E63]">{formError}</p>}
              <button
                onClick={handleCreate}
                disabled={createWarehouse.isPending}
                className="w-full h-12 rounded-xl bg-[#2D1B69] text-white text-body-md font-bold hover:bg-[#1E1245] disabled:opacity-50"
              >
                {createWarehouse.isPending ? "Opening…" : "Open store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
