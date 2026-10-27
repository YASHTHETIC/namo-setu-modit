"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { onlyDigits } from "@/lib/utils";
import type { Address } from "@/lib/address-store";

export type AddressFormValue = Omit<Address, "id" | "isDefault">;

const EMPTY: AddressFormValue = {
  label: "",
  name: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
  type: "site",
};

const TEST_ADDRESS: AddressFormValue = {
  label: "Site Alpha",
  name: "Demo Tester",
  phone: "9876543210",
  line1: "Plot 42, Sector 62, Industrial Area",
  city: "Noida",
  state: "Uttar Pradesh",
  pincode: "201301",
  type: "site",
};

const field =
  "w-full px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-lg focus:outline-none focus:border-[#2D1B69]";

/**
 * Single address form for the whole app (checkout + profile).
 * Validates inline; calls onSave with a clean value.
 */
export function AddressForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save Address",
}: {
  initial?: Partial<AddressFormValue>;
  onSave: (value: AddressFormValue) => void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [form, setForm] = useState<AddressFormValue>({ ...EMPTY, ...initial });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.label || !form.name || !form.line1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill in all required fields");
      return;
    }
    if (form.pincode.length !== 6) {
      setError("Pincode must be 6 digits");
      return;
    }
    if (form.phone && form.phone.length !== 10) {
      setError("Phone must be 10 digits");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div className="p-4 rounded-xl border-2 border-[#2D1B69] bg-[#F8F6FC] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-bold text-[#150726]">New Address</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setForm(TEST_ADDRESS); setError(""); }}
            className="inline-flex items-center gap-1 rounded-md bg-[#7CB518]/15 px-2 py-1 text-tiny font-bold text-[#7CB518] hover:bg-[#7CB518]/25 transition-colors cursor-pointer"
            title="Autofill test address"
          >
            ⚡ Fill Test Address
          </button>
          {onCancel && (
            <button onClick={onCancel} aria-label="Close" className="text-[#9B8CB5] hover:text-[#150726]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Address type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Address["type"] })}
            className="col-span-2 px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-lg focus:outline-none focus:border-[#2D1B69]"
          >
            <option value="site">Construction Site</option>
            <option value="home">Home</option>
            <option value="warehouse">Warehouse</option>
            <option value="office">Office</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Label</span>
          <input
            placeholder="e.g. Site A"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Full name</span>
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Phone</span>
          <input
            placeholder="10-digit mobile"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: onlyDigits(e.target.value, 10) })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Pincode</span>
          <input
            placeholder="6-digit pincode"
            inputMode="numeric"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: onlyDigits(e.target.value, 6) })}
            className={field}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-micro font-bold text-[#150726]">Address line 1</span>
          <input
            placeholder="House / plot / street"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">City</span>
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-micro font-bold text-[#150726]">State</span>
          <input
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className={field}
          />
        </label>
      </div>
      {error && <p className="text-micro text-red-500">{error}</p>}
      <button
        onClick={submit}
        className="w-full py-2 rounded-lg bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245] transition-all"
      >
        {saveLabel}
      </button>
    </div>
  );
}
