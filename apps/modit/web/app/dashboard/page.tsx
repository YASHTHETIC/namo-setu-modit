"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useProducts, useOrders, useRFQs, useProjects, useSuppliers } from "@/lib/modit-api";
import { Package, Users, FileText, ShoppingCart, FolderOpen, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
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

  const products = productsData?.items ?? [];
  const orders = ordersData ?? [];
  const rfqs = rfqsData ?? [];
  const projects = projectsData ?? [];
  const suppliers = suppliersData ?? [];

  const loading = loadingProducts || loadingOrders || loadingRFQs || loadingProjects || loadingSuppliers;

  const isError = productsQuery.isError || ordersQuery.isError || rfqsQuery.isError || projectsQuery.isError || suppliersQuery.isError;
  const firstError = productsQuery.error || ordersQuery.error || rfqsQuery.error || projectsQuery.error || suppliersQuery.error;

  const handleRetry = () => {
    productsQuery.refetch();
    ordersQuery.refetch();
    rfqsQuery.refetch();
    projectsQuery.refetch();
    suppliersQuery.refetch();
  };

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

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-red-900">Failed to load data</h3>
            <p className="mt-1 text-sm text-red-700/80">{firstError?.message || "Please try again later"}</p>
          </div>
          <button onClick={handleRetry} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-all hover:bg-red-700">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
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
