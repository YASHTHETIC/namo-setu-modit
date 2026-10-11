"use client";

import { formatINR2 } from "@/lib/utils";
import { useSupplierProducts } from "@/lib/supplier-api";

export default function SupplierProductsPage() {
  const { data, isLoading, isError } = useSupplierProducts();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-md font-extrabold text-[#150726]">My Products</h1>
        <p className="text-caption text-[#9B8CB5]">{data ? `${data.total} items in your catalog` : "Your catalog slice."}</p>
      </div>

      {isLoading && <p className="text-body-sm font-bold text-[#9B8CB5]">Loading products…</p>}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-body-sm text-red-700">
          Could not load products.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center">
          <p className="text-body-md font-bold text-[#150726]">No products linked yet</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Ask an administrator to assign catalog items to your supplier profile.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left fx-table">
              <thead>
                <tr className="border-b border-[#E8E0F7] text-micro uppercase text-[#9B8CB5]">
                  <th className="px-4 py-3 font-bold">SKU</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold text-right">Price</th>
                  <th className="px-4 py-3 font-bold text-right">MRP</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-[#F0ECF9] last:border-0">
                    <td className="px-4 py-3 text-micro font-bold text-[#9B8CB5]">{p.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-caption font-semibold text-[#150726]">{p.name ?? p.id}</td>
                    <td className="px-4 py-3 text-caption font-bold text-[#150726] text-right tabular-nums">{formatINR2(p.list_price)}</td>
                    <td className="px-4 py-3 text-micro text-[#9B8CB5] text-right tabular-nums">{p.mrp != null ? formatINR2(p.mrp) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-tiny font-bold ${p.is_active ? "bg-[#F0F9E8] text-[#5A8010]" : "bg-[#FCE4EC] text-[#C2185B]"}`}>
                        {p.is_active ? "LIVE" : "HIDDEN"}
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
