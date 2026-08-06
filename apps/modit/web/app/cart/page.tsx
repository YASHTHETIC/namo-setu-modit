"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Heart,
  Tag,
  Truck,
  Shield,
  Package,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button, Badge, QuantitySelector, PriceDisplay, DeliveryBadge } from "@/lib/modit-ui";
import { useCartStore } from "@/lib/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const savedItems = useCartStore((s) => s.savedItems);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const saveForLater = useCartStore((s) => s.saveForLater);
  const moveToCart = useCartStore((s) => s.moveToCart);
  const removeSaved = useCartStore((s) => s.removeSaved);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartMRP = useCartStore((s) => s.getCartMRP);
  const getCartDiscount = useCartStore((s) => s.getCartDiscount);
  const getCartGST = useCartStore((s) => s.getCartGST);
  const getCartShipping = useCartStore((s) => s.getCartShipping);
  const getCartGrandTotal = useCartStore((s) => s.getCartGrandTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "FIRST10") {
      setCouponApplied(true);
      setCouponDiscount(getCartTotal() * 0.1);
    } else if (couponCode.toUpperCase() === "BULK5") {
      setCouponApplied(true);
      setCouponDiscount(getCartTotal() * 0.05);
    }
  };

  const grandTotal = getCartGrandTotal() - (couponApplied ? couponDiscount : 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)]/30" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Your cart is empty</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Add construction materials to your cart to proceed.</p>
        <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Browse Products
        </Link>

        {savedItems.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Saved for Later ({savedItems.length})</h3>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {savedItems.map((s) => (
                <div key={s.product.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
                  <img src={s.product.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{s.product.name}</p>
                    <p className="text-sm font-bold text-[var(--brand)]">₹{s.product.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => moveToCart(s.product.id)} className="text-xs font-medium text-[var(--brand)] hover:underline">Move to Cart</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/products" className="mb-1 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--brand)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Shopping Cart
            <span className="ml-2 text-base font-normal text-[var(--text-muted)]">
              ({items.length} item{items.length !== 1 ? "s" : ""})
            </span>
          </h1>
        </div>
        <button onClick={clearCart} className="text-xs font-medium text-red-500 hover:underline">
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-4 rounded-xl border border-[var(--border)] bg-white p-4">
              {/* Image */}
              <Link href={`/products/${item.product.id}`} className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-amber-50">
                <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.product.brand && <p className="text-[10px] font-semibold text-[var(--brand)]">{item.product.brand}</p>}
                    <Link href={`/products/${item.product.id}`} className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--brand)] line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-[10px] text-[var(--text-muted)]">Seller: {item.product.seller.name}</p>
                  </div>
                  <p className="text-lg font-extrabold text-[var(--text-primary)]">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {item.product.mrp > item.product.price && (
                    <span className="text-xs text-[var(--text-muted)] line-through">₹{item.product.mrp.toLocaleString()}</span>
                  )}
                  {item.product.discount > 0 && (
                    <Badge variant="success" className="text-[10px]">{item.product.discount}% OFF</Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QuantitySelector
                      quantity={item.quantity}
                      min={item.product.moq}
                      max={Math.min(item.product.stockLevel, 999)}
                      onChange={(qty) => updateQuantity(item.product.id, qty)}
                      size="sm"
                    />
                    <DeliveryBadge days={item.product.deliveryDays} freeDelivery={item.product.freeDelivery} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveForLater(item.product.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--brand)]"
                    >
                      <Heart className="h-3 w-3" /> Save for later
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Saved for Later */}
          {savedItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Saved for Later ({savedItems.length})</h3>
              <div className="space-y-2">
                {savedItems.map((s) => (
                  <div key={s.product.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
                    <img src={s.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{s.product.name}</p>
                      <p className="text-sm font-bold text-[var(--brand)]">₹{s.product.price.toLocaleString()}</p>
                    </div>
                    <button onClick={() => moveToCart(s.product.id)} className="text-xs font-medium text-[var(--brand)] hover:underline">Move to Cart</button>
                    <button onClick={() => removeSaved(s.product.id)} className="text-[10px] text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            {/* Coupon */}
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Tag className="h-4 w-4 text-[var(--brand)]" /> Apply Coupon
              </h4>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
                <Button variant="secondary" size="sm" onClick={handleApplyCoupon} disabled={!couponCode}>
                  Apply
                </Button>
              </div>
              {couponApplied && <p className="mt-2 text-xs text-emerald-600 font-medium">Coupon applied! You save ₹{couponDiscount.toLocaleString()}</p>}
              {!couponApplied && couponCode && <p className="mt-2 text-[10px] text-[var(--text-muted)]">Try FIRST10 or BULK5</p>}
            </div>

            {/* Price Details */}
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Price Details</h4>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Price ({items.length} items)</span>
                  <span className="text-[var(--text-primary)]">₹{getCartMRP().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600">-₹{getCartDiscount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Delivery</span>
                  <span className={getCartShipping() === 0 ? "text-emerald-600 font-medium" : "text-[var(--text-primary)]"}>
                    {getCartShipping() === 0 ? "FREE" : `₹${getCartShipping()}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">GST</span>
                  <span className="text-[var(--text-primary)]">₹{getCartGST().toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600">Coupon Discount</span>
                    <span className="text-emerald-600">-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[var(--border-subtle)] pt-2 flex justify-between">
                  <span className="text-sm font-bold text-[var(--text-primary)]">Total</span>
                  <span className="text-lg font-extrabold text-[var(--brand)]">₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="mt-4 w-full h-11 text-sm font-semibold">
                  Place Order
                </Button>
              </Link>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <Shield className="h-3 w-3 text-[var(--brand)]" /> Secure payment — 256-bit SSL
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <Truck className="h-3 w-3 text-[var(--brand)]" /> Free delivery on orders above ₹5,000
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <Clock className="h-3 w-3 text-[var(--brand)]" /> 7-day easy returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
