"use client";

import { useState } from "react";
import { Plus, X, Power, Trash2, Ticket, Check, Loader2 } from "lucide-react";
import { useAdminCoupons, useCreateAdminCoupon, useUpdateAdminCoupon, useDeleteAdminCoupon, useCategories } from "@/lib/modit-api";
import { useToast } from "@foundation/ui";
import { Stagger } from "@/components/fx";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "flat" | "percent" | "ship";
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  valid_till: string | null;
  usage_limit: number | null;
  used_count: number;
  category: string | null;
  is_active: boolean;
};

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "flat" | "free_shipping",
  discountValue: "10",
  maxDiscount: "",
  minOrder: "1000",
  validTill: "2026-12-31",
  usageLimit: "",
  categorySlug: "",
};

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading, isError, error: couponsError } = useAdminCoupons();
  const createCoupon = useCreateAdminCoupon();
  const updateCoupon = useUpdateAdminCoupon();
  const deleteCoupon = useDeleteAdminCoupon();
  const { data: categories = [] } = useCategories();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState("");

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    setFormError("");
    const value = Number(form.discountValue);
    const minOrder = Number(form.minOrder);
    if (!form.code.trim()) return setFormError("Coupon code is required.");
    if (form.discountType !== "free_shipping" && (!Number.isFinite(value) || value <= 0)) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (form.discountType === "percentage" && value > 90) return setFormError("Percentage discount cannot exceed 90%.");
    if (!Number.isFinite(minOrder) || minOrder < 0) return setFormError("Minimum order must be 0 or more.");
    createCoupon.mutate(
      {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || `${form.code.trim().toUpperCase()} offer`,
        discount_type: form.discountType === "percentage" ? "percent" : form.discountType === "flat" ? "flat" : "ship",
        discount_value: form.discountType === "free_shipping" ? 0 : Math.round(value * 100) / 100,
        max_discount: form.maxDiscount.trim() === "" ? null : Number(form.maxDiscount),
        min_order: minOrder,
        valid_till: form.validTill || null,
        usage_limit: form.usageLimit.trim() === "" ? null : Number(form.usageLimit),
        category: form.categorySlug || null,
        is_active: true,
      },
      {
        onSuccess: (c: CouponRow) => {
          toast.success("Coupon live", `${c.code} now validates at checkout.`);
          setForm(emptyForm);
          setShowForm(false);
        },
        onError: (e: Error) => setFormError(e.message),
      },
    );
  };

  const field = "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-sm font-semibold focus:outline-none focus:border-[#E91E63]";

  const offerLabel = (c: CouponRow) =>
    c.discount_type === "flat" ? `₹${c.discount_value}` : c.discount_type === "percent" ? `${c.discount_value}%` : "Free ship";

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726]">Coupons</h1>
          <p className="text-caption text-[#9B8CB5] mt-0.5">
            {isLoading
              ? "Loading…"
              : `${coupons.filter((c) => c.is_active).length} active · validated server-side at checkout`}
          </p>
        </div>
        <button onClick={() => { setForm(emptyForm); setFormError(""); setShowForm(true); }} className="btn-shine flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E91E63] text-white text-caption font-bold hover:bg-[#C2185B]">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      {isError && (
        <div className="mt-4 rounded-2xl border border-[#FF9800]/30 bg-[#FFFBF5] px-4 py-3">
          <p className="text-caption font-bold text-[#B45309]">{couponsError?.message || "Could not load coupons."}</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Stagger step={60} className="h-full">
        {(coupons as CouponRow[]).map((c) => (
          <div key={c.id} className={`rounded-2xl border-2 bg-white p-4 h-full ${c.is_active ? "border-[#DDD6EE]" : "border-dashed border-[#DDD6EE] opacity-70"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.is_active ? "bg-[#FCE4EC]" : "bg-[#F0ECF9]"}`}>
                  <Ticket className={`h-5 w-5 ${c.is_active ? "text-[#E91E63]" : "text-[#9B8CB5]"}`} />
                </div>
                <div>
                  <p className="text-body-lg font-black tracking-wider text-[#150726]">{c.code}</p>
                  <p className="text-micro text-[#9B8CB5]">{c.description || "—"}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateCoupon.mutate({ id: c.id, payload: { is_active: !c.is_active } })}
                  disabled={updateCoupon.isPending}
                  title={c.is_active ? "Deactivate" : "Activate"}
                  className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${c.is_active ? "border-[#7CB518]/40 text-[#7CB518] bg-[#F0F9E8]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete coupon "${c.code}"?`)) deleteCoupon.mutate(c.id); }}
                  disabled={deleteCoupon.isPending}
                  className="p-2 rounded-lg border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#E91E63] hover:border-[#E91E63]/40 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { l: "Offer", v: offerLabel(c) },
                { l: "Min order", v: `₹${c.min_order.toLocaleString("en-IN")}` },
                { l: "Used", v: c.usage_limit != null ? `${c.used_count}/${c.usage_limit}` : String(c.used_count) },
                { l: "Valid till", v: c.valid_till || "No expiry" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-[#F7F4FC] px-1 py-1.5">
                  <p className="text-tiny font-bold text-[#9B8CB5] uppercase">{s.l}</p>
                  <p className="text-micro font-extrabold text-[#150726]">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {c.category && (
                <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-tiny font-bold text-[#2D1B69]">category: {c.category}</span>
              )}
              {editingLimit === c.id ? (
                <>
                  <input value={limitValue} onChange={(e) => setLimitValue(e.target.value)} inputMode="numeric" placeholder="Blank = unlimited" className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg border border-[#DDD6EE] text-caption font-semibold focus:outline-none focus:border-[#2D1B69]" />
                  <button
                    onClick={() => {
                      const raw = limitValue.trim();
                      if (raw === "" || (Number.isFinite(Number(raw)) && Number(raw) >= 1)) {
                        updateCoupon.mutate({ id: c.id, payload: { usage_limit: raw === "" ? null : Number(raw) } });
                      }
                      setEditingLimit(null);
                    }}
                    className="p-1.5 rounded-lg bg-[#7CB518] text-white"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingLimit(null)} className="p-1.5 rounded-lg border border-[#DDD6EE] text-[#9B8CB5]"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <button onClick={() => { setEditingLimit(c.id); setLimitValue(c.usage_limit != null ? String(c.usage_limit) : ""); }} className="text-micro font-bold text-[#2D1B69] hover:underline">
                  Edit usage limit
                </button>
              )}
            </div>
          </div>
        ))}
        </Stagger>
      </div>

      {!isLoading && !isError && coupons.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DDD6EE] bg-white p-10 text-center">
          <Ticket className="h-8 w-8 text-[#E91E63] mx-auto mb-2" />
          <p className="text-body-md font-bold text-[#150726]">No coupons yet</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Create a coupon — it validates at checkout instantly.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body-lg font-bold text-[#150726]">New coupon</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-[#9B8CB5] hover:bg-[#F7F4FC]"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Code</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="e.g. DIWALI25" className={`${field} uppercase tracking-wider`} />
              </div>
              <div className="col-span-2">
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Description</label>
                <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. 25% off on orders above ₹2000" className={field} />
              </div>
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Type</label>
                <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className={`${field} bg-white`}>
                  <option value="percentage">% Percentage</option>
                  <option value="flat">₹ Flat off</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">{form.discountType === "free_shipping" ? "Value (n/a)" : "Value"}</label>
                <input
                  value={form.discountType === "free_shipping" ? "0" : form.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)}
                  inputMode="numeric"
                  disabled={form.discountType === "free_shipping"}
                  className={field}
                />
              </div>
              {form.discountType === "percentage" && (
                <div>
                  <label className="block text-micro font-bold text-[#150726] mb-1.5">Max discount ₹ (optional)</label>
                  <input value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} inputMode="numeric" placeholder="No cap" className={field} />
                </div>
              )}
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Min order ₹</label>
                <input value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} inputMode="numeric" className={field} />
              </div>
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Limit to category</label>
                <select value={form.categorySlug} onChange={(e) => set("categorySlug", e.target.value)} className={`${field} bg-white`}>
                  <option value="">All categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id ?? cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Valid till</label>
                <input type="date" value={form.validTill} onChange={(e) => set("validTill", e.target.value)} className={field} />
              </div>
              <div>
                <label className="block text-micro font-bold text-[#150726] mb-1.5">Usage limit (blank = ∞)</label>
                <input value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} inputMode="numeric" className={field} />
              </div>
            </div>
            {formError && <p className="text-micro text-red-500 font-semibold mt-3">{formError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg text-caption font-bold text-[#9B8CB5] hover:bg-[#F7F4FC]">Cancel</button>
              <button
                onClick={handleSave}
                disabled={createCoupon.isPending}
                className="px-5 py-2.5 rounded-lg bg-[#E91E63] text-white text-caption font-bold hover:bg-[#C2185B] disabled:opacity-50 flex items-center gap-2"
              >
                {createCoupon.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
