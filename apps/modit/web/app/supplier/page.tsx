"use client";

import Link from "next/link";
import { Package, ShoppingBag, IndianRupee, Wallet } from "lucide-react";

import { formatINR2 } from "@/lib/utils";
import { useSupplierMe, useSupplierSummary, useSupplierOrders } from "@/lib/supplier-api";

function Card({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof Package; tint: string }) {
  return (
    <div className="rounded-2xl border border-[#DDD6EE] bg-white p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-micro font-bold text-[#9B8CB5] uppercase">{label}</p>
        <p className="text-title-md font-extrabold text-[#150726] tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

export default function SupplierDashboard() {
  const me = useSupplierMe();
  const summary = useSupplierSummary(!me.data || me.data.is_verified);
  const orders = useSupplierOrders(!me.data || me.data.is_verified);

  if (me.isLoading) {
    return <p className="text-body-sm font-bold text-[#9B8CB5]">Loading your business.</p>;
  }
  if (me.data && !me.data.is_verified) {
    return (
      <div className="rounded-2xl border border-[#FF9800]/40 bg-[#FFF8E1] p-6 text-center">
        <p className="text-title-md font-extrabold text-[#150726]">Application under review</p>
        <p className="text-caption text-[#6B5B83] mt-1">
          Reference <span className="font-bold text-[#150726] tabular-nums">{me.data.supplier_code}</span> — we verify
          every supplier within 2 working days. Your products, orders and payouts unlock here after approval.
        </p>
      </div>
    );
  }
  if (me.isError) {
    return (
      <div className="rounded-2xl border border-[#DDD6EE] bg-white p-6 text-center">
        <p className="text-title-md font-extrabold text-[#150726]">No supplier profile yet</p>
        <p className="text-caption text-[#6B5B83] mt-1">Apply in 2 minutes with your GSTIN — approval within 2 working days.</p>
        <Link href="/supplier/apply" className="btn-shine mt-4 inline-flex items-center gap-2 bg-[#7CB518] text-white text-caption font-bold px-6 py-3 rounded-xl hover:bg-[#6A9C14] transition-all">
          Apply to Sell
        </Link>
      </div>
    );
  }
  if (summary.isLoading) {
    return <p className="text-body-sm font-bold text-[#9B8CB5]">Loading your business.</p>;
  }
  if (summary.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-body-sm text-red-700">
        Could not load supplier data. Ask an administrator to link a supplier profile to this login.
      </div>
    );
  }

  const s = summary.data!;
  const recent = (orders.data ?? []).slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-md font-extrabold text-[#150726]">Namaste, {s.supplier_code}</h1>
        <p className="text-caption text-[#9B8CB5]">Your catalog performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="My products" value={String(s.product_count)} icon={Package} tint="bg-[#F0ECF9] text-[#2D1B69]" />
        <Card label="Orders" value={String(s.order_count)} icon={ShoppingBag} tint="bg-[#E0F7FA] text-[#0097A7]" />
        <Card label="Revenue" value={formatINR2(s.revenue)} icon={IndianRupee} tint="bg-[#F0F9E8] text-[#5A8010]" />
        <Card label="Payable" value={formatINR2(s.payable)} icon={Wallet} tint="bg-[#FFF6DE] text-[#150726]" />
      </div>

      <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body-md font-bold text-[#150726]">Recent orders</h2>
          <Link href="/supplier/orders" className="text-caption font-bold text-[#2D1B69] hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-body-sm text-[#9B8CB5]">No orders with your items yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F6FC]">
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-bold text-[#150726]">{o.order_number ?? o.id}</p>
                  <p className="text-micro text-[#9B8CB5] capitalize">{o.status} · {o.lines.length} line{o.lines.length === 1 ? "" : "s"}</p>
                </div>
                <p className="text-body-sm font-extrabold text-[#150726] tabular-nums">{formatINR2(o.my_total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
