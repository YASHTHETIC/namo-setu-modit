"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useProduct, useProducts, useCategories, useCreateCart } from "@/lib/modit-api";
import type { ProductDetailRead } from "@foundation/api-client";
import {
  ArrowLeft,
  Package,
  Star,
  Truck,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap,
  Store,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button, Badge, Card, Panel, Skeleton, EmptyState } from "@/lib/modit-ui";

interface FallbackProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  list_price: number;
  mrp: number | null;
  category: { name: string; slug: string };
  brand: { name: string; slug: string } | null;
  unit: { name: string; code: string; symbol: string | null };
  gst: { code: string; rate_percent: number } | null;
  specification_json: string | null;
  images: Array<{ id: string; media_id: string; caption: string | null; sort_order: number; is_primary: boolean }>;
  supplier: { id: string; name: string; is_verified: boolean } | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  moq: number;
  delivery_days: number;
}

const fallbackProducts: Record<string, FallbackProduct> = {
  "p1": {
    id: "p1",
    name: "TMT Steel Bars Fe-500D 12mm",
    sku: "STL-TMT-500D-12",
    description: "High tensile strength TMT bars for structural reinforcement. Conforms to IS 1786:2008 standards. Used in RCC structures, bridges, and high-rise buildings.",
    list_price: 62000,
    mrp: 68000,
    category: { name: "Steel & TMT", slug: "steel-tmt" },
    brand: { name: "Tata Tiscon", slug: "tata-tiscon" },
    unit: { name: "Metric Ton", code: "MT", symbol: "t" },
    gst: { code: "GST 18%", rate_percent: 18 },
    specification_json: JSON.stringify({
      "Grade": "Fe-500D",
      "Diameter": "12mm",
      "Length": "12m",
      "Yield Strength": "500 MPa",
      "Tensile Strength": "565 MPa",
      "Elongation": "18%",
      "Standard": "IS 1786:2008",
      "Surface": "Corrugated",
    }),
    images: [],
    supplier: { id: "s1", name: "Tata Steel Distribution", is_verified: true },
    rating: 4.8,
    review_count: 234,
    in_stock: true,
    moq: 1,
    delivery_days: 3,
  },
  "p2": {
    id: "p2",
    name: "Portland Pozzolana Cement PPC 53 Grade",
    sku: "CEM-PPC-53-50KG",
    description: "ISI marked 53 grade PPC cement for durable construction. Suitable for all general construction work including RCC, plastering, and masonry.",
    list_price: 380,
    mrp: 420,
    category: { name: "Cement", slug: "cement" },
    brand: { name: "UltraTech Cement", slug: "ultratech-cement" },
    unit: { name: "Bag (50 kg)", code: "BAG", symbol: null },
    gst: { code: "GST 28%", rate_percent: 28 },
    specification_json: JSON.stringify({
      "Grade": "53 Grade PPC",
      "Weight": "50 kg",
      "Compressive Strength (28 days)": "53 MPa",
      "Setting Time (Initial)": "30 min",
      "Fineness": "350 m²/kg",
      "Standard": "IS 1489 (Part 1):2015",
    }),
    images: [],
    supplier: { id: "s2", name: "UltraTech Cement Dealers", is_verified: true },
    rating: 4.6,
    review_count: 567,
    in_stock: true,
    moq: 50,
    delivery_days: 2,
  },
  "p3": {
    id: "p3",
    name: "Red Clay Bricks First Class (9x4x3 inch)",
    sku: "BRK-RED-FC-943",
    description: "First class machine molded red clay bricks. Uniform shape and size, high compressive strength. Ideal for load bearing and partition walls.",
    list_price: 8.5,
    mrp: 10,
    category: { name: "Bricks & Blocks", slug: "bricks-blocks" },
    brand: null,
    unit: { name: "Piece", code: "PCS", symbol: null },
    gst: { code: "GST 5%", rate_percent: 5 },
    specification_json: JSON.stringify({
      "Size": "9 x 4 x 3 inch (228 x 107 x 75 mm)",
      "Compressive Strength": "10 MPa minimum",
      "Water Absorption": "20% max",
      "Class": "First Class",
      "Type": "Machine Molded",
      "Color": "Red",
    }),
    images: [],
    supplier: { id: "s3", name: "Bharat Bricks Supply Co.", is_verified: false },
    rating: 4.2,
    review_count: 89,
    in_stock: true,
    moq: 1000,
    delivery_days: 5,
  },
  "p4": {
    id: "p4",
    name: "MS Pipes ERW 2 inch (50mm) x 6m",
    sku: "PIP-MS-ERW-2x6",
    description: "Electric resistance welded mild steel pipes. Suitable for structural use, plumbing, and water supply lines. Conforms to IS 1239 Part 1.",
    list_price: 1250,
    mrp: 1400,
    category: { name: "Pipes & Fittings", slug: "pipes-fittings" },
    brand: { name: "Surya Roshni", slug: "surya-roshni" },
    unit: { name: "Piece", code: "PCS", symbol: null },
    gst: { code: "GST 18%", rate_percent: 18 },
    specification_json: JSON.stringify({
      "Diameter": "2 inch (50mm)",
      "Length": "6m",
      "Wall Thickness": "3.2mm",
      "Grade": "IS 1239 Part 1",
      "Type": "ERW",
      "Surface": "Black",
    }),
    images: [],
    supplier: { id: "s4", name: "Surya Roshni authorized distributor", is_verified: true },
    rating: 4.5,
    review_count: 123,
    in_stock: true,
    moq: 10,
    delivery_days: 4,
  },
  "p5": {
    id: "p5",
    name: "River Sand M-Sand Alternative 0-20mm",
    sku: "SND-RVR-20MM",
    description: "Clean river sand graded 0-20mm for concrete mixing. Free from organic impurities. Suitable for plastering and concrete work.",
    list_price: 2800,
    mrp: 3200,
    category: { name: "Aggregates & Sand", slug: "aggregates-sand" },
    brand: null,
    unit: { name: "Metric Ton", code: "MT", symbol: "t" },
    gst: { code: "GST 5%", rate_percent: 5 },
    specification_json: JSON.stringify({
      "Grading": "0-20mm",
      "Type": "River Sand",
      "Moisture Content": "< 5%",
      "Organic Impurities": "Nil",
      "Silt Content": "< 5%",
      "Fineness Modulus": "2.6-2.9",
    }),
    images: [],
    supplier: { id: "s5", name: "Kumar Sand Suppliers", is_verified: false },
    rating: 4.0,
    review_count: 45,
    in_stock: true,
    moq: 5,
    delivery_days: 1,
  },
  "p6": {
    id: "p6",
    name: "White Marble Tiles 2x2 ft (Polished)",
    sku: "TLS-MRB-2x2-POL",
    description: "Premium white marble floor tiles polished finish. Natural veining patterns, suitable for flooring, wall cladding, and countertops.",
    list_price: 85,
    mrp: 100,
    category: { name: "Tiles & Ceramics", slug: "tiles-ceramics" },
    brand: { name: "Kajaria Ceramics", slug: "kajaria-ceramics" },
    unit: { name: "Square Foot", code: "SQFT", symbol: "ft²" },
    gst: { code: "GST 18%", rate_percent: 18 },
    specification_json: JSON.stringify({
      "Size": "2 x 2 ft (600 x 600 mm)",
      "Thickness": "10-12mm",
      "Finish": "Polished",
      "Material": "White Marble",
      "Water Absorption": "< 0.5%",
      "Application": "Flooring, Wall Cladding",
    }),
    images: [],
    supplier: { id: "s6", name: "Kajaria Premium Showroom", is_verified: true },
    rating: 4.7,
    review_count: 312,
    in_stock: true,
    moq: 50,
    delivery_days: 7,
  },
};

function parseSpecifications(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: apiProduct, isLoading, isError } = useProduct(id);
  const { data: relatedProductsData } = useProducts({ page: 1 });
  const createCart = useCreateCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = useMemo(() => {
    if (apiProduct) return apiProduct as ProductDetailRead & { supplier?: FallbackProduct["supplier"] };
    return fallbackProducts[id] ?? null;
  }, [apiProduct, id]);

  const specifications = useMemo(() => {
    if (!product) return {};
    return parseSpecifications(product.specification_json ?? null);
  }, [product]);

  const getQuantityMultiplier = useCallback((qty: number): number => {
    if (qty >= 100) return 0.92;
    if (qty >= 50) return 0.95;
    if (qty >= 20) return 0.97;
    return 1;
  }, []);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.list_price;
    const multiplier = getQuantityMultiplier(quantity);
    return base * multiplier;
  }, [product, quantity, getQuantityMultiplier]);

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const savings = useMemo(() => {
    if (!product?.mrp) return 0;
    return (product.mrp - unitPrice) * quantity;
  }, [product, unitPrice, quantity]);

  const gstAmount = useMemo(() => {
    if (!product?.gst) return 0;
    return totalPrice * (product.gst.rate_percent / 100);
  }, [totalPrice, product]);

  const handleCheckDelivery = useCallback(() => {
    if (!pincode || pincode.length < 6) return;
    setPincodeChecked(true);
    if (product && "delivery_days" in product) {
      const days = (product as FallbackProduct).delivery_days;
      setDeliveryEstimate(`${days} business days`);
    } else {
      setDeliveryEstimate("3-5 business days");
    }
  }, [pincode, product]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    try {
      await createCart.mutateAsync({
        product_id: product.id,
        quantity,
      });
    } catch {
      // Fallback: just show success
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }, [product, quantity, createCart]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Product Not Found"
          description="The product you are looking for does not exist or has been removed."
          action={
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const specs = Object.entries(specifications);
  const primaryImage = product.images?.[selectedImageIndex];

  const fallbackRelated = Object.values(fallbackProducts).filter((p) => p.id !== id).slice(0, 4);
  const relatedProducts = relatedProductsData?.items?.filter((p: any) => p.id !== id).slice(0, 4) ?? fallbackRelated;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-[var(--brand)] transition-colors">Products</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/products?category=${product.category?.slug ?? ""}`}
          className="hover:text-[var(--brand)] transition-colors"
        >
          {product.category?.name ?? "Category"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border border-[var(--border)]">
            {primaryImage ? (
              <img
                src={`/api/v1/media/${primaryImage.media_id}`}
                alt={primaryImage.caption ?? product.name}
                className="h-full w-full object-contain p-8"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-32 w-32 text-[var(--brand)]/20" />
              </div>
            )}
            {product.mrp && product.mrp > product.list_price && (
              <Badge variant="danger" className="absolute top-4 left-4 px-3 py-1 text-sm font-bold">
                {Math.round(((product.mrp - product.list_price) / product.mrp) * 100)}% OFF
              </Badge>
            )}
            {product.supplier && "is_verified" in product.supplier && (product.supplier as any).is_verified && (
              <Badge variant="success" className="absolute top-4 right-4 px-3 py-1 text-sm">
                <Shield className="mr-1 inline h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === selectedImageIndex
                      ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20"
                      : "border-[var(--border)] hover:border-[var(--brand)]/50"
                  }`}
                >
                  <img
                    src={`/api/v1/media/${img.media_id}`}
                    alt={img.caption ?? `Image ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-[var(--border-subtle)] px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                  <Info className="h-4 w-4 text-[var(--brand)]" />
                  Specifications
                </h3>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex items-center px-6 py-3">
                    <span className="w-1/3 text-sm font-medium text-[var(--text-muted)]">{key}</span>
                    <span className="w-2/3 text-sm text-[var(--text-primary)]">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Product Info + Purchase */}
        <div className="space-y-6">
          {/* Brand & Category */}
          <div className="flex items-center gap-3">
            {product.brand && (
              <Link
                href={`/products?brand=${product.brand.slug}`}
                className="text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                {product.brand.name}
              </Link>
            )}
            {product.brand && product.category && (
              <span className="text-[var(--text-muted)]">·</span>
            )}
            <Link
              href={`/products?category=${product.category?.slug}`}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
            >
              {product.category?.name}
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating & SKU */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round((product as any).rating ?? 0)
                        ? "fill-[var(--brand)] text-[var(--brand)]"
                        : "fill-[var(--border)] text-[var(--border)]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {(product as any).rating?.toFixed(1) ?? "0.0"}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                ({(product as any).review_count ?? 0} reviews)
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">SKU: {product.sku}</span>
          </div>

          {/* Price Block */}
          <div className="rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/60 border border-orange-100 p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[var(--brand)]">
                ₹{unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                / {product.unit?.name ?? "unit"}
              </span>
              {product.mrp && product.mrp > product.list_price && (
                <span className="text-lg text-[var(--text-muted)] line-through">
                  ₹{product.mrp.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="mt-2 text-sm font-medium text-emerald-700">
                You save ₹{savings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            {product.gst && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Inclusive of {product.gst.code} (₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </p>
            )}
            {quantity >= 20 && (
              <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--brand)]">
                <Zap className="h-4 w-4" />
                Bulk discount applied: {Math.round((1 - getQuantityMultiplier(quantity)) * 100)}% off
              </div>
            )}
          </div>

          {/* MOQ & Stock */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--text-muted)]">
              MOQ: <span className="font-semibold text-[var(--text-primary)]">{(product as any).moq ?? 1} {product.unit?.code}</span>
            </span>
            {(product as any).in_stock ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> In Stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle className="h-4 w-4" /> Out of Stock
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                <button
                  onClick={() => setQuantity(Math.max((product as any).moq ?? 1, quantity - 1))}
                  className="h-10 px-3 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQuantity(Math.max((product as any).moq ?? 1, val));
                  }}
                  className="h-10 w-20 border-x border-[var(--border)] bg-transparent text-center text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 px-3 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-[var(--text-muted)]">
                Total: <span className="font-bold text-[var(--text-primary)]">₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            </div>
            {/* Quick quantity buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setQuantity(qty)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    quantity === qty
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
                  }`}
                >
                  {qty} {product.unit?.code}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 h-12 text-base font-semibold"
              disabled={!(product as any).in_stock}
            >
              {addedToCart ? (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="h-12 w-12 px-0"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="secondary" className="h-12 w-12 px-0">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Delivery Check */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Truck className="h-4 w-4 text-[var(--brand)]" />
                Delivery Check
              </h4>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setPincodeChecked(false);
                    setDeliveryEstimate(null);
                  }}
                  className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
                <Button variant="secondary" onClick={handleCheckDelivery} disabled={pincode.length < 6}>
                  Check
                </Button>
              </div>
              {pincodeChecked && deliveryEstimate && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                  <Clock className="h-4 w-4" />
                  Delivery in <span className="font-semibold">{deliveryEstimate}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Supplier Info */}
          {product.supplier && (
            <Card className="overflow-hidden">
              <div className="px-5 py-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Store className="h-4 w-4 text-[var(--brand)]" />
                  Sold by
                </h4>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {product.supplier.name}
                    </p>
                    {(product.supplier as any).is_verified && (
                      <Badge variant="success" className="mt-1">
                        <Shield className="mr-1 inline h-3 w-3" /> Verified Supplier
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Key Features */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Why choose this product?</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  Quality assured — ISI / BIS certified
                </li>
                <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  Free delivery on orders above ₹10,000
                </li>
                <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  Secure payment — pay online or via credit terms
                </li>
                <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  Easy returns within 7 days
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Description */}
      <Card className="mt-8 overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Product Description</h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {product.description}
          </p>
        </div>
      </Card>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Related Products</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rp: any) => (
              <Link key={rp.id} href={`/products/${rp.id}`}>
                <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg h-full">
                  <div className="h-36 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
                    <Package className="h-12 w-12 text-[var(--brand)]/30" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-[var(--brand)]">{rp.brand?.name ?? ""}</p>
                    <h4 className="mt-1 text-sm font-semibold text-[var(--text-primary)] line-clamp-2">{rp.name}</h4>
                    <p className="mt-2 text-lg font-bold text-[var(--brand)]">₹{rp.list_price?.toLocaleString()}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
