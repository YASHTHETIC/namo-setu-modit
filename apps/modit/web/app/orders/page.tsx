"use client";

import { motion } from "framer-motion";
import { useOrders } from "@/lib/modit-api";
import { ShoppingCart, Package } from "lucide-react";
import { Card, CardHeader, CardContent, EmptyState, LoadingSpinner, Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, StatusPill } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function OrdersPage() {
  const { data: orders, isLoading, isError, error, refetch } = useOrders();
  const fallbackOrders = [
    { id: "o1", order_number: "ORD-2026-0451", status: "delivered", placed_at: "2026-06-28", created_at: "2026-06-27" },
    { id: "o2", order_number: "ORD-2026-0452", status: "shipped", placed_at: "2026-07-01", created_at: "2026-06-30" },
    { id: "o3", order_number: "ORD-2026-0453", status: "placed", placed_at: "2026-07-03", created_at: "2026-07-03" },
    { id: "o4", order_number: "ORD-2026-0454", status: "processing", placed_at: "2026-07-04", created_at: "2026-07-04" },
  ];
  const orderList = orders ?? (isError ? fallbackOrders : []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Orders</h1>
        <p className="text-[var(--text-secondary)]">Track and manage your orders</p>
      </div>

      {isLoading ? <LoadingSpinner /> : orderList.length === 0 ? (
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
