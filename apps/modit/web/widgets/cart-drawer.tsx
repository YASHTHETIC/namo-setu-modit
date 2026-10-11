"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Timer, Share2, ArrowLeft } from "lucide-react";

import { useCartStore } from "@/lib/cart-store";
import { useCouponStore } from "@/lib/coupon-store";
import { useDeliveryStore } from "@/lib/delivery-store";
import { useCartUi } from "@/lib/cart-ui";
import { computeBill } from "@/lib/bill";
import { formatINR2 } from "@/lib/utils";
import { useAuthReady } from "@/lib/use-auth";
import { useToast } from "@foundation/ui";
import { ProductThumb } from "@/components/product-thumb";

/**
 * Blinkit-style quick cart drawer (DisplayCartItem architecture, MODIT theme):
 * overlay + right panel, savings strip, item steppers, bill details,
 * total + Proceed bar. Opened from every cart entry point via useCartUi.
 * The full /cart page stays for detailed management.
 */
export function CartDrawer() {
  const open = useCartUi((s) => s.drawerOpen);
  const closeDrawer = useCartUi((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const appliedCoupon = useCouponStore((s) => s.appliedCoupon);
  const getSlot = useDeliveryStore((s) => s.getSelected);
  const loggedIn = useAuthReady();
  const toast = useToast();

  const shareCart = async () => {
    const bill = computeBill();
    const text = `My MODIT cart: ${bill.count} items, ${formatINR2(bill.total)} — construction materials on door.`;
    try {
      if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: unknown }).share) {
        await (navigator as Navigator & { share: (d: Record<string, string>) => Promise<void> }).share({
          title: "My MODIT cart",
          text,
          url: window.location.origin + "/cart",
        });
        return;
      }
      throw new Error("no-share");
    } catch {
      try {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}/cart`);
        toast.success("Cart link copied!", "Share it with your site team.");
      } catch {
        toast.error("Share failed", "Copy the link manually from the address bar.");
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeDrawer]);

  if (!open) return null;

  const bill = computeBill();

  return (
    <div className="fixed inset-0 z-sheet" role="dialog" aria-modal="true" aria-label="Cart">
      <button
        aria-label="Close cart"
        onClick={closeDrawer}
        className="absolute inset-0 bg-[#150726]/60 backdrop-blur-[2px] animate-fade-in"
      />
      <aside className="absolute top-0 bottom-0 right-0 w-full sm:max-w-md bg-[#F8F6FC] shadow-2xl flex flex-col animate-drawer-in-right">
        {/* Header — back + My Cart + Share (real-Blinkit layout, dark theme) */}
        <div className="flex items-center gap-2 bg-[#150726] px-3 py-3 flex-shrink-0">
          <button
            onClick={closeDrawer}
            aria-label="Back"
            className="p-1.5 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-body-md font-extrabold text-white flex-1">
            My Cart {bill.count > 0 && <span className="text-white/50 font-bold">({bill.count})</span>}
          </h2>
          {items.length > 0 && (
            <button
              onClick={shareCart}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-caption font-bold text-[#7CB518] hover:bg-white/10 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
            <div className="h-20 w-20 rounded-full bg-[#F0ECF9] flex items-center justify-center">
              <ShoppingCart className="h-9 w-9 text-[#9B8CB5]" />
            </div>
            <p className="text-body-md font-bold text-[#150726]">Your cart is empty</p>
            <p className="text-caption text-[#9B8CB5]">Materials you add will show up here.</p>
            <Link
              href="/products"
              onClick={closeDrawer}
              className="mt-1 px-6 py-2.5 rounded-xl bg-[#7CB518] text-white text-body-sm font-bold hover:bg-[#6A9C14] transition-all"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Savings strip */}
              {bill.savings > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#FFF6DE] border border-[#F8CB46] rounded-full">
                  <p className="text-caption font-bold text-[#150726]">Your total savings</p>
                  <p className="text-caption font-extrabold text-[#150726] tabular-nums">{formatINR2(bill.savings)}</p>
                </div>
              )}

              {/* Delivery block */}
              <div className="bg-white rounded-2xl border border-[#DDD6EE] p-3.5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#F0F9E8] border border-[#7CB518]/30 flex items-center justify-center flex-shrink-0">
                  <Timer className="h-5 w-5 text-[#5A8010]" />
                </div>
                <div className="min-w-0">
                  <p className="text-body-sm font-extrabold text-[#150726]">
                    Delivery in {getSlot()?.time ?? "60 min"}
                  </p>
                  <p className="text-micro text-[#9B8CB5]">
                    Shipment of {bill.count} item{bill.count === 1 ? "" : "s"}
                    {getSlot() ? ` · ${getSlot()?.label}` : ""}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-2xl border border-[#DDD6EE] p-3 space-y-3">
                {items.map((item) => {
                  const key = `${item.product.id}:${item.variantId ?? "d"}:${item.shade ?? ""}`;
                  const unitPrice = item.unitPrice ?? item.product.price;
                  const variant = item.variantId
                    ? item.product.variants?.find((v) => v.id === item.variantId)
                    : null;
                  const mrp = variant?.mrp ?? item.product.mrp;
                  return (
                    <div key={key} className="flex gap-3">
                      <ProductThumb
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        className="h-16 w-16 rounded-xl object-contain bg-[#F0ECF9] flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-semibold text-[#150726] leading-snug line-clamp-2">{item.product.name}</p>
                        <p className="text-micro text-[#9B8CB5] mt-0.5">
                          {item.product.unit}
                          {item.shade ? ` · ${item.shade}` : ""}
                        </p>
                        <p className="text-body-sm font-extrabold text-[#150726] mt-0.5 tabular-nums">
                          {formatINR2(unitPrice)}{" "}
                          {mrp != null && mrp > unitPrice && (
                            <span className="line-through text-[#9B8CB5] text-caption font-semibold">
                              {formatINR2(mrp)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <div className="stepper">
                          <button
                            onClick={() => removeItem(item.product.id, item.variantId)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => addItem(item.product, 1, item.variantId, item.shade)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.variantId)}
                          aria-label="Remove item"
                          className="p-1 text-[#9B8CB5] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bill details */}
              <div className="bg-white rounded-2xl border border-[#DDD6EE] p-4">
                <h3 className="text-body-sm font-extrabold text-[#150726] mb-2">Bill details</h3>
                <div className="space-y-1.5 text-body-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B5B83]">
                      Items total{" "}
                      {bill.savings > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#E0F7FA] text-tiny font-bold text-[#0097A7]">
                          Saved {formatINR2(bill.savings)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      {bill.mrpTotal > bill.subtotal && (
                        <span className="line-through text-[#9B8CB5] text-caption">{formatINR2(bill.mrpTotal)}</span>
                      )}
                      <span className="font-bold text-[#150726] tabular-nums">{formatINR2(bill.subtotal)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B83]">Quantity</span>
                    <span className="font-semibold text-[#150726] tabular-nums">{bill.count} item{bill.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B83]">GST</span>
                    <span className="font-semibold text-[#150726] tabular-nums">{formatINR2(bill.gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B83]">Delivery</span>
                    {bill.shipping === 0 ? (
                      <span className="font-bold text-[#5A8010]">FREE</span>
                    ) : (
                      <span className="font-semibold text-[#150726] tabular-nums">{formatINR2(bill.shipping)}</span>
                    )}
                  </div>
                  {bill.couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#5A8010]">Coupon {appliedCoupon ? `(${appliedCoupon.code})` : ""}</span>
                      <span className="font-bold text-[#5A8010] tabular-nums">−{formatINR2(bill.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DDD6EE] pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-[#150726]">Grand total</span>
                    <span className="text-title-md font-extrabold text-[#2D1B69] tabular-nums">{formatINR2(bill.total)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-caption font-bold text-[#2D1B69] hover:underline py-1"
              >
                Open full cart page
              </Link>
            </div>

            {/* Bottom proceed bar — solid green, Blinkit architecture */}
            <div className="p-3 flex-shrink-0">
              <Link
                href={loggedIn ? "/checkout" : "/auth?next=%2Fcheckout"}
                onClick={closeDrawer}
                className="btn-shine flex items-center justify-between gap-4 rounded-2xl bg-[#7CB518] px-5 py-3.5 text-white hover:bg-[#6A9C14] transition-all shadow-lg shadow-green-500/30"
              >
                <span>
                  <span className="block text-body-lg font-extrabold tabular-nums leading-tight">
                    {formatINR2(bill.total)}
                  </span>
                  <span className="block text-tiny font-bold text-white/70 tracking-wider">TOTAL</span>
                </span>
                <span className="text-body-md font-bold">
                  {loggedIn ? "Proceed →" : "Login to Proceed →"}
                </span>
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
