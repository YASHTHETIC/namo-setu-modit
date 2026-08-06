"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useOrder } from "@/lib/modit-api";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  Download,
  RotateCcw,
  Phone,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button, Card, Badge, Panel, Skeleton, EmptyState } from "@/lib/modit-ui";

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
  address: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
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
    id: "ORD-2026-08001",
    status: "delivered",
    placedAt: "2026-07-28T10:30:00Z",
    expectedDelivery: "2026-08-02T14:00:00Z",
    deliveredAt: "2026-08-01T11:45:00Z",
    address: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      line1: "42, MG Road, Near Metro Station",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    payment: {
      method: "UPI — Google Pay",
      status: "paid",
      transactionId: "TXN-2026-0728-001",
    },
    items: [
      { name: "TMT Steel Bars Fe-500D 12mm", sku: "STL-TMT-500D-12", quantity: 5, unitPrice: 62000, unitCode: "MT", gstRate: 18, brand: "Tata Tiscon", total: 310000 },
      { name: "Portland Pozzolana Cement PPC 53 Grade", sku: "CEM-PPC-53-50KG", quantity: 200, unitPrice: 380, unitCode: "BAG", gstRate: 28, brand: "UltraTech Cement", total: 76000 },
      { name: "Red Clay Bricks First Class (9x4x3 inch)", sku: "BRK-RED-FC-943", quantity: 5000, unitPrice: 8.5, unitCode: "PCS", gstRate: 5, brand: null, total: 42500 },
    ],
    subtotal: 428500,
    gst: 79335,
    shipping: 0,
    total: 507835,
    invoiceNumber: "INV-2026-08001",
  },
  "ORD-2026-08002": {
    id: "ORD-2026-08002",
    status: "in_transit",
    placedAt: "2026-08-03T09:15:00Z",
    expectedDelivery: "2026-08-07T14:00:00Z",
    address: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      line1: "Construction Site B, Sector 15",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400065",
    },
    payment: {
      method: "Credit Terms — 30 days",
      status: "pending",
    },
    items: [
      { name: "MS Pipes ERW 2 inch (50mm) x 6m", sku: "PIP-MS-ERW-2x6", quantity: 100, unitPrice: 1250, unitCode: "PCS", gstRate: 18, brand: "Surya Roshni", total: 125000 },
      { name: "River Sand M-Sand Alternative 0-20mm", sku: "SND-RVR-20MM", quantity: 10, unitPrice: 2800, unitCode: "MT", gstRate: 5, brand: null, total: 28000 },
    ],
    subtotal: 153000,
    gst: 23950,
    shipping: 1500,
    total: 178450,
    invoiceNumber: "INV-2026-08002",
    specialInstructions: "Deliver to Site B gate, ask for Site Manager",
  },
  "ORD-2026-08003": {
    id: "ORD-2026-08003",
    status: "confirmed",
    placedAt: "2026-08-05T14:00:00Z",
    expectedDelivery: "2026-08-10T14:00:00Z",
    address: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      line1: "42, MG Road, Near Metro Station",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    payment: {
      method: "Card — Visa ending 4532",
      status: "paid",
      transactionId: "TXN-2026-0805-003",
    },
    items: [
      { name: "White Marble Tiles 2x2 ft (Polished)", sku: "TLS-MRB-2x2-POL", quantity: 200, unitPrice: 85, unitCode: "SQFT", gstRate: 18, brand: "Kajaria Ceramics", total: 17000 },
    ],
    subtotal: 17000,
    gst: 3060,
    shipping: 1500,
    total: 21560,
    invoiceNumber: "INV-2026-08003",
  },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700", icon: CheckCircle2 },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-700", icon: Clock },
  dispatched: { label: "Dispatched", color: "bg-purple-50 text-purple-700", icon: Package },
  in_transit: { label: "In Transit", color: "bg-blue-50 text-blue-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700", icon: AlertCircle },
};

const timelineSteps = [
  { key: "placed", label: "Order Placed", icon: FileText },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "dispatched", label: "Dispatched", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)]">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Order Not Found"
          description="This order does not exist or you do not have access."
          action={<Link href="/orders"><Button>View All Orders</Button></Link>}
        />
      </div>
    );
  }

  const statusInfo = statusConfig[order.status] ?? statusConfig.confirmed;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/orders" className="mb-2 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{order.id}</h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusInfo.color}`}>
              <statusInfo.icon className="mr-1 h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Placed on {formatDateTime(order.placedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Invoice</Button>
          <Button variant="secondary" size="sm"><MessageCircle className="h-4 w-4" /> Support</Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="mb-8 overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Order Timeline</h3>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isActive
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                      } ${isCurrent ? "ring-4 ring-[var(--brand)]/20" : ""}`}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-2 text-[10px] font-medium text-center ${isActive ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${i < currentStepIndex ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Order Items</h3>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 px-6 py-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-[var(--brand)]/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.brand && <p className="text-xs font-medium text-[var(--brand)]">{item.brand}</p>}
                    <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">SKU: {item.sku}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        {item.quantity} {item.unitCode} × ₹{item.unitPrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        ₹{item.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Special Instructions</h4>
                <p className="text-sm text-[var(--text-secondary)]">{order.specialInstructions}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Summary & Address */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Payment Summary</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Subtotal</span>
                <span className="text-[var(--text-primary)]">₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">GST</span>
                <span className="text-[var(--text-primary)]">₹{order.gst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Shipping</span>
                <span className={order.shipping === 0 ? "text-emerald-600 font-medium" : "text-[var(--text-primary)]"}>
                  {order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="border-t border-[var(--border-subtle)] pt-3 flex justify-between">
                <span className="text-base font-semibold text-[var(--text-primary)]">Total</span>
                <span className="text-xl font-extrabold text-[var(--brand)]">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-[var(--bg-subtle)]/50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>{order.payment.method}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-medium ${order.payment.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.payment.status === "paid" ? "Paid" : "Pending"}
                  </span>
                  {order.payment.transactionId && (
                    <span className="text-[var(--text-muted)]">· {order.payment.transactionId}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <MapPin className="h-4 w-4 text-[var(--brand)]" />
                Delivery Address
              </h4>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">
                <p className="font-medium text-[var(--text-primary)]">{order.address.name}</p>
                <p>{order.address.phone}</p>
                <p className="mt-1">{order.address.line1}</p>
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              </div>
            </div>
          </Card>

          {/* Expected Delivery */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Calendar className="h-4 w-4 text-[var(--brand)]" />
                Delivery
              </h4>
              <div className="mt-3 text-sm">
                <p className="text-[var(--text-muted)]">
                  {order.deliveredAt ? "Delivered on" : "Expected by"}
                </p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {order.deliveredAt ? formatDateTime(order.deliveredAt) : formatDate(order.expectedDelivery)}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="secondary" className="w-full">
              <Download className="h-4 w-4" /> Download Invoice ({order.invoiceNumber})
            </Button>
            {order.status === "delivered" && (
              <Button variant="secondary" className="w-full">
                <RotateCcw className="h-4 w-4" /> Request Return
              </Button>
            )}
            <Button variant="ghost" className="w-full">
              <Phone className="h-4 w-4" /> Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
