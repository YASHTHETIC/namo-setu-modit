"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard, Package, Zap, ShoppingCart, Ticket, Store, ChevronRight,
  Lock, RotateCcw, IndianRupee, FileText, Building2, Warehouse,
  Users, ShieldCheck, Tags, KeyRound,
} from "lucide-react";
import { logAdminActivity } from "@/lib/admin-activity";
import { getAccessToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/use-current-user";
import { env } from "@/lib/env";

type StaffCheck =
  | { kind: "checking" }
  | { kind: "logged-out" }
  | { kind: "staff" }
  | { kind: "claimable" }
  | { kind: "blocked" }
  | { kind: "error"; message: string };

/**
 * Authoritative staff check against the backend. The API is the source of
 * truth — every admin write is permission-gated server-side regardless of
 * what this client gate renders.
 */
function useStaffStatus() {
  const [state, setState] = useState<StaffCheck>({ kind: "checking" });

  const load = useCallback(async (retried = false) => {
    const token = getAccessToken();
    if (!token) {
      setState({ kind: "logged-out" });
      return;
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      let res: Response;
      try {
        res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/staff-status`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 401) {
        // Dead/expired session (tokens live 60 min, no silent refresh yet):
        // drop it so the next login mints a fresh one instead of looping here.
        try { localStorage.removeItem("modit_access_token"); } catch { /* ignore */ }
        setState({ kind: "logged-out" });
        return;
      }
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = (await res.json()) as { is_staff: boolean; staff_exists: boolean };
      if (data.is_staff) setState({ kind: "staff" });
      else if (!data.staff_exists) setState({ kind: "claimable" });
      else setState({ kind: "blocked" });
    } catch (e) {
      if (!retried && e instanceof Error && (e.name === "AbortError" || e.message === "Failed to fetch")) {
        // One automatic retry: transient WiFi/VPN blips must not stick forever.
        await new Promise((r) => setTimeout(r, 2000));
        return load(true);
      }
      const hint = e instanceof Error && e.message === "Failed to fetch"
        ? "Browser could not reach the API server - check connection, VPN or ad-blocker, then Recheck."
        : e instanceof Error ? e.message : "Server unreachable";
      setState({ kind: "error", message: hint });
    }
  }, []);

  const claim = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/claim-staff`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(data?.detail || `Server ${res.status}`);
      }
      logAdminActivity("admin.unlock", "Staff access claimed (first staff)");
      setState({ kind: "staff" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Claim failed";
      setState({ kind: "error", message: msg });
      throw e;
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { state, load, claim };
}

/** One-click staff setup: shows only while this login lacks staff rights. */
function StaffBanner({ gate }: { gate: ReturnType<typeof useStaffStatus> }) {
  const { state, load, claim } = gate;
  const [busy, setBusy] = useState(false);
  if (state.kind === "checking" || state.kind === "staff") return null;

  return (
    <div className="mb-4 rounded-2xl border border-[#2D1B69]/20 bg-white p-4 flex items-center gap-3 flex-wrap">
      <div className="h-10 w-10 rounded-xl bg-[#F0ECF9] flex items-center justify-center shrink-0">
        <KeyRound className="h-5 w-5 text-[#2D1B69]" />
      </div>
      <div className="flex-1 min-w-[200px]">
        {state.kind === "logged-out" && (
          <>
            <p className="text-body-sm font-bold text-[#150726]">Log in to unlock server actions</p>
            <p className="text-micro text-[#6B5B83]">Seed, dispatch and stock edits need a staff login.</p>
          </>
        )}
        {state.kind === "claimable" && (
          <>
            <p className="text-body-sm font-bold text-[#150726]">One tap to become staff</p>
            <p className="text-micro text-[#6B5B83]">No staff exists yet — claim it now, works only once ever.</p>
          </>
        )}
        {state.kind === "blocked" && (
          <>
            <p className="text-body-sm font-bold text-[#150726]">Staff already exists</p>
            <p className="text-micro text-[#6B5B83]">Ask an administrator to grant your account a staff role.</p>
          </>
        )}
        {state.kind === "error" && (
          <>
            <p className="text-body-sm font-bold text-[#150726]">Server check failed</p>
            <p className="text-micro text-[#6B5B83]">{state.message}</p>
          </>
        )}
      </div>
      {state.kind === "logged-out" && (
        <Link href="/auth" className="px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]">
          Log in
        </Link>
      )}
      {state.kind === "claimable" && (
        <button
          onClick={async () => {
            setBusy(true);
            try { await claim(); } finally { setBusy(false); }
          }}
          disabled={busy}
          className="btn-shine px-4 py-2.5 rounded-xl bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] disabled:opacity-50"
        >
          {busy ? "Claiming…" : "Become staff"}
        </button>
      )}
      {(state.kind === "blocked" || state.kind === "error") && (
        <button
          onClick={() => load()}
          className="px-4 py-2.5 rounded-xl border border-[#DDD6EE] text-caption font-bold text-[#2D1B69] hover:border-[#2D1B69]"
        >
          Recheck
        </button>
      )}
    </div>
  );
}

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Pricing", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/sales", label: "Sales & Banners", icon: Zap },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/stores", label: "Stores & Stock", icon: Warehouse },
  { href: "/admin/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { href: "/admin/audit", label: "Activity Log", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Server-side gate mirror: every admin action is a staff login + a backend
  // permission check (products/inventory/deliveries/etc are permission-gated
  // at the API). No PIN wall — a PIN string in public JS is not a gate.
  const gate = useStaffStatus();
  const { isSupplier } = useCurrentUser();
  const { state, load } = gate;
  // A logged-in non-staff whose server says "no": supplier logins go to their
  // own hub, everyone else is a buyer and stays on the login wall below.
  const supplierOnly = isSupplier && state.kind === "blocked";

  useEffect(() => {
    // Blinkit rule: a seller login never lands on the staff surface.
    if (supplierOnly) router.replace("/supplier");
  }, [supplierOnly, router]);

  if (supplierOnly) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <p className="text-body-sm font-bold text-[#9B8CB5]">Opening your supplier hub…</p>
      </div>
    );
  }

  if (state.kind === "checking") {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <p className="text-body-sm font-bold text-[#9B8CB5]">Checking staff access…</p>
      </div>
    );
  }

  // No session / wrong account (buyer or blocked supplier): hard login wall.
  const locked = state.kind === "logged-out" || state.kind === "blocked";
  if (locked) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2D1B69] flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-title-md font-extrabold text-[#150726]">Staff access only</h1>
          <p className="text-caption text-[#9B8CB5] mt-1">
            This panel controls live prices, stock and orders. Log in with a staff account — buyer logins won&apos;t pass.
          </p>
          <button
            onClick={() => load()}
            className="mt-4 w-full h-11 rounded-xl border border-[#DDD6EE] text-caption font-bold text-[#2D1B69] hover:border-[#2D1B69]"
          >
            Recheck access
          </button>
          <Link
            href="/auth?next=%2Fadmin"
            className="mt-2 w-full h-12 rounded-xl bg-[#2D1B69] text-white text-body-md font-bold hover:bg-[#1E1245] flex items-center justify-center"
          >
            Log in as staff
          </Link>
          <Link href="/" className="mt-4 inline-block text-caption font-bold text-[#2D1B69] hover:underline">← Back to store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-2 text-xs text-[#9B8CB5]">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#2D1B69] font-semibold">
            <Store className="h-3.5 w-3.5" /> Back to store
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#150726]">Admin Panel</span>
          <span className="ml-1 rounded-full bg-[#E91E63]/10 px-2 py-0.5 text-tiny font-bold text-[#E91E63]">STAFF ONLY</span>
        </div>

        <StaffBanner gate={gate} />

        <div className="flex flex-col gap-5 lg:flex-row">
          <aside className="lg:w-60 shrink-0">
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-2 lg:sticky lg:top-24">
              <div className="flex lg:flex-col gap-1 overflow-x-auto">
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-body-sm font-bold whitespace-nowrap transition-all ${
                        active
                          ? "bg-[#2D1B69] text-white shadow-md"
                          : "text-[#6B5B83] hover:bg-[#F0ECF9] hover:text-[#2D1B69]"
                      }`}
                    >
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="fx-page flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
