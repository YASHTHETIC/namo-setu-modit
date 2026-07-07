"use client";

import { useModitAnalyticsSummary } from "@/lib/modit-api";
import { TrendingUp, Users, FileText, Package, FolderOpen, AlertTriangle } from "lucide-react";
import { MetricTile, Card, CardHeader, CardContent } from "@/lib/modit-ui";

export default function AnalyticsPage() {
  const { data: analytics } = useModitAnalyticsSummary();

  const fallbackAnalytics = {
    total_organizations: 42,
    total_products: 5000,
    total_suppliers: 200,
    total_orders: 156,
    total_revenue: 4250000,
    active_projects: 18,
    pending_rfqs: 12,
    low_stock_items: 7,
  };
  const d = analytics ?? fallbackAnalytics;

  const monthlyData = [
    { month: "Jan", value: 320000 },
    { month: "Feb", value: 410000 },
    { month: "Mar", value: 380000 },
    { month: "Apr", value: 520000 },
    { month: "May", value: 610000 },
    { month: "Jun", value: 580000 },
    { month: "Jul", value: 720000 },
    { month: "Aug", value: 690000 },
    { month: "Sep", value: 850000 },
    { month: "Oct", value: 780000 },
    { month: "Nov", value: 910000 },
    { month: "Dec", value: 880000 },
  ];
  const maxValue = Math.max(...monthlyData.map((m) => m.value));
  const categoryData = [
    { name: "Cement & Concrete", value: 32, color: "from-[var(--brand)] to-[var(--brand-light)]" },
    { name: "Steel & TMT", value: 24, color: "from-amber-500 to-orange-400" },
    { name: "Tiles & Flooring", value: 18, color: "from-teal-500 to-emerald-400" },
    { name: "Paint & Chemicals", value: 14, color: "from-purple-500 to-indigo-400" },
    { name: "Electrical & Plumbing", value: 12, color: "from-sky-500 to-blue-400" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Analytics</h1>
          <p className="text-[var(--text-secondary)]">Procurement insights and reports</p>
        </div>
        <span className="hidden items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live data
        </span>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-[fadeIn_0.4s_ease-out]">
        <MetricTile label="Total Orders" value={d.total_orders} icon={<FileText className="h-5 w-5" />} delta={12} deltaLabel="vs last month" />
        <MetricTile label="Total Revenue" value={`₹${d.total_revenue.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} delta={8} deltaLabel="vs last month" />
        <MetricTile label="Suppliers" value={d.total_suppliers} icon={<Users className="h-5 w-5" />} delta={5} deltaLabel="verified" />
        <MetricTile label="Pending RFQs" value={d.pending_rfqs} icon={<FileText className="h-5 w-5" />} delta={-3} deltaLabel="vs last month" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--text-primary)]">Revenue Trend</h2>
              <span className="text-xs text-[var(--text-muted)]">Last 12 months</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-2">
              {monthlyData.map((m, i) => (
                <div key={m.month} className="group flex flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(m.value / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--brand)] to-[var(--brand-light)] transition-all duration-700 group-hover:from-[var(--brand-dark)] group-hover:to-[var(--brand)]"
                    style={{ height: `${(m.value / maxValue) * 100}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Top Categories</h2></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{cat.name}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{cat.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-700`} style={{ width: `${cat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Platform Overview</h2></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Organizations</span><span className="font-medium text-[var(--text-primary)]">{d.total_organizations}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Products Listed</span><span className="font-medium text-[var(--text-primary)]">{d.total_products.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Active Suppliers</span><span className="font-medium text-[var(--text-primary)]">{d.total_suppliers}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total Orders</span><span className="font-medium text-[var(--text-primary)]">{d.total_orders}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Revenue & Projects</h2></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total Revenue</span><span className="font-bold text-[var(--brand)]">₹{d.total_revenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Active Projects</span><span className="font-medium text-[var(--text-primary)]">{d.active_projects}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Pending RFQs</span><span className="font-medium text-[var(--text-primary)]">{d.pending_rfqs}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Inventory Alerts</h2></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Low Stock Items</span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {d.low_stock_items}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Products Catalog</span><span className="font-medium text-[var(--text-primary)]">{d.total_products.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Avg. Order Value</span><span className="font-medium text-[var(--text-primary)]">₹{d.total_orders > 0 ? Math.round(d.total_revenue / d.total_orders).toLocaleString() : 0}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
