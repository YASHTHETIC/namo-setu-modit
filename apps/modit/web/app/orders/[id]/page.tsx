"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useOrder } from "@/lib/modit-api";
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, CreditCard, FileText, Download, RotateCcw, Phone, AlertCircle, Calendar, MessageCircle, Copy,
  Star, Navigation, MessageSquare, RefreshCcw, Check
} from "lucide-react";

interface OrderItem {
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
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#F0ECF9]", border: "border-[#2D1B69]/20", icon: CheckCircle2, dot: "bg-[#2D1B69]" },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#FCE8F0]", border: "border-[#E91E63]/20", icon: Clock, dot: "bg-[#E91E63]" },
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: apiOrder, isLoading } = useOrder(id, demoOrders[id] ?? null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const order = useMemo(() => {
    if (apiOrder) return apiOrder as unknown as OrderDetail;
    return demoOrders[id] ?? null;
  }, [apiOrder, id]);

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    return timelineSteps.findIndex((s) => s.key === order.status);
  }, [order]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatDateTime = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6FC]">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #1E0F4A 60%, #150726 100%)" }}>
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
      <div className="min-h-screen bg-[#F8F6FC]">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #1E0F4A 60%, #150726 100%)" }}>
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
          <h2 className="text-[18px] font-bold text-[#150726]">Order Not Found</h2>
          <p className="mt-2 text-[13px] text-[#9B8CB5] max-w-xs mx-auto">This order does not exist or you do not have access.</p>
          <Link href="/orders"
            className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/25">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const st = statusConfig[order.status] ?? statusConfig.confirmed;
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Gradient header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #1E0F4A 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,188,212,0.4), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/orders" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-[16px] font-extrabold text-white">{order.id}</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border ${st.bg} ${st.color} ${st.border}`}>
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
                      <span className={`mt-1 text-[8px] font-bold text-center ${isActive ? "text-white" : "text-white/30"}`}>
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
                  <span className="text-[13px] font-bold">Live Tracking</span>
                </div>
                <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                  <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold">Delivery Partner: Vikram S.</p>
                    <p className="text-[11px] text-white/70 mt-0.5">Estimated arrival: 12 min</p>
                  </div>
                  <div className="flex gap-2">
                    <a href="tel:+919876543210" className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                      <Phone className="h-4 w-4" />
                    </a>
                    <button className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
            <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
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
              <button onClick={() => setRated(true)} className="px-5 py-2 rounded-lg bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6A9C14] transition-all">
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
            <span className="text-[13px] font-semibold text-[#7CB518]">Thanks for rating!</span>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#FAFAFE]">
            <h3 className="text-[13px] font-bold text-[#150726] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#2D1B69]" />
              Items ({order.items.length})
            </h3>
          </div>
          <div className="divide-y divide-[#F0ECF9]">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 p-4 hover:bg-[#FAFAFE] transition-colors">
                <div className="h-12 w-12 rounded-xl bg-[#F0ECF9] flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-[#2D1B69]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.brand && <p className="text-[10px] font-bold text-[#7CB518] uppercase tracking-wide">{item.brand}</p>}
                  <p className="text-[13px] font-semibold text-[#150726] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#9B8CB5] mt-0.5">{item.quantity} {item.unitCode} × ₹{item.unitPrice.toLocaleString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-extrabold text-[#150726]">₹{item.total.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-[#9B8CB5] mt-0.5">incl. GST {item.gstRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#FAFAFE]">
            <h3 className="text-[13px] font-bold text-[#150726] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#2D1B69]" />
              Payment Summary
            </h3>
          </div>
          <div className="p-5 space-y-2.5">
            <div className="flex justify-between text-[12px]"><span className="text-[#9B8CB5]">Subtotal</span><span className="text-[#150726] font-medium">₹{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#9B8CB5]">GST</span><span className="text-[#150726] font-medium">₹{order.gst.toLocaleString()}</span></div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9B8CB5]">Delivery</span>
              <span className={order.shipping === 0 ? "text-[#7CB518] font-bold" : "text-[#150726] font-medium"}>
                {order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="border-t border-[#DDD6EE] pt-2.5 flex justify-between">
              <span className="text-[14px] font-bold text-[#150726]">Total</span>
              <span className="text-[18px] font-extrabold text-[#2D1B69]">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mx-5 mb-5 p-3.5 rounded-xl bg-[#F8F6FC] border border-[#F0ECF9]">
            <div className="flex items-center gap-2 text-[12px] text-[#6B5B83]">
              <CreditCard className="h-3.5 w-3.5 text-[#2D1B69]" /> {order.payment.method}
            </div>
            <div className="flex items-center gap-2 text-[11px] mt-1.5">
              <span className={`inline-flex items-center gap-1 font-bold ${order.payment.status === "paid" ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${order.payment.status === "paid" ? "bg-[#7CB518]" : "bg-[#E91E63]"}`} />
                {order.payment.status === "paid" ? "Paid" : "Pending"}
              </span>
              {order.payment.transactionId && <span className="text-[#9B8CB5]">· {order.payment.transactionId}</span>}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECF9] bg-[#FAFAFE]">
            <h3 className="text-[13px] font-bold text-[#150726] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2D1B69]" />
              Delivery Address
            </h3>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F0ECF9] flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-[#2D1B69]" />
              </div>
              <div className="text-[12px]">
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
              <p className="text-[11px] text-[#9B8CB5]">{order.deliveredAt ? "Delivered on" : "Expected by"}</p>
              <p className="text-[14px] font-bold text-[#150726]">{order.deliveredAt ? formatDateTime(order.deliveredAt) : formatDate(order.expectedDelivery)}</p>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="rounded-2xl border border-[#E91E63]/20 bg-[#FCE8F0] overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-[#E91E63] mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-[#E91E63] uppercase tracking-wide">Special Instructions</p>
                <p className="text-[12px] text-[#6B5B83] mt-1">{order.specialInstructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          <button className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-[13px] font-bold text-[#150726] hover:border-[#7CB518] hover:bg-[#F0F9E8] transition-all flex items-center justify-center gap-2">
            <Download className="h-4 w-4 text-[#2D1B69]" /> Invoice
          </button>
          {order.status === "delivered" && (
            <button className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-[13px] font-bold text-[#150726] hover:border-[#E91E63] hover:bg-[#FCE8F0] transition-all flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#E91E63]" /> Return
            </button>
          )}
          <button className="flex-1 h-12 rounded-xl border-2 border-[#DDD6EE] bg-white text-[13px] font-bold text-[#150726] hover:border-[#00BCD4] hover:bg-[#E8F9FC] transition-all flex items-center justify-center gap-2">
            <Phone className="h-4 w-4 text-[#00BCD4]" /> Support
          </button>
        </div>
      </div>
    </div>
  );
}
