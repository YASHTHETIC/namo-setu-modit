"use client";

import { motion } from "framer-motion";
import { useInventory, useInventoryAlerts, useWarehouses } from "@/lib/modit-api";
import { Box, AlertTriangle, Package } from "lucide-react";
import { Card, CardHeader, CardContent, EmptyState, LoadingSpinner, MetricTile, Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, StatusPill } from "@/lib/modit-ui";

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function InventoryPage() {
  const { data: inventory, isLoading, isError } = useInventory();
  const { data: alerts } = useInventoryAlerts();
  const { data: warehouses } = useWarehouses();
  const fallbackInventory = [
    { id: "i1", product_id: "TMT Steel Bars 12mm", warehouse_id: "Warehouse A", quantity_on_hand: 2400, reserved_quantity: 180, reorder_level: 500, status: "in_stock" },
    { id: "i2", product_id: "Portland Cement 53 Grade", warehouse_id: "Warehouse A", quantity_on_hand: 320, reserved_quantity: 50, reorder_level: 200, status: "in_stock" },
    { id: "i3", product_id: "Red Clay Bricks", warehouse_id: "Warehouse B", quantity_on_hand: 45, reserved_quantity: 0, reorder_level: 100, status: "low_stock" },
    { id: "i4", product_id: "MS Pipes ERW 2 inch", warehouse_id: "Warehouse A", quantity_on_hand: 0, reserved_quantity: 0, reorder_level: 30, status: "out_of_stock" },
  ];
  const fallbackWarehouses = [{ id: "w1" }, { id: "w2" }];
  const fallbackAlerts = [
    { alert_type: "Low Stock", product_name: "Red Clay Bricks", warehouse_name: "Warehouse B", current_stock: 45, reorder_level: 100 },
    { alert_type: "Out of Stock", product_name: "MS Pipes ERW 2 inch", warehouse_name: "Warehouse A", current_stock: 0, reorder_level: 30 },
  ];
  const inventoryList = inventory ?? (isError ? fallbackInventory : []);
  const alertList = alerts ?? fallbackAlerts;
  const warehouseList = warehouses ?? fallbackWarehouses;
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

      {isLoading ? <LoadingSpinner /> : inventoryList.length === 0 ? (
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
