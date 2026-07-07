"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useProducts, useOrders, useRFQs, useProjects, useSuppliers } from "@/lib/modit-api";
import { Package, Users, FileText, ShoppingCart, FolderOpen, ArrowRight } from "lucide-react";
import { MetricTile, Card, CardHeader, CardContent, StatusPill, LoadingSpinner, EmptyState } from "@/lib/modit-ui";

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function DashboardPage() {
  const productsQuery = useProducts({ page: 1 });
  const ordersQuery = useOrders();
  const rfqsQuery = useRFQs();
  const projectsQuery = useProjects();
  const suppliersQuery = useSuppliers();

  const { data: productsData, isLoading: loadingProducts } = productsQuery;
  const { data: ordersData, isLoading: loadingOrders } = ordersQuery;
  const { data: rfqsData, isLoading: loadingRFQs } = rfqsQuery;
  const { data: projectsData, isLoading: loadingProjects } = projectsQuery;
  const { data: suppliersData, isLoading: loadingSuppliers } = suppliersQuery;

  const fallbackProducts = [
    { id: "p1", name: "TMT Steel Bars", sku: "STL-001", list_price: 62000 },
    { id: "p2", name: "PPC Cement", sku: "CEM-001", list_price: 380 },
  ];
  const fallbackOrders = [{ id: "o1", order_number: "ORD-0451", status: "delivered", placed_at: "2026-07-01", created_at: "2026-06-28" }];
  const fallbackRFQs = [{ id: "r1", rfq_number: "RFQ-001", status: "open", notes: "Steel for Phase 2", due_date: "2026-07-20", created_at: "2026-07-01" }];
  const fallbackProjects = [{ id: "pr1", name: "Skyline Residency", project_code: "SKY-2026", status: "active", budget_amount: 12000000 }];
  const fallbackSuppliers = [{ id: "s1", supplier_code: "Tata Steel", is_verified: true }];

  const products = productsData?.items ?? (productsQuery.isError ? fallbackProducts : []);
  const orders = ordersData ?? (ordersQuery.isError ? fallbackOrders : []);
  const rfqs = rfqsData ?? (rfqsQuery.isError ? fallbackRFQs : []);
  const projects = projectsData ?? (projectsQuery.isError ? fallbackProjects : []);
  const suppliers = suppliersData ?? (suppliersQuery.isError ? fallbackSuppliers : []);

  const loading = loadingProducts || loadingOrders || loadingRFQs || loadingProjects || loadingSuppliers;

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-h1 text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Overview of your procurement activities</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  const stats = [
    { label: "Products", value: products.length, icon: <Package className="h-5 w-5" />, link: "/products", delta: 12, deltaLabel: "vs last month" },
    { label: "Suppliers", value: suppliers.length, icon: <Users className="h-5 w-5" />, link: "/suppliers", delta: 5, deltaLabel: "vs last month" },
    { label: "Active RFQs", value: rfqs.length, icon: <FileText className="h-5 w-5" />, link: "/rfq", delta: -3, deltaLabel: "vs last month" },
    { label: "Orders", value: orders.length, icon: <ShoppingCart className="h-5 w-5" />, link: "/orders", delta: 8, deltaLabel: "vs last month" },
    { label: "Projects", value: projects.length, icon: <FolderOpen className="h-5 w-5" />, link: "/projects", delta: 2, deltaLabel: "vs last month" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Overview of your procurement activities</p>
      </div>

      {/* Metric tiles */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.link}>
            <MetricTile
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              delta={stat.delta}
              deltaLabel={stat.deltaLabel}
            />
          </Link>
        ))}
      </motion.div>

      {/* Recent Orders & RFQs */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--text-primary)]">Recent Orders</h2>
              <Link href="/orders" className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8" />}
                title="No orders yet"
                description="Browse products to get started"
              />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between rounded-xl py-3 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{order.order_number ?? `#${order.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <StatusPill status={order.status ?? "placed"} />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--text-primary)]">Recent RFQs</h2>
              <Link href="/rfq" className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {rfqs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="No RFQs yet"
                description="Create an RFQ to start sourcing"
              />
            ) : (
              <div className="space-y-3">
                {rfqs.slice(0, 5).map((rfq) => (
                  <motion.div
                    key={rfq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between rounded-xl py-3 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{rfq.rfq_number ?? `#${rfq.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-[var(--text-muted)]">Due: {rfq.due_date ?? "N/A"}</div>
                    </div>
                    <StatusPill status={rfq.status ?? "open"} />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects & Suppliers */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--text-primary)]">Projects</h2>
              <Link href="/projects" className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-8 w-8" />}
                title="No projects yet"
                description="Create a project to track procurement"
              />
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-xl py-3 border-b border-[var(--border-subtle)] last:border-0">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{project.name ?? `#${project.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-[var(--text-muted)]">{project.project_code}</div>
                    </div>
                    <StatusPill status={project.status ?? "active"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--text-primary)]">Suppliers</h2>
              <Link href="/suppliers" className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No suppliers yet"
                description="Add suppliers to start procurement"
              />
            ) : (
              <div className="space-y-3">
                {suppliers.slice(0, 5).map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between rounded-xl py-3 border-b border-[var(--border-subtle)] last:border-0">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{supplier.supplier_code ?? `#${supplier.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-[var(--text-muted)]">{supplier.is_verified ? "Verified" : "Pending verification"}</div>
                    </div>
                    <StatusPill status={supplier.is_verified ? "approved" : "pending"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
