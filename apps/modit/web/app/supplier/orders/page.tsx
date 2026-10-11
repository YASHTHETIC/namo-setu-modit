"use client";

import { formatINR2 } from "@/lib/utils";
import { useSupplierOrders } from "@/lib/supplier-api";

export default function SupplierOrdersPage() {
  const { data, isLoading, isError } = useSupplierOrders();
  const orders = data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-md font-extrabold text-[#150726]">My Orders</h1>
        <p className="text-caption text-[#9B8CB5]">Only orders containing your items. Amounts are your share.</p>
      </div>

      {isLoading && <p className="text-body-sm font-bold text-[#9B8CB5]">Loading orders…</p>}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-body-sm text-red-700">
          Could not load orders.
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center">
          <p className="text-body-md font-bold text-[#150726]">No orders yet</p>
          <p className="text-caption text-[#9B8CB5] mt-1">Orders with your items will appear here automatically.</p>
        </div>
      )}

      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-[#DDD6EE] bg-white p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-body-sm font-extrabold text-[#150726]">{o.order_number ?? o.id}</p>
            <span className="px-2 py-0.5 rounded-full text-tiny font-bold bg-[#F0ECF9] text-[#2D1B69] uppercase">{o.status}</span>
            <p className="ml-auto text-body-md font-extrabold text-[#2D1B69] tabular-nums">{formatINR2(o.my_total)}</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {o.lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-caption bg-[#F8F6FC] rounded-lg px-3 py-2">
                <span className="flex-1 min-w-0 font-semibold text-[#150726] truncate">
                  {line.product_name ?? line.sku ?? "Item"} <span className="text-[#9B8CB5]">× {line.quantity}</span>
                </span>
                <span className="font-bold text-[#150726] tabular-nums">{formatINR2(line.line_total)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
