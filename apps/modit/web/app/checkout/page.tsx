"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Check, Plus, Package, Truck, Clock, CheckCircle2, ShoppingCart,
  Tag, Wallet, Calendar, Zap, X, Trash2, Gift, Repeat
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAddressStore, type Address } from "@/lib/address-store";
import { useDeliveryStore } from "@/lib/delivery-store";
import { useCouponStore } from "@/lib/coupon-store";
import { useWalletStore } from "@/lib/wallet-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { PaymentSection } from "@/components/payment-checkout";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartGST = useCartStore((s) => s.getCartGST);
  const getCartShipping = useCartStore((s) => s.getCartShipping);
  const clearCart = useCartStore((s) => s.clearCart);

  const { addresses, selectedAddressId, selectAddress, addAddress, deleteAddress, setDefault, getSelected } = useAddressStore();
  const { selectedSlotId, slots, selectSlot, getSelected: getSlot } = useDeliveryStore();
  const { appliedCoupon, couponError, applyCoupon, removeCoupon, getDiscount, getBestCoupon } = useCouponStore();
  const { balance, points, addPoints, deductBalance } = useWalletStore();
  const { addSubscription } = useSubscriptionStore();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [subscribeFreq, setSubscribeFreq] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [newAddr, setNewAddr] = useState({ label: "", name: "", phone: "", line1: "", city: "", state: "", pincode: "", type: "site" as Address["type"] });
  const [activeStep, setActiveStep] = useState(1);
  const [addressError, setAddressError] = useState("");

  const subtotal = getCartTotal();
  const gst = getCartGST();
  const shipping = getCartShipping();
  const slot = getSlot();
  const deliveryFee = slot?.fee ?? 0;
  const couponDiscount = getDiscount(subtotal);
  const isFreeShipping = appliedCoupon?.discountType === "free_shipping";
  const effectiveShipping = isFreeShipping ? 0 : shipping;
  const walletDeduct = useWallet ? Math.min(balance, subtotal + gst + effectiveShipping + deliveryFee - couponDiscount) : 0;
  const total = Math.max(0, subtotal + gst + effectiveShipping + deliveryFee - couponDiscount - walletDeduct);
  const bestCoupon = getBestCoupon(subtotal);
  const selectedAddr = getSelected();

  const handleApplyCoupon = () => {
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim().toUpperCase(), subtotal);
      setCouponInput("");
    }
  };

  const handlePlaceOrder = (apiOrderId?: string) => {
    const id = apiOrderId || `ORD-${Date.now().toString(36).toUpperCase()}`;
    const cartItems = [...items];
    if (subscribe) {
      cartItems.forEach((item) => addSubscription(item.product, item.quantity, subscribeFreq, item.variantId));
    }
    if (useWallet && walletDeduct > 0) deductBalance(walletDeduct, `Order ${id}`);
    addPoints(Math.floor(total / 10), `Points for order ${id}`);
    removeCoupon();
    clearCart();
    setOrderId(id);
    setOrderPlaced(true);
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F8F6FC]">
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-[16px] font-bold text-white">Checkout</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-[#9B8CB5]/30 mx-auto mb-4" />
          <h2 className="text-[18px] font-bold text-[#150726]">Your cart is empty</h2>
          <Link href="/products" className="mt-4 inline-flex items-center gap-2 bg-[#7CB518] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F8F6FC]">
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <h1 className="text-[16px] font-bold text-white">Order Confirmed</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <div className="h-20 w-20 rounded-full bg-[#7CB518]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-[#7CB518]" />
          </div>
          <h2 className="text-[22px] font-bold text-[#150726]">Order Placed!</h2>
          <p className="text-[13px] text-[#9B8CB5] mt-2">Your order <span className="font-bold text-[#2D1B69]">{orderId}</span> has been placed successfully.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[#7CB518] font-semibold">
            <Truck className="h-4 w-4" /> Estimated delivery: {slot?.time ?? "60 minutes"}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[#2D1B69]">
            <Wallet className="h-4 w-4" /> +{Math.floor(total / 10)} points earned
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href={`/orders/${orderId}`} className="bg-[#2D1B69] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#1E1245] transition-all">
              Track Order
            </Link>
            <Link href="/products" className="bg-white text-[#150726] text-[13px] font-bold px-6 py-2.5 rounded-full border border-[#DDD6EE] hover:border-[#2D1B69] transition-all">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/cart" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-[16px] font-bold text-white">Checkout</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] py-4 sm:px-6">
        {/* Steps */}
        <div className="mb-6 flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {[
            { step: 1, label: "Address" },
            { step: 2, label: "Delivery" },
            { step: 3, label: "Payment" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center flex-shrink-0">
              <button onClick={() => setActiveStep(s.step)} className={`flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold transition-all ${
                s.step === activeStep ? "bg-[#7CB518] text-white" : s.step < activeStep ? "bg-[#7CB518]/20 text-[#7CB518]" : "bg-white text-[#9B8CB5] border border-[#E8E0F7]"
              }`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.step < activeStep ? "bg-[#7CB518] text-white" : s.step === activeStep ? "bg-white/20" : "bg-[#F0ECF9]"}`}>
                  {s.step < activeStep ? "✓" : s.step}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < 2 && <div className="w-6 h-px bg-[#E8E0F7] mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            {/* Address Section */}
            {activeStep === 1 && (
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
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
                            <span className="text-[12px] font-bold text-[#150726]">{addr.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F0ECF9] text-[#2D1B69] uppercase">{addr.type}</span>
                            {addr.isDefault && <span className="px-1.5 py-0.5 rounded bg-[#7CB518]/10 text-[9px] font-bold text-[#7CB518]">DEFAULT</span>}
                          </div>
                          <p className="text-[12px] text-[#150726] mt-0.5">{addr.name} · {addr.phone}</p>
                          <p className="text-[11px] text-[#9B8CB5]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}</p>
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
                    <div className="p-4 rounded-xl border-2 border-[#2D1B69] bg-[#F8F6FC] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#150726]">New Address</span>
                        <button onClick={() => setShowAddAddress(false)} className="text-[#9B8CB5] hover:text-[#150726]"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newAddr.type} onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value as Address["type"] })} className="col-span-2 px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]">
                          <option value="site">Construction Site</option>
                          <option value="home">Home</option>
                          <option value="warehouse">Warehouse</option>
                          <option value="office">Office</option>
                        </select>
                        <input placeholder="Label (e.g. Site A)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="Full Name" value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="Phone" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="6-digit Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="Address Line 1" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                        <input placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] focus:outline-none focus:border-[#2D1B69]" />
                      </div>
                      {addressError && <p className="text-[11px] text-red-500">{addressError}</p>}
                      <button onClick={() => {
                        if (!newAddr.label || !newAddr.name || !newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
                          setAddressError("Please fill in all required fields");
                          return;
                        }
                        if (newAddr.pincode.length !== 6) {
                          setAddressError("Pincode must be 6 digits");
                          return;
                        }
                        if (newAddr.phone && newAddr.phone.length !== 10) {
                          setAddressError("Phone must be 10 digits");
                          return;
                        }
                        setAddressError("");
                        addAddress({ ...newAddr, isDefault: addresses.length === 0 });
                        setNewAddr({ label: "", name: "", phone: "", line1: "", city: "", state: "", pincode: "", type: "site" });
                        setShowAddAddress(false);
                      }} className="w-full py-2 rounded-lg bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245] transition-all">
                        Save Address
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddAddress(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#DDD6EE] text-[12px] font-semibold text-[#9B8CB5] hover:border-[#2D1B69] hover:text-[#2D1B69] transition-all">
                      <Plus className="h-4 w-4" /> Add New Address
                    </button>
                  )}
                </div>
                <button onClick={() => {
                  if (!selectedAddr) {
                    setAddressError("Please select or add a delivery address");
                    return;
                  }
                  setAddressError("");
                  setActiveStep(2);
                }} className="mt-4 w-full py-2.5 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all">
                  Continue to Delivery
                </button>
                {addressError && !showAddAddress && <p className="text-[11px] text-red-500 mt-2">{addressError}</p>}
              </div>
            )}

            {/* Delivery Slot Section */}
            {activeStep === 2 && (
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[#2D1B69]" /> Delivery Time
                </h3>

                <div className="mb-4">
                  <p className="text-[11px] font-bold text-[#9B8CB5] uppercase mb-2">Express</p>
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
                            <span className="text-[12px] font-bold text-[#150726]">{s.label}</span>
                          </div>
                          <p className="text-[11px] text-[#9B8CB5] mt-1">{s.time}</p>
                          {s.fee > 0 && <p className="text-[10px] font-bold text-[#E91E63] mt-0.5">+₹{s.fee}</p>}
                          {s.fee === 0 && <p className="text-[10px] font-bold text-[#7CB518] mt-0.5">FREE</p>}
                          {!isAvailable && <p className="text-[10px] font-bold text-[#9B8CB5] mt-0.5">Unavailable now</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#9B8CB5] uppercase mb-2">Standard & Scheduled</p>
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
                            <span className="text-[12px] font-bold text-[#150726]">{s.label}</span>
                            <p className="text-[11px] text-[#9B8CB5]">{s.time}</p>
                          </div>
                          {isAvailable ? (
                            <span className="text-[10px] text-[#9B8CB5]">{s.cutoff}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#E91E63]">Past cutoff</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => setActiveStep(1)} className="flex-1 py-2.5 rounded-xl border border-[#DDD6EE] text-[13px] font-bold text-[#9B8CB5] hover:border-[#2D1B69] transition-all">
                    Back
                  </button>
                  <button onClick={() => setActiveStep(3)} className="flex-1 py-2.5 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all">
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {activeStep === 3 && (
              <>
                {/* Coupon */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-[#E91E63]" /> Apply Coupon
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#7CB518]/5 border border-[#7CB518]/20">
                      <div>
                        <span className="text-[13px] font-bold text-[#7CB518]">{appliedCoupon.code}</span>
                        <p className="text-[11px] text-[#9B8CB5]">{appliedCoupon.description}</p>
                      </div>
                      <button onClick={removeCoupon} className="p-1 text-[#9B8CB5] hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} placeholder="Enter coupon code" className="flex-1 px-3 py-2 rounded-lg border border-[#DDD6EE] text-[12px] font-semibold uppercase tracking-wider focus:outline-none focus:border-[#2D1B69]" />
                        <button onClick={handleApplyCoupon} className="px-4 py-2 rounded-lg bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245] transition-all">Apply</button>
                      </div>
                      {couponError && <p className="text-[11px] text-red-500 mt-2">{couponError}</p>}
                      {bestCoupon && (
                        <button onClick={() => { applyCoupon(bestCoupon.code, subtotal); }} className="mt-2 w-full flex items-center gap-2 p-2 rounded-lg bg-[#E91E63]/5 border border-[#E91E63]/20 text-left hover:bg-[#E91E63]/10 transition-all">
                          <Gift className="h-4 w-4 text-[#E91E63]" />
                          <div>
                            <span className="text-[11px] font-bold text-[#E91E63]">Best offer: {bestCoupon.code}</span>
                            <p className="text-[10px] text-[#9B8CB5]">{bestCoupon.description}</p>
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Wallet */}
                {balance > 0 && (
                  <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[#FF9800]" />
                        <div>
                          <span className="text-[13px] font-bold text-[#150726]">Wallet Balance: ₹{balance.toLocaleString()}</span>
                          <p className="text-[10px] text-[#9B8CB5]">{points} loyalty points</p>
                        </div>
                      </div>
                      <button onClick={() => setUseWallet(!useWallet)} className={`relative w-10 h-5 rounded-full transition-all ${useWallet ? "bg-[#7CB518]" : "bg-[#DDD6EE]"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useWallet ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    {useWallet && walletDeduct > 0 && (
                      <p className="text-[11px] text-[#7CB518] font-semibold mt-2">Using ₹{walletDeduct.toLocaleString()} from wallet</p>
                    )}
                  </div>
                )}

                {/* Subscription */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-[#00BCD4]" />
                      <div>
                        <span className="text-[13px] font-bold text-[#150726]">Subscribe & Save</span>
                        <p className="text-[10px] text-[#9B8CB5]">Auto-reorder these items</p>
                      </div>
                    </div>
                    <button onClick={() => setSubscribe(!subscribe)} className={`relative w-10 h-5 rounded-full transition-all ${subscribe ? "bg-[#00BCD4]" : "bg-[#DDD6EE]"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${subscribe ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                  {subscribe && (
                    <div className="flex gap-2 mt-3">
                      {(["weekly", "biweekly", "monthly"] as const).map((f) => (
                        <button key={f} onClick={() => setSubscribeFreq(f)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                          subscribeFreq === f ? "bg-[#00BCD4] text-white" : "bg-[#F0ECF9] text-[#9B8CB5] hover:bg-[#E8F9FC]"
                        }`}>
                          {f === "weekly" ? "Weekly" : f === "biweekly" ? "Every 2 Weeks" : "Monthly"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                  <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
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
                          <img src={item.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover bg-[#F0ECF9]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#2D1B69]">{item.product.brand}</p>
                            <p className="text-[12px] font-semibold text-[#150726] truncate">{item.product.name}</p>
                            {variant && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-[9px] font-bold text-[#2D1B69]">{variant.label}</span>}
                            {item.shade && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F0ECF9] text-[9px] font-bold text-[#2D1B69] ml-1">{item.shade}</span>}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[12px] font-bold text-[#150726]">₹{itemPrice.toLocaleString()}</span>
                              {discount > 0 && <span className="text-[10px] font-bold text-[#E91E63]">{discount}% OFF</span>}
                              <span className="text-[10px] text-[#9B8CB5]">× {item.quantity}</span>
                            </div>
                          </div>
                          <p className="text-[13px] font-bold text-[#150726] whitespace-nowrap">₹{(itemPrice * item.quantity).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => setActiveStep(2)} className="w-full py-2.5 rounded-xl border border-[#DDD6EE] text-[13px] font-bold text-[#9B8CB5] hover:border-[#2D1B69] transition-all">
                  Back to Delivery
                </button>
              </>
            )}
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Delivery Info */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <div className="flex items-center gap-2 text-[12px] text-[#150726]">
                  <Clock className="h-4 w-4 text-[#7CB518]" />
                  <span>Delivery: <span className="font-bold text-[#7CB518]">{slot?.label ?? "60 min"}</span></span>
                </div>
                {selectedAddr && (
                  <div className="flex items-start gap-2 mt-2 text-[11px] text-[#9B8CB5]">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{selectedAddr.line1}, {selectedAddr.city} - {selectedAddr.pincode}</span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h4 className="text-[14px] font-bold text-[#150726] mb-3">Price Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">Subtotal</span>
                    <span className="text-[#150726]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">GST</span>
                    <span className="text-[#150726]">₹{gst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">Shipping</span>
                    <span className={effectiveShipping === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>
                      {effectiveShipping === 0 ? "FREE" : `₹${effectiveShipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#7CB518]">Coupon ({appliedCoupon?.code})</span>
                      <span className="text-[#7CB518] font-semibold">-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {useWallet && walletDeduct > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#FF9800]">Wallet</span>
                      <span className="text-[#FF9800] font-semibold">-₹{walletDeduct.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DDD6EE] pt-2 flex justify-between">
                    <span className="text-[15px] font-bold text-[#150726]">Total</span>
                    <span className="text-[18px] font-extrabold text-[#2D1B69]">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {activeStep === 3 ? (
                <PaymentSection
                  total={total}
                  onPaymentComplete={handlePlaceOrder}
                />
              ) : (
                <button onClick={() => {
                  if (activeStep === 1 && !selectedAddr) return;
                  setActiveStep(Math.min(activeStep + 1, 3));
                }} className={`w-full py-3 rounded-xl text-white text-[14px] font-bold transition-all shadow-lg ${
                  activeStep === 1 && !selectedAddr
                    ? "bg-[#9B8CB5] cursor-not-allowed shadow-none"
                    : "bg-[#7CB518] hover:bg-[#6A9C14] shadow-green-500/25"
                }`}>
                  {activeStep === 1 ? "Continue to Delivery" : "Continue to Payment"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
