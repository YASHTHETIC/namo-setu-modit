"use client";

import { formatINR2 } from "@/lib/utils";
import { useSupplierPayouts } from "@/lib/supplier-api";

export default function SupplierPayoutsPage() {
  const { data, isLoading, isError } = useSupplierPayouts();
  const payouts = data ?? [];
  const pending = payouts.filter((p) => p.state !== "paid").reduce((s, p) => s + p.amount, 0);
  const paid = payouts.filter((p) => p.state === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-md font-extrabold text-[#150726]">Payouts</h1>
        <p className="text-caption text-[#9B8CB5]">Computed from your order lines — paid on delivery, released by finance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
          <p className="text-micro font-bold text-[#9B8CB5] uppercase">Pending release</p>
          <p className="text-title-md font-extrabold text-[#150726] tabular-nums">{formatINR2(pending)}</p>
        </div>
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
          <p className="text-micro font-bold text-[#9B8CB5] uppercase">Paid</p>
          <p className="text-title-md font-extrabold text-[#5A8010] tabular-nums">{formatINR2(paid)}</p>
        </div>
      </div>

      {isLoading && <p className="text-body-sm font-bold text-[#9B8CB5]">Loading payouts…</p>}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-body-sm text-red-700">
          Could not load payouts.
        </div>
      )}

      {!isLoading && !isError && payouts.length === 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center">
          <p className="text-body-md font-bold text-[#150726]">No payouts yet</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Payouts appear here as your items get ordered.</p>
        </div>
      )}

      {payouts.length > 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left fx-table">
              <thead>
                <tr className="border-b border-[#E8E0F7] text-micro uppercase text-[#9B8CB5]">
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                  <th className="px-4 py-3 font-bold">State</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.order_id} className="border-b border-[#F0ECF9] last:border-0">
                    <td className="px-4 py-3 text-caption font-bold text-[#150726]">{p.order_number ?? p.order_id}</td>
                    <td className="px-4 py-3 text-micro text-[#9B8CB5] capitalize">{p.status}</td>
                    <td className="px-4 py-3 text-caption font-bold text-[#150726] text-right tabular-nums">{formatINR2(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-tiny font-bold ${p.state === "paid" ? "bg-[#F0F9E8] text-[#5A8010]" : "bg-[#FFF6DE] text-[#150726]"}`}>
                        {p.state === "paid" ? "PAID" : "PENDING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
