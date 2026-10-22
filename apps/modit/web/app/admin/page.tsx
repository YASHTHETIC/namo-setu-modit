"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Package, ShoppingCart, Zap, AlertTriangle, ArrowRight, IndianRupee,
  RotateCcw, Plus, Activity, BellRing, Send, Warehouse,
} from "lucide-react";
import { useOrders, useWarehouses, useInventoryAlerts, useServerReturns, useAuditLogs, useProducts, getModitApi } from "@/lib/modit-api";
import { getAccessToken } from "@/lib/auth";
import { useToast } from "@foundation/ui";
import { CountUp, Stagger, FxBackdrop } from "@/components/fx";
import { Reveal } from "@/components/reveal";

const STAGE_LABEL: Record<string, string> = {
  draft: "Draft",
  placed: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STAGES = ["placed", "confirmed", "processing", "dispatched", "in_transit", "delivered"] as const;

const STAGE_DOT: Record<string, string> = {
  placed: "#E91E63",
  confirmed: "#FF9800",
  processing: "#00BCD4",
  dispatched: "#2D1B69",
  in_transit: "#7CB518",
  delivered: "#7CB518",
};

export default function AdminDashboard() {
  const { data: apiOrders, isError: ordersOffline } = useOrders(undefined);
  const { data: serverWarehouses = [] } = useWarehouses();
  const warehousesReady = serverWarehouses.length > 0;
  const { data: alerts = [], isLoading: alertsLoading } = useInventoryAlerts();
  const { data: serverReturns = [] } = useServerReturns();
  const { data: auditPage } = useAuditLogs(1, 50);
  // Single-row probe just to read the live catalog count for the checklist.
  const { data: catalogProbe } = useProducts({ page: 1, page_size: 1 });
  const catalogCount = catalogProbe?.total ?? 0;
  const toast = useToast();
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushStatus, setPushStatus] = useState("");
  const [pushSending, setPushSending] = useState(false);
  const [subCount, setSubCount] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [restocking, setRestocking] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Staff-only endpoint — send the token or the count stays hidden.
    fetch("/api/push/send", { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.subscribers === "number") setSubCount(d.subscribers);
      })
      .catch(() => {});
  }, []);

  const sendAnnouncement = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      setPushStatus("Enter a title and message first.");
      return;
    }
    setPushSending(true);
    setPushStatus("");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken() ?? ""}`,
        },
        body: JSON.stringify({ title: pushTitle.trim(), body: pushBody.trim(), url: "/products" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPushStatus(`Sent to ${data.sent} device(s).`);
        setPushTitle("");
        setPushBody("");
      } else {
        setPushStatus(data.error || "Could not send.");
      }
    } catch {
      setPushStatus("Network error — try again.");
    }
    setPushSending(false);
  };

  const orders = useMemo(() => {
    const list = (apiOrders ?? []) as any[];
    return list;
  }, [apiOrders]);

  const gmv = orders.reduce((s, o) => s + (o.total || 0), 0);
  const aov = orders.length ? Math.round(gmv / orders.length) : 0;

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  const revenue7d = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const total = orders
        .filter((o) => (o.placed_at || "").slice(0, 10) === key)
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label, total });
    }
    return days;
  }, [orders]);
  const maxDay = Math.max(1, ...revenue7d.map((d) => d.total));

  // Server inventory alerts are the real low-stock signal; client stock
  // overrides were removed with the fake-data layer.
  const lowStock = useMemo(
    () =>
      (alerts as any[])
        .slice()
        .sort((a, b) => a.current_stock - b.current_stock)
        .slice(0, 5),
    [alerts]
  );

  const openReturns = useMemo(
    () => (serverReturns as any[]).filter((r) => !["refunded", "rejected"].includes(r.status)),
    [serverReturns]
  );

  // Push stock to the server: find that warehouse's inventory row and patch it.
  const quickRestock = async (alert: any, add: number) => {
    setRestocking(`${alert.product_id}:${alert.warehouse_id}`);
    try {
      const api = getModitApi();
      const rows = await api.listInventory(alert.warehouse_id, alert.product_id);
      if (!rows.length) {
        toast.error("No stock row", "Set up the inventory entry in Stores & Stock first.");
      } else {
        const target = rows[0];
        await api.updateInventory(target.id, {
          quantity_on_hand: (target.quantity_on_hand ?? 0) + add,
        });
        toast.success("Restocked", `${alert.product_name} +${add} at ${alert.warehouse_name}`);
      }
    } catch (e: any) {
      toast.error("Restock failed", e?.message || "Try again in Stores & Stock.");
    }
    setRestocking(null);
  };

  const lowStockCount = alerts.length;
  const stats = [
    { label: "Revenue (GMV)", value: `₹${(gmv / 100000).toFixed(2)}L`, raw: gmv, money: true, sub: `${orders.length} orders · AOV ₹${aov.toLocaleString("en-IN")}`, icon: IndianRupee, color: "#2D1B69", bg: "#F0ECF9" },
    { label: "Low stock", value: lowStockCount, raw: lowStockCount, sub: alertsLoading ? "checking inventory…" : "alerts from store inventory", icon: AlertTriangle, color: "#FF9800", bg: "#FFFBF5", href: "/admin/products", attention: lowStockCount > 0, ring: "ring-2 ring-[#FF9800]/40" },
    { label: "Open returns", value: openReturns.length, raw: openReturns.length, sub: "need action", icon: RotateCcw, color: "#C2185B", bg: "#FCE4EC", href: "/admin/returns", attention: openReturns.length > 0, ring: "ring-2 ring-[#E91E63]/40" },
    { label: "Audit entries", value: auditPage?.total ?? 0, raw: auditPage?.total ?? 0, sub: "server audit trail", icon: Activity, color: "#00BCD4", bg: "#E8F9FC", href: "/admin/audit" },
  ];

  if (subCount !== null) {
    stats.push({ label: "Push devices", value: subCount, raw: subCount, sub: "subscribed to announcements", icon: BellRing, color: "#E91E63", bg: "#FCE4EC", href: "#push" });
  }

  const quickActions = [
    { label: "Add product", href: "/admin/products", icon: Plus },
    { label: "Open store", href: "/admin/stores", icon: Warehouse },
    { label: "Announce", href: "#push", icon: BellRing },
  ];

  const launchSteps = [
    { label: "Add products", sub: catalogCount > 0 ? `${catalogCount.toLocaleString("en-IN")} live in the catalog` : "Create your first catalog item", href: "/admin/products", done: catalogCount > 0 },
    { label: "Open your store", sub: warehousesReady ? "Store is live" : "Pick a location and open", href: "/admin/stores", done: warehousesReady },
    { label: "Place a test order", sub: "COD · fill the pipeline", href: "/products", done: orders.length > 0 },
  ];

  return (
    <div>
      {/* Command-center hero */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, #150726 0%, #2D1B69 60%, #150726 100%)" }}>
        <FxBackdrop tone="dark" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="fx-glow-dot h-2.5 w-2.5 rounded-full bg-[#7CB518]" />
                <p className="text-micro font-black uppercase tracking-[0.2em] text-[#7CB518]">Live · Command Center</p>
              </div>
              <h1 className="mt-1 text-title-lg font-extrabold text-white">Dashboard</h1>
              <p className="text-caption text-white/50 tabular-nums">
                {new Date(now).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                {" · "}
                {new Date(now).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" })} IST
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((a) => {
                const ActionIcon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="btn-shine flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-caption font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <ActionIcon className="h-3.5 w-3.5 text-[#7CB518]" />
                    {a.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p className="text-micro text-[#6B5B83] mt-2">        All numbers come from real orders, catalog and admin activity.
        {ordersOffline && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FF9800]/15 border border-[#FF9800]/30 px-2 py-0.5 text-tiny font-bold text-[#B26A00]">
            Offline - showing demo data, check connection
          </span>
        )}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stagger step={60} className="h-full">
        {stats.map((c: any) => {
          const inner = (
            <div className={`card-lift rounded-2xl border border-[#DDD6EE] bg-white p-4 h-full ${c.ring ?? ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-micro font-bold text-[#6B5B83] uppercase tracking-wide">{c.label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                  <c.icon className="h-4 w-4" style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-display font-extrabold text-[#150726] mt-1 tabular-nums">
                {c.money ? (
                  <CountUp value={c.raw} format={(n) => `₹${(n / 100000).toFixed(2)}L`} />
                ) : (
                  <CountUp value={c.raw} />
                )}
              </p>
              <p className="text-micro text-[#6B5B83]">{c.sub}</p>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
        </Stagger>
      </div>

      {/* Launch checklist — hides once real orders flow */}
      {orders.length === 0 && (
        <Reveal>
          <div className="mt-4 rounded-2xl border border-[#7CB518]/30 bg-white p-5">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7CB518]" /> Get launch-ready
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {launchSteps.map((s, i) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-xl border border-[#DDD6EE] px-3 py-2.5 hover:border-[#7CB518] transition-colors"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-black ${s.done ? "bg-[#7CB518] text-white" : "bg-[#F0ECF9] text-[#2D1B69]"}`}>
                  {s.done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-caption font-bold text-[#150726]">{s.label}</span>
                  <span className="block text-micro text-[#6B5B83] truncate">{s.sub}</span>
                </span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-[#9B8CB5]" />
              </Link>
            ))}
          </div>
        </div>
        </Reveal>
      )}

      {/* Ops pipeline */}
      <Reveal>
        <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#2D1B69]" /> Order pipeline
          </h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-caption font-bold text-[#2D1B69] hover:underline">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {STAGES.map((st) => (
            <Link key={st} href="/admin/orders" className="card-lift rounded-xl bg-[#F7F4FC] border border-[#F0ECF9] px-2 py-2.5 text-center">
              <span
                className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full"
                style={{ background: STAGE_DOT[st] ?? "#9B8CB5" }}
              />
              <p className="text-title-lg font-extrabold text-[#2D1B69] tabular-nums"><CountUp value={pipeline[st] ?? 0} /></p>
              <p className="text-tiny font-bold text-[#6B5B83] uppercase">{STAGE_LABEL[st]}</p>
            </Link>
          ))}
        </div>
        </div>
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <Reveal>
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h2 className="text-body-md font-bold text-[#150726]">Revenue — last 7 days</h2>
          <div className="mt-4 flex items-end gap-2 h-36">
            {revenue7d.map((d, i) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-tiny font-bold text-[#6B5B83]">{d.total > 0 ? `₹${(d.total / 1000).toFixed(0)}k` : ""}</span>
                <div
                  className="fx-bar-grow w-full rounded-t-lg"
                  style={{
                    height: `${Math.max(4, (d.total / maxDay) * 100)}%`,
                    background: d.total > 0 ? "linear-gradient(180deg, #7CB518, #5a8010)" : "#F0ECF9",
                    animationDelay: `${Math.min(i * 80, 480)}ms`,
                  }}
                />
                <span className="text-tiny font-bold text-[#9B8CB5]">{d.label}</span>
              </div>
            ))}
          </div>
          </div>
        </Reveal>

        {/* Needs attention */}
        <Reveal delay={100}>
          <div className="rounded-2xl border border-[#E91E63]/20 bg-white p-5 h-full">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#E91E63]" /> Needs attention
          </h2>
          <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto">
            {openReturns.slice(0, 3).map((r) => (
              <Link key={r.id} href="/admin/returns" className="flex items-center justify-between rounded-xl bg-[#FCE4EC] px-3 py-2.5 hover:bg-[#F8BBD0]/40">
                <span className="text-caption font-bold text-[#150726]">{r.return_number ?? r.id} · {r.reason || "Return requested"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#E91E63]" />
              </Link>
            ))}
            {lowStock.map((a) => (
              <div key={`${a.product_id}:${a.warehouse_id}`} className="flex items-center justify-between rounded-xl bg-[#FFFBF5] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-caption font-bold text-[#150726] truncate max-w-[220px]">{a.product_name}</p>
                  <p className="text-tiny text-[#9B8CB5]">{a.current_stock} units · {a.warehouse_name}</p>
                </div>
                <div className="flex gap-1.5">
                  {[50, 100].map((q) => (
                    <button
                      key={q}
                      onClick={() => void quickRestock(a, q)}
                      disabled={restocking === `${a.product_id}:${a.warehouse_id}`}
                      className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white border border-[#FF9800]/30 text-tiny font-bold text-[#FF9800] hover:bg-[#FF9800] hover:text-white disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />{q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!alertsLoading && openReturns.length === 0 && lowStock.length === 0 && (
              <p className="text-caption text-[#7CB518] font-bold text-center py-4">All clear — nothing needs action 🎉</p>
            )}
          </div>
          </div>
        </Reveal>
      </div>

      {/* Push announcements */}
      <Reveal>
        <div id="push" className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[#E91E63]" /> Push announcement
          </h2>
          <span className="text-micro font-bold text-[#9B8CB5]">
            {subCount === null ? "checking devices..." : `${subCount} device(s) subscribed`}
          </span>
        </div>
        <p className="text-micro text-[#9B8CB5] mt-1">Reaches buyers even with the app closed — like Zepto sale alerts.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            placeholder="Title e.g. Diwali Sale is LIVE"
            maxLength={80}
            className="px-3 py-2.5 rounded-xl border border-[#DDD6EE] text-body-sm font-semibold focus:outline-none focus:border-[#E91E63]"
          />
          <input
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            placeholder="Message e.g. Up to 20% off cement till Sunday"
            maxLength={200}
            className="px-3 py-2.5 rounded-xl border border-[#DDD6EE] text-body-sm focus:outline-none focus:border-[#E91E63]"
          />
          <button
            onClick={sendAnnouncement}
            disabled={pushSending}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E91E63] text-white text-caption font-bold hover:bg-[#C2185B] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {pushSending ? "Sending..." : "Send"}
          </button>
        </div>
        {pushStatus && <p className="mt-2 text-micro font-bold text-[#2D1B69]">{pushStatus}</p>}
        </div>
      </Reveal>

      {/* Recent activity — straight from the server audit trail */}
      {auditPage && auditPage.logs.length > 0 && (
        <Reveal>
          <div className="mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-body-md font-bold text-[#150726] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#00BCD4]" /> Recent staff activity
            </h2>
            <Link href="/admin/audit" className="flex items-center gap-1 text-caption font-bold text-[#2D1B69] hover:underline">
              Full log <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-[#F0ECF9]">
            {auditPage.logs.slice(0, 5).map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between gap-3">
                <p className="text-caption font-semibold text-[#150726] truncate">{a.action} · {a.entity_type} {a.entity_id}</p>
                <span className="text-tiny text-[#9B8CB5] whitespace-nowrap tabular-nums">
                  {new Date(a.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
