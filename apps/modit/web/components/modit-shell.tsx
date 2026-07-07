"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, Users, FileText, ShoppingCart,
  FolderOpen, BarChart3, Settings, Search, Menu, X, Box,
  CreditCard, Shield, Bell, User,
} from "lucide-react";
import { NotificationCenter } from "@/components/notification-center";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/rfq", label: "RFQ", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Box },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Settings },
];

const userLinks = [
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/payment/history", label: "Payment History", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/admin/users", label: "User Management", icon: Users },
];

export function ModitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isHome = pathname === "/";

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Premium glassmorphism header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
        <div className="container-premium flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-bold text-white shadow-md"
            >
              M
            </motion.div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-[var(--text-primary)] tracking-tight font-display">MODIT</span>
              <span className="block text-[10px] text-[var(--text-muted)] tracking-wide uppercase">Construction Procurement</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('[data-search-input]');
                if (input) input.focus();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <NotificationCenter />
            <Link
              href="/auth"
              className="hidden rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)] transition-colors shadow-sm sm:inline-flex"
            >
              Sign In
            </Link>
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <User className="h-4 w-4" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2 shadow-xl">
                    {userLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border-subtle)] px-4 py-3 lg:hidden"
          >
            <div className="container-premium flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    pathname === item.href
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="container-premium mt-3 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
              {userLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="shrink-0 rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </header>

      {/* Page content */}
      <main className="container-premium py-6">{children}</main>
    </div>
  );
}
