"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Check, Plus, Package, Truck, Shield, Clock, CheckCircle2, ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { PaymentSection } from "@/components/payment-checkout";

const demoAddresses = [
  { id: "a1", label: "Site Office", name: "Rajesh Kumar", phone: "+91 98765 43210", line1: "42, MG Road, Near Metro Station", city: "Mumbai", state: "Maharashtra", pincode: "400001", isDefault: true },
  { id: "a2", label: "Warehouse", name: "Rajesh Kumar", phone: "+91 98765 43210", line1: "15, Industrial Area Phase 2", city: "Mumbai", state: "Maharashtra", pincode: "400070", isDefault: false },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartGST = useCartStore((s) => s.getCartGST);
  const getCartShipping = useCartStore((s) => s.getCartShipping);
  const [selectedAddress, setSelectedAddress] = useState("a1");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const subtotal = getCartTotal();
  const gst = getCartGST();
  const shipping = getCartShipping();
  const total = subtotal + gst + shipping;

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
        <div className="mx-auto max-w-[600px] py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-[#7CB518]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-[#7CB518]" />
          </div>
          <h2 className="text-[22px] font-bold text-[#150726]">Order Placed!</h2>
          <p className="text-[13px] text-[#9B8CB5] mt-2">Your order <span className="font-bold text-[#2D1B69]">{orderId}</span> has been placed successfully.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[#7CB518] font-semibold">
            <Truck className="h-4 w-4" /> Estimated delivery: 60 minutes
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
        {/* Checkout Steps */}
        <div className="mb-6 flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {[
            { step: 1, label: "Address", done: true },
            { step: 2, label: "Delivery", done: false },
            { step: 3, label: "Payment", done: false },
            { step: 4, label: "Confirm", done: false },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold transition-all ${
                s.step === 1
                  ? "bg-[#7CB518] text-white"
                  : "bg-white text-[#9B8CB5] border border-[#E8E0F7]"
              }`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  s.step === 1 ? "bg-white/20" : "bg-[#F0ECF9]"
                }`}>
                  {s.done ? "✓" : s.step}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && <div className="w-6 h-px bg-[#E8E0F7] mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left — Address + Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Delivery Address */}
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
              <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-[#2D1B69]" /> Delivery Address
              </h3>
              <div className="space-y-2">
                {demoAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedAddress === addr.id
                        ? "border-[#2D1B69] bg-[#F0ECF9]"
                        : "border-[#DDD6EE] hover:border-[#C9B8E8]"
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAddress === addr.id ? "border-[#2D1B69]" : "border-[#DDD6EE]"
                    }`}>
                      {selectedAddress === addr.id && <div className="h-2 w-2 rounded-full bg-[#2D1B69]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-[#150726]">{addr.label}</span>
                        {addr.isDefault && <span className="px-1.5 py-0.5 rounded bg-[#7CB518]/10 text-[9px] font-bold text-[#7CB518]">DEFAULT</span>}
                      </div>
                      <p className="text-[12px] text-[#150726] mt-0.5">{addr.name} · {addr.phone}</p>
                      <p className="text-[11px] text-[#9B8CB5]">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </button>
                ))}
                <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#DDD6EE] text-[12px] font-semibold text-[#9B8CB5] hover:border-[#2D1B69] hover:text-[#2D1B69] transition-all">
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
              <h3 className="text-[14px] font-bold text-[#150726] flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#2D1B69]" /> Order Items ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const discount = item.product.mrp > item.product.price
                    ? Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100)
                    : 0;
                  return (
                    <div key={item.product.id} className="flex gap-3 p-3 rounded-xl bg-[#F8F6FC]">
                      <img src={item.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover bg-[#F0ECF9]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#2D1B69]">{item.product.brand}</p>
                        <p className="text-[12px] font-semibold text-[#150726] truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[12px] font-bold text-[#150726]">₹{item.product.price.toLocaleString()}</span>
                          {discount > 0 && <span className="text-[10px] font-bold text-[#E91E63]">{discount}% OFF</span>}
                          <span className="text-[10px] text-[#9B8CB5]">× {item.quantity}</span>
                        </div>
                      </div>
                      <p className="text-[13px] font-bold text-[#150726] whitespace-nowrap">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Payment */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Delivery Info */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <div className="flex items-center gap-2 text-[12px] text-[#150726]">
                  <Clock className="h-4 w-4 text-[#7CB518]" />
                  <span>Estimated delivery in <span className="font-bold text-[#7CB518]">60 minutes</span></span>
                </div>
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
                    <span className="text-[#9B8CB5]">Delivery</span>
                    <span className={shipping === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726]"}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="border-t border-[#DDD6EE] pt-2 flex justify-between">
                    <span className="text-[15px] font-bold text-[#150726]">Total</span>
                    <span className="text-[18px] font-extrabold text-[#2D1B69]">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <PaymentSection
                total={total}
                onPaymentComplete={(id) => {
                  setOrderId(id);
                  setOrderPlaced(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
