"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Check, Plus, Package, Truck, Clock, CheckCircle2, ShoppingCart,
  Tag, Calendar, Zap, X, Trash2, Gift, FileText, Sparkles, Copy, ShieldCheck
} from "lucide-react";
import { useCartStore, getBulkUnitPrice } from "@/lib/cart-store";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";
import { useAddressStore } from "@/lib/address-store";
import { useDeliveryStore } from "@/lib/delivery-store";
import { useCouponStore } from "@/lib/coupon-store";
import { useServerCoupons } from "@/lib/modit-api";
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
  const { appliedCoupon, couponError, applyCoupon, removeCoupon, getDiscount, getBestCoupon, availableCoupons } = useCouponStore();
  const toast = useToast();
  // Coupons come from the server (same rows checkout validates) — hydrate
  // on load; local defaults only cover offline.
  const serverCoupons = useServerCoupons();
  useEffect(() => {
    if (serverCoupons.data && (serverCoupons.data as unknown[]).length) {
      useCouponStore.getState().hydrateFromServer(serverCoupons.data as unknown as Array<Record<string, unknown>>);
    }
  }, [serverCoupons.data]);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const headerHidden = useHideOnScroll(140);
  const [orderId, setOrderId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(
    () => useAddressStore.getState().addresses.length === 0
  );
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  // Blinkit-style single page: address, slot, items, coupon and payment are
  // all visible at once — no wizard steps. Pay stays disabled until an
  // address is selected.
  const [gstin, setGstin] = useState("");
  // One idempotency key per checkout attempt: retries/replays after a
  // network blip return the same server order instead of duplicating it.
  // If the cart changes after an abandoned attempt (dismissed Razorpay
  // widget, qty edit), the key rotates so the next Pay creates a FRESH
  // order for the new cart instead of replaying the stored old one.
  const attemptKeyRef = useRef<string | null>(null);
  const attemptCartSigRef = useRef<string>("");
  const cartSig = items.map((i) => `${i.product.id}:${i.quantity}`).join("|");
  if (attemptKeyRef.current === null || attemptCartSigRef.current !== cartSig) {
    attemptKeyRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `att-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    attemptCartSigRef.current = cartSig;
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

  const handleCopyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard?.writeText(orderId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  if (!loggedIn) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-header bg-[#0b0318]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/cart" aria-label="Back to cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-body-lg font-bold text-white">Checkout</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#150726] to-[#2D1B69] border border-white/10 flex items-center justify-center mx-auto mb-5 shadow-cyber-purple">
            <MapPin className="h-9 w-9 text-[#00BCD4]" />
          </div>
          <h2 className="text-title-lg font-extrabold text-[#150726]">Login to checkout</h2>
          <p className="text-body-sm text-[#9B8CB5] mt-2 max-w-xs mx-auto">Instant site delivery, GPS live tracking and GST tax invoices are linked to your account.</p>
          <Link href="/auth?next=%2Fcheckout" className="btn-shine specular-sheen mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#7CB518] to-[#5A8010] text-white text-body-md font-extrabold px-8 py-3 rounded-xl hover:opacity-95 transition-all shadow-cyber-green hover:scale-105 active:scale-95">
            Login / Sign up →
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-header bg-[#0b0318]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/cart" aria-label="Back to cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-body-lg font-bold text-white">Checkout</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <div className="h-16 w-16 rounded-2xl bg-[#F0ECF9] flex items-center justify-center mx-auto mb-4 border border-[#DDD6EE]">
            <ShoppingCart className="h-8 w-8 text-[#9B8CB5]" />
          </div>
          <h2 className="text-title-md font-bold text-[#150726]">Your cart is empty</h2>
          <Link href="/products" className="btn-shine mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#7CB518] to-[#5A8010] text-white text-body-sm font-bold px-6 py-2.5 rounded-full hover:opacity-95 transition-all shadow-cyber-green">
            <ArrowLeft className="h-4 w-4" /> Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="fx-page min-h-screen bg-[#F8F6FC]">
        <header className={`sticky top-0 z-header bg-[#0b0318]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <h1 className="text-body-lg font-bold text-white">Order Confirmed</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[640px] py-14 text-center px-4">
          <div className="card-2028 specular-sheen rounded-3xl border border-[#DDD6EE] bg-white p-8 shadow-xl">
            <div className="relative h-20 w-20 rounded-full bg-[#7CB518]/15 border border-[#7CB518]/40 flex items-center justify-center mx-auto mb-5 shadow-cyber-green">
              <CheckCircle2 className="h-10 w-10 text-[#7CB518]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#7CB518]"></span>
              </span>
            </div>

            <h2 className="text-title-lg font-black text-[#150726]">Order Placed Successfully!</h2>
            <p className="text-body-sm text-[#9B8CB5] mt-1.5">
              Your materials order has been dispatched to our nearest fulfillment hub.
            </p>

            {/* Order ID Tag with instant copy */}
            <div className="mt-5 inline-flex items-center gap-2 bg-[#F0ECF9] px-4 py-2 rounded-xl border border-[#2D1B69]/20">
              <span className="text-caption font-bold text-[#2D1B69]">Order ID:</span>
              <span className="font-mono text-body-sm font-extrabold text-[#150726]">{orderId}</span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="ml-1 text-tiny font-bold text-[#2D1B69] hover:text-[#7CB518] transition-colors flex items-center gap-1"
                title="Copy Order ID"
              >
                {copiedOrderId ? <Check className="h-3.5 w-3.5 text-[#7CB518]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {serverTotal !== null && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-[#F0F9E8] px-4 py-1.5 text-body-sm font-extrabold text-[#5A8010] border border-[#7CB518]/30">
                  Amount: {formatINR2(serverTotal)} (server-verified)
                </span>
              </div>
            )}

            {/* Delivery Telemetry HUD preview */}
            <div className="mt-6 rounded-2xl bg-[#0b0318] p-4 text-left border border-white/10 shadow-glass-elevated">
              <div className="flex items-center justify-between text-white mb-2">
                <div className="flex items-center gap-2 text-caption font-bold text-[#00BCD4]">
                  <Truck className="h-4 w-4" />
                  <span>Express Site Dispatch</span>
                </div>
                <span className="text-tiny font-bold text-[#7CB518] bg-[#7CB518]/20 px-2.5 py-0.5 rounded-full border border-[#7CB518]/40">
                  ETA: {slot?.time ?? "60 minutes"}
                </span>
              </div>
              <p className="text-tiny text-white/70">
                Live GPS rider telemetry and digital GST invoice are ready in your order dashboard.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link
                href={`/orders/${orderId}`}
                className="btn-shine specular-sheen bg-[#2D1B69] text-white text-body-sm font-extrabold px-6 py-3 rounded-xl hover:bg-[#1E1245] transition-all shadow-cyber-purple"
              >
                Track Live Order →
              </Link>
              <Link
                href="/products"
                className="bg-white text-[#150726] text-body-sm font-bold px-6 py-3 rounded-xl border border-[#DDD6EE] hover:border-[#2D1B69] transition-all hover:bg-[#F8F6FC]"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      <header className={`sticky top-0 z-header bg-[#0b0318]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/cart" aria-label="Back to cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1">
            <h1 className="text-body-lg font-bold text-white flex items-center gap-2">
              <span>Checkout</span>
              <span className="text-tiny text-[#7CB518] font-bold bg-[#7CB518]/15 px-2 py-0.5 rounded-full border border-[#7CB518]/30">
                1-Step Fast Checkout
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-tiny text-white/70">
            <ShieldCheck className="h-4 w-4 text-[#7CB518]" />
            <span className="hidden sm:inline">256-Bit Encrypted</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 lg:pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            {/* 1 · Address Section */}
              <Reveal>
              <div className="card-2028 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-[#2D1B69] text-white text-tiny font-black flex items-center justify-center shadow-xs">1</span>
                    <MapPin className="h-4 w-4 text-[#2D1B69]" /> Delivery Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      addAddress({
                        label: "Test Site Alpha",
                        name: "Demo Tester",
                        phone: "9876543210",
                        line1: "Plot 42, Sector 62, Industrial Area",
                        city: "Noida",
                        state: "Uttar Pradesh",
                        pincode: "201301",
                        type: "site",
                        isDefault: true,
                      });
                      toast.success("Test address added!", "Pre-filled and selected for checkout");
                      setShowAddAddress(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#7CB518]/15 px-3 py-1 text-tiny font-extrabold text-[#7CB518] hover:bg-[#7CB518]/25 transition-all border border-[#7CB518]/30 cursor-pointer shadow-xs"
                  >
                    ⚡ Quick Test Address
                  </button>
                </div>
                <div className="space-y-2.5">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      selectedAddressId === addr.id ? "border-[#2D1B69] bg-[#F0ECF9]/70 shadow-xs" : "border-[#DDD6EE] hover:border-[#C9B8E8]"
                    }`}>
                      <button onClick={() => selectAddress(addr.id)} className="flex-1 text-left flex items-start gap-3">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAddressId === addr.id ? "border-[#2D1B69]" : "border-[#DDD6EE]"
                        }`}>
                          {selectedAddressId === addr.id && <div className="h-2 w-2 rounded-full bg-[#2D1B69]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-caption font-extrabold text-[#150726]">{addr.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-tiny font-bold bg-[#F0ECF9] text-[#2D1B69] uppercase">{addr.type}</span>
                            {addr.isDefault && <span className="px-1.5 py-0.5 rounded bg-[#7CB518]/15 text-tiny font-bold text-[#7CB518]">DEFAULT</span>}
                          </div>
                          <p className="text-caption text-[#150726] mt-0.5 font-medium">{addr.name} · {addr.phone}</p>
                          <p className="text-micro text-[#9B8CB5]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr.id)} className="p-1.5 rounded-lg text-[#9B8CB5] hover:text-[#7CB518] hover:bg-white transition-colors" title="Set as default">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteAddress(addr.id)} className="p-1.5 rounded-lg text-[#9B8CB5] hover:text-red-500 hover:bg-white transition-colors" title="Delete">
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
                    <button onClick={() => setShowAddAddress(true)} className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-[#DDD6EE] text-caption font-bold text-[#9B8CB5] hover:border-[#2D1B69] hover:text-[#2D1B69] hover:bg-[#F8F6FC] transition-all">
                      <Plus className="h-4 w-4" /> Add New Address
                    </button>
                  )}
                </div>
              </div>
              </Reveal>

            {/* 2 · Delivery Slot Section */}
              <Reveal>
              <div className="card-2028 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2.5 mb-3.5">
                  <span className="h-6 w-6 rounded-full bg-[#2D1B69] text-white text-tiny font-black flex items-center justify-center shadow-xs">2</span>
                  <Clock className="h-4 w-4 text-[#2D1B69]" /> Delivery Slot
                </h3>

                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-3.5 w-3.5 text-[#7CB518]" />
                    <p className="text-micro font-extrabold text-[#7CB518] uppercase">Express 60-Minute Slots</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {slots.filter((s) => s.type === "express").map((s) => {
                      const now = new Date();
                      const hour = now.getHours();
                      const isAvailable = s.id === "express-30" || s.id === "express-60" ? (hour >= 8 && hour < 22) : true;
                      return (
                        <button key={s.id} onClick={() => isAvailable && selectSlot(s.id)} disabled={!isAvailable} className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                          !isAvailable ? "border-[#E8E0F7] bg-[#F8F6FC] opacity-50 cursor-not-allowed" :
                          selectedSlotId === s.id ? "border-[#7CB518] bg-[#7CB518]/10 shadow-xs shadow-green-500/10" : "border-[#DDD6EE] hover:border-[#C9B8E8]"
                        }`}>
                          <div className="flex items-center gap-2">
                            <Zap className={`h-3.5 w-3.5 ${selectedSlotId === s.id ? "text-[#7CB518]" : "text-[#9B8CB5]"}`} />
                            <span className="text-caption font-bold text-[#150726]">{s.label}</span>
                          </div>
                          <p className="text-micro text-[#9B8CB5] mt-1">{s.time}</p>
                          {s.fee > 0 && <p className="text-tiny font-bold text-[#E91E63] mt-0.5">+₹{s.fee}</p>}
                          {s.fee === 0 && <p className="text-tiny font-extrabold text-[#7CB518] mt-0.5">FREE</p>}
                          {!isAvailable && <p className="text-tiny font-bold text-[#9B8CB5] mt-0.5">Unavailable now</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-micro font-bold text-[#9B8CB5] uppercase mb-2">Standard & Scheduled Delivery</p>
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

            {/* 3 · Business GSTIN */}
              <Reveal>
                <div className="card-2028 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2.5 mb-2">
                    <span className="h-6 w-6 rounded-full bg-[#2D1B69] text-white text-tiny font-black flex items-center justify-center shadow-xs">3</span>
                    <FileText className="h-4 w-4 text-[#2D1B69]" /> Business Details &amp; GSTIN (Optional)
                  </h3>
                  <p className="text-micro text-[#9B8CB5] mb-3">Provide your registered GSTIN to claim 100% input tax credit (ITC) on all orders.</p>
                  <div className="relative">
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      placeholder="15-digit GSTIN e.g. 27AABCU9603R1ZM"
                      maxLength={15}
                      inputMode="text"
                      className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-[#DDD6EE] text-body-lg font-mono font-semibold tracking-wider focus:outline-none focus:border-[#2D1B69] uppercase"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tiny font-bold text-[#9B8CB5] tabular-nums">{gstin.length}/15</span>
                  </div>
                  {gstin.length > 0 && gstin.length < 15 && (
                    <p className="text-tiny text-red-500 mt-1.5 font-medium">GSTIN must be 15 characters</p>
                  )}
                  {gstin.length === 15 && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) && (
                    <p className="text-tiny text-red-500 mt-1.5 font-medium">Invalid GSTIN format — verify state code, PAN and checksum</p>
                  )}
                  {gstin.length === 15 && /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) && (
                    <p className="text-micro text-[#7CB518] font-bold mt-2 flex items-center gap-1.5 bg-[#F0F9E8] px-3 py-1 rounded-lg border border-[#7CB518]/25">
                      <Check className="h-3.5 w-3.5 text-[#7CB518]" /> GST B2B tax invoice will be generated
                    </p>
                  )}
                </div>

                {/* 4 · Coupon */}
                <div className="card-2028 mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2.5 mb-3">
                    <span className="h-6 w-6 rounded-full bg-[#2D1B69] text-white text-tiny font-black flex items-center justify-center shadow-xs">4</span>
                    <Tag className="h-4 w-4 text-[#E91E63]" /> Apply Coupon
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#7CB518]/10 border border-[#7CB518]/30">
                      <div>
                        <span className="text-body-sm font-extrabold text-[#7CB518]">{appliedCoupon.code}</span>
                        <p className="text-micro text-[#9B8CB5]">{appliedCoupon.description}</p>
                      </div>
                      <button onClick={removeCoupon} aria-label="Remove coupon" className="p-1 text-[#9B8CB5] hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 items-stretch">
                        <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} placeholder="Enter coupon code" className="flex-1 min-w-0 px-3.5 h-11 rounded-xl border border-[#DDD6EE] text-body-lg font-mono font-semibold uppercase tracking-wider focus:outline-none focus:border-[#2D1B69]" />
                        <button onClick={handleApplyCoupon} className="px-5 h-11 inline-flex items-center justify-center rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245] transition-all flex-shrink-0 shadow-xs">Apply</button>
                      </div>
                      {couponError && <p className="text-micro text-red-500 mt-2 font-medium">{couponError}</p>}
                      {bestCoupon && (
                        <button onClick={() => { applyCoupon(bestCoupon.code, subtotal); toast.success("Coupon applied!", `Best offer ${bestCoupon.code} applied`); }} className="mt-2.5 w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#FFF6DE] border border-[#F8CB46] text-left hover:bg-[#F8CB46]/20 transition-all">
                          <Gift className="h-4 w-4 text-[#150726]" />
                          <div>
                            <span className="text-micro font-bold text-[#150726]">Best offer: {bestCoupon.code}</span>
                            <p className="text-tiny text-[#9B8CB5]">{bestCoupon.description}</p>
                          </div>
                        </button>
                      )}
                      {/* All live offers */}
                      <div className="mt-2.5 flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-1">
                        {availableCoupons.filter((c) => c.active).map((c) => (
                          <button
                            key={c.code}
                            onClick={() => {
                              const res = applyCoupon(c.code, subtotal);
                              if (res.success) toast.success("Coupon applied!", `${c.code} applied to your order`);
                              else toast.error("Coupon not applicable", res.message);
                            }}
                            className="snap-start shrink-0 flex items-center gap-2 rounded-xl border border-dashed border-[#7CB518]/50 bg-[#F0F9E8] px-3 py-2 text-left hover:border-[#7CB518] active:scale-95 transition-all"
                          >
                            <Tag className="h-4 w-4 text-[#5A8010] flex-shrink-0" />
                            <span>
                              <span className="block text-caption font-black text-[#150726] tracking-wide">{c.code}</span>
                              <span className="block text-tiny text-[#5C4A7A] whitespace-nowrap">{c.description}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* 5 · Order Items */}
                <div className="card-2028 mt-4 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                  <h3 className="text-body-md font-bold text-[#150726] flex items-center gap-2.5 mb-3.5">
                    <span className="h-6 w-6 rounded-full bg-[#2D1B69] text-white text-tiny font-black flex items-center justify-center shadow-xs">5</span>
                    <Package className="h-4 w-4 text-[#2D1B69]" /> Order Items ({items.length})
                  </h3>
                  <div className="space-y-2.5">
                    {items.map((item) => {
                      const unitPrice = getBulkUnitPrice(item);
                      const variant = item.variantId ? item.product.variants?.find((v) => v.id === item.variantId) : null;
                      const mrp = variant?.mrp ?? item.product.mrp;
                      const discount = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;
                      return (
                        <div key={`${item.product.id}:${item.variantId || "default"}`} className="flex gap-3 p-3 rounded-xl bg-[#F8F6FC] border border-[#DDD6EE]/60">
                          <ProductThumb src={item.product.images[0]} alt={item.product.name} className="h-14 w-14 rounded-lg object-contain bg-[#F0ECF9] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-micro font-semibold text-[#2D1B69]">{item.product.brand}</p>
                            <p className="text-caption font-semibold text-[#150726] truncate">{item.product.name}</p>
                            {variant && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-tiny font-bold text-[#2D1B69]">{variant.label}</span>}
                            {item.shade && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-tiny font-bold text-[#2D1B69] ml-1">{item.shade}</span>}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-caption font-bold text-[#150726]">{formatINR2(unitPrice)}</span>
                              {discount > 0 && <span className="text-tiny font-bold text-[#E91E63]">{discount}% OFF</span>}
                              <span className="text-tiny text-[#9B8CB5]">× {item.quantity}</span>
                            </div>
                          </div>
                          <p className="text-body-sm font-bold text-[#150726] whitespace-nowrap">{formatINR2(unitPrice * item.quantity)}</p>
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
              <div className="card-2028 rounded-2xl border border-[#DDD6EE] bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-caption text-[#150726]">
                  <Clock className="h-4 w-4 text-[#7CB518]" />
                  <span>Delivery: <span className="font-extrabold text-[#7CB518]">{slot?.label ?? "60 min Express"}</span></span>
                </div>
                {selectedAddr && (
                  <div className="flex items-start gap-2 mt-2 text-micro text-[#9B8CB5]">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#2D1B69]" />
                    <span>{selectedAddr.line1}, {selectedAddr.city} - {selectedAddr.pincode}</span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="card-2028 rounded-2xl border border-[#E5DCF3] bg-white p-5 shadow-sm">
                <h4 className="text-body-md font-extrabold tracking-tight text-[#150726] mb-3">Price Summary</h4>
                <div className="space-y-2.5 tabular-nums">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Subtotal</span>
                    <span className="text-[#150726] font-medium">{formatINR2(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">GST</span>
                    <span className="text-[#150726] font-medium">{formatINR2(gst)}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Shipping</span>
                    <span className={effectiveShipping === 0 ? "text-[#7CB518] font-bold" : "text-[#150726] font-medium"}>
                      {effectiveShipping === 0 ? "FREE" : formatINR2(effectiveShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[#9B8CB5]">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-[#7CB518] font-bold" : "text-[#150726] font-medium"}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-body-sm">
                      <span className="text-[#7CB518]">Coupon ({appliedCoupon?.code})</span>
                      <span className="text-[#7CB518] font-extrabold">-{formatINR2(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#EDE7F6] pt-3 mt-1 flex justify-between items-baseline">
                    <span className="text-body-lg font-black tracking-tight text-[#150726]">Total Amount</span>
                    <span className="text-title-lg font-black tracking-tight text-[#2D1B69]">{formatINR2(total)}</span>
                  </div>
                </div>
              </div>

              {/* 6 · Pay */}
              <PaymentSection
                total={total}
                onPaymentComplete={handlePlaceOrder}
                gstin={gstin || undefined}
                shippingAddress={(selectedAddr ?? null) as Record<string, unknown> | null}
                couponCode={appliedCoupon?.code}
                clientReference={attemptKeyRef.current ?? undefined}
              />
              {!selectedAddr && (
                <p className="mt-2 text-center text-micro font-bold text-[#9B8CB5]">
                  Select or add a delivery address above to proceed to payment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
