"use client";

import { useState } from "react";
import { Plus, X, Power, Trash2, Ticket, Check } from "lucide-react";
import { useCouponStore, type Coupon } from "@/lib/coupon-store";

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage" as Coupon["discountType"],
  discountValue: "10",
  maxDiscount: "",
  minOrder: "1000",
  validTill: "2026-12-31",
  usageLimit: "5",
};

export default function AdminCouponsPage() {
  const coupons = useCouponStore((s) => s.availableCoupons);
  const addCoupon = useCouponStore((s) => s.addCoupon);
  const toggleCoupon = useCouponStore((s) => s.toggleCoupon);
  const deleteCoupon = useCouponStore((s) => s.deleteCoupon);
  const updateCoupon = useCouponStore((s) => s.updateCoupon);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState("");

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const value = Number(form.discountValue);
    const minOrder = Number(form.minOrder);
    const usageLimit = Number(form.usageLimit);
    if (!form.code.trim()) return setError("Coupon code is required.");
    if (!Number.isFinite(value) || value <= 0) return setError("Discount value must be greater than 0.");
    if (form.discountType === "percentage" && value > 90) return setError("Percentage discount cannot exceed 90%.");
    if (!Number.isFinite(minOrder) || minOrder < 0) return setError("Minimum order must be 0 or more.");
    if (!Number.isFinite(usageLimit) || usageLimit < 1) return setError("Usage limit must be at least 1.");
    const res = addCoupon({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || `${form.code.trim().toUpperCase()} offer`,
      discountType: form.discountType,
      discountValue: value,
      maxDiscount: form.maxDiscount.trim() === "" ? undefined : Number(form.maxDiscount) || undefined,
      minOrder,
      validTill: form.validTill || "2026-12-31",
      usageLimit,
      usedCount: 0,
      active: true,
    });
    if (!res.success) return setError(res.message);
    setError("");
    setForm(emptyForm);
    setShowForm(false);
  };

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-[13px] font-semibold focus:outline-none focus:border-[#E91E63]";

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Coupons</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">{coupons.filter((c) => c.active).length} active · buyers apply these at cart & checkout</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E91E63] text-white text-[12px] font-bold hover:bg-[#C2185B]">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {coupons.map((c) => (
          <div key={c.code} className={`rounded-2xl border-2 bg-white p-4 ${c.active ? "border-[#DDD6EE]" : "border-dashed border-[#DDD6EE] opacity-70"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.active ? "bg-[#FCE8F0]" : "bg-[#F0ECF9]"}`}>
                  <Ticket className={`h-5 w-5 ${c.active ? "text-[#E91E63]" : "text-[#9B8CB5]"}`} />
                </div>
                <div>
                  <p className="text-[15px] font-black tracking-wider text-[#150726]">{c.code}</p>
                  <p className="text-[11px] text-[#9B8CB5]">{c.description}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => toggleCoupon(c.code)} title={c.active ? "Deactivate" : "Activate"} className={`p-2 rounded-lg border transition-all ${c.active ? "border-[#7CB518]/40 text-[#7CB518] bg-[#F0F9E8]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}>
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { if (confirm(`Delete coupon "${c.code}"?`)) deleteCoupon(c.code); }} className="p-2 rounded-lg border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { l: "Offer", v: c.discountType === "flat" ? `₹${c.discountValue}` : c.discountType === "percentage" ? `${c.discountValue}%` : "Free ship" },
                { l: "Min order", v: `₹${c.minOrder.toLocaleString()}` },
                { l: "Used", v: `${c.usedCount}/${c.usageLimit}` },
                { l: "Valid till", v: c.validTill },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-[#F7F4FC] px-1 py-1.5">
                  <p className="text-[9px] font-bold text-[#9B8CB5] uppercase">{s.l}</p>
                  <p className="text-[11px] font-extrabold text-[#150726]">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              {editingLimit === c.code ? (
                <>
                  <input value={limitValue} onChange={(e) => setLimitValue(e.target.value)} inputMode="numeric" placeholder="New usage limit" className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#DDD6EE] text-[12px] font-semibold focus:outline-none focus:border-[#2D1B69]" />
                  <button
                    onClick={() => {
                      const n = Number(limitValue);
                      if (Number.isFinite(n) && n >= c.usedCount && n >= 1) updateCoupon(c.code, { usageLimit: n });
                      setEditingLimit(null);
                    }}
                    className="p-1.5 rounded-lg bg-[#7CB518] text-white"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingLimit(null)} className="p-1.5 rounded-lg border border-[#DDD6EE] text-[#9B8CB5]"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <button onClick={() => { setEditingLimit(c.code); setLimitValue(String(c.usageLimit)); }} className="text-[11px] font-bold text-[#2D1B69] hover:underline">
                  Edit usage limit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#150726]">New coupon</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Code</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="e.g. DIWALI25" className={`${field} uppercase tracking-wider`} />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Description</label>
                <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. 25% off on orders above ₹2000" className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Type</label>
                <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className={`${field} bg-white`}>
                  <option value="percentage">% Percentage</option>
                  <option value="flat">₹ Flat off</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Value</label>
                <input value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} inputMode="numeric" className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Max discount ₹ (optional)</label>
                <input value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} inputMode="numeric" placeholder="No cap" className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Min order ₹</label>
                <input value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} inputMode="numeric" className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Valid till</label>
                <input type="date" value={form.validTill} onChange={(e) => set("validTill", e.target.value)} className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#150726] mb-1.5">Usage limit</label>
                <input value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} inputMode="numeric" className={field} />
              </div>
            </div>
            {error && <p className="text-[11px] text-red-500 font-semibold mt-3">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-[#E91E63] text-white text-[12px] font-bold hover:bg-[#C2185B]">Create coupon</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
