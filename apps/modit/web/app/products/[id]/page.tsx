"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  Package,
  CheckCircle2,
  Store,
  Phone,
  Info,
  Clock,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { Button, Badge, Card, StarRating, PriceDisplay, DeliveryBadge, QuantitySelector } from "@/lib/modit-ui";
import { useCartStore } from "@/lib/cart-store";
import { getProductById, products } from "@/lib/product-data";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const addItem = useCartStore((s) => s.addItem);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "specs" | "delivery">("details");

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 6);
  }, [product]);

  const frequentlyBought = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.categorySlug !== product.categorySlug && p.inStock)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
  }, [product]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }, [product, quantity, addItem]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    addItem(product, quantity);
    window.location.href = "/checkout";
  }, [product, quantity, addItem]);

  const handleCheckDelivery = useCallback(() => {
    if (pincode.length === 6) setPincodeChecked(true);
  }, [pincode]);

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)]/30" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Product Not Found</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">The product you are looking for does not exist.</p>
        <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--cyan)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const specs = Object.entries(product.specifications);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--cyan)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-[var(--cyan)]">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[var(--cyan)]">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#0A0A20] via-[#0D0D25] to-[#100820]">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-32 w-32 text-[var(--cyan)]/20" />
                </div>
              )}
              {product.discount > 0 && (
                <span className="absolute top-4 left-4 rounded-xl bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                      i === selectedImage
                        ? "border-[var(--cyan)]"
                        : "border-[var(--border)] hover:border-[var(--cyan)]/50"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info + Buy Box */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand & Title */}
          <div>
            {product.brand && (
              <Link href={`/products?brand=${product.brandSlug}`} className="text-sm font-semibold text-[var(--cyan)] hover:underline">
                {product.brand}
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)] lg:text-3xl">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <StarRating rating={product.rating} count={product.reviewCount} size="md" />
              <span className="text-xs text-[var(--text-muted)]">SKU: {product.sku}</span>
            </div>
          </div>

          {/* Price Block */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-5">
            <PriceDisplay
              price={product.price}
              mrp={product.mrp}
              discount={product.discount}
              bulkPrice={product.bulkPrice}
              bulkLabel={product.bulkLabel}
              unit={product.unit}
              size="lg"
            />
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>Inclusive of {product.gstCode}</span>
              <span>·</span>
              <span>MOQ: {product.moq} {product.unitCode}</span>
            </div>
          </div>

          {/* Delivery Check */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Truck className="h-4 w-4 text-[var(--cyan)]" />
              Delivery
            </h4>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPincodeChecked(false); }}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,240,255,0.15)]"
                />
              </div>
              <Button variant="secondary" onClick={handleCheckDelivery} disabled={pincode.length < 6}>
                Check
              </Button>
            </div>
            {pincodeChecked && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Delivery by <strong>{new Date(Date.now() + product.deliveryDays * 86400000).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</strong></span>
                </div>
                {product.freeDelivery && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Truck className="h-3.5 w-3.5" /> Free delivery on this order
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[var(--text-primary)]">Quantity:</span>
              <QuantitySelector
                quantity={quantity}
                min={product.moq}
                max={Math.min(product.stockLevel, 999)}
                onChange={setQuantity}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {product.stockLevel > 100 ? "In Stock" : `Only ${product.stockLevel} left`}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 text-base font-semibold"
                disabled={!product.inStock}
              >
                {added ? (
                  <><CheckCircle2 className="h-5 w-5" /> Added to Cart</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                )}
              </Button>
              <Button onClick={handleBuyNow} variant="secondary" className="flex-1 h-12 text-base font-semibold">
                <Zap className="h-5 w-5" /> Buy Now
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWishlisted(!wishlisted)}
                className="flex-1"
              >
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "100% Genuine", sub: "Products" },
              { icon: CreditCard, label: "Secure Payment", sub: "SSL Encrypted" },
              { icon: RotateCcw, label: "Easy Returns", sub: "7 Days" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
                <Icon className="h-5 w-5 text-[var(--cyan)]" />
                <span className="text-[10px] font-bold text-[var(--text-primary)]">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{sub}</span>
              </div>
            ))}
          </div>

          {/* Seller Info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cyan)]/10">
                <Store className="h-5 w-5 text-[var(--cyan)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{product.seller.name}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={product.seller.rating} size="sm" showCount={false} />
                  <span className="text-xs text-[var(--text-muted)]">Seller rating: {product.seller.rating}/5</span>
                  {product.seller.isVerified && <Badge variant="success" className="text-[10px]">Verified</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Details, Specifications, Delivery */}
      <div className="mt-10">
        <div className="flex gap-0 border-b border-[var(--border)]">
          {([
            { key: "details", label: "Product Details" },
            { key: "specs", label: "Specifications" },
            { key: "delivery", label: "Delivery & Returns" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "text-[var(--cyan)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cyan)]" />
              )}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === "details" && (
            <div className="max-w-3xl">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{product.description}</p>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Key Features</h4>
                <ul className="space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="max-w-3xl">
              <table className="w-full">
                <tbody>
                  {specs.map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-[var(--bg-subtle)]/30" : ""}>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-muted)] w-1/3">{key}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">Delivery</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> Free delivery on orders above ₹5,000</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> Estimated delivery: {product.deliveryDays} business day{product.deliveryDays > 1 ? "s" : ""}</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> Same-day delivery available in select areas</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">Returns</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> 7-day return policy for unused items</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> Full refund on defective products</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> GST invoice provided for all orders</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Frequently Bought Together</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {frequentlyBought.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-28 overflow-hidden rounded-lg bg-gradient-to-br from-[#0A0A20] to-[#0D0D25]">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--text-primary)] line-clamp-1">{p.name}</p>
                <p className="mt-1 text-sm font-bold text-[var(--cyan)]">₹{p.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Similar Products in {product.category}</h3>
            <Link href={`/products?category=${product.categorySlug}`} className="text-sm font-medium text-[var(--cyan)] hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-[#0A0A20] to-[#0D0D25]">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-[var(--cyan)]">{p.brand}</p>
                <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">{p.name}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-[var(--cyan)] text-[var(--cyan)]" />
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">{p.rating}</span>
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)]">₹{p.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
