"use client";

import { use, useState, useMemo, useCallback, useEffect } from "react";
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
  Palette,
  Ruler,
} from "lucide-react";
import { Button, Badge, Card, StarRating, PriceDisplay, DeliveryBadge, QuantitySelector } from "@/lib/modit-ui";
import { ShadePicker } from "@/components/shade-picker";
import { OutOfStockSubstitutes } from "@/components/out-of-stock-substitutes";
import { usePincode } from "@/lib/pincode-context";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { getProductById, products } from "@/lib/product-data";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const addItem = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewed((s) => s.addProduct);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "specs" | "delivery">("details");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedShade, setSelectedShade] = useState<string | null>(null);
  const [customColorCode, setCustomColorCode] = useState("");

  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product?.id]);

  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const { setPincode: setContextPincode } = usePincode();
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const wishlisted = product ? isWishlisted(product.id) : false;

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
    addItem(product, quantity, selectedVariant ?? undefined, selectedShade ?? undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }, [product, quantity, addItem, selectedVariant, selectedShade]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    addItem(product, quantity, selectedVariant ?? undefined, selectedShade ?? undefined);
    window.location.href = "/checkout";
  }, [product, quantity, addItem, selectedVariant, selectedShade]);

  const handleCheckDelivery = useCallback(() => {
    if (pincode.length === 6) {
      setPincodeChecked(true);
      setContextPincode(pincode);
    }
  }, [pincode, setContextPincode]);

  const activeVariant = useMemo(() => {
    if (!product?.variants || !selectedVariant) return null;
    return product.variants.find((v) => v.id === selectedVariant) ?? null;
  }, [product, selectedVariant]);

  const displayPrice = activeVariant?.price ?? product?.price ?? 0;
  const displayMrp = activeVariant?.mrp ?? product?.mrp ?? 0;
  const displayUnit = activeVariant?.unit ?? product?.unit ?? "";
  const displayDiscount = activeVariant?.discount ?? product?.discount ?? 0;
  const displayStock = activeVariant?.stockLevel ?? product?.stockLevel ?? 0;

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] py-20 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)]/30" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Product Not Found</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">The product you are looking for does not exist.</p>
        <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const specs = Object.entries(product.specifications);

  return (
    <div className="mx-auto max-w-[1400px] py-4 sm:px-6 pb-24 lg:pb-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)] overflow-x-auto scrollbar-hide pb-1">
        <Link href="/" className="hover:text-[var(--brand)] whitespace-nowrap">Home</Link>
        <ChevronRight className="h-3 w-3 flex-shrink-0" />
        <Link href="/products" className="hover:text-[var(--brand)] whitespace-nowrap">Products</Link>
        <ChevronRight className="h-3 w-3 flex-shrink-0" />
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[var(--brand)] whitespace-nowrap">{product.category}</Link>
        <ChevronRight className="h-3 w-3 flex-shrink-0" />
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[#F0ECF9]">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-32 w-32 text-[var(--text-muted)]/20" />
                </div>
              )}
              {product.discount > 0 && (
                <span className="absolute top-4 left-4 rounded-xl bg-[#E91E63] px-3 py-1 text-sm font-bold text-white shadow-lg shadow-pink-500/20">
                  {product.discount}% OFF
                </span>
              )}
              {/* Image counter */}
              {product.images.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white">
                  {selectedImage + 1} / {product.images.length}
                </span>
              )}
            </div>

            {/* Thumbnails — horizontal scroll on mobile */}
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === selectedImage
                        ? "border-[var(--green)] shadow-md shadow-green-500/20"
                        : "border-[var(--border)] hover:border-[var(--green)]/50"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges — below gallery on mobile */}
            <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
              {[
                { icon: Shield, label: "Genuine", sub: "100% Verified" },
                { icon: CreditCard, label: "Secure", sub: "SSL Payment" },
                { icon: RotateCcw, label: "Returns", sub: "7 Days" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-white p-2.5 text-center">
                  <Icon className="h-4 w-4 text-[var(--green)]" />
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product Info + Buy Box */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand & Title */}
          <div>
            {product.brand && (
              <Link href={`/products?brand=${product.brandSlug}`} className="text-sm font-semibold text-[var(--brand)] hover:underline">
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
          <div className="rounded-xl border border-[var(--border)] bg-white p-5">
            {/* Delivery promise bar */}
            <div className="rounded-xl bg-gradient-to-r from-[#7CB518]/10 to-[#00BCD4]/10 border border-[#7CB518]/20 p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#7CB518] flex items-center justify-center">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#150726]">Delivery in 60 minutes</p>
                    <p className="text-[10px] text-[#9B8CB5]">Order within <span className="text-[#E91E63] font-bold">47:23</span> for fastest delivery</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#9B8CB5]">Tomorrow by</p>
                  <p className="text-[12px] font-bold text-[#7CB518]">10:00 AM</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-[#E8E0F7] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7CB518] to-[#00BCD4] rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            {/* Delivery + Cashback badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F9FC] border border-[#00BCD4]/20 px-2.5 py-1 text-[11px] font-bold text-[#00BCD4]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                60 Min Delivery
              </span>
              {product.cashbackPercent && product.cashbackPercent > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FCE8F0] border border-[#E91E63]/20 px-2.5 py-1 text-[11px] font-bold text-[#E91E63]">
                  Assured {product.cashbackPercent}% Cashback
                </span>
              )}
              {product.freeDelivery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F9E8] border border-[#7CB518]/20 px-2.5 py-1 text-[11px] font-bold text-[#7CB518]">
                  Free Delivery
                </span>
              )}
            </div>
            <PriceDisplay
              price={displayPrice}
              mrp={displayMrp}
              discount={displayDiscount}
              bulkPrice={activeVariant?.bulkPrice ?? product.bulkPrice}
              bulkLabel={activeVariant ? `Bulk: ₹${activeVariant.bulkPrice?.toLocaleString()} at ${activeVariant.bulkMinQty}+` : product.bulkLabel}
              unit={displayUnit}
              size="lg"
            />
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)] flex-wrap">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Inclusive of {product.gstCode}
              </span>
              <span>·</span>
              <span>MOQ: {product.moq} {activeVariant?.unitCode ?? product.unitCode}</span>
              {displayStock <= 100 && displayStock > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#E91E63] font-semibold">Only {displayStock} left</span>
                </>
              )}
            </div>
            {/* B2B bulk info */}
            {(activeVariant?.bulkPrice ?? product.bulkPrice) && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FFF3E0] border border-[#FFE0B2] px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                <span className="text-[11px] font-semibold text-[#E65100]">
                  Bulk pricing — {activeVariant ? `₹${activeVariant.bulkPrice?.toLocaleString()} at ${activeVariant.bulkMinQty}+ units` : product.bulkLabel || `Min ${product.bulkMinQty} units`}
                </span>
              </div>
            )}
          </div>

          {/* Size Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-3">
                <Ruler className="h-4 w-4 text-[var(--brand)]" />
                Select Size
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant === variant.id;
                  const variantDiscount = variant.mrp > variant.price
                    ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)
                    : 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`relative flex flex-col items-center rounded-xl border-2 px-4 py-3 transition-all ${
                        isSelected
                          ? "border-[var(--brand)] bg-[var(--brand-50)] shadow-md"
                          : "border-[var(--border)] bg-white hover:border-[var(--brand-200)]"
                      }`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>
                        {variant.label}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        ₹{variant.price.toLocaleString()}
                      </span>
                      {variantDiscount > 0 && (
                        <span className="absolute -top-2 -right-2 rounded-full bg-[#E91E63] px-1.5 py-0.5 text-[8px] font-bold text-white">
                          {variantDiscount}% off
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shade/Color Picker — only for paint products with shades */}
          {product.hasShades && product.shades && product.shades.length > 0 && (
            <ShadePicker
              shades={product.shades}
              selectedShade={selectedShade}
              onSelectShade={setSelectedShade}
              customColorCode={customColorCode}
              onCustomColorCodeChange={setCustomColorCode}
            />
          )}

          {/* Delivery Check */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Truck className="h-4 w-4 text-[var(--brand)]" />
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
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
                />
              </div>
              <Button variant="secondary" onClick={handleCheckDelivery} disabled={pincode.length < 6}>
                Check
              </Button>
            </div>
            {pincodeChecked && (
              <div className="mt-3 space-y-2">
                <div className="rounded-xl bg-[#F0F9E8] border border-[#7CB518]/20 p-3">
                  <div className="flex items-center gap-2 text-sm text-[#150726]">
                    <CheckCircle2 className="h-4 w-4 text-[#7CB518]" />
                    <span className="font-bold">Delivering to {pincode}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-[#7CB518]/10">
                      <Truck className="h-4 w-4 text-[#7CB518]" />
                      <div>
                        <p className="text-[10px] text-[#9B8CB5]">Express</p>
                        <p className="text-[11px] font-bold text-[#150726]">60 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-[#00BCD4]/10">
                      <Clock className="h-4 w-4 text-[#00BCD4]" />
                      <div>
                        <p className="text-[10px] text-[#9B8CB5]">Scheduled</p>
                        <p className="text-[11px] font-bold text-[#150726]">Tomorrow</p>
                      </div>
                    </div>
                  </div>
                  {product.freeDelivery && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#7CB518] font-semibold">
                      <Truck className="h-3.5 w-3.5" /> Free delivery on this order
                    </div>
                  )}
                </div>
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
                onClick={() => product && toggleWishlist(product)}
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
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-white p-3 text-center">
                <Icon className="h-5 w-5 text-[var(--brand)]" />
                <span className="text-[10px] font-bold text-[var(--text-primary)]">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{sub}</span>
              </div>
            ))}
          </div>

          {/* Seller Info */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)]/10">
                <Store className="h-5 w-5 text-[var(--green)]" />
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
            {/* GST Invoice notice */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
              <CreditCard className="h-4 w-4 text-[var(--brand)]" />
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">GST invoice available for all orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--border)] px-4 py-3 flex items-center gap-3 lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex-1">
          <p className="text-[11px] text-[var(--text-muted)]">Total ({quantity} {quantity === 1 ? "item" : "items"})</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">₹{(product.price * quantity).toLocaleString()}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 h-12 rounded-xl bg-[var(--green)] text-white text-[14px] font-bold hover:bg-[var(--green-hover)] transition-all active:scale-[0.98] shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
        >
          {added ? (
            <><CheckCircle2 className="h-5 w-5" /> Added</>
          ) : (
            <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 h-12 rounded-xl bg-[var(--brand)] text-white text-[14px] font-bold hover:bg-[var(--brand-hover)] transition-all active:scale-[0.98] shadow-lg shadow-purple-900/25 flex items-center justify-center gap-2"
        >
          <Zap className="h-5 w-5" /> Buy Now
        </button>
      </div>

      {/* Out of stock substitutes */}
      <div className="mt-4">
        <OutOfStockSubstitutes product={product} />
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
                activeTab === tab.key ? "text-[var(--brand)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
              <Link key={p.id} href={`/products/${p.id}`} className="rounded-xl border border-[var(--border)] bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-28 overflow-hidden rounded-lg bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)]">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--text-primary)] line-clamp-1">{p.name}</p>
                <p className="mt-1 text-sm font-bold text-[var(--brand)]">₹{p.price.toLocaleString()}</p>
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
            <Link href={`/products?category=${product.categorySlug}`} className="text-sm font-medium text-[var(--brand)] hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="rounded-xl border border-[var(--border)] bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)]">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-[var(--brand)]">{p.brand}</p>
                <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">{p.name}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-[var(--cyan)] text-[var(--brand)]" />
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
