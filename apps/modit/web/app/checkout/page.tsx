"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Check, Plus, Package, Truck, Clock, CheckCircle2, ShoppingCart,
  Tag, Calendar, Zap, X, Trash2, Gift, FileText
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";
import { useAddressStore } from "@/lib/address-store";
import { useDeliveryStore } from "@/lib/delivery-store";
import { useCouponStore } from "@/lib/coupon-store";
import { formatINR2 } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { useToast } from "@foundation/ui";
import { PaymentSection } from "@/components/payment-checkout";
import { ProductThumb } from "@/components/product-thumb";
import { AddressForm } from "@/components/address-form";
import { useAuthReady } from "@/lib/use-auth";

export default function CheckoutPage() {
  const loggedIn = useAuthReady();
  const items = useCartStore((s) => s.items);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartGST = useCartStore((s) => s.getCartGST);
  const clearCart = useCartStore((s) => s.clearCart);

  const { addresses, selectedAddressId, selectAddress, addAddress, deleteAddress, setDefault, getSelected } = useAddressStore();
  const { selectedSlotId, slots, selectSlot, getSelected: getSlot } = useDeliveryStore();
  const { appliedCoupon, couponError, applyCoupon, removeCoupon, getDiscount, getBestCoupon } = useCouponStore();
  const toast = useToast();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const headerHidden = useHideOnScroll(140);
  const [orderId, setOrderId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(
    () => useAddressStore.getState().addresses.length === 0
  );
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  // Blinkit-style single page: address, slot, items, coupon and payment are
  // all visible at once — no wizard steps. Pay stays disabled until an
  // address is selected.
  const [gstin, setGstin] = useState("");
  // One idempotency key per checkout session: retries/replays after a
  // network blip return the same server order instead of duplicating it.
  const attemptKeyRef = useRef<string | null>(null);
  if (attemptKeyRef.current === null) {
    attemptKeyRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `att-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }

  const subtotal = getCartTotal();
  const gst = getCartGST();
  const couponDiscount = getDiscount(subtotal);
  const isFreeShipping = appliedCoupon?.discountType === "free_shipping";
  // Mirror the server: free shipping only when the POST-discount subtotal
  // clears ₹5000 (compute_checkout_totals uses subtotal - discount).
  const shipping = subtotal - couponDiscount >= 5000 ? 0 : 250;
  const effectiveShipping = isFreeShipping ? 0 : shipping;
  const slot = getSlot();
  const deliveryFee = slot?.fee ?? 0;
  const total = Math.max(0, subtotal + gst + effectiveShipping + deliveryFee - couponDiscount);
  const bestCoupon = getBestCoupon(subtotal);
  const selectedAddr = getSelected();

  const handleApplyCoupon = () => {
    if (couponInput.trim()) {
      const result = applyCoupon(couponInput.trim().toUpperCase(), subtotal);
      if (result.success) {
        toast.success("Coupon applied!", result.message);
      } else {
        toast.error("Coupon failed", result.message);
      }
      setCouponInput("");
    }
  };

  const handlePlaceOrder = (apiOrderId?: string, due?: number) => {
    if (!apiOrderId) {
      toast.error("Order failed", "Server did not confirm the order. Cart kept — please retry.");
      return;
    }
    const id = apiOrderId;
    removeCoupon();
    clearCart();
    setOrderId(id);
    setServerTotal(typeof due === "number" ? due : null);
    setOrderPlaced(true);
  };

  if (!loggedIn) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-body-lg font-bold text-white">Checkout</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <div className="h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-10 w-10 text-[#2D1B69]" />
          </div>
          <h2 className="text-title-md font-bold text-[#150726]">Login to checkout</h2>
          <p className="text-body-sm text-[#9B8CB5] mt-2 max-w-xs mx-auto">Orders, delivery tracking and invoices need your account. Your cart is saved.</p>
          <Link href="/auth?next=%2Fcheckout" className="mt-6 inline-flex items-center gap-2 bg-[#7CB518] text-white text-body-md font-bold px-8 py-3 rounded-xl hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/25">
            Login / Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-body-lg font-bold text-white">Checkout</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-[#9B8CB5]/30 mx-auto mb-4" />
          <h2 className="text-title-md font-bold text-[#150726]">Your cart is empty</h2>
          <Link href="/products" className="mt-4 inline-flex items-center gap-2 bg-[#7CB518] text-white text-body-sm font-bold px-6 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <h1 className="text-body-lg font-bold text-white">Order Confirmed</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <div className="h-20 w-20 rounded-full bg-[#7CB518]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-[#7CB518]" />
          </div>
          <h2 className="text-title-lg font-bold text-[#150726]">Order Placed!</h2>
          <p className="text-body-sm text-[#9B8CB5] mt-2">Your order <span className="font-bold text-[#2D1B69]">{orderId}</span> has been placed successfully.</p>
          {serverTotal !== null && (
            <p className="mt-2 inline-block rounded-full bg-[#F0F9E8] px-4 py-1.5 text-body-sm font-bold text-[#2D1B69]">
              Amount due: {formatINR2(serverTotal)} (server-verified)
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-2 text-caption text-[#7CB518] font-semibold">
            <Truck className="h-4 w-4" /> Estimated delivery: {slot?.time ?? "60 minutes"}
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href={`/orders/${orderId}`} className="bg-[#2D1B69] text-white text-body-sm font-bold px-6 py-2.5 rounded-full hover:bg-[#1E1245] transition-all">
              Track Order
            </Link>
            <Link href="/products" className="bg-white text-[#150726] text-body-sm font-bold px-6 py-2.5 rounded-full border border-[#DDD6EE] hover:border-[#2D1B69] transition-all">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      <header className={`sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-body-lg font-bold text-white">Checkout</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            {/* 1 · Address Section */}
              <Reveal>
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-[#2D1B69] text-white text-tiny font-bold flex items-center justify-center">1</span>
                  <MapPin className="h-4 w-4 text-[#2D1B69]" /> Delivery Address
                </h3>
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedAddressId === addr.id ? "border-[#2D1B69] bg-[#F0ECF9]" : "border-[#DDD6EE]"
                    }`}>
                      <button onClick={() => selectAddress(addr.id)} className="flex-1 text-left flex items-start gap-3">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAddressId === addr.id ? "border-[#2D1B69]" : "border-[#DDD6EE]"
                        }`}>
                          {selectedAddressId === addr.id && <div className="h-2 w-2 rounded-full bg-[#2D1B69]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-caption font-bold text-[#150726]">{addr.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-tiny font-bold bg-[#F0ECF9] text-[#2D1B69] uppercase">{addr.type}</span>
                            {addr.isDefault && <span className="px-1.5 py-0.5 rounded bg-[#7CB518]/10 text-tiny font-bold text-[#7CB518]">DEFAULT</span>}
                          </div>
                          <p className="text-caption text-[#150726] mt-0.5">{addr.name} · {addr.phone}</p>
                          <p className="text-micro text-[#9B8CB5]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr.id)} className="p-1 text-[#9B8CB5] hover:text-[#7CB518] transition-colors" title="Set as default">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteAddress(addr.id)} className="p-1 text-[#9B8CB5] hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {showAddAddress ? (
                    <AddressForm
                      onSave={(v) => {
                        addAddress({ ...v, isDefault: addresses.length === 0 });
                        toast.success("Address saved!", `${v.label} added successfully`);
                        setShowAddAddress(false);
                      }}
                      onCancel={() => setShowAddAddress(false)}
                    />
                  ) : (
                    <button onClick={() => setShowAddAddress(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#DDD6EE] text-caption font-semibold text-[#9B8CB5] hover:border-[#2D1B69] hover:text-[#2D1B69] transition-all">
                      <Plus className="h-4 w-4" /> Add New Address
                    </button>
                  )}
                </div>
              </div>
              </Reveal>

            {/* 2 · Delivery Slot Section */}
              <Reveal>
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-[#2D1B69] text-white text-tiny font-bold flex items-center justify-center">2</span>
                  <Clock className="h-4 w-4 text-[#2D1B69]" /> Delivery Time
                </h3>

                <div className="mb-4">
                  <p className="text-micro font-bold text-[#9B8CB5] uppercase mb-2">Express</p>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.filter((s) => s.type === "express").map((s) => {
                      const now = new Date();
                      const hour = now.getHours();
                      const isAvailable = s.id === "express-30" || s.id === "express-60" ? (hour >= 8 && hour < 22) : true;
                      return (
                        <button key={s.id} onClick={() => isAvailable && selectSlot(s.id)} disabled={!isAvailable} className={`p-3 rounded-xl border-2 text-left transition-all ${
                          !isAvailable ? "border-[#E8E0F7] bg-[#F8F6FC] opacity-50 cursor-not-allowed" :
                          selectedSlotId === s.id ? "border-[#7CB518] bg-[#7CB518]/5" : "border-[#DDD6EE] hover:border-[#C9B8E8]"
                        }`}>
                          <div className="flex items-center gap-2">
                            <Zap className={`h-3.5 w-3.5 ${selectedSlotId === s.id ? "text-[#7CB518]" : "text-[#9B8CB5]"}`} />
                            <span className="text-caption font-bold text-[#150726]">{s.label}</span>
                          </div>
                          <p className="text-micro text-[#9B8CB5] mt-1">{s.time}</p>
                          {s.fee > 0 && <p className="text-tiny font-bold text-[#E91E63] mt-0.5">+₹{s.fee}</p>}
                          {s.fee === 0 && <p className="text-tiny font-bold text-[#7CB518] mt-0.5">FREE</p>}
                          {!isAvailable && <p className="text-tiny font-bold text-[#9B8CB5] mt-0.5">Unavailable now</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-micro font-bold text-[#9B8CB5] uppercase mb-2">Standard & Scheduled</p>
                  <div className="grid grid-cols-1 gap-2">
                    {slots.filter((s) => s.type === "scheduled" || s.type === "standard").map((s) => {
                      const now = new Date();
                      const hour = now.getHours();
                      let isAvailable = true;
                      if (s.id === "standard-2hr") isAvailable = hour < 18;
                      else if (s.id === "scheduled-morning") isAvailable = hour < 22;
                      else if (s.id === "scheduled-afternoon") isAvailable = hour < 14;
                      else if (s.id === "scheduled-evening") isAvailable = hour < 18;
                      return (
                        <button key={s.id} onClick={() => isAvailable && selectSlot(s.id)} disabled={!isAvailable} className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          !isAvailable ? "border-[#E8E0F7] bg-[#F8F6FC] opacity-50 cursor-not-allowed" :
                          selectedSlotId === s.id ? "border-[#2D1B69] bg-[#F0ECF9]" : "border-[#DDD6EE] hover:border-[#C9B8E8]"
                        }`}>
                          <Calendar className={`h-4 w-4 ${selectedSlotId === s.id ? "text-[#2D1B69]" : "text-[#9B8CB5]"}`} />
                          <div className="flex-1">
                            <span className="text-caption font-bold text-[#150726]">{s.label}</span>
                            <p className="text-micro text-[#9B8CB5]">{s.time}</p>
                          </div>
                          {isAvailable ? (
                            <span className="text-tiny text-[#9B8CB5]">{s.cutoff}</span>
                          ) : (
                            <span className="text-tiny font-bold text-[#E91E63]">Past cutoff</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
              </Reveal>

            {/* 3 · Business + 4 · Coupon + 5 · Items (all visible, Blinkit-style) */}
              <Reveal>
                {/* Business GSTIN */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
                    <span className="h-5 w-5 rounded-full bg-[#2D1B69] text-white text-tiny font-bold flex items-center justify-center">3</span>
                    <FileText className="h-4 w-4 text-[#2D1B69]" /> Business Details (optional)
                  </h3>
                  <p className="text-micro text-[#9B8CB5] -mt-1 mb-3">Provide your GSTIN to receive a proper GST invoice for input tax credit.</p>
                  <div className="relative">
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="15-digit GSTIN e.g. 27AABCU9603R1ZM"
                    maxLength={15}
                    inputMode="text"
                    className="w-full px-3 py-2.5 pr-14 rounded-lg border border-[#DDD6EE] text-body-lg font-semibold tracking-wider focus:outline-none focus:border-[#2D1B69]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tiny font-bold text-[#9B8CB5] tabular-nums">{gstin.length}/15</span>
                  </div>
                  {gstin.length > 0 && gstin.length < 15 && (
                    <p className="text-tiny text-red-500 mt-1.5">GSTIN must be 15 characters</p>
                  )}
                  {gstin.length === 15 && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) && (
                    <p className="text-tiny text-red-500 mt-1.5">Invalid GSTIN format — check state code, PAN and checksum</p>
                  )}
                  {gstin.length === 15 && /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) && (
                    <p className="text-micro text-[#7CB518] font-semibold mt-1.5 flex items-center gap-1">
                      <Check className="h-3 w-3" /> GST invoice will be issued for this order
                    </p>
                  )}
                </div>

                {/* Coupon */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
                    <span className="h-5 w-5 rounded-full bg-[#2D1B69] text-white text-tiny font-bold flex items-center justify-center">4</span>
                    <Tag className="h-4 w-4 text-[#E91E63]" /> Apply Coupon
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#7CB518]/5 border border-[#7CB518]/20">
                      <div>
                        <span className="text-body-sm font-bold text-[#7CB518]">{appliedCoupon.code}</span>
                        <p className="text-micro text-[#9B8CB5]">{appliedCoupon.description}</p>
                      </div>
                      <button onClick={removeCoupon} className="p-1 text-[#9B8CB5] hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} placeholder="Enter coupon code" className="flex-1 px-3 py-2 rounded-lg border border-[#DDD6EE] text-body-lg font-semibold uppercase tracking-wider focus:outline-none focus:border-[#2D1B69]" />
                        <button onClick={handleApplyCoupon} className="px-4 py-2 rounded-lg bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245] transition-all">Apply</button>
                      </div>
                      {couponError && <p className="text-micro text-red-500 mt-2">{couponError}</p>}
                      {bestCoupon && (
                        <button onClick={() => { applyCoupon(bestCoupon.code, subtotal); toast.success("Coupon applied!", `Best offer ${bestCoupon.code} applied`); }} className="mt-2 w-full flex items-center gap-2 p-2 rounded-lg bg-[#E91E63]/5 border border-[#E91E63]/20 text-left hover:bg-[#E91E63]/10 transition-all">
                          <Gift className="h-4 w-4 text-[#E91E63]" />
                          <div>
                            <span className="text-micro font-bold text-[#E91E63]">Best offer: {bestCoupon.code}</span>
                            <p className="text-tiny text-[#9B8CB5]">{bestCoupon.description}</p>
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Order Items */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2 mb-3">
                    <span className="h-5 w-5 rounded-full bg-[#2D1B69] text-white text-tiny font-bold flex items-center justify-center">5</span>
                    <Package className="h-4 w-4 text-[#2D1B69]" /> Order Items ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const itemPrice = item.unitPrice ?? item.product.price;
                      const variant = item.variantId ? item.product.variants?.find((v) => v.id === item.variantId) : null;
                      const discount = (variant?.mrp ?? item.product.mrp) > itemPrice
                        ? Math.round((((variant?.mrp ?? item.product.mrp) - itemPrice) / (variant?.mrp ?? item.product.mrp)) * 100)
                        : 0;
                      return (
                        <div key={`${item.product.id}:${item.variantId || "default"}`} className="flex gap-3 p-3 rounded-xl bg-[#F8F6FC]">
                          <ProductThumb src={item.product.images[0]} alt={item.product.name} className="h-14 w-14 rounded-lg object-contain bg-[#F0ECF9] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-micro font-semibold text-[#2D1B69]">{item.product.brand}</p>
                            <p className="text-caption font-semibold text-[#150726] truncate">{item.product.name}</p>
                            {variant && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-tiny font-bold text-[#2D1B69]">{variant.label}</span>}
                            {item.shade && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-tiny font-bold text-[#2D1B69] ml-1">{item.shade}</span>}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-caption font-bold text-[#150726]">₹{itemPrice.toLocaleString()}</span>
                              {discount > 0 && <span className="text-tiny font-bold text-[#E91E63]">{discount}% OFF</span>}
                              <span className="text-tiny text-[#9B8CB5]">× {item.quantity}</span>
                            </div>
                          </div>
                          <p className="text-body-sm font-bold text-[#150726] whitespace-nowrap">₹{(itemPrice * item.quantity).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Delivery Info */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <div className="flex items-center gap-2 text-caption text-[#150726]">
                  <Clock className="h-4 w-4 text-[#7CB518]" />
                  <span>Delivery: <span className="font-bold text-[#7CB518]">{slot?.label ?? "60 min"}</span></span>
                </div>
                {selectedAddr && (
                  <div className="flex items-start gap-2 mt-2 text-micro text-[#9B8CB5]">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{selectedAddr.line1}, {selectedAddr.city} - {selectedAddr.pincode}</span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h4 className="text-body-md font-bold text-[#150726] mb-3">Price Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Subtotal</span>
                    <span className="text-[#150726]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">GST</span>
                    <span className="text-[#150726]">{formatINR2(gst)}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Shipping</span>
                    <span className={effectiveShipping === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>
                      {effectiveShipping === 0 ? "FREE" : `₹${effectiveShipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-body-sm">
                      <span className="text-[#7CB518]">Coupon ({appliedCoupon?.code})</span>
                      <span className="text-[#7CB518] font-semibold">-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DDD6EE] pt-2 flex justify-between">
                    <span className="text-body-lg font-bold text-[#150726]">Total</span>
                    <span className="text-title-md font-extrabold text-[#2D1B69]">{formatINR2(total)}</span>
                  </div>
                </div>
              </div>

                {/* 6 · Pay — always visible; PaymentSection disables itself until an address is picked */}
                <PaymentSection
                  total={total}
                  onPaymentComplete={handlePlaceOrder}
                  gstin={gstin || undefined}
                  shippingAddress={(selectedAddr ?? null) as Record<string, unknown> | null}
                  couponCode={appliedCoupon?.code}
                  clientReference={attemptKeyRef.current ?? undefined}
                />
              {!selectedAddr && (
                <p className="mt-2 text-center text-micro font-semibold text-[#9B8CB5]">
                  Add a delivery address above to continue — it takes 20 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
