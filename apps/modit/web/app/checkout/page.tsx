"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Building2,
  Wallet,
  Banknote,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
  Truck,
  Shield,
  FileText,
  Plus,
  Pencil,
  AlertCircle,
  Info,
  ShoppingCart,
} from "lucide-react";
import { Button, Card, Input, Select, Badge, FormRow, Textarea } from "@/lib/modit-ui";
import { useCartStore } from "@/lib/cart-store";

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const demoAddresses: Address[] = [
  {
    id: "a1",
    label: "Office",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    line1: "42, MG Road, Near Metro Station",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Site Address",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    line1: "Construction Site B, Sector 15",
    line2: "Goregaon East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400065",
    isDefault: false,
  },
];

type PaymentMethod = "upi" | "cards" | "netbanking" | "cod" | "credit";

export default function CheckoutPage() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartGST = useCartStore((s) => s.getCartGST);
  const getCartShipping = useCartStore((s) => s.getCartShipping);
  const getCartGrandTotal = useCartStore((s) => s.getCartGrandTotal);

  const [selectedAddressId, setSelectedAddressId] = useState("a1");
  const [addresses, setAddresses] = useState<Address[]>(demoAddresses);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  const [deliverySlot, setDeliverySlot] = useState<"morning" | "afternoon" | "evening">("morning");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });

  const [gstInvoiceType, setGstInvoiceType] = useState<"regular" | "composition" | "export">("regular");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [isPlacing, setIsPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const totals = useMemo(() => {
    const subtotal = getCartTotal();
    const totalGst = getCartGST();
    const shipping = getCartShipping();
    const total = getCartGrandTotal();
    return { subtotal, totalGst, shipping, total };
  }, [items]);

  const handleAddAddress = useCallback(() => {
    if (!newAddress.name || !newAddress.line1 || !newAddress.city || !newAddress.pincode) return;
    const addr: Address = {
      id: `a${addresses.length + 1}`,
      label: newAddress.label || "New Address",
      name: newAddress.name,
      phone: newAddress.phone,
      line1: newAddress.line1,
      line2: newAddress.line2 || undefined,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
    setNewAddress({ label: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  }, [newAddress, addresses]);

  const handlePlaceOrder = useCallback(async () => {
    setIsPlacing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsPlacing(false);
    setOrderPlaced(true);
  }, []);

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)]/30" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Your cart is empty</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Add items to your cart before checking out.</p>
        <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Browse Products
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Order Placed Successfully!</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Your order <span className="font-semibold text-[var(--text-primary)]">ORD-2026-08001</span> has been confirmed.
          You will receive a confirmation email shortly.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/orders/ORD-2026-08001">
            <Button>View Order</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Checkout Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">1</span>
                <MapPin className="h-4 w-4 text-[var(--brand)]" />
                Delivery Address
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border)] hover:border-[var(--brand)]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{addr.label}</span>
                      {addr.isDefault && <Badge variant="default" className="text-[10px]">Default</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{addr.name} · {addr.phone}</p>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                  <button className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]">
                    <Pencil className="h-4 w-4" />
                  </button>
                </label>
              ))}
              <button
                onClick={() => setShowAddressForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
              >
                <Plus className="h-4 w-4" /> Add New Address
              </button>

              {showAddressForm && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormRow label="Label">
                      <Input placeholder="e.g. Office, Site" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
                    </FormRow>
                    <FormRow label="Full Name" required>
                      <Input placeholder="Recipient name" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} />
                    </FormRow>
                  </div>
                  <FormRow label="Phone" required>
                    <Input placeholder="+91 XXXXX XXXXX" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  </FormRow>
                  <FormRow label="Address Line 1" required>
                    <Input placeholder="Street address" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                  </FormRow>
                  <FormRow label="Address Line 2">
                    <Input placeholder="Apartment, suite, etc." value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                  </FormRow>
                  <div className="grid grid-cols-3 gap-4">
                    <FormRow label="City" required>
                      <Input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                    </FormRow>
                    <FormRow label="State" required>
                      <Input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                    </FormRow>
                    <FormRow label="Pincode" required>
                      <Input placeholder="6-digit pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                    </FormRow>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                    <Button onClick={handleAddAddress}>Save Address</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Delivery Schedule */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">2</span>
                <Calendar className="h-4 w-4 text-[var(--brand)]" />
                Delivery Schedule
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <FormRow label="Preferred Delivery Date">
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]}
                />
              </FormRow>
              <FormRow label="Time Slot">
                <div className="flex gap-3">
                  {(["morning", "afternoon", "evening"] as const).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setDeliverySlot(slot)}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all ${
                        deliverySlot === slot
                          ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]/50"
                      }`}
                    >
                      <Clock className="mx-auto mb-1 h-4 w-4" />
                      <span className="text-xs font-semibold capitalize">{slot}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                        {slot === "morning" ? "8 AM - 12 PM" : slot === "afternoon" ? "12 PM - 4 PM" : "4 PM - 8 PM"}
                      </span>
                    </button>
                  ))}
                </div>
              </FormRow>
            </div>
          </Card>

          {/* Step 3: Payment Method */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">3</span>
                <CreditCard className="h-4 w-4 text-[var(--brand)]" />
                Payment Method
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {([
                { id: "upi", label: "UPI", icon: Wallet, desc: "Google Pay, PhonePe, Paytm" },
                { id: "cards", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Rupay" },
                { id: "netbanking", label: "Net Banking", icon: Building2, desc: "All major banks" },
                { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when delivered" },
                { id: "credit", label: "Credit Terms", icon: FileText, desc: "30/60/90 day credit" },
              ] as const).map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    paymentMethod === pm.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border)] hover:border-[var(--brand)]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  <pm.icon className="h-5 w-5 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{pm.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{pm.desc}</p>
                  </div>
                </label>
              ))}

              {paymentMethod === "upi" && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-4">
                  <FormRow label="UPI ID">
                    <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                  </FormRow>
                </div>
              )}

              {paymentMethod === "cards" && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-4 space-y-4">
                  <FormRow label="Card Number">
                    <Input placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} />
                  </FormRow>
                  <div className="grid grid-cols-2 gap-4">
                    <FormRow label="Expiry">
                      <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} />
                    </FormRow>
                    <FormRow label="CVV">
                      <Input type="password" placeholder="XXX" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} />
                    </FormRow>
                  </div>
                </div>
              )}

              {paymentMethod === "netbanking" && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-4">
                  <FormRow label="Select Bank">
                    <Select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                      <option value="">Choose your bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                      <option value="bob">Bank of Baroda</option>
                    </Select>
                  </FormRow>
                </div>
              )}

              {paymentMethod === "credit" && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--brand)]" />
                    <p className="text-xs text-[var(--text-muted)]">
                      Credit terms are available for verified businesses with approved credit limits.
                      Your credit limit: <span className="font-semibold text-[var(--text-primary)]">₹25,00,000</span>.
                      Remaining: <span className="font-semibold text-emerald-600">₹18,50,000</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 4: Invoice & Notes */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">4</span>
                <FileText className="h-4 w-4 text-[var(--brand)]" />
                GST Invoice & Notes
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <FormRow label="Invoice Type">
                <Select value={gstInvoiceType} onChange={(e) => setGstInvoiceType(e.target.value as any)}>
                  <option value="regular">Regular GST Invoice</option>
                  <option value="composition">Composition Scheme</option>
                  <option value="export">Export Invoice (IGST)</option>
                </Select>
              </FormRow>
              <FormRow label="Purchase Order Number (Optional)">
                <Input placeholder="PO-XXXXX" value={purchaseOrderNumber} onChange={(e) => setPurchaseOrderNumber(e.target.value)} />
              </FormRow>
              <FormRow label="Special Instructions">
                <Textarea
                  placeholder="Any delivery notes, site access instructions, or special requirements..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-[80px]"
                />
              </FormRow>
            </div>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <Card className="overflow-hidden sticky top-24">
            <div className="border-b border-[var(--border-subtle)] px-6 py-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Order Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Items from actual cart */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.quantity} × ₹{item.product.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Subtotal ({items.length} items)</span>
                  <span className="text-[var(--text-primary)]">₹{totals.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">GST</span>
                  <span className="text-[var(--text-primary)]">₹{totals.totalGst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Shipping</span>
                  <span className={totals.shipping === 0 ? "text-emerald-600 font-medium" : "text-[var(--text-primary)]"}>
                    {totals.shipping === 0 ? "FREE" : `₹${totals.shipping.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-[var(--text-primary)]">Total</span>
                  <span className="text-xl font-extrabold text-[var(--brand)]">
                    ₹{totals.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold mt-2"
                onClick={handlePlaceOrder}
                disabled={isPlacing || !selectedAddressId}
              >
                {isPlacing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Place Order
                  </>
                )}
              </Button>

              <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">
                By placing this order you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
