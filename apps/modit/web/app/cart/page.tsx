"use client";

import { useState } from "react";
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
  Clock,
  Minus,
  Plus,
  Check,
} from "lucide-react";
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
      <div className="min-h-screen bg-[#F8F6FC]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[16px] font-bold text-white">Shopping Cart</h1>
          </div>
        </header>

        <div className="mx-auto max-w-[600px] px-4 py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-10 w-10 text-[#9B8CB5]" />
          </div>
          <h2 className="text-[18px] font-bold text-[#150726]">Your cart is empty</h2>
          <p className="mt-2 text-[13px] text-[#9B8CB5]">Add construction materials to your cart to proceed.</p>
          <Link href="/products" className="mt-5 inline-flex items-center gap-2 bg-[#7CB518] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25">
            <ArrowLeft className="h-4 w-4" />
            Browse Products
          </Link>

          {savedItems.length > 0 && (
            <div className="mt-12 text-left">
              <h3 className="text-[15px] font-bold text-[#150726] mb-4">Saved for Later ({savedItems.length})</h3>
              <div className="space-y-3">
                {savedItems.map((s) => (
                  <div key={s.product.id} className="flex items-center gap-3 rounded-xl border border-[#DDD6EE] bg-white p-3">
                    <img src={s.product.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover bg-[#F0ECF9]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#150726] truncate">{s.product.name}</p>
                      <p className="text-[14px] font-bold text-[#150726]">₹{s.product.price.toLocaleString()}</p>
                    </div>
                    <button onClick={() => moveToCart(s.product.id)} className="text-[12px] font-semibold text-[#7CB518] hover:underline">Move to Cart</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/products" className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[16px] font-bold text-white flex-1">Shopping Cart</h1>
          <button onClick={clearCart} className="text-[12px] font-semibold text-[#E91E63] hover:text-[#C2185B] transition-colors">
            Clear Cart
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-[12px] text-[#9B8CB5] hover:text-[#2D1B69] transition-colors">
            <ArrowLeft className="h-3 w-3" /> Continue Shopping
          </Link>
          <h1 className="text-[22px] font-bold text-[#150726] mt-1">
            Shopping Cart
            <span className="ml-2 text-[15px] font-normal text-[#9B8CB5]">
              ({items.length} item{items.length !== 1 ? "s" : ""})
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-3">
            {items.map((item) => {
              const discount = item.product.mrp > item.product.price
                ? Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100)
                : 0;
              return (
                <div key={item.product.id} className="flex gap-4 rounded-2xl border border-[#DDD6EE] bg-white p-4 hover:shadow-md transition-shadow">
                  {/* Image */}
                  <Link href={`/products/${item.product.id}`} className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0ECF9]">
                    <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.product.brand && (
                          <p className="text-[11px] font-semibold text-[#2D1B69]">{item.product.brand}</p>
                        )}
                        <Link href={`/products/${item.product.id}`} className="text-[14px] font-bold text-[#150726] hover:text-[#2D1B69] line-clamp-2 leading-tight">
                          {item.product.name}
                        </Link>
                        <p className="text-[11px] text-[#9B8CB5] mt-0.5">Seller: {item.product.seller.name}</p>
                      </div>
                      <p className="text-[18px] font-extrabold text-[#150726] whitespace-nowrap">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      {item.product.mrp > item.product.price && (
                        <span className="text-[12px] text-[#9B8CB5] line-through">₹{item.product.mrp.toLocaleString()}</span>
                      )}
                      {discount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#E91E63]/10 text-[10px] font-bold text-[#E91E63]">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Quantity selector */}
                        <div className="flex items-center border-2 border-[#DDD6EE] rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(item.product.moq, item.quantity - 1))}
                            disabled={item.quantity <= item.product.moq}
                            className="h-8 w-8 flex items-center justify-center text-[#150726] hover:bg-[#F0ECF9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="h-8 w-10 flex items-center justify-center text-[13px] font-bold text-[#150726] border-x-2 border-[#DDD6EE] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.min(item.product.stockLevel, item.quantity + 1))}
                            className="h-8 w-8 flex items-center justify-center text-[#150726] hover:bg-[#F0ECF9] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Delivery badge */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-[#7CB518]" />
                          <span className="font-semibold text-[#150726]">Tomorrow</span>
                          {item.product.freeDelivery && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-[#7CB518]/10 text-[9px] font-bold text-[#7CB518]">FREE</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveForLater(item.product.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#9B8CB5] hover:bg-[#F0ECF9] hover:text-[#2D1B69] transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5" /> Save for later
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#E91E63] hover:bg-[#E91E63]/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Saved for Later */}
            {savedItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[14px] font-bold text-[#150726] mb-3">Saved for Later ({savedItems.length})</h3>
                <div className="space-y-2">
                  {savedItems.map((s) => (
                    <div key={s.product.id} className="flex items-center gap-3 rounded-xl border border-[#DDD6EE] bg-white p-3">
                      <img src={s.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover bg-[#F0ECF9]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#150726] truncate">{s.product.name}</p>
                        <p className="text-[14px] font-bold text-[#150726]">₹{s.product.price.toLocaleString()}</p>
                      </div>
                      <button onClick={() => moveToCart(s.product.id)} className="text-[12px] font-semibold text-[#7CB518] hover:underline">Move to Cart</button>
                      <button onClick={() => removeSaved(s.product.id)} className="text-[11px] font-medium text-[#E91E63] hover:underline">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Coupon */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h4 className="flex items-center gap-2 text-[14px] font-bold text-[#150726]">
                  <Tag className="h-4 w-4 text-[#2D1B69]" /> Apply Coupon
                </h4>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-10 flex-1 rounded-xl border-2 border-[#DDD6EE] bg-white px-3 text-[13px] text-[#150726] focus:outline-none focus:border-[#7CB518] focus:ring-2 focus:ring-[#7CB518]/10 transition-all"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    className="h-10 px-5 rounded-xl bg-[#2D1B69] text-white text-[12px] font-bold hover:bg-[#1E1245] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#7CB518] font-semibold">
                    <Check className="h-3.5 w-3.5" /> Coupon applied! You save ₹{couponDiscount.toLocaleString()}
                  </div>
                )}
                {!couponApplied && couponCode && (
                  <p className="mt-2 text-[11px] text-[#9B8CB5]">Try FIRST10 or BULK5</p>
                )}
              </div>

              {/* Price Details */}
              <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
                <h4 className="text-[14px] font-bold text-[#150726]">Price Details</h4>
                <div className="mt-3 space-y-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">Price ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                    <span className="text-[#150726] font-medium">₹{getCartMRP().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#7CB518]">Discount</span>
                    <span className="text-[#7CB518] font-medium">-₹{getCartDiscount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">Delivery</span>
                    <span className={getCartShipping() === 0 ? "text-[#7CB518] font-semibold" : "text-[#150726] font-medium"}>
                      {getCartShipping() === 0 ? "FREE" : `₹${getCartShipping()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CB5]">GST</span>
                    <span className="text-[#150726] font-medium">₹{getCartGST().toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#7CB518]">Coupon Discount</span>
                      <span className="text-[#7CB518] font-medium">-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DDD6EE] pt-3 flex justify-between">
                    <span className="text-[15px] font-bold text-[#150726]">Total</span>
                    <span className="text-[20px] font-extrabold text-[#2D1B69]">₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <button className="mt-4 w-full h-12 rounded-xl bg-[#7CB518] text-white text-[14px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25">
                    Place Order
                  </button>
                </Link>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-[#9B8CB5]">
                    <Shield className="h-3.5 w-3.5 text-[#2D1B69]" /> Secure payment — 256-bit SSL
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9B8CB5]">
                    <Truck className="h-3.5 w-3.5 text-[#7CB518]" /> Free delivery on orders above ₹5,000
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9B8CB5]">
                    <Package className="h-3.5 w-3.5 text-[#00BCD4]" /> 7-day easy returns
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
