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
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)]">Procurement insights and reports</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-[fadeIn_0.4s_ease-out]">
        <MetricTile label="Total Orders" value={d.total_orders} icon={<FileText className="h-5 w-5" />} delta={12} deltaLabel="vs last month" />
        <MetricTile label="Total Revenue" value={`₹${d.total_revenue.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} delta={8} deltaLabel="vs last month" />
        <MetricTile label="Suppliers" value={d.total_suppliers} icon={<Users className="h-5 w-5" />} delta={5} deltaLabel="verified" />
        <MetricTile label="Pending RFQs" value={d.pending_rfqs} icon={<FileText className="h-5 w-5" />} delta={-3} deltaLabel="vs last month" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
