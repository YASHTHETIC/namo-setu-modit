"use client";

import { motion } from "framer-motion";
import { useOrders } from "@/lib/modit-api";
import { ShoppingCart, Package, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent, EmptyState, LoadingSpinner, Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, StatusPill } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function OrdersPage() {
  const { data: orders, isLoading, isError, error, refetch } = useOrders();
  const orderList = orders ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Orders</h1>
        <p className="text-[var(--text-secondary)]">Track and manage your orders</p>
      </div>

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
      ) : orderList.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="No orders yet" description="Orders will appear here once you purchase products" />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Order ID</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Placed</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderList.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[var(--text-muted)]" />
                        <span className="font-medium">{order.order_number ?? `#${order.id.slice(0, 8)}`}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusPill status={order.status ?? "placed"} /></TableCell>
                    <TableCell className="text-[var(--text-muted)]">{order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-[var(--text-muted)]">{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
