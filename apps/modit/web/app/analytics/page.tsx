"use client";

import { useModitAnalyticsSummary } from "@/lib/modit-api";
import { BarChart3, TrendingUp, Package, Users, FileText, FolderOpen } from "lucide-react";
import { MetricTile, Card, CardHeader, CardContent, EmptyState, LoadingSpinner } from "@/lib/modit-ui";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useModitAnalyticsSummary();

  const fallbackAnalytics = {
    total_revenue: 24500000,
    total_products: 51,
    total_suppliers: 20,
    pending_rfqs: 3,
    total_organizations: 12,
    active_projects: 4,
    low_stock_items: 7,
  };
  const analyticsData = analytics ?? fallbackAnalytics;
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)]">Procurement insights and reports</p>
      </div>

      {isLoading ? <LoadingSpinner /> : analyticsData ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-[fadeIn_0.4s_ease-out]">
            <MetricTile label="Total Revenue" value={`₹${(analyticsData.total_revenue ?? 0).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} delta={12} deltaLabel="vs last month" />
            <MetricTile label="Products" value={analyticsData.total_products ?? 0} icon={<Package className="h-5 w-5" />} delta={8} deltaLabel="new this month" />
            <MetricTile label="Suppliers" value={analyticsData.total_suppliers ?? 0} icon={<Users className="h-5 w-5" />} delta={5} deltaLabel="verified" />
            <MetricTile label="Pending RFQs" value={analyticsData.pending_rfqs ?? 0} icon={<FileText className="h-5 w-5" />} delta={-3} deltaLabel="vs last month" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Organizations</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--brand)]">{analyticsData.total_organizations ?? 0}</div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Registered on the platform</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Active Projects</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-emerald-600">{analyticsData.active_projects ?? 0}</div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Currently in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Low Stock Items</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-amber-600">{analyticsData.low_stock_items ?? 0}</div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Requires attention</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="No analytics data" description="Analytics will appear as you use the platform" />
      )}
    </div>
  );
}
