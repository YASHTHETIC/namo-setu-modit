"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { placeOrder } from "@/lib/hybrid-api";
import { Shield, Truck, Clock, Check, CreditCard, Banknote, Smartphone } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentProps {
  total: number;
  onPaymentComplete: (orderId: string) => void;
}

export function PaymentSection({ total, onPaymentComplete }: PaymentProps) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | "upi">("razorpay");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "razorpay",
      };

      const result = await placeOrder(orderData);
      if (result.success && result.orderId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_demo",
          amount: total * 100,
          currency: "INR",
          name: "MODIT",
          description: `Order ${result.orderId}`,
          order_id: result.orderId,
          handler: function (response: any) {
            clearCart();
            onPaymentComplete(result.orderId!);
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#2D1B69",
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            },
          },
        };

        if (typeof window !== "undefined" && window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          clearCart();
          onPaymentComplete(result.orderId);
        }
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCOD = async () => {
    setProcessing(true);
    try {
      const result = await placeOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "cod",
      });
      if (result.success && result.orderId) {
        clearCart();
        onPaymentComplete(result.orderId);
      }
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUPI = async () => {
    setProcessing(true);
    try {
      const result = await placeOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "upi",
      });
      if (result.success && result.orderId) {
        clearCart();
        onPaymentComplete(result.orderId);
      }
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods */}
      <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <h4 className="text-[14px] font-bold text-[#150726] mb-3">Payment Method</h4>
        <div className="space-y-2">
          {[
            { id: "razorpay", label: "UPI / Card / Netbanking", icon: CreditCard, desc: "Powered by Razorpay" },
            { id: "upi", label: "Pay by UPI ID", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm" },
            { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when order arrives" },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                paymentMethod === method.id
                  ? "border-[#2D1B69] bg-[#F0ECF9]"
                  : "border-[#DDD6EE] hover:border-[#C9B8E8]"
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                paymentMethod === method.id ? "bg-[#2D1B69] text-white" : "bg-[#F0ECF9] text-[#2D1B69]"
              }`}>
                <method.icon className="h-5 w-5" />
              </div>
              <div className="text-left flex-1">
                <p className="text-[13px] font-semibold text-[#150726]">{method.label}</p>
                <p className="text-[11px] text-[#9B8CB5]">{method.desc}</p>
              </div>
              {paymentMethod === method.id && (
                <Check className="h-5 w-5 text-[#2D1B69]" />
              )}
            </button>
          ))}
        </div>

        {/* UPI ID Input */}
        {paymentMethod === "upi" && (
          <div className="mt-3">
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full border-2 border-[#DDD6EE] rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all"
            />
          </div>
        )}
      </div>

      {/* Place Order Button */}
      <button
        onClick={paymentMethod === "razorpay" ? handleRazorpayPayment : paymentMethod === "cod" ? handleCOD : handleUPI}
        disabled={processing || items.length === 0}
        className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : paymentMethod === "cod" ? (
          `Place Order — ₹${total.toLocaleString("en-IN")}`
        ) : (
          `Pay ₹${total.toLocaleString("en-IN")}`
        )}
      </button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-[#9B8CB5]">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 256-bit SSL</span>
        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Free ₹5000+</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 7-day returns</span>
      </div>
    </div>
  );
}
