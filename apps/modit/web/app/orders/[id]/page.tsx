"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useOrder } from "@/lib/modit-api";
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, CreditCard, FileText, Download, RotateCcw, Phone, ChevronRight, AlertCircle, Calendar, MessageCircle,
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

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
  confirmed: { label: "Confirmed", color: "text-[#2D1B69]", bg: "bg-[#2D1B69]/10", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-[#E91E63]", bg: "bg-[#E91E63]/10", icon: Clock },
  dispatched: { label: "Dispatched", color: "text-[#00BCD4]", bg: "bg-[#00BCD4]/10", icon: Package },
  in_transit: { label: "In Transit", color: "text-[#00BCD4]", bg: "bg-[#00BCD4]/10", icon: Truck },
  delivered: { label: "Delivered", color: "text-[#7CB518]", bg: "bg-[#7CB518]/10", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", icon: AlertCircle },
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
  const { data: apiOrder, isLoading } = useOrder(id);

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
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/orders" className="text-white/70 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-[16px] font-bold text-white">Order Details</h1>
          </div>
        </header>
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
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/orders" className="text-white/70 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-[16px] font-bold text-white">Order Not Found</h1>
          </div>
        </header>
        <div className="py-20 text-center">
          <Package className="h-16 w-16 text-[#9B8CB5]/30 mx-auto mb-4" />
          <h2 className="text-[18px] font-bold text-[#150726]">Order Not Found</h2>
          <p className="mt-1 text-[13px] text-[#9B8CB5]">This order does not exist or you do not have access.</p>
          <Link href="/orders" className="mt-4 inline-flex items-center gap-2 bg-[#2D1B69] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#1E1245] transition-all">
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
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/orders" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1">
            <h1 className="text-[16px] font-bold text-white">{order.id}</h1>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.bg} ${st.color}`}>
            <StatusIcon className="h-3 w-3" /> {st.label}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[800px] px-4 py-4 space-y-4 sm:px-6">
        {/* Timeline */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-4">Order Timeline</h3>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                      isActive ? "bg-[#2D1B69] text-white shadow-lg shadow-purple-900/20" : "bg-[#F0ECF9] text-[#9B8CB5]"
                    } ${isCurrent ? "ring-4 ring-[#2D1B69]/20 scale-110" : ""}`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-1.5 text-[9px] font-bold text-center ${isActive ? "text-[#2D1B69]" : "text-[#9B8CB5]"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 ${i < currentStepIndex ? "bg-[#2D1B69]" : "bg-[#F0ECF9]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-3">Items ({order.items.length})</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#F8F6FC]">
                <div className="h-12 w-12 rounded-lg bg-[#F0ECF9] flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-[#2D1B69]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.brand && <p className="text-[10px] font-bold text-[#2D1B69]">{item.brand}</p>}
                  <p className="text-[12px] font-semibold text-[#150726] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#9B8CB5]">{item.quantity} {item.unitCode} × ₹{item.unitPrice.toLocaleString()}</p>
                </div>
                <p className="text-[13px] font-bold text-[#150726] whitespace-nowrap">₹{item.total.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-3">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[12px]"><span className="text-[#9B8CB5]">Subtotal</span><span className="text-[#150726]">₹{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#9B8CB5]">GST</span><span className="text-[#150726]">₹{order.gst.toLocaleString()}</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-[#9B8CB5]">Delivery</span>
              <span className={order.shipping === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
            </div>
            <div className="border-t border-[#DDD6EE] pt-2 flex justify-between">
              <span className="text-[14px] font-bold text-[#150726]">Total</span>
              <span className="text-[16px] font-extrabold text-[#2D1B69]">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-[#F8F6FC]">
            <div className="flex items-center gap-2 text-[11px] text-[#9B8CB5]">
              <CreditCard className="h-3.5 w-3.5" /> {order.payment.method}
            </div>
            <div className="flex items-center gap-2 text-[11px] mt-1">
              <span className={`font-bold ${order.payment.status === "paid" ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                {order.payment.status === "paid" ? "Paid" : "Pending"}
              </span>
              {order.payment.transactionId && <span className="text-[#9B8CB5]">· {order.payment.transactionId}</span>}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-[#150726] mb-2">
            <MapPin className="h-4 w-4 text-[#2D1B69]" /> Delivery Address
          </h4>
          <div className="text-[12px] text-[#9B8CB5]">
            <p className="font-semibold text-[#150726]">{order.address.name}</p>
            <p>{order.address.phone}</p>
            <p className="mt-0.5">{order.address.line1}</p>
            <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-[#150726] mb-2">
            <Calendar className="h-4 w-4 text-[#2D1B69]" /> Delivery
          </h4>
          <p className="text-[11px] text-[#9B8CB5]">{order.deliveredAt ? "Delivered on" : "Expected by"}</p>
          <p className="text-[13px] font-bold text-[#150726]">{order.deliveredAt ? formatDateTime(order.deliveredAt) : formatDate(order.expectedDelivery)}</p>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
            <h4 className="text-[13px] font-bold text-[#150726] mb-1">Special Instructions</h4>
            <p className="text-[12px] text-[#9B8CB5]">{order.specialInstructions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 h-11 rounded-xl border-2 border-[#DDD6EE] bg-white text-[12px] font-bold text-[#150726] hover:border-[#2D1B69] transition-all flex items-center justify-center gap-2">
            <Download className="h-4 w-4" /> Invoice
          </button>
          {order.status === "delivered" && (
            <button className="flex-1 h-11 rounded-xl border-2 border-[#DDD6EE] bg-white text-[12px] font-bold text-[#150726] hover:border-[#2D1B69] transition-all flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" /> Return
            </button>
          )}
          <button className="flex-1 h-11 rounded-xl border-2 border-[#DDD6EE] bg-white text-[12px] font-bold text-[#150726] hover:border-[#2D1B69] transition-all flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" /> Support
          </button>
        </div>
      </div>
    </div>
  );
}
