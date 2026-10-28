"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrder, useOrderDelivery, useUpdateOrderStatus } from "@/lib/modit-api";
import { useCartStore } from "@/lib/cart-store";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/hybrid-api";
import { getProductById, getProductBySku } from "@/lib/product-data";
import { resolveReorderProduct, reorderQuantity } from "@/lib/order-reorder";
import { downloadInvoiceHtml, type InvoiceItem } from "@/lib/invoice";
import { ReturnModal } from "@/components/return-modal";
import { useReturnStore, RETURN_STATUS_LABEL, refundAmount } from "@/lib/return-store";
import { useToast } from "@foundation/ui";
import {
  ArrowLeft, ArrowRight, Package, Truck, CheckCircle2, Clock, MapPin, CreditCard, FileText, Download, RotateCcw, Phone, AlertCircle, Calendar, MessageCircle,
  Star, Navigation, RefreshCcw, Check, XCircle
} from "lucide-react";

// Statuses where a delivery row may exist on the server (created by the
// admin's "Dispatch + delivery"). Used to skip the delivery fetch earlier.
const DISPATCHED_STATUSES = new Set(["dispatched", "in_transit", "out_for_delivery", "delivered"]);

interface OrderItem {
  productId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCode: string;
  gstRate: number;
  brand: string | null;
  total: number;
}

interface OrderDetail {
  id: string;
  status: string;
  placedAt: string;
  expectedDelivery: string;
  deliveredAt?: string;
  address: { name: string; phone: string; line1: string; city: string; state: string; pincode: string };
  payment: { method: string; status: string; transactionId?: string };
  items: OrderItem[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  invoiceNumber: string;
  specialInstructions?: string;
}

const demoOrders: Record<string, OrderDetail> = {
  "ORD-2026-08001": {
    id: "ORD-2026-08001", status: "delivered", placedAt: "2026-07-28T10:30:00Z", expectedDelivery: "2026-08-02T14:00:00Z", deliveredAt: "2026-08-01T11:45:00Z",
    address: { name: "Rajesh Kumar", phone: "+91 98765 43210", line1: "42, MG Road, Near Metro Station", city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    payment: { method: "UPI — Google Pay", status: "paid", transactionId: "TXN-2026-0728-001" },
    items: [
      { name: "TMT Steel Bars Fe-500D 12mm", sku: "STL-TMT-500D-12", quantity: 5, unitPrice: 62000, unitCode: "MT", gstRate: 18, brand: "Tata Tiscon", total: 310000 },
      { name: "Portland Pozzolana Cement PPC 53 Grade", sku: "CEM-PPC-53-50KG", quantity: 200, unitPrice: 380, unitCode: "BAG", gstRate: 28, brand: "UltraTech Cement", total: 76000 },
      { name: "Red Clay Bricks First Class (9x4x3 inch)", sku: "BRK-RED-FC-943", quantity: 5000, unitPrice: 8.5, unitCode: "PCS", gstRate: 5, brand: null, total: 42500 },
    ],
    subtotal: 428500, gst: 79335, shipping: 0, total: 507835, invoiceNumber: "INV-2026-08001",
  },
  "ORD-2026-08002": {
    id: "ORD-2026-08002", status: "in_transit", placedAt: "2026-08-03T09:15:00Z", expectedDelivery: "2026-08-07T14:00:00Z",
    address: { name: "Rajesh Kumar", phone: "+91 98765 43210", line1: "Construction Site B, Sector 15", city: "Mumbai", state: "Maharashtra", pincode: "400065" },
    payment: { method: "Credit Terms — 30 days", status: "pending" },
    items: [
      { name: "MS Pipes ERW 2 inch (50mm) x 6m", sku: "PIP-MS-ERW-2x6", quantity: 100, unitPrice: 1250, unitCode: "PCS", gstRate: 18, brand: "Surya Roshni", total: 125000 },
      { name: "River Sand M-Sand Alternative 0-20mm", sku: "SND-RVR-20MM", quantity: 10, unitPrice: 2800, unitCode: "MT", gstRate: 5, brand: null, total: 28000 },
    ],
    subtotal: 153000, gst: 23950, shipping: 1500, total: 178450, invoiceNumber: "INV-2026-08002",
    specialInstructions: "Deliver to Site B gate, ask for Site Manager",
  },
  "ORD-2026-08003": {
    id: "ORD-2026-08003", status: "confirmed", placedAt: "2026-08-05T14:00:00Z", expectedDelivery: "2026-08-10T14:00:00Z",
    address: { name: "Rajesh Kumar", phone: "+91 98765 43210", line1: "42, MG Road, Near Metro Station", city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    payment: { method: "Card — Visa ending 4532", status: "paid", transactionId: "TXN-2026-0805-003" },
    items: [
      { name: "White Marble Tiles 2x2 ft (Polished)", sku: "TLS-MRB-2x2-POL", quantity: 200, unitPrice: 85, unitCode: "SQFT", gstRate: 18, brand: "Kajaria Ceramics", total: 17000 },
    ],
    subtotal: 17000, gst: 3060, shipping: 1500, total: 21560, invoiceNumber: "INV-2026-08003",
  },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Package; dot: string }> = {
  placed: { label: "Placed", color: "text-[#2D1B69]", bg: "bg-[#F0ECF9]", border: "border-[#2D1B69]/20", icon: FileText, dot: "bg-[#2D1B69]" },
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#F0ECF9]", border: "border-[#2D1B69]/20", icon: CheckCircle2, dot: "bg-[#2D1B69]" },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#FCE4EC]", border: "border-[#E91E63]/20", icon: Clock, dot: "bg-[#E91E63]" },
  dispatched: { label: "Dispatched", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Package, dot: "bg-[#00BCD4]" },
  in_transit: { label: "In Transit", color: "text-[#00BCD4]", bg: "bg-[#E8F9FC]", border: "border-[#00BCD4]/20", icon: Truck, dot: "bg-[#00BCD4]" },
  delivered: { label: "Delivered", color: "text-[#7CB518]", bg: "bg-[#F0F9E8]", border: "border-[#7CB518]/20", icon: CheckCircle2, dot: "bg-[#7CB518]" },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, dot: "bg-red-400" },
};

const timelineSteps = [
  { key: "placed", label: "Placed", icon: FileText },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "dispatched", label: "Dispatched", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

/**
 * Normalize a raw API order (OrderDetailRead: snake_case, ids only) into the
 * OrderDetail shape this page renders. Prices/totals come from the server;
 * only display labels (unit/brand) are enriched from the local catalog.
 * Unknown/missing pieces degrade to blanks — never invented money.
 */
function toOrderDetail(api: any): OrderDetail | null {
  if (!api || typeof api !== "object" || !api.id) return null;
  const addr = (api.address ?? {}) as Record<string, any>;
  // Server PaymentStatus values: captured/authorized mean money is reserved.
  // "paid" stays accepted for demo/local records.
  const ps = String(api.payment_status ?? "pending").toLowerCase();
  const paid = ps === "paid" || ps === "captured" || ps === "authorized";
  const items = Array.isArray(api.items) ? api.items : [];
  return {
    id: String(api.order_number || api.id),
    status: String(api.status || "placed"),
    placedAt: String(api.placed_at || new Date().toISOString()),
    expectedDelivery: String(api.expected_delivery || ""),
    address: {
      name: String(addr.name || "Customer"),
      phone: String(addr.phone || ""),
      line1: String(addr.line1 || addr.address || ""),
      city: String(addr.city || ""),
      state: String(addr.state || ""),
      pincode: String(addr.pincode || ""),
    },
    payment: {
      method: paid ? "Online payment" : "Pay on delivery",
      status: paid ? "paid" : "pending",
      transactionId: api.payment_reference ? String(api.payment_reference) : undefined,
    },
    items: items.map((it: any) => {
      // API order items carry a DB-UUID product_id that the static catalog
      // (slug-keyed) can't resolve; the SKU is stable across both, so look
      // it up by SKU first and only then fall back to the id.
      const p =
        (it?.sku ? getProductBySku(String(it.sku)) : undefined) ??
        (it?.product_id ? getProductById(String(it.product_id)) : undefined);
      const qty = Number(it?.quantity ?? 0);
      const unitPrice = Number(it?.unit_price ?? 0);
      return {
        productId: it?.product_id ? String(it.product_id) : undefined,
        name: String(it?.name || p?.name || "Item"),
        sku: String(it?.sku || p?.sku || ""),
        quantity: qty,
        unitPrice,
        unitCode: String(p?.unitCode || ""),
        gstRate: Number(p?.gstRate ?? 0),
        brand: p?.brand ?? null,
        total: Number(it?.line_total ?? unitPrice * qty),
      };
    }),
    subtotal: Number(api.subtotal ?? 0),
    gst: Number(api.gst_total ?? api.gst ?? 0),
    shipping: Number(api.shipping_total ?? api.shipping ?? 0),
    total: Number(api.grand_total ?? api.total ?? 0),
    invoiceNumber: `${String(api.order_number || api.id)}-INV`,
    specialInstructions: typeof api.notes === "string" && api.notes ? api.notes : undefined,
  };
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: apiOrder, isLoading, refetch: refetchOrder, dataUpdatedAt } = useOrder(id, demoOrders[id] ?? null);
  // Real delivery for the Track button. Delivery rows only exist once the
  // order is dispatched, so asking earlier is a guaranteed 404 (console
  // noise) — gate on the loaded order's status.
  const orderStatus = String((apiOrder as { status?: string } | null)?.status ?? "");
  const { data: liveDelivery } = useOrderDelivery(id, DISPATCHED_STATUSES.has(orderStatus));
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [cancelArmed, setCancelArmed] = useState(false);
  const [payAttempt, setPayAttempt] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const toast = useToast();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  // One-tap reorder: real catalog products only (same honesty rule as the list).
  // Server lines carry a DB UUID in product_id that never matches static ids —
  // resolveReorderProduct falls back to the shared SKU.
  const handleReorderAll = () => {
    const lines = (order?.items ?? []) as Array<{ productId?: string; sku?: string; quantity?: number }>;
    let added = 0;
    lines.forEach((line) => {
      const p = resolveReorderProduct(line);
      if (p) {
        addItem(p, reorderQuantity(line));
        added += 1;
      }
    });
    if (added === 0) {
      toast.error("Reorder failed", "Those products are no longer available.");
      return;
    }
    if (added < lines.length) {
      toast.warning("Partial reorder", `${added} of ${lines.length} items were still available.`);
    } else {
      toast.success("Added to cart", `${added} item${added === 1 ? "" : "s"} from this order.`);
    }
    setTimeout(() => router.push("/cart"), 600);
  };
  const existingReturn = useReturnStore((s) => s.getReturnForOrder(id));

  const order = useMemo(() => {
    // Demo showcase ids keep their built-in data; every real server order
    // goes through the normalizer (raw API shape cannot render directly).
    if (demoOrders[id]) return demoOrders[id];
    return apiOrder ? toOrderDetail(apiOrder as unknown as Record<string, unknown>) : null;
  }, [apiOrder, id]);

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    return timelineSteps.findIndex((s) => s.key === order.status);
  }, [order]);

  const handleDownloadInvoice = () => {
    if (!order) return;
    downloadInvoiceHtml({
      invoiceNumber: order.invoiceNumber || `${order.id}-INV`,
      orderId: order.id,
      date: formatDate(order.placedAt),
      gstin: (order as any).gstin || "",
      buyerName: order.address.name,
      buyerAddress: `${order.address.line1}, ${order.address.city}, ${order.address.state}`,
      buyerPincode: order.address.pincode,
      items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unit: i.unitCode,
        price: i.unitPrice,
        gstRate: i.gstRate,
      })) as InvoiceItem[],
      subtotal: order.subtotal,
      gst: order.gst,
      shipping: order.shipping,
      total: order.total,
    });
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatDateTime = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Buyer cancel: real server orders only, while still placed/confirmed.
  // First tap arms, second tap confirms. Stock goes back automatically.
  const handleCancel = () => {
    if (!cancelArmed) {
      setCancelArmed(true);
      return;
    }
    updateStatus.mutate(
      { orderId: id, status: "cancelled" },
      {
        onSuccess: () => {
          toast.success("Order cancelled", "Stock released back to the warehouse.");
          setCancelArmed(false);
          refetchOrder();
        },
        onError: (e: unknown) => {
          toast.error("Cancel failed", e instanceof Error ? e.message : "Try again or contact support.");
          setCancelArmed(false);
        },
      }
    );
  };

  // Failed/abandoned online payments complete straight from this page: the
  // widget re-opens against the same server order (amount is server-side).
  const handleCompletePayment = async () => {
    if (!apiOrder || payAttempt) return;
    setPayAttempt(true);
    try {
      const rzp = await createRazorpayOrder(String((apiOrder as { id: string }).id));
      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error("Gateway not ready", "Refresh this page once and try again.");
        setPayAttempt(false);
        return;
      }
      const rzpInstance = new window.Razorpay({
        key: rzp.key_id,
        amount: rzp.amount_paise,
        currency: rzp.currency,
        name: "MODIT",
        description: `Order ${order?.id ?? ""}`,
        order_id: rzp.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verification = await verifyRazorpayPayment({
              orderId: id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (!verification.verified) throw new Error("verification failed");
            toast.success("Payment successful!", "This order is fully paid.");
            refetchOrder();
          } catch {
            toast.error("Verification failed", "If money was debited it will auto-refund. Try again here.");
          } finally {
            setPayAttempt(false);
          }
        },
        modal: { ondismiss: () => setPayAttempt(false) },
        theme: { color: "#2D1B69" },
      });
      rzpInstance.on("payment.failed", () => {
        toast.error("Payment failed", "Nothing was charged — tap Complete payment to retry.");
        setPayAttempt(false);
      });
      rzpInstance.open();
    } catch (err) {
      toast.error("Payment setup failed", err instanceof Error ? err.message : "Try again shortly.");
      setPayAttempt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
          <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-5 w-5 bg-white/20 rounded" />
              <div className="h-5 w-32 bg-white/20 rounded" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[800px] px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#DDD6EE] bg-white p-5 animate-pulse">
              <div className="space-y-3"><div className="h-4 w-48 bg-[#F0ECF9] rounded" /><div className="h-3 w-32 bg-[#F0ECF9] rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
          <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
            <Link href="/orders" className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" /> Back to orders
            </Link>
          </div>
        </div>
        <div className="py-20 text-center px-4">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center">
            <Package className="h-10 w-10 text-[#2D1B69]" />
          </div>
          <h2 className="text-title-md font-bold text-[#150726]">Order Not Found</h2>
          <p className="mt-2 text-body-sm text-[#9B8CB5] max-w-xs mx-auto">This order does not exist or you do not have access.</p>
          <Link href="/orders"
            className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#7CB518] text-white text-body-md font-bold hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/25">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const st = statusConfig[order.status] ?? statusConfig.confirmed;
  const StatusIcon = st.icon;

  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      {/* Gradient header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,188,212,0.4), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/orders" aria-label="Back to orders" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-body-lg font-extrabold text-white">{order.id}</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-micro font-bold border ${st.bg} ${st.color} ${st.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>

          {/* Mini timeline */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              {timelineSteps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                        isActive ? "bg-[#7CB518] text-white shadow-lg" : "bg-white/10 text-white/30"
                      } ${isCurrent ? "ring-4 ring-[#7CB518]/30 scale-110" : ""}`}>
                        <step.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`mt-1 text-tiny font-bold text-center ${isActive ? "text-white" : "text-white/30"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`mx-0.5 h-0.5 flex-1 ${i < currentStepIndex ? "bg-[#7CB518]" : "bg-white/10"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-4 space-y-4 sm:px-6">
        {/* Live Tracking Bar — for active orders */}
        {["in_transit", "dispatched"].includes(order.status) && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)" }}>
            <div className="p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 animate-pulse" />
                  <span className="text-body-sm font-bold">Live Tracking</span>
                  <span className="text-tiny text-white/60">· auto-updates every 30s</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-md font-bold">
                      {liveDelivery ? `Delivery ${liveDelivery.delivery_number}` : "Awaiting dispatch"}
                    </p>
                    <p className="text-micro text-white/70 mt-0.5">
                      {liveDelivery
                        ? `Status: ${liveDelivery.status.replace(/_/g, " ")}`
                        : "Tracking activates once the order is dispatched."}
                    </p>
                  </div>
                  <button onClick={() => { setRefreshing(true); refetchOrder().finally(() => setRefreshing(false)); }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title="Refresh status">
                    <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
                {liveDelivery && (
                  <Link
                    href={`/track/${liveDelivery.id}`}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-body-sm font-extrabold text-[#0097A7] transition-all hover:bg-white/90 active:scale-[0.99]"
                  >
                    Open live map <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {/* Simulated map placeholder */}
                <div className="mt-3 h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)" }} />
                  <div className="relative flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                    <div className="w-16 h-0.5 bg-white/30" />
                    <div className="h-6 w-6 rounded-full bg-[#7CB518] flex items-center justify-center">
                      <Truck className="h-3 w-3 text-white" />
                    </div>
                    <div className="w-16 h-0.5 bg-white/30" />
                    <div className="h-3 w-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Rating — for delivered orders */}
        {order.status === "delivered" && !rated && (
          <div className="rounded-2xl border border-[#7CB518]/20 bg-[#F0F9E8] p-5">
            <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-[#FF9800]" /> Rate your delivery experience
            </h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="transition-all hover:scale-110">
                  <Star className={`h-8 w-8 ${s <= rating ? "fill-[#FF9800] text-[#FF9800]" : "text-[#DDD6EE]"}`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button onClick={() => setRated(true)} className="px-5 py-2 rounded-lg bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] transition-all">
                Submit Rating
              </button>
            )}
          </div>
        )}
        {rated && (
          <div className="rounded-2xl border border-[#7CB518]/20 bg-[#F0F9E8] p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#7CB518] flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-body-sm font-semibold text-[#7CB518]">Thanks for rating!</span>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#F7F4FC]">
            <h3 className="text-body-sm font-bold text-[#150726] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#2D1B69]" />
              Items ({order.items.length})
            </h3>
          </div>
          <div className="divide-y divide-[#F0ECF9]">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 p-4 hover:bg-[#F7F4FC] transition-colors">
                <div className="h-12 w-12 rounded-xl bg-[#F0ECF9] flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-[#2D1B69]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.brand && <p className="text-tiny font-bold text-[#7CB518] uppercase tracking-wide">{item.brand}</p>}
                  <p className="text-body-sm font-semibold text-[#150726] truncate">{item.name}</p>
                  <p className="text-micro text-[#9B8CB5] mt-0.5">{item.quantity} {item.unitCode} × ₹{item.unitPrice.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-body-md font-extrabold text-[#150726]">₹{item.total.toLocaleString("en-IN")}</p>
                  <p className="text-tiny text-[#9B8CB5] mt-0.5">+ {item.gstRate}% GST</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#F7F4FC]">
            <h3 className="text-body-sm font-bold text-[#150726] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#2D1B69]" />
              Payment Summary
            </h3>
          </div>
          <div className="p-5 space-y-2.5">
            <div className="flex justify-between text-caption"><span className="text-[#9B8CB5]">Subtotal</span><span className="text-[#150726] font-medium">₹{order.subtotal.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-caption"><span className="text-[#9B8CB5]">GST</span><span className="text-[#150726] font-medium">₹{order.gst.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-caption">
              <span className="text-[#9B8CB5]">Delivery</span>
              <span className={order.shipping === 0 ? "text-[#7CB518] font-bold" : "text-[#150726] font-medium"}>
                {order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="border-t border-[#DDD6EE] pt-2.5 flex justify-between">
              <span className="text-body-md font-bold text-[#150726]">Total</span>
              <span className="text-title-md font-extrabold text-[#2D1B69]">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mx-5 mb-5 p-3.5 rounded-xl bg-[#F8F6FC] border border-[#F0ECF9]">
            <div className="flex items-center gap-2 text-caption text-[#6B5B83]">
              <CreditCard className="h-3.5 w-3.5 text-[#2D1B69]" /> {order.payment.method}
            </div>
            <div className="flex items-center gap-2 text-micro mt-1.5">
              <span className={`inline-flex items-center gap-1 font-bold ${order.payment.status === "paid" ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${order.payment.status === "paid" ? "bg-[#7CB518]" : "bg-[#E91E63]"}`} />
                {order.payment.status === "paid" ? "Paid" : "Pending"}
              </span>
              {order.payment.transactionId && <span className="text-[#9B8CB5]">· {order.payment.transactionId}</span>}
            </div>
          </div>
          {(apiOrder as unknown as Record<string, unknown>)?.paid_via === "razorpay" && order.payment.status !== "paid" && order.status !== "cancelled" && (
            <button
              onClick={handleCompletePayment}
              disabled={payAttempt}
              className="mx-5 mb-5 h-11 rounded-xl bg-[#2D1B69] text-caption font-bold text-white hover:bg-[#1E1245] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${payAttempt ? "animate-spin" : ""}`} /> Complete payment
            </button>
          )}
        </div>

        {/* Delivery Address */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#F7F4FC]">
            <h3 className="text-body-sm font-bold text-[#150726] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2D1B69]" />
              Delivery Address
            </h3>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F0ECF9] flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-[#2D1B69]" />
              </div>
              <div className="text-caption">
                <p className="font-bold text-[#150726]">{order.address.name}</p>
                <p className="text-[#6B5B83]">{order.address.phone}</p>
                <p className="text-[#9B8CB5] mt-0.5">{order.address.line1}</p>
                <p className="text-[#9B8CB5]">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Date */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F0F9E8] flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-[#7CB518]" />
            </div>
          <div>
            <p className="text-micro text-[#9B8CB5]">
              {order.deliveredAt ? "Delivered on" : order.expectedDelivery && !isNaN(new Date(order.expectedDelivery).getTime()) ? "Expected by" : "Dispatch schedule"}
            </p>
            <p className="text-body-md font-bold text-[#150726]">
              {order.deliveredAt
                ? formatDateTime(order.deliveredAt)
                : order.expectedDelivery && !isNaN(new Date(order.expectedDelivery).getTime())
                  ? formatDate(order.expectedDelivery)
                  : "Pending"}
            </p>
          </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="rounded-2xl border border-[#E91E63]/20 bg-[#FCE4EC] overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-[#E91E63] mt-0.5" />
              <div>
                <p className="text-micro font-bold text-[#E91E63] uppercase tracking-wide">Special Instructions</p>
                <p className="text-caption text-[#6B5B83] mt-1">{order.specialInstructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Return status */}
        {existingReturn && (
          <div className="rounded-2xl border border-[#E91E63]/20 bg-[#FCE4EC] overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-micro font-bold text-[#E91E63] uppercase tracking-wide flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Return {existingReturn.id}
                </p>
                <span className="text-micro font-bold text-[#C2185B] bg-white rounded-full px-2.5 py-1">{RETURN_STATUS_LABEL[existingReturn.status]}</span>
              </div>
              <p className="text-caption text-[#6B5B83] mt-2">
                {existingReturn.items.length} item{existingReturn.items.length !== 1 ? "s" : ""} · {existingReturn.reason} · Est. refund ₹{refundAmount(existingReturn).toLocaleString("en-IN")}
              </p>
              <div className="mt-3 space-y-1.5">
                {existingReturn.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-micro">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E91E63] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[#150726]">{RETURN_STATUS_LABEL[h.status]}</span>
                      <span className="text-[#9B8CB5]"> — {new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <p className="text-[#6B5B83]">{h.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <button onClick={handleReorderAll} className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-sm font-bold hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2">
          <RotateCcw className="h-4 w-4" /> Reorder all items
        </button>
        <div className="flex gap-3 pb-4">
          <button onClick={handleDownloadInvoice} className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-body-sm font-bold text-[#150726] hover:border-[#7CB518] hover:bg-[#F0F9E8] transition-all flex items-center justify-center gap-2">
            <Download className="h-4 w-4 text-[#2D1B69]" /> GST Invoice
          </button>
          {order.status === "delivered" && !existingReturn && (
            <button onClick={() => setReturnOpen(true)} className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-body-sm font-bold text-[#150726] hover:border-[#E91E63] hover:bg-[#FCE4EC] transition-all flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#E91E63]" /> Return
            </button>
          )}
          {Boolean(apiOrder) && (order.status === "placed" || order.status === "confirmed") && (
            <button
              onClick={handleCancel}
              disabled={updateStatus.isPending}
              className={`flex-1 h-12 rounded-xl border-2 text-body-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                cancelArmed
                  ? "border-[#E91E63] bg-[#E91E63] text-white"
                  : "border-[#DDD6EE] bg-white text-[#150726] hover:border-[#E91E63] hover:bg-[#FCE4EC]"
              }`}
            >
              <XCircle className={`h-4 w-4 ${cancelArmed ? "text-white" : "text-[#E91E63]"}`} />
              {cancelArmed ? "Confirm cancel?" : "Cancel order"}
            </button>
          )}
          <Link href="/contact" className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-body-sm font-bold text-[#150726] hover:border-[#00BCD4] hover:bg-[#E8F9FC] transition-all flex items-center justify-center gap-2">
            <Phone className="h-4 w-4 text-[#00BCD4]" /> Support
          </Link>
        </div>
      </div>

      {order && (
        <ReturnModal
          open={returnOpen}
          onClose={() => setReturnOpen(false)}
          orderId={order.id}
          purchaseOrderId={(order as any).purchase_order_id ?? null}
          items={(order.items || []).map((i: any) => ({
            sku: i.sku ?? i.product_id ?? "unknown",
            name: i.name ?? `Item ${(i.product_id ?? "").slice(0, 8)}`,
            quantity: i.quantity ?? 1,
            unitPrice: i.unitPrice ?? i.unit_price ?? 0,
            unitCode: i.unitCode ?? "",
          }))}
        />
      )}
    </div>
  );
}
