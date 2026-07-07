"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, X, User, CreditCard, Shield, Bell, LogOut, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";

import { navItems } from "../lib/namo-data";
import { NotificationCenter } from "./notification-center";

const userLinks = [
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/profile/sessions", label: "Sessions", icon: Shield },
  { href: "/profile/security", label: "Security", icon: Settings },
  { href: "/payment/history", label: "Payments", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const footerLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Support", href: "#" },
];

export function NamoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:rounded-xl focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] glass" role="banner">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group" aria-label="Namo Setu Home">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand shadow-sm shadow-orange-500/20 transition-transform duration-200 group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-display text-[15px] font-normal tracking-tight text-[var(--text-primary)] whitespace-nowrap">Namo Setu</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[var(--text-primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              aria-label="Search temples"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <NotificationCenter />
            <Link
              href="/auth"
              className="hidden items-center gap-2 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:shadow-md hover:shadow-orange-500/30 sm:inline-flex"
            >
              Sign In
            </Link>
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <User className="h-4 w-4" aria-hidden="true" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-1.5 shadow-xl"
                  >
                    {userLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            active
                              ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] lg:hidden transition-all duration-200 hover:bg-[var(--bg-subtle)]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="h-4 w-4" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeMobile} aria-hidden="true" />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] border-l border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
                <span className="font-display text-sm font-semibold text-[var(--text-primary)]">Menu</span>
                <button
                  onClick={closeMobile}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-y-auto px-3 py-3" style={{ height: "calc(100vh - 65px)" }}>
                <div className="space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-[var(--text-primary)] text-white shadow-sm"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="my-4 border-t border-[var(--border-subtle)]" />

                <div className="space-y-0.5">
                  <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Account</p>
                  {userLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobile}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-all duration-200"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="my-4 border-t border-[var(--border-subtle)]" />

                <Link
                  href="/auth"
                  onClick={closeMobile}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:shadow-md"
                >
                  Sign In
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" role="main">
        {children}
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50" role="contentinfo">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--text-muted)]">&copy; 2026 Namo Setu. All rights reserved.</p>
          <nav className="flex items-center gap-4" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
