"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, Zap, ShoppingCart, Ticket, Store, ChevronRight,
  Lock, RotateCcw, LogOut, IndianRupee, FileText, Building2, Warehouse,
  Users, ShieldCheck, Tags, KeyRound,
} from "lucide-react";
import { useAdminAuth, getAdminPinHint } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { onlyDigits } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/use-current-user";
import { env } from "@/lib/env";

/** One-click staff setup: shows only while this login lacks staff rights. */
function StaffBanner() {
  const [state, setState] = useState<
    | { kind: "checking" }
    | { kind: "logged-out" }
    | { kind: "staff" }
    | { kind: "claimable" }
    | { kind: "blocked" }
    | { kind: "error"; message: string }
  >({ kind: "checking" });
  const [busy, setBusy] = useState(false);

  const load = async (retried = false) => {
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
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async () => {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
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
      setState({ kind: "error", message: e instanceof Error ? e.message : "Claim failed" });
    } finally {
      setBusy(false);
    }
  };

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
          onClick={claim}
          disabled={busy}
          className="btn-shine px-4 py-2.5 rounded-xl bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] disabled:opacity-50"
        >
          {busy ? "Claiming…" : "Become staff"}
        </button>
      )}
      {(state.kind === "blocked" || state.kind === "error") && (
        <button
          onClick={() => {
            setState({ kind: "checking" });
            load();
          }}
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
  const unlocked = useAdminAuth((s) => s.unlocked);
  const unlock = useAdminAuth((s) => s.unlock);
  const lock = useAdminAuth((s) => s.lock);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  // Real logins bypass the demo PIN wall: staff keep full access, supplier
  // logins are redirected to their own hub below (never the staff surface).
  const { loggedIn, isStaff, isSupplier } = useCurrentUser();
  const authed = loggedIn && (isStaff || isSupplier);
  const supplierOnly = authed && isSupplier && !isStaff;
  const router = useRouter();
  useEffect(() => {
    // Blinkit rule: a seller login never lands on the staff surface.
    if (supplierOnly) router.replace("/supplier");
  }, [supplierOnly, router]);

  if (!unlocked && !authed) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2D1B69] flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-title-md font-extrabold text-[#150726]">Staff access only</h1>
          <p className="text-caption text-[#9B8CB5] mt-1">This panel controls live prices, sales and orders.</p>
          <input
            value={pin}
            onChange={(e) => { setPin(onlyDigits(e.target.value, 8)); setPinError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (unlock(pin)) logAdminActivity("admin.unlock", "Staff unlocked the admin panel");
                else setPinError("Incorrect PIN. Try again.");
              }
            }}
            inputMode="numeric"
            type="password"
            placeholder="Enter staff PIN"
            autoFocus
            className="mt-5 w-full rounded-xl border-2 border-[#DDD6EE] px-4 py-3 text-center text-body-lg font-extrabold tracking-[0.4em] focus:outline-none focus:border-[#2D1B69]"
          />
          {pinError && <p className="mt-2 text-micro font-bold text-red-500">{pinError}</p>}
          <button
            onClick={() => { if (unlock(pin)) logAdminActivity("admin.unlock", "Staff unlocked the admin panel"); else setPinError("Incorrect PIN. Try again."); }}
            className="mt-3 w-full h-12 rounded-xl bg-[#2D1B69] text-white text-body-md font-bold hover:bg-[#1E1245]"
          >
            Unlock panel
          </button>
          <p className="mt-3 text-micro text-[#9B8CB5]">{getAdminPinHint()}</p>
          <Link href="/" className="mt-4 inline-block text-caption font-bold text-[#2D1B69] hover:underline">← Back to store</Link>
        </div>
      </div>
    );
  }

  if (supplierOnly) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4">
        <p className="text-body-sm font-bold text-[#9B8CB5]">Opening your supplier hub…</p>
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
          <button onClick={lock} title="Lock panel" className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-micro font-bold text-[#9B8CB5] hover:text-[#E91E63] hover:bg-[#FCE4EC]">
            <LogOut className="h-3.5 w-3.5" /> Lock
          </button>
        </div>

        <StaffBanner />

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
