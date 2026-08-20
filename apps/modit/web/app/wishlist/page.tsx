"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Truck,
  Star,
  CheckCircle,
  Building2,
} from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeWishlist = useWishlistStore((s) => s.removeWishlist);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: (typeof items)[0]) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleBuyNow = (product: (typeof items)[0]) => {
    addItem(product);
    router.push("/cart");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)]/30" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Your wishlist is empty</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Save products you love for later.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]">Wishlist</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Wishlist</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
        </div>
        {items.length > 1 && (
          <button
            onClick={clearWishlist}
            className="text-sm font-medium text-[var(--danger)] hover:underline flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <div
            key={product.id}
            className="group rounded-xl border border-[var(--border)] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-100)] to-[var(--brand-50)]">
              <Link href={`/products/${product.id}`} className="absolute inset-0 z-[1]">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-16 w-16 text-[var(--brand)]/20" />
                  </div>
                )}
              </Link>
              <button
                onClick={() => removeWishlist(product.id)}
                className="absolute top-2 left-2 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white hover:scale-110"
                title="Remove from Wishlist"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </button>
              {product.discount > 0 && (
                <span className="absolute top-2 right-2 z-[2] rounded-lg bg-[#E91E63] px-2 py-0.5 text-[10px] font-bold text-white">
                  {product.discount}% OFF
                </span>
              )}
              {product.seller.isVerified && (
                <span className="absolute bottom-2 left-2 z-[2] rounded-lg bg-[var(--success-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
                  <CheckCircle className="mr-0.5 inline h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              {product.brand && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">{product.brand}</p>
              )}
              <Link href={`/products/${product.id}`}>
                <h3 className="mt-1 text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-tight hover:text-[var(--brand)] transition-colors">
                  {product.name}
                </h3>
              </Link>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded bg-[var(--brand)]/10 px-1.5 py-0.5">
                  <span className="text-xs font-bold text-[var(--brand)]">{product.rating}</span>
                  <Star className="h-2.5 w-2.5 fill-[var(--brand)] text-[var(--brand)]" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">({product.reviewCount.toLocaleString()})</span>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-[var(--text-primary)]">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.mrp > product.price && (
                    <span className="text-xs text-[var(--text-muted)] line-through">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                  )}
                </div>
                {product.bulkLabel && (
                  <p className="mt-1 text-[10px] font-medium text-emerald-600">{product.bulkLabel}</p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Truck className="h-3 w-3" />
                <span className="font-medium text-[var(--success)]">Free delivery</span>
                <span>· {product.deliveryDays} day{product.deliveryDays > 1 ? "s" : ""}</span>
              </div>

              <p className="mt-1.5 text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {product.seller.name}
                {product.seller.isVerified && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[var(--success)] font-semibold">
                    <CheckCircle className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-all ${
                    addedId === product.id
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  }`}
                >
                  {addedId === product.id ? (
                    <>✓ Added</>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBuyNow(product)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-gray-50 transition-all"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
