"use client";

import { motion } from "framer-motion";
import { useModitAnalyticsSummary } from "@/lib/modit-api";
import { BarChart3, TrendingUp, Package, Users, FileText, FolderOpen, AlertTriangle, Building } from "lucide-react";
import { MetricTile, Card, CardHeader, CardContent, EmptyState, LoadingSpinner } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useModitAnalyticsSummary();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)]">Procurement insights and reports</p>
      </div>

      {isLoading ? <LoadingSpinner /> : analytics ? (
        <>
          <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Total Revenue" value={`₹${(analytics.total_revenue ?? 0).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} delta={12} deltaLabel="vs last month" />
            <MetricTile label="Products" value={analytics.total_products ?? 0} icon={<Package className="h-5 w-5" />} delta={8} deltaLabel="new this month" />
            <MetricTile label="Suppliers" value={analytics.total_suppliers ?? 0} icon={<Users className="h-5 w-5" />} delta={5} deltaLabel="verified" />
            <MetricTile label="Pending RFQs" value={analytics.pending_rfqs ?? 0} icon={<FileText className="h-5 w-5" />} delta={-3} deltaLabel="vs last month" />
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Organizations</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--brand)]">{analytics.total_organizations ?? 0}</div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Registered on the platform</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Active Projects</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-emerald-600">{analytics.active_projects ?? 0}</div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Currently in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-h4 text-[var(--text-primary)]">Low Stock Items</h2></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-amber-600">{analytics.low_stock_items ?? 0}</div>
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
