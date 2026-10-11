"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { placeOrder, checkServerUp, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/hybrid-api";
import { useToast } from "@foundation/ui";
import { formatINR2 } from "@/lib/utils";
import { Shield, Truck, Clock, Check, CreditCard, Banknote, Smartphone, Building2 } from "lucide-react";
import { notifyOrderEvent } from "@/lib/order-notifications";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentProps {
  total: number;
  onPaymentComplete: (orderId: string, serverTotal?: number) => void;
  gstin?: string;
  shippingAddress?: Record<string, unknown> | null;
  couponCode?: string;
  clientReference?: string;
}

export function PaymentSection({ total, onPaymentComplete, gstin, shippingAddress, couponCode, clientReference }: PaymentProps) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | "upi" | "credit">(() => {
    try {
      const saved = localStorage.getItem("modit_pay_method");
      return saved === "cod" || saved === "upi" || saved === "credit" ? saved : "razorpay";
    } catch {
      return "razorpay";
    }
  });

  const chooseMethod = (m: "razorpay" | "cod" | "upi" | "credit") => {
    setPaymentMethod(m);
    try {
      localStorage.setItem("modit_pay_method", m);
    } catch { /* ignore */ }
  };
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Server reachability probe — a dead API fails fast here instead of at tap.
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const pingServer = () => {
    setServerUp(null);
    checkServerUp().then(setServerUp);
  };
  useEffect(() => {
    pingServer();
  }, []);

  const cartPayload = () => ({
    items: items.map((i) => ({
      sku: i.product.sku,
      quantity: i.quantity,
    })),
    addressSnapshot: shippingAddress,
    gstin,
    couponCode,
    clientReference,
  });

  const handleCredit = async () => {
    setError(null);
    setProcessing(true);
    try {
      const result = await placeOrder({ ...cartPayload(), paymentMethod: "credit" });
      if (result.success && result.orderId) {
        const due = result.total ?? total;
        clearCart();
        toast.success("Order placed!", `Order ${result.orderNumber ?? result.orderId} confirmed — credit terms (net 30 days)`);
        notifyOrderEvent({
          title: "Order placed (Credit)",
          body: `Order ${result.orderId} confirmed on Net-30 credit terms — invoice due in 30 days from delivery.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId, due);
      } else {
        // Single error surface: the inline box below. (No toast here —
        // one tap must never stack two "Order failed" popups.)
        setError(result.error || "Failed to place order. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setError(null);
    setProcessing(true);
    try {
      // 1. Real server order first (server prices/tax/shipping/coupons).
      const result = await placeOrder({ ...cartPayload(), paymentMethod: "razorpay" });
      if (!result.success || !result.orderId) {
        setError(result.error || "Failed to create order. Please try again.");
        setProcessing(false);
        return;
      }
      // 2. Server-side Razorpay order (amount from the server order, never the client).
      let rzp: { key_id: string; razorpay_order_id: string; amount_paise: number; currency: string };
      try {
        rzp = await createRazorpayOrder(result.orderId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment setup failed. Your order is saved — retry from Orders.");
        setProcessing(false);
        return;
      }
      const due = result.total ?? total;
      const options = {
        key: rzp.key_id,
        amount: rzp.amount_paise,
        currency: rzp.currency,
        name: "MODIT",
        description: `Order ${result.orderId}`,
        order_id: rzp.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verification = await verifyRazorpayPayment({
              orderId: result.orderId!,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (!verification.verified) throw new Error("verification failed");
            clearCart();
            toast.success("Payment successful!", `Order ${result.orderId} confirmed`);
            notifyOrderEvent({
              title: "Payment successful",
              body: `Order ${result.orderId} confirmed — ${formatINR2(due)} paid online. Receipt and GST invoice available on the order page.`,
              type: "payment",
              orderId: result.orderId,
            });
            onPaymentComplete(result.orderId!, due);
          } catch {
            setError("Payment verification failed. If money was debited it will auto-refund. Your order is saved — retry from Orders.");
            setProcessing(false);
          }
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
        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on("payment.failed", function () {
          setError("Payment failed. Your order is saved — retry payment from Orders. Nothing was charged.");
          setProcessing(false);
        });
        rzpInstance.open();
      } else {
        setError("Payment gateway failed to load. Check your connection — your order is saved, retry from Orders.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const handleCOD = async () => {
    setError(null);
    setProcessing(true);
    try {
      const result = await placeOrder({ ...cartPayload(), paymentMethod: "cod" });
      if (result.success && result.orderId) {
        const due = result.total ?? total;
        clearCart();
        toast.success("Order placed!", `Order ${result.orderNumber ?? result.orderId} confirmed — pay on delivery`);
        notifyOrderEvent({
          title: "Order placed (COD)",
          body: `Order ${result.orderId} confirmed — ${formatINR2(due)} payable on delivery.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId, due);
      } else {
        setError(result.error || "Failed to place order. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const handleUPI = async () => {
    if (!upiId || !upiId.includes("@")) {
      setError("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      // Manual UPI-to-merchant flow: the order is recorded with server totals;
      // the pending payment is settled outside the widget (collect on delivery).
      const result = await placeOrder({ ...cartPayload(), paymentMethod: "upi" });
      if (result.success && result.orderId) {
        const due = result.total ?? total;
        clearCart();
        toast.success("Order placed!", `Order ${result.orderNumber ?? result.orderId} confirmed — UPI payment pending`);
        notifyOrderEvent({
          title: "Order placed (UPI)",
          body: `Order ${result.orderId} confirmed — complete your UPI payment of ${formatINR2(due)} to ${upiId}.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId, due);
      } else {
        setError(result.error || "Failed to place order. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const placeHandler =
    paymentMethod === "razorpay"
      ? handleRazorpayPayment
      : paymentMethod === "cod"
        ? handleCOD
        : paymentMethod === "upi"
          ? handleUPI
          : handleCredit;
  const placeDisabled =
    processing || items.length === 0 || !shippingAddress || (paymentMethod === "upi" && (!upiId || !upiId.includes("@")));
  const placeLabel =
    paymentMethod === "upi" || paymentMethod === "razorpay"
      ? `Pay ${formatINR2(total)} securely`
      : `Place Order • ${formatINR2(total)}`;

  return (
    <div className="space-y-4">
      {/* Payment Methods */}
      <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
        <h4 className="text-body-md font-bold text-[#150726] mb-3">Payment Method</h4>
        <div className="space-y-2">
          {[
            { id: "razorpay", label: "UPI / Card / Netbanking", icon: CreditCard, desc: "Powered by Razorpay" },
            { id: "upi", label: "Pay by UPI ID", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm" },
            { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when order arrives" },
            { id: "credit", label: "Business Credit Terms", icon: Building2, desc: "Net 30 · approved accounts only" },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => chooseMethod(method.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                paymentMethod === method.id
                  ? "border-[#2D1B69] bg-[#F0ECF9]"
                  : "border-[#DDD6EE] hover:border-[#C9B8E8]"
              }`}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                paymentMethod === method.id ? "bg-[#2D1B69] text-white" : "bg-[#F0ECF9] text-[#2D1B69]"
              }`}>
                <method.icon className="h-4 w-4" />
              </div>
              <div className="text-left flex-1">
                <p className="text-body-sm font-semibold text-[#150726]">{method.label}</p>
                <p className="text-micro text-[#9B8CB5]">{method.desc}</p>
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
              className="w-full border-2 border-[#DDD6EE] rounded-xl px-4 py-3 text-body-lg focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all"
            />
          </div>
        )}

 {/* Credit terms note */}
        {paymentMethod === "credit" && (
          <div className="mt-3 rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 px-4 py-3">
            <p className="text-caption font-semibold text-[#5A8010] flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Credit Terms — Net 30
            </p>
            <p className="text-micro text-[#5C4A7A] mt-1">
              For verified business/organization accounts. Invoice due in 30 days from delivery. Our credit team verifies GSTIN before approval.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-body-sm text-red-700 flex items-center gap-2">
          <span className="text-red-500 font-bold">!</span>
          {error}
        </div>
      )}

      {/* Server reachability — fail fast with retry instead of at tap */}
      {serverUp === false && (
        <div className="rounded-xl bg-[#FFFBF5] border border-[#FF9800]/40 px-4 py-3 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF9800] animate-pulse shrink-0" />
          <p className="flex-1 text-caption font-semibold text-[#150726]">
            Cannot reach the server. Check your connection before placing the order.
          </p>
          <button
            onClick={pingServer}
            className="px-3 py-1.5 rounded-lg bg-[#FF9800] text-white text-micro font-bold hover:opacity-90 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={placeHandler}
        disabled={placeDisabled}
        className="btn-shine w-full h-12 rounded-xl bg-[#7CB518] text-white text-body-md font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          placeLabel
        )}
      </button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-tiny text-[#9B8CB5]">
        <span className="flex items-center gap-1 whitespace-nowrap"><Shield className="h-3 w-3" /> 256-bit SSL</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><Truck className="h-3 w-3" /> Free ₹5000+</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3" /> 7-day returns</span>
      </div>

      {/* Sticky mobile order bar — button never buried at page bottom */}
      <div className="lg:hidden fixed bottom-[76px] left-4 right-4 z-40 rounded-2xl border border-white/10 bg-[#150726]/95 backdrop-blur-md px-4 py-2.5 shadow-xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-tiny text-white/50">Total payable</p>
          <p className="text-body-lg font-extrabold text-white tabular-nums">{formatINR2(total)}</p>
        </div>
        <button
          onClick={placeHandler}
          disabled={placeDisabled}
          className="btn-shine rounded-xl bg-[#7CB518] px-5 py-2.5 text-body-sm font-bold text-white flex-shrink-0 disabled:opacity-50"
        >
          {processing ? "…" : paymentMethod === "cod" || paymentMethod === "credit" ? "Order" : "Pay"}
        </button>
      </div>
    </div>
  );
}
