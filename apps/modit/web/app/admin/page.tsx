"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/auth";
import { Package, Users, FolderOpen, Activity, ExternalLink, BarChart3, ShoppingCart, FileText } from "lucide-react";
import { Card, CardHeader, CardContent, LoadingSpinner } from "@/lib/modit-ui";

interface HealthResponse { status?: string; [key: string]: unknown; }

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const adminLinks = [
  { href: "/products", label: "Product Management", desc: "Manage product catalog and approvals", icon: Package, color: "bg-blue-100 text-blue-600" },
  { href: "/suppliers", label: "Supplier Management", desc: "Verify and manage suppliers", icon: Users, color: "bg-emerald-100 text-emerald-600" },
  { href: "/projects", label: "Project Management", desc: "Manage construction projects", icon: FolderOpen, color: "bg-purple-100 text-purple-600" },
  { href: "/analytics", label: "Analytics", desc: "View reports and insights", icon: BarChart3, color: "bg-amber-100 text-amber-600" },
  { href: "/orders", label: "Orders", desc: "Track and manage orders", icon: ShoppingCart, color: "bg-rose-100 text-rose-600" },
  { href: "/rfq", label: "RFQ Management", desc: "Manage requests for quotation", icon: FileText, color: "bg-indigo-100 text-indigo-600" },
];

export default function AdminPage() {
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const client = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_BASE_URL, accessToken: getAccessToken() });
      const res = await client.request("/api/v1/healthz", { method: "GET" });
      return res as HealthResponse;
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-[var(--text-primary)]">Admin Panel</h1>
        <p className="text-[var(--text-secondary)]">System administration and management</p>
      </div>

      {/* Health Check */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[var(--text-secondary)]" />
            <h2 className="text-h4 text-[var(--text-primary)]">System Health</h2>
          </div>
          {healthLoading ? (
            <div className="mt-3 h-6 w-32 animate-pulse rounded-lg bg-[var(--bg-subtle)]" />
          ) : healthData ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500" />
              <span className="text-sm text-[var(--text-secondary)]">Backend is running</span>
              <span className="text-xs text-[var(--text-muted)]">
                {healthData.status === "healthy" ? "All systems operational" : healthData.status ?? "Running"}
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500" />
              <span className="text-sm text-[var(--text-secondary)]">Backend unreachable</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Links */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <motion.div key={link.href} variants={fadeUp}>
              <Link href={link.href}>
                <Card className="p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{link.label}</h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{link.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}

        <motion.div variants={fadeUp}>
          <a href="/api/v1/docs" target="_blank" rel="noopener noreferrer">
            <Card className="p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">API Documentation</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Swagger/OpenAPI docs</p>
                </div>
              </div>
            </Card>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
