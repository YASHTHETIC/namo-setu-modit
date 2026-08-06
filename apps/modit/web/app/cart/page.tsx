"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Tag,
  Truck,
  Shield,
  ChevronRight,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button, Card, Input, Badge, EmptyState } from "@/lib/modit-ui";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  unitCode: string;
  gstRate: number;
  brand: string | null;
  supplier: { id: string; name: string; isVerified: boolean } | null;
  imageUrl?: string;
  moq: number;
  maxQty: number;
}

const demoCartItems: CartItem[] = [
  {
    id: "c1",
    productId: "p1",
    name: "TMT Steel Bars Fe-500D 12mm",
    sku: "STL-TMT-500D-12",
    unitPrice: 62000,
    quantity: 5,
    unit: "Metric Ton",
    unitCode: "MT",
    gstRate: 18,
    brand: "Tata Tiscon",
    supplier: { id: "s1", name: "Tata Steel Distribution", isVerified: true },
    moq: 1,
    maxQty: 500,
  },
  {
    id: "c2",
    productId: "p2",
    name: "Portland Pozzolana Cement PPC 53 Grade",
    sku: "CEM-PPC-53-50KG",
    unitPrice: 380,
    quantity: 200,
    unit: "Bag (50 kg)",
    unitCode: "BAG",
    gstRate: 28,
    brand: "UltraTech Cement",
    supplier: { id: "s2", name: "UltraTech Cement Dealers", isVerified: true },
    moq: 50,
    maxQty: 10000,
  },
  {
    id: "c3",
    productId: "p3",
    name: "Red Clay Bricks First Class (9x4x3 inch)",
    sku: "BRK-RED-FC-943",
    unitPrice: 8.5,
    quantity: 5000,
    unit: "Piece",
    unitCode: "PCS",
    gstRate: 5,
    brand: null,
    supplier: { id: "s3", name: "Bharat Bricks Supply Co.", isVerified: false },
    moq: 1000,
    maxQty: 100000,
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(demoCartItems);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(item.moq, Math.min(item.maxQty, item.quantity + delta)) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, { supplier: CartItem["supplier"]; items: CartItem[] }> = {};
    items.forEach((item) => {
      const key = item.supplier?.id ?? "unknown";
      if (!groups[key]) groups[key] = { supplier: item.supplier, items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalGst = items.reduce((sum, item) => sum + item.unitPrice * item.quantity * (item.gstRate / 100), 0);
    const shipping = subtotal >= 100000 ? 0 : subtotal >= 50000 ? 1500 : 3500;
    const discount = couponApplied ? couponDiscount : 0;
    const total = subtotal + totalGst + shipping - discount;
    return { subtotal, totalGst, shipping, discount, total };
  }, [items, couponApplied, couponDiscount]);

  const handleApplyCoupon = useCallback(() => {
    if (!couponCode) return;
    if (couponCode.toUpperCase() === "FIRST10") {
      setCouponApplied(true);
      setCouponDiscount(totals.subtotal * 0.1);
    } else if (couponCode.toUpperCase() === "BULK5") {
      setCouponApplied(true);
      setCouponDiscount(totals.subtotal * 0.05);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
    }
  }, [couponCode, totals.subtotal]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Browse our catalog and add construction materials to your cart."
          action={
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/products"
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {items.length} item{items.length !== 1 ? "s" : ""} from {groupedBySupplier.length} supplier{groupedBySupplier.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {groupedBySupplier.map((group, gi) => (
            <Card key={gi} className="overflow-hidden">
              {/* Supplier Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {group.supplier?.name ?? "Supplier"}
                    </p>
                    {group.supplier?.isVerified && (
                      <Badge variant="success" className="mt-0.5 text-[10px]">
                        <Shield className="mr-0.5 inline h-2.5 w-2.5" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-[var(--border-subtle)]">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-4 px-6 py-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-[var(--brand)]/30" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {item.brand && (
                            <p className="text-xs font-medium text-[var(--brand)]">{item.brand}</p>
                          )}
                          <Link href={`/products/${item.productId}`} className="text-sm font-semibold text-[var(--text-primary)] hover:underline line-clamp-1">
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">SKU: {item.sku}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-4">
                        {/* Quantity */}
                        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 px-2 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? { ...it, quantity: Math.max(it.moq, Math.min(it.maxQty, val)) }
                                      : it
                                  )
                                );
                              }
                            }}
                            className="h-8 w-16 border-x border-[var(--border)] bg-transparent text-center text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 px-2 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-xs text-[var(--text-muted)]">
                            ₹{item.unitPrice.toLocaleString()} / {item.unitCode}
                          </p>
                          <p className="text-base font-bold text-[var(--text-primary)]">
                            ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Coupon */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Tag className="h-4 w-4 text-[var(--brand)]" />
                Apply Coupon
              </h4>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-10 text-sm"
                />
                <Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>
                  Apply
                </Button>
              </div>
              {couponApplied && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  Coupon applied! You save ₹{couponDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
              {!couponApplied && couponCode && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Try FIRST10 or BULK5
                </p>
              )}
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Order Summary</h4>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Subtotal ({items.length} items)</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    ₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">GST (inclusive)</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    ₹{totals.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <Truck className="h-3.5 w-3.5" /> Shipping
                  </span>
                  <span className={`font-medium ${totals.shipping === 0 ? "text-emerald-600" : "text-[var(--text-primary)]"}`}>
                    {totals.shipping === 0 ? "FREE" : `₹${totals.shipping.toLocaleString()}`}
                  </span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Coupon Discount</span>
                    <span className="font-medium text-emerald-600">
                      -₹{totals.discount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t border-[var(--border-subtle)] pt-3 flex justify-between">
                  <span className="text-base font-semibold text-[var(--text-primary)]">Total</span>
                  <span className="text-xl font-extrabold text-[var(--brand)]">
                    ₹{totals.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Link href="/checkout">
                <Button className="mt-5 w-full h-12 text-base font-semibold">
                  Proceed to Checkout
                </Button>
              </Link>
              {totals.subtotal < 100000 && (
                <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
                  Add ₹{(100000 - totals.subtotal).toLocaleString()} more for free shipping
                </p>
              )}
            </div>
          </Card>

          {/* Trust Badges */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Shield className="h-5 w-5 flex-shrink-0 text-[var(--brand)]" />
                <span>Secure payment — 256-bit SSL encryption</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Truck className="h-5 w-5 flex-shrink-0 text-[var(--brand)]" />
                <span>Free delivery on orders above ₹1,00,000</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--brand)]" />
                <span>Easy returns within 7 days</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
