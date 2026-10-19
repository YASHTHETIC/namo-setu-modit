"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Store, CheckCircle2, LogOut } from "lucide-react";
import { supplierApply } from "@/lib/supplier-api";
import { getAccessToken, clearAccessToken } from "@/lib/auth";
import { useToast } from "@foundation/ui";

const CATEGORY_OPTIONS = [
  "cement", "painting", "lighting", "tiling", "electrical", "plywood",
  "hardware-tools", "sanitary", "pipes", "switches",
];

const inputCls =
  "mt-1 w-full h-12 rounded-xl border-2 border-[#DDD6EE] px-3 text-body-md font-semibold text-[#150726] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10";
const labelCls = "text-micro font-bold text-[#150726] uppercase tracking-wide";

export default function SupplierApplyPage() {
  const toast = useToast();
  const loggedIn = typeof window !== "undefined" && Boolean(getAccessToken());
  const [form, setForm] = useState({
    business_name: "", contact_name: "", email: "", phone: "",
    password: "", gstin: "", pan: "", city: "", pincode: "", brands: "",
  });
  const [categories, setCategories] = useState<string[]>(["cement"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ supplier_code: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "gstin" || k === "pan" || k === "email") v = v.toUpperCase().trimStart();
    if (k === "phone" || k === "pincode") v = v.replace(/\D/g, "");
    setForm((f) => ({ ...f, [k]: v }));
  };

  const toggleCategory = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    setError(null);
    if (categories.length === 0) {
      setError("Pick at least one category you supply.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await supplierApply({
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        gstin: form.gstin.trim(),
        pan: form.pan.trim(),
        city: form.city.trim(),
        pincode: form.pincode,
        categories,
        brands: form.brands.split(",").map((b) => b.trim()).filter(Boolean),
      });
      setDone({ supplier_code: res.supplier_code });
      toast.success("Application received", "We review every application within 2 working days.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not submit. Try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/supplier" aria-label="Back to supplier hub" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-title-md font-extrabold text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-[#7CB518]" /> Sell on MODIT
              </h1>
              <p className="text-caption text-white/50">Supplier application — reviewed within 2 working days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-4 sm:px-6">
        {loggedIn && !done && (
          <div className="rounded-2xl border border-[#FF9800]/40 bg-[#FFF8E1] p-4 mb-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-body-sm font-bold text-[#150726]">You are logged in</p>
              <p className="text-caption text-[#6B5B83]">Supplier applications use a separate business login. Log out first, then apply.</p>
            </div>
            <button
              onClick={() => { clearAccessToken(); window.location.reload(); }}
              className="flex items-center gap-1.5 rounded-xl bg-[#150726] text-white text-caption font-bold px-4 py-2.5 hover:bg-[#2D1B69] transition-all flex-shrink-0"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}

        {done ? (
          <div className="rounded-2xl border border-[#7CB518]/30 bg-[#F0F9E8] p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-[#7CB518] mx-auto mb-3" />
            <h2 className="text-title-md font-extrabold text-[#150726]">Application received</h2>
            <p className="text-caption text-[#6B5B83] mt-1">
              Reference <span className="font-bold text-[#150726] tabular-nums">{done.supplier_code}</span> — log in with
              your business email anytime to check status. The hub unlocks after verification.
            </p>
            <Link href="/supplier" className="btn-shine mt-4 inline-flex items-center gap-2 bg-[#7CB518] text-white text-caption font-bold px-6 py-3 rounded-xl hover:bg-[#6A9C14] transition-all">
              Go to Supplier Hub
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Business name</label>
                <input value={form.business_name} onChange={set("business_name")} placeholder="Sharma Building Mart" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact person</label>
                <input value={form.contact_name} onChange={set("contact_name")} placeholder="Ravi Sharma" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Business email (your login)</label>
                <input value={form.email} onChange={set("email")} placeholder="you@business.in" inputMode="email" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mobile (10 digits, OTP/login)</label>
                <input value={form.phone} onChange={set("phone")} placeholder="9810012345" inputMode="numeric" maxLength={10} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password (min 8 characters)</label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="Choose a password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input value={form.city} onChange={set("city")} placeholder="Noida" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSTIN (15 characters)</label>
                <input value={form.gstin} onChange={set("gstin")} placeholder="07ABCDE1234F1Z5" maxLength={15} className={`${inputCls} uppercase tracking-wider`} />
              </div>
              <div>
                <label className={labelCls}>PAN (10 characters)</label>
                <input value={form.pan} onChange={set("pan")} placeholder="ABCDE1234F" maxLength={10} className={`${inputCls} uppercase tracking-wider`} />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input value={form.pincode} onChange={set("pincode")} placeholder="201301" inputMode="numeric" maxLength={6} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Brands (comma separated)</label>
                <input value={form.brands} onChange={set("brands")} placeholder="UltraTech, ACC" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Categories you supply</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={`rounded-xl px-4 py-2 text-caption font-bold border-2 transition-all ${
                      categories.includes(c)
                        ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-caption font-semibold p-3">{error}</p>
            )}
            <button
              onClick={submit}
              disabled={submitting}
              className="btn-shine w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-md font-bold hover:bg-[#6A9C14] transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
            <p className="text-tiny text-[#9B8CB5] text-center">By applying you agree to verification of your GSTIN and business details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
