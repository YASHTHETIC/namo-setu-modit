"use client";

import { useMemo } from "react";
import { IndianRupee, Download, Info } from "lucide-react";
import { useOrders } from "@/lib/modit-api";
import { useAdminStore } from "@/lib/admin-store";
import { useReturnStore, refundAmount } from "@/lib/return-store";
import {
  COMMISSION_PCT, DEFAULT_COMMISSION_PCT, FULFILLMENT_FEE, FREE_FULFILLMENT_ABOVE,
  TCS_PCT, settleOrder, type SettleRow,
} from "@/lib/settlements";

const fallbackOrders = [
  { id: "ORD-2026-08001", order_number: "ORD-2026-08001", status: "delivered", placed_at: "2026-07-28T10:30:00Z", total: 507835, items_count: 3 },
  { id: "ORD-2026-08002", order_number: "ORD-2026-08002", status: "in_transit", placed_at: "2026-08-03T09:15:00Z", total: 178450, items_count: 2 },
  { id: "ORD-2026-08003", order_number: "ORD-2026-08003", status: "confirmed", placed_at: "2026-08-05T14:00:00Z", total: 21560, items_count: 1 },
];

export default function AdminPayoutsPage() {
  const { data: apiOrders } = useOrders(undefined, fallbackOrders);
  const orderStatuses = useAdminStore((s) => s.orderStatuses);
  const returns = useReturnStore((s) => s.returns);

  const rows: SettleRow[] = useMemo(() => {
    const list = (apiOrders ?? fallbackOrders) as any[];
    return list
      .filter((o) => o.status !== "cancelled" && (orderStatuses[o.id]?.status ?? o.status) !== "cancelled")
      .map((o) => settleOrder({ ...o, status: orderStatuses[o.id]?.status ?? o.status }));
  }, [apiOrders, orderStatuses]);

  const returnDeductions = useMemo(
    () => returns.filter((r) => r.status !== "rejected").reduce((s, r) => s + refundAmount(r), 0),
    [returns]
  );

  const totals = useMemo(() => ({
    gross: rows.reduce((s, r) => s + r.gross, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
    fulfillment: rows.reduce((s, r) => s + r.fulfillment, 0),
    tcs: rows.reduce((s, r) => s + r.tcs, 0),
    net: rows.reduce((s, r) => s + r.net, 0) - returnDeductions,
  }), [rows, returnDeductions]);

  const exportCsv = () => {
    const lines = [
      "Order,Date,Status,Gross,Commission,Fulfillment,TCS,Net Payable",
      ...rows.map((r) => [r.id, r.date, r.status, r.gross, r.commission, r.fulfillment, r.tcs, r.net].join(",")),
      `TOTAL,,${rows.length} orders,${totals.gross},${totals.commission},${totals.fulfillment},${totals.tcs},${totals.net}`,
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modit-settlement.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "Gross sales", value: `₹${totals.gross.toLocaleString("en-IN")}`, color: "#150726" },
    { label: "Commission", value: `−₹${totals.commission.toLocaleString("en-IN")}`, color: "#E91E63" },
    { label: "Fulfillment", value: `−₹${totals.fulfillment.toLocaleString("en-IN")}`, color: "#FF9800" },
    { label: "TCS (0.5%)", value: `−₹${totals.tcs.toLocaleString("en-IN")}`, color: "#00BCD4" },
    { label: "Returns", value: `−₹${returnDeductions.toLocaleString("en-IN")}`, color: "#C2185B" },
    { label: "Net payable", value: `₹${totals.net.toLocaleString("en-IN")}`, color: "#5f8f12", highlight: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#150726]">Payouts & Settlements</h1>
          <p className="text-[12px] text-[#9B8CB5] mt-0.5">Every order traced to net payout — gross minus commission, fulfillment, TCS and returns.</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border bg-white p-4 ${c.highlight ? "border-[#7CB518]/50 ring-1 ring-[#7CB518]/30" : "border-[#DDD6EE]"}`}>
            <span className="text-[11px] font-bold text-[#9B8CB5] uppercase tracking-wide">{c.label}</span>
            <p className="text-[20px] font-extrabold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-[#F7F4FC] px-4 py-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-[#2D1B69] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[#6B5B83]">
          <span className="font-bold text-[#150726]">Rate card:</span> commission {Object.entries(COMMISSION_PCT).map(([k, v]) => `${k} ${v}%`).join(" · ")} (default {DEFAULT_COMMISSION_PCT}%) · fulfillment ₹{FULFILLMENT_FEE} below ₹{FREE_FULFILLMENT_ABOVE.toLocaleString("en-IN")} · TCS {TCS_PCT}% like marketplace settlements.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-[#F7F4FC] text-[10px] uppercase tracking-wider text-[#9B8CB5]">
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Gross</th>
                <th className="px-4 py-3 font-bold text-right">Commission</th>
                <th className="px-4 py-3 font-bold text-right">Fulfillment</th>
                <th className="px-4 py-3 font-bold text-right">TCS</th>
                <th className="px-4 py-3 font-bold text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#F0ECF9]">
                  <td className="px-4 py-3 text-[13px] font-bold text-[#150726]">{r.id}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B5B83]">{r.date}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-[10px] font-bold text-[#2D1B69] capitalize">{r.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-[13px] text-right font-semibold">₹{r.gross.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-[13px] text-right text-[#E91E63]">−₹{r.commission.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-[13px] text-right text-[#6B5B83]">{r.fulfillment ? `₹${r.fulfillment}` : "FREE"}</td>
                  <td className="px-4 py-3 text-[13px] text-right text-[#6B5B83]">₹{r.tcs.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-[13px] text-right font-extrabold text-[#5f8f12]">₹{r.net.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#9B8CB5]">
        <IndianRupee className="h-3.5 w-3.5" /> Payouts settle on a T+7 style cycle after delivery — pending orders release automatically once delivered.
      </p>
    </div>
  );
}
