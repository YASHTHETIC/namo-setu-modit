"use client";

import Link from "next/link";
import { useProducts, useOrders, useRFQs, useProjects, useSuppliers } from "@/lib/modit-api";
import { Package, Users, FileText, ShoppingCart, FolderOpen, ArrowRight, TrendingUp, TrendingDown, Zap, Truck, Building2 } from "lucide-react";

export default function DashboardPage() {
  const productsQuery = useProducts({ page: 1 });
  const ordersQuery = useOrders();
  const rfqsQuery = useRFQs();
  const projectsQuery = useProjects();
  const suppliersQuery = useSuppliers();

  const { data: productsData } = productsQuery;
  const { data: ordersData, isLoading: loadingOrders } = ordersQuery;
  const { data: rfqsData } = rfqsQuery;
  const { data: projectsData } = projectsQuery;
  const { data: suppliersData } = suppliersQuery;

  const fallbackProducts = [
    { id: "p1", name: "TMT Steel Bars", sku: "STL-001", list_price: 62000 },
    { id: "p2", name: "PPC Cement", sku: "CEM-001", list_price: 380 },
  ];
  const fallbackOrders = [{ id: "o1", order_number: "ORD-0451", status: "delivered", placed_at: "2026-07-01", total: 507835, items_count: 3 }];
  const fallbackRFQs = [{ id: "r1", rfq_number: "RFQ-001", status: "open", notes: "Steel for Phase 2", due_date: "2026-07-20" }];
  const fallbackProjects = [{ id: "pr1", name: "Skyline Residency", project_code: "SKY-2026", status: "active", budget_amount: 12000000 }];
  const fallbackSuppliers = [{ id: "s1", supplier_code: "Tata Steel", is_verified: true }];

  const products = productsData?.items ?? fallbackProducts;
  const orders = (ordersData ?? fallbackOrders) as typeof fallbackOrders;
  const rfqs = (rfqsData ?? fallbackRFQs) as typeof fallbackRFQs;
  const projects = (projectsData ?? fallbackProjects) as typeof fallbackProjects;
  const suppliers = (suppliersData ?? fallbackSuppliers) as typeof fallbackSuppliers;

  const stats = [
    { label: "Products", value: products.length, icon: Package, link: "/products", delta: 12, color: "#2D1B69", bg: "#F0ECF9" },
    { label: "Suppliers", value: suppliers.length, icon: Users, link: "/suppliers", delta: 5, color: "#7CB518", bg: "#F0F9E8" },
    { label: "Active RFQs", value: rfqs.length, icon: FileText, link: "/rfq", delta: -3, color: "#E91E63", bg: "#FCE4EC" },
    { label: "Orders", value: orders.length, icon: ShoppingCart, link: "/orders", delta: 8, color: "#00BCD4", bg: "#E0F7FA" },
    { label: "Projects", value: projects.length, icon: FolderOpen, link: "/projects", delta: 2, color: "#FF9800", bg: "#FFF3E0" },
  ];

  const statusColors: Record<string, { label: string; color: string; bg: string }> = {
    delivered: { label: "Delivered", color: "#7CB518", bg: "#F0F9E8" },
    in_transit: { label: "In Transit", color: "#00BCD4", bg: "#E0F7FA" },
    confirmed: { label: "Confirmed", color: "#2D1B69", bg: "#F0ECF9" },
    processing: { label: "Processing", color: "#E91E63", bg: "#FCE4EC" },
    placed: { label: "Placed", color: "#9B8CB5", bg: "#F0ECF9" },
    open: { label: "Open", color: "#7CB518", bg: "#F0F9E8" },
    active: { label: "Active", color: "#7CB518", bg: "#F0F9E8" },
    approved: { label: "Verified", color: "#7CB518", bg: "#F0F9E8" },
    pending: { label: "Pending", color: "#FF9800", bg: "#FFF3E0" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1B69] to-[#150726] p-6 text-white">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#7CB518]/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-[#E91E63]/20 blur-2xl" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7CB518] via-[#E91E63] to-[#00BCD4]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-[#7CB518]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7CB518]">Dashboard</span>
          </div>
          <h1 className="text-[22px] font-extrabold">Welcome back!</h1>
          <p className="mt-1 text-[13px] text-white/60">Here&apos;s your procurement overview</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.link}>
              <div className="group rounded-2xl border border-[#DDD6EE] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#2D1B69]/30 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: stat.bg }}>
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-[11px] font-bold ${stat.delta >= 0 ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                    {stat.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.delta >= 0 ? "+" : ""}{stat.delta}%
                  </div>
                </div>
                <p className="text-[22px] font-extrabold text-[#150726]">{stat.value}</p>
                <p className="text-[11px] font-semibold text-[#9B8CB5] mt-0.5">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Orders & RFQs */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0ECF9]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#00BCD4]/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-[#00BCD4]" />
              </div>
              <h2 className="text-[14px] font-bold text-[#150726]">Recent Orders</h2>
            </div>
            <Link href="/orders" className="flex items-center gap-1 text-[12px] font-semibold text-[#2D1B69] hover:text-[#7CB518] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {orders.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="h-8 w-8 text-[#9B8CB5]/30 mx-auto mb-2" />
                <p className="text-[13px] text-[#9B8CB5]">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => {
                  const st = statusColors[order.status] || statusColors.placed;
                  return (
                    <div key={order.id} className="flex items-center justify-between rounded-xl py-2.5 px-3 hover:bg-[#F8F6FC] transition-colors">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#150726] truncate">{order.order_number ?? `#${order.id.slice(0, 8)}`}</div>
                        <div className="text-[11px] text-[#9B8CB5]">
                          {order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent RFQs */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0ECF9]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#E91E63]/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#E91E63]" />
              </div>
              <h2 className="text-[14px] font-bold text-[#150726]">Recent RFQs</h2>
            </div>
            <Link href="/rfq" className="flex items-center gap-1 text-[12px] font-semibold text-[#2D1B69] hover:text-[#7CB518] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {rfqs.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="h-8 w-8 text-[#9B8CB5]/30 mx-auto mb-2" />
                <p className="text-[13px] text-[#9B8CB5]">No RFQs yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rfqs.slice(0, 5).map((rfq) => {
                  const st = statusColors[rfq.status] || statusColors.open;
                  return (
                    <div key={rfq.id} className="flex items-center justify-between rounded-xl py-2.5 px-3 hover:bg-[#F8F6FC] transition-colors">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#150726] truncate">{rfq.rfq_number ?? `#${rfq.id.slice(0, 8)}`}</div>
                        <div className="text-[11px] text-[#9B8CB5]">Due: {rfq.due_date ?? "N/A"}</div>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects & Suppliers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Projects */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0ECF9]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#FF9800]/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-[#FF9800]" />
              </div>
              <h2 className="text-[14px] font-bold text-[#150726]">Projects</h2>
            </div>
            <Link href="/projects" className="flex items-center gap-1 text-[12px] font-semibold text-[#2D1B69] hover:text-[#7CB518] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <FolderOpen className="h-8 w-8 text-[#9B8CB5]/30 mx-auto mb-2" />
                <p className="text-[13px] text-[#9B8CB5]">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 3).map((project) => {
                  const st = statusColors[project.status] || statusColors.active;
                  return (
                    <div key={project.id} className="flex items-center justify-between rounded-xl py-2.5 px-3 hover:bg-[#F8F6FC] transition-colors">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#150726] truncate">{project.name ?? `#${project.id.slice(0, 8)}`}</div>
                        <div className="text-[11px] text-[#9B8CB5]">{project.project_code}</div>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Suppliers */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0ECF9]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#7CB518]/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-[#7CB518]" />
              </div>
              <h2 className="text-[14px] font-bold text-[#150726]">Suppliers</h2>
            </div>
            <Link href="/suppliers" className="flex items-center gap-1 text-[12px] font-semibold text-[#2D1B69] hover:text-[#7CB518] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {suppliers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-[#9B8CB5]/30 mx-auto mb-2" />
                <p className="text-[13px] text-[#9B8CB5]">No suppliers yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suppliers.slice(0, 5).map((supplier) => {
                  const st = statusColors[supplier.is_verified ? "approved" : "pending"] || statusColors.pending;
                  return (
                    <div key={supplier.id} className="flex items-center justify-between rounded-xl py-2.5 px-3 hover:bg-[#F8F6FC] transition-colors">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#150726] truncate">{supplier.supplier_code ?? `#${supplier.id.slice(0, 8)}`}</div>
                        <div className="text-[11px] text-[#9B8CB5]">{supplier.is_verified ? "Verified supplier" : "Pending verification"}</div>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
