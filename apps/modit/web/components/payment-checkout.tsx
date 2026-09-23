"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { placeOrder } from "@/lib/hybrid-api";
import { useToast } from "@foundation/ui";
import { Shield, Truck, Clock, Check, CreditCard, Banknote, Smartphone, Building2, KeyRound, Phone } from "lucide-react";
import { requestOtp, verifyOtp, formatPhoneForDisplay } from "@/lib/otp";
import { notifyOrderEvent } from "@/lib/order-notifications";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentProps {
  total: number;
  onPaymentComplete: (orderId: string) => void;
  gstin?: string;
}

export function PaymentSection({ total, onPaymentComplete, gstin }: PaymentProps) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | "upi" | "credit">("razorpay");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codPhone, setCodPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleSendOtp = () => {
    const res = requestOtp(codPhone);
    if (!res.ok) {
      setError(res.error || "Could not send OTP.");
      return;
    }
    setError(null);
    setOtpSent(true);
    setDemoOtp(res.demoCode ?? null);
    toast.success("OTP sent!", `Verification code sent to ${formatPhoneForDisplay(codPhone)}`);
  };

  const handleVerifyOtp = () => {
    const res = verifyOtp(codPhone, otpCode);
    if (!res.ok) {
      setError(res.error || "OTP verification failed.");
      return;
    }
    setError(null);
    setPhoneVerified(true);
    toast.success("Phone verified!", "You can now place your COD order.");
  };

  const handleCredit = async () => {
    setError(null);
    setProcessing(true);
    try {
      const result = await placeOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "credit",
        gstin,
      });
      if (result.success && result.orderId) {
        clearCart();
        toast.success("Order placed!", `Order ${result.orderId} confirmed — credit terms (net 30 days)`);
        notifyOrderEvent({
          title: "Order placed (Credit)",
          body: `Order ${result.orderId} confirmed on Net-30 credit terms — invoice due in 30 days from delivery.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId);
      } else {
        setError(result.error || "Failed to place order. Please try again.");
        toast.error("Order failed", result.error || "Please try again");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong", "Please try again");
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setError(null);
    setProcessing(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "razorpay",
        gstin,
      };

      const result = await placeOrder(orderData);
      if (result.success && result.orderId) {
        if (total <= 0) {
          clearCart();
          onPaymentComplete(result.orderId);
          return;
        }
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_demo",
          amount: total * 100,
          currency: "INR",
          name: "MODIT",
          description: `Order ${result.orderId}`,
          order_id: result.orderId,
          handler: function (response: any) {
            clearCart();
            toast.success("Payment successful!", `Order ${result.orderId} confirmed`);
            notifyOrderEvent({
              title: "Payment successful",
              body: `Order ${result.orderId} confirmed — ₹${total.toLocaleString("en-IN")} paid online. Receipt and GST invoice available on the order page.`,
              type: "payment",
              orderId: result.orderId,
            });
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
          rzp.on("payment.failed", function () {
            setError("Payment failed. Please try again.");
            toast.error("Payment failed", "Please try again or use a different method");
            setProcessing(false);
          });
          rzp.open();
        } else {
          clearCart();
          notifyOrderEvent({
            title: "Order placed",
            body: `Order ${result.orderId} confirmed — ₹${total.toLocaleString("en-IN")}.`,
            type: "order",
            orderId: result.orderId,
          });
          onPaymentComplete(result.orderId);
        }
      } else {
        setError(result.error || "Failed to create order. Please try again.");
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
      const result = await placeOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "cod",
        gstin,
      });
      if (result.success && result.orderId) {
        clearCart();
        toast.success("Order placed!", `Order ${result.orderId} confirmed — pay on delivery`);
        notifyOrderEvent({
          title: "Order placed (COD)",
          body: `Order ${result.orderId} confirmed — ₹${total.toLocaleString("en-IN")} payable on delivery. Confirmation sent to ${formatPhoneForDisplay(codPhone)}.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId);
      } else {
        setError(result.error || "Failed to place order. Please try again.");
        toast.error("Order failed", result.error || "Please try again");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong", "Please try again");
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
      const result = await placeOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        paymentMethod: "upi",
        upiId: upiId,
        gstin,
      });
      if (result.success && result.orderId) {
        clearCart();
        toast.success("Order placed!", `Order ${result.orderId} confirmed — UPI payment pending`);
        notifyOrderEvent({
          title: "Order placed (UPI)",
          body: `Order ${result.orderId} confirmed — complete your UPI payment of ₹${total.toLocaleString("en-IN")} to ${upiId}.`,
          type: "order",
          orderId: result.orderId,
        });
        onPaymentComplete(result.orderId);
      } else {
        setError(result.error || "Failed to place order. Please try again.");
        toast.error("Order failed", result.error || "Please try again");
        setProcessing(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong", "Please try again");
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
            { id: "credit", label: "Business Credit Terms", icon: Building2, desc: "Net 30 for verified organizations" },
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

        {/* COD phone verification (OTP) */}
        {paymentMethod === "cod" && (
          <div className="mt-3 rounded-xl border-2 border-[#DDD6EE] p-4">
            <p className="text-[12px] font-bold text-[#150726] flex items-center gap-1.5 mb-1">
              <Phone className="h-4 w-4 text-[#2D1B69]" /> Verify mobile for Cash on Delivery
            </p>
            <p className="text-[11px] text-[#9B8CB5] mb-3">We send a 6-digit OTP to confirm your order and delivery updates.</p>
            {!phoneVerified ? (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    value={codPhone}
                    onChange={(e) => { setCodPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneVerified(false); setOtpSent(false); setDemoOtp(null); }}
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    className="flex-1 border-2 border-[#DDD6EE] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2D1B69] transition-all"
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={codPhone.replace(/\D/g, "").length !== 10}
                    className="px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245] disabled:opacity-50 transition-all"
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
                {otpSent && (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 border-2 border-[#DDD6EE] rounded-xl px-4 py-2.5 text-[13px] tracking-[0.3em] font-bold text-center focus:outline-none focus:border-[#7CB518] transition-all"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== 6}
                        className="px-4 py-2.5 rounded-xl bg-[#7CB518] text-white text-[12px] font-bold hover:bg-[#6A9C14] disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Verify
                      </button>
                    </div>
                    {demoOtp && (
                      <p className="text-[11px] font-semibold text-[#FF9800] bg-[#FF9800]/10 rounded-lg px-3 py-2">
                        Demo mode — your OTP is {demoOtp}. Connect an SMS gateway to send real OTPs.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-[12px] font-bold text-[#7CB518] flex items-center gap-1.5">
                <Check className="h-4 w-4" /> {formatPhoneForDisplay(codPhone)} verified
              </p>
            )}
          </div>
        )}

{/* Credit terms note */}
        {paymentMethod === "credit" && (
          <div className="mt-3 rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 px-4 py-3">
            <p className="text-[12px] font-semibold text-[#5f8f12] flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Credit Terms — Net 30
            </p>
            <p className="text-[11px] text-[#6B5B83] mt-1">
              For verified business/organization accounts. Invoice due in 30 days from delivery. Our credit team verifies GSTIN before approval.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700 flex items-center gap-2">
          <span className="text-red-500 font-bold">!</span>
          {error}
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={paymentMethod === "razorpay" ? handleRazorpayPayment : paymentMethod === "cod" ? handleCOD : paymentMethod === "upi" ? handleUPI : handleCredit}
        disabled={processing || items.length === 0 || (paymentMethod === "upi" && (!upiId || !upiId.includes("@"))) || (paymentMethod === "cod" && !phoneVerified)}
        className="w-full h-12 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : paymentMethod === "razorpay" ? (
          `Pay ₹${total.toLocaleString("en-IN")}`
        ) : (
          `Place Order — ₹${total.toLocaleString("en-IN")}`
        )}
      </button>

{paymentMethod === "cod" && !phoneVerified && items.length > 0 && (
        <p className="text-center text-[11px] font-semibold text-[#FF9800]">Verify your mobile number above to place a COD order</p>
      )}

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-[#9B8CB5]">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 256-bit SSL</span>
        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Free ₹5000+</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 7-day returns</span>
      </div>
    </div>
  );
}
