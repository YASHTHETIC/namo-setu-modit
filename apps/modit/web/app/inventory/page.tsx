"use client";

import { motion } from "framer-motion";
import { useInventory, useInventoryAlerts, useWarehouses } from "@/lib/modit-api";
import { Box, AlertTriangle, Package, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent, EmptyState, LoadingSpinner, MetricTile, Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, StatusPill, Badge } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function InventoryPage() {
  const { data: inventory, isLoading, isError, error, refetch } = useInventory();
  const { data: alerts } = useInventoryAlerts();
  const { data: warehouses } = useWarehouses();
  const inventoryList = inventory ?? [];
  const alertList = alerts ?? [];
  const warehouseList = warehouses ?? [];
  const lowStock = inventoryList.filter((item) => item.quantity_on_hand > 0 && item.quantity_on_hand <= item.reorder_level);
  const outOfStock = inventoryList.filter((item) => item.quantity_on_hand === 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Inventory</h1>
        <p className="text-[var(--text-secondary)]">Manage stock across warehouses</p>
      </div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Total Items" value={inventoryList.length} icon={<Package className="h-5 w-5" />} />
        <MetricTile label="Warehouses" value={warehouseList.length} icon={<Box className="h-5 w-5" />} />
        <MetricTile label="Low Stock" value={lowStock.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricTile label="Out of Stock" value={outOfStock.length} icon={<Package className="h-5 w-5" />} />
      </motion.div>

      {alertList.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" /> Inventory Alerts
          </div>
          <div className="space-y-1">
            {alertList.map((alert, i) => (
              <div key={i} className="text-sm text-amber-700">
                {alert.alert_type}: {alert.product_name} at {alert.warehouse_name} ({alert.current_stock} / {alert.reorder_level})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading ? <LoadingSpinner /> : isError ? (
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-900">Failed to load data</h3>
              <p className="mt-1 text-sm text-red-700/80">{error?.message || "Please try again later"}</p>
            </div>
            <button onClick={() => refetch()} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-all hover:bg-red-700">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      ) : inventoryList.length === 0 ? (
        <EmptyState icon={<Box className="h-8 w-8" />} title="No inventory data" description="Inventory records will appear here once stock is added" />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Warehouse</TableHeaderCell>
                <TableHeaderCell>On Hand</TableHeaderCell>
                <TableHeaderCell>Reserved</TableHeaderCell>
                <TableHeaderCell>Reorder</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryList.map((item) => {
                const qty = item.quantity_on_hand ?? 0;
                const reorder = item.reorder_level ?? 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-[var(--text-muted)]">{item.warehouse_id?.slice(0, 8)}...</TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell className="text-[var(--text-muted)]">{item.reserved_quantity ?? 0}</TableCell>
                    <TableCell>{reorder}</TableCell>
                    <TableCell><StatusPill status={item.status ?? "in_stock"} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
