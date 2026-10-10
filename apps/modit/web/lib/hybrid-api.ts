import { products as staticProducts, categories as staticCategories, searchProducts as staticSearch, getProductById as staticGetById } from "./product-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** Cheap connectivity probe: is the API itself reachable right now? */
export async function checkServerUp(timeoutMs = 8000): Promise<boolean> {
  if (!API_BASE || typeof window === "undefined") return false;
  try {
    const res = await fetch(`${API_BASE}/healthz`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("modit_access_token") : null;
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface HybridProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  brand: string | null;
  brandSlug: string | null;
  category: string;
  categorySlug: string;
  subCategory: string | null;
  subCategorySlug: string | null;
  unit: string;
  unitCode: string;
  unitSymbol: string | null;
  price: number;
  mrp: number;
  discount: number;
  bulkPrice: number | null;
  bulkMinQty: number | null;
  bulkLabel: string | null;
  gstRate: number;
  gstCode: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockLevel: number;
  moq: number;
  deliveryDays: number;
  freeDelivery: boolean;
  seller: { name: string; rating: number; isVerified: boolean };
  images: string[];
  specifications: Record<string, string>;
  features: string[];
  tags: string[];
}

function mapApiProduct(p: any): HybridProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || "",
    description: p.description || "",
    shortDescription: p.description || "",
    brand: p.brand?.name || null,
    brandSlug: p.brand?.slug || null,
    category: p.category?.name || "",
    categorySlug: p.category?.slug || "",
    subCategory: p.sub_category?.name || null,
    subCategorySlug: p.sub_category?.slug || null,
    unit: p.unit?.name || "",
    unitCode: p.unit?.code || "",
    unitSymbol: p.unit?.symbol || null,
    price: p.list_price,
    mrp: p.mrp || p.list_price,
    discount: p.mrp ? Math.round(((p.mrp - p.list_price) / p.mrp) * 100) : 0,
    bulkPrice: null,
    bulkMinQty: null,
    bulkLabel: null,
    gstRate: p.gst?.rate_percent || 18,
    gstCode: p.gst?.code || "GST 18%",
    rating: 4.5,
    reviewCount: 0,
    inStock: p.is_active,
    stockLevel: 999,
    moq: 1,
    deliveryDays: 1,
    freeDelivery: true,
    seller: { name: "MODIT Verified", rating: 4.5, isVerified: true },
    images: p.images?.length > 0
      ? p.images.map((img: any) => `/api/v1/media/${img.media_id}`)
      : ["/products/cement/Ambuja Cement.png"],
    specifications: p.specification_json ? JSON.parse(p.specification_json) : {},
    features: [],
    tags: [],
  };
}

export async function fetchProducts(params?: {
  search?: string;
  categorySlug?: string;
  page?: number;
}): Promise<{ items: HybridProduct[]; total: number }> {
  const apiParams = new URLSearchParams();
  if (params?.search) apiParams.set("search", params.search);
  if (params?.categorySlug) apiParams.set("category", params.categorySlug);
  if (params?.page) apiParams.set("page", String(params.page));

  const apiData = await apiFetch<any>(`/products?${apiParams.toString()}`);
  if (apiData?.items) {
    return { items: apiData.items.map(mapApiProduct), total: apiData.total || 0 };
  }

  let filtered = [...staticProducts];
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q))
    );
  }
  if (params?.categorySlug) {
    filtered = filtered.filter((p) => p.categorySlug === params.categorySlug);
  }
  return { items: filtered, total: filtered.length };
}

export async function fetchProductById(id: string): Promise<HybridProduct | null> {
  const apiData = await apiFetch<any>(`/products/${id}`);
  if (apiData?.id) return mapApiProduct(apiData);
  return staticGetById(id) || null;
}

export async function fetchCategories(): Promise<Array<{ name: string; slug: string; description: string; productCount: number }>> {
  const apiData = await apiFetch<any>("/categories");
  if (Array.isArray(apiData)) {
    return apiData.map((c: any) => ({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      productCount: 0,
    }));
  }
  return staticCategories.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: c.productCount,
  }));
}

export async function searchProducts(query: string): Promise<HybridProduct[]> {
  const apiData = await apiFetch<any>(`/products/search?q=${encodeURIComponent(query)}`);
  if (apiData?.items) return apiData.items.map(mapApiProduct);
  return staticSearch(query);
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
}

export async function placeOrder(orderData: {
  items: Array<{ sku: string; quantity: number }>;
  paymentMethod: string;
  addressSnapshot?: Record<string, unknown> | null;
  couponCode?: string;
  gstin?: string;
  notes?: string;
  clientReference?: string;
}): Promise<CheckoutResult> {
  // Real checkout — the server validates SKUs, computes totals from the
  // synced catalog and creates Order + items + payment. NEVER invent an
  // order id here: failures must surface as errors, not fake success.
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("modit_access_token") : null;
    if (!API_BASE) return { success: false, error: "Server not configured." };
    const res = await fetch(`${API_BASE}/modit/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        items: orderData.items,
        payment_method: orderData.paymentMethod,
        address_snapshot: orderData.addressSnapshot ?? null,
        coupon_code: orderData.couponCode ?? null,
        gstin: orderData.gstin ?? null,
        notes: orderData.notes ?? null,
        client_reference: orderData.clientReference ?? null,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401) {
      return { success: false, error: "Please log in again to place your order." };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      const detail = typeof data?.detail === "string" ? data.detail : null;
      return { success: false, error: detail || `Checkout failed (${res.status}). Nothing was charged.` };
    }
    return {
      success: true,
      orderId: data.id,
      orderNumber: data.order_number,
      total: data.grand_total,
    };
  } catch {
    return { success: false, error: "Couldn't reach the server. Check your connection and retry — nothing was charged." };
  }
}

async function postPayments<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("modit_access_token") : null;
  if (!API_BASE) throw new Error("Server not configured.");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : null;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data as T;
}

export function createRazorpayOrder(orderId: string): Promise<{
  key_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
}> {
  return postPayments("/payments/razorpay/order", { order_id: orderId });
}

export function verifyRazorpayPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ verified: boolean; payment_status: string }> {
  return postPayments("/payments/razorpay/verify", {
    order_id: input.orderId,
    razorpay_order_id: input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_signature: input.razorpaySignature,
  });
}

export async function fetchOrders(): Promise<any[]> {
  const apiData = await apiFetch<any>("/orders");
  if (Array.isArray(apiData)) return apiData;
  if (apiData?.items) return apiData.items;
  return [];
}

export async function fetchOrderById(id: string): Promise<any | null> {
  return apiFetch<any>(`/orders/${id}`);
}
