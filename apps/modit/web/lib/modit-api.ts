"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiClient, createModitApi } from "@foundation/api-client";

import { getAccessToken } from "./auth";
import { env } from "./env";

function getModitApi() {
  return createModitApi(
    createApiClient({
      baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
      accessToken: getAccessToken(),
      timeout: 5000,
      maxRetries: 1,
      retryDelay: 300,
    })
  );
}

/** Plain (non-hook) fetch of one order's full detail — used by reorder from
 * the orders list, which only has ids and totals (the list endpoint does
 * not return line items). */
export function fetchOrderDetail(orderId: string) {
  return getModitApi().getOrder(orderId);
}

const fastQueryOpts = { retry: false, staleTime: 30_000, gcTime: 60_000 } as const;

export const moditKeys = {
  all: ["modit"] as const,
  products: (params?: Record<string, unknown>) => ["modit", "products", params] as const,
  product: (id: string) => ["modit", "product", id] as const,
  categories: () => ["modit", "categories"] as const,
  subcategories: (categoryId?: string) => ["modit", "subcategories", categoryId] as const,
  brands: () => ["modit", "brands"] as const,
  units: () => ["modit", "units"] as const,
  suppliers: () => ["modit", "suppliers"] as const,
  supplier: (id: string) => ["modit", "supplier", id] as const,
  warehouses: (orgId?: string) => ["modit", "warehouses", orgId] as const,
  rfqs: (orgId?: string) => ["modit", "rfqs", orgId] as const,
  rfq: (id: string) => ["modit", "rfq", id] as const,
  quotations: (rfqId: string) => ["modit", "quotations", rfqId] as const,
  orders: (orgId?: string) => ["modit", "orders", orgId] as const,
  order: (id: string) => ["modit", "order", id] as const,
  purchaseOrders: (orgId?: string) => ["modit", "purchase-orders", orgId] as const,
  invoices: (orgId?: string) => ["modit", "invoices", orgId] as const,
  inventory: (warehouseId?: string) => ["modit", "inventory", warehouseId] as const,
  inventoryAlerts: (orgId?: string) => ["modit", "inventory-alerts", orgId] as const,
  inventoryAnalytics: (orgId?: string) => ["modit", "inventory-analytics", orgId] as const,
  adminCoupons: () => ["modit", "admin-coupons"] as const,
  coupons: () => ["modit", "coupons"] as const,
  deliveries: (poId?: string) => ["modit", "deliveries", poId] as const,
  deliveryTrack: (id: string) => ["modit", "delivery-track", id] as const,
  nearestWarehouse: (lat?: number, lng?: number) => ["modit", "nearest-warehouse", lat, lng] as const,
  supportConversations: () => ["modit", "support-conversations"] as const,
  supportConversation: (id: string) => ["modit", "support-conversation", id] as const,
  drivers: (orgId?: string) => ["modit", "drivers", orgId] as const,
  vehicles: (orgId?: string) => ["modit", "vehicles", orgId] as const,
  projects: (orgId?: string) => ["modit", "projects", orgId] as const,
  project: (id: string) => ["modit", "project", id] as const,
  materialRequests: (projectId: string) => ["modit", "material-requests", projectId] as const,
  analytics: () => ["modit", "analytics"] as const,
  notifications: (orgId: string) => ["modit", "notifications", orgId] as const,
  layout: (screen: string, pincode?: string) => ["modit", "layout", screen, pincode] as const,
  auditLogs: (page?: number, pageSize?: number) => ["modit", "audit-logs", page, pageSize] as const,
};

// Product Catalog
// The backend caps page_size at 200 (list perf budget). A few screens — the
// product explorer, home rails, dashboard — intentionally ask for the WHOLE
// catalog in one cached query so client-side filters and sidebar counts can
// never disagree. Honour that intent by walking the server pages inside this
// single queryFn and concatenating: same hook API, same cache key, live data
// instead of the 422 → static-catalog fallback (which hid admin edits).
const SERVER_MAX_PAGE_SIZE = 200;

async function listProductsPaged(
  params: Parameters<ReturnType<typeof getModitApi>["listProducts"]>[0],
  signal: AbortSignal,
) {
  const wanted = Number(params?.page_size ?? 0);
  if (!params || wanted <= SERVER_MAX_PAGE_SIZE) {
    return getModitApi().listProducts(params, { signal });
  }
  const pageSize = SERVER_MAX_PAGE_SIZE;
  const first = await getModitApi().listProducts({ ...params, page: 1, page_size: pageSize }, { signal });
  const firstPage = first as { items?: unknown[]; total?: number };
  const items = [...(firstPage.items ?? [])];
  const total = Number(firstPage.total ?? items.length);
  // Never walk past what the caller asked for (wanted/size pages), and never
  // past what the server reports (total/size) — whichever is smaller.
  const pages = Math.min(Math.ceil(total / pageSize), Math.ceil(wanted / pageSize));
  if (pages > 1) {
    // Remaining pages in parallel — page 1 already told us the total.
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        getModitApi().listProducts({ ...params, page: i + 2, page_size: pageSize }, { signal })
      ),
    );
    for (const next of rest) items.push(...(((next as { items?: unknown[] }).items ?? []) as unknown[]));
  }
  return { ...(first as object), items, total } as typeof first;
}

export function useProducts(params?: { search?: string; category_id?: string; brand_id?: string; category_slug?: string; brand_slug?: string; supplier_id?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: moditKeys.products(params),
    // react-query aborts the in-flight request on key change/unmount via signal.
    queryFn: ({ signal }) => listProductsPaged(params, signal),
    ...fastQueryOpts,
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: moditKeys.product(productId ?? ""),
    queryFn: () => getModitApi().getProduct(productId!),
    enabled: Boolean(productId),
    ...fastQueryOpts,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateProduct(id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: moditKeys.product(vars.id) });
      queryClient.invalidateQueries({ queryKey: moditKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getModitApi().deleteProduct(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: moditKeys.all });
      const queries = queryClient.getQueriesData<{ items: Array<{ id: string }> }>({ queryKey: ["modit", "products"] });
      queries.forEach(([key, data]) => {
        if (data?.items) {
          queryClient.setQueryData(key, { ...data, items: data.items.filter((p) => p.id !== id) });
        }
      });
      return { queries };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: moditKeys.categories(),
    queryFn: () => getModitApi().listCategories(),
    ...fastQueryOpts,
  });
}

export function useSubCategories(categoryId?: string) {
  return useQuery({
    queryKey: moditKeys.subcategories(categoryId),
    queryFn: () => getModitApi().listSubCategories(categoryId),
    ...fastQueryOpts,
  });
}

function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: moditKeys.categories() });
  queryClient.invalidateQueries({ queryKey: moditKeys.all });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createCategory,
    onSuccess: () => invalidateCatalog(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateCategory(id, payload),
    onSuccess: () => invalidateCatalog(queryClient),
  });
}

export function useCreateSubCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createSubCategory,
    onSuccess: () => invalidateCatalog(queryClient),
  });
}

export function useUpdateSubCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateSubCategory(id, payload),
    onSuccess: () => invalidateCatalog(queryClient),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: moditKeys.brands(),
    queryFn: () => getModitApi().listBrands(),
    ...fastQueryOpts,
  });
}

export function useUnits() {
  return useQuery({
    queryKey: moditKeys.units(),
    queryFn: () => getModitApi().listUnits(),
    ...fastQueryOpts,
  });
}

// Supplier Platform
export function useSuppliers() {
  return useQuery({
    queryKey: moditKeys.suppliers(),
    queryFn: () => getModitApi().listSuppliers(),
    ...fastQueryOpts,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.suppliers() }),
  });
}

export function useSupplierVendors(supplierId: string) {
  return useQuery({
    queryKey: ["modit", "supplier-vendors", supplierId],
    queryFn: () => getModitApi().listSupplierVendors(supplierId),
    enabled: Boolean(supplierId),
    ...fastQueryOpts,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: Record<string, unknown> }) =>
      getModitApi().createVendor(supplierId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useWarehouses(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.warehouses(organizationId),
    queryFn: () => getModitApi().listWarehouses(organizationId),
    ...fastQueryOpts,
  });
}

export interface AuditLogEntry {
  id: string;
  product_code: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json: string | null;
  after_json: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogPage {
  logs: AuditLogEntry[];
  total: number;
}

/** Server-side staff audit trail (GET /admin/audit-logs, AUDIT_READ). Why a
 * raw client call: createModitApi() has no audit-logs method, and this list
 * needs the logged-in staff token just like everything else here. */
export async function listAuditLogs(page = 1, pageSize = 50, signal?: AbortSignal): Promise<AuditLogPage> {
  const client = createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: getAccessToken(),
    timeout: 8000,
    maxRetries: 1,
    retryDelay: 300,
  });
  return client.request<AuditLogPage>(
    `/admin/audit-logs?page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`,
    { signal }
  );
}

export function useAuditLogs(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: moditKeys.auditLogs(page, pageSize),
    queryFn: ({ signal }) => listAuditLogs(page, pageSize, signal),
    enabled: Boolean(getAccessToken()),
    ...fastQueryOpts,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useSeedCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getModitApi().seedCatalog(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// RFQ / Quotation
export function useRFQs(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.rfqs(organizationId),
    queryFn: () => getModitApi().listRFQs(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createRFQ,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useRFQ(rfqId: string) {
  return useQuery({
    queryKey: moditKeys.rfq(rfqId),
    queryFn: () => getModitApi().getRFQ(rfqId),
    enabled: Boolean(rfqId),
    ...fastQueryOpts,
  });
}

export function useRFQQuotations(rfqId: string) {
  return useQuery({
    queryKey: moditKeys.quotations(rfqId),
    queryFn: () => getModitApi().listRFQQuotations(rfqId),
    enabled: Boolean(rfqId),
    ...fastQueryOpts,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createQuotation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useAddRFQItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfqId, lines }: {
      rfqId: string;
      lines: Array<{ product_id: string; requested_quantity: number; unit_price_hint?: number | null; notes?: string | null }>;
    }) => getModitApi().addRFQItems(rfqId, lines),
    onSuccess: (_d, v) => queryClient.invalidateQueries({ queryKey: moditKeys.rfq(v.rfqId) }),
  });
}

export function useAwardRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfqId, quotationId }: { rfqId: string; quotationId: string }) =>
      getModitApi().awardRFQ(rfqId, quotationId),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: moditKeys.rfq(v.rfqId) });
      queryClient.invalidateQueries({ queryKey: moditKeys.rfqs() });
      queryClient.invalidateQueries({ queryKey: moditKeys.quotations(v.rfqId) });
    },
  });
}

// Orders
export function useCreateCart() {
  return useMutation({
    mutationFn: getModitApi().createCart,
  });
}

export function useOrders(
  organizationId?: string,
  fallbackData?: any[],
  opts?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: moditKeys.orders(organizationId),
    queryFn: () => getModitApi().listOrders(organizationId),
    placeholderData: fallbackData,
    // Guests never hit the orders endpoint (401 noise); callers pass
    // { enabled: loggedIn } when the UI is auth-only.
    enabled: opts?.enabled ?? true,
    // Keep the order list fresh while it is open
    refetchInterval: 60_000,
    ...fastQueryOpts,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useOrder(orderId: string, fallbackData?: any) {
  return useQuery({
    queryKey: moditKeys.order(orderId),
    queryFn: () => getModitApi().getOrder(orderId),
    enabled: Boolean(orderId),
    placeholderData: fallbackData,
    // Live tracking: re-check status every 30s while the page is open
    refetchInterval: 30_000,
    ...fastQueryOpts,
  });
}

export function usePurchaseOrders(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.purchaseOrders(organizationId),
    queryFn: () => getModitApi().listPurchaseOrders(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createPurchaseOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useInvoices(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.invoices(organizationId),
    queryFn: () => getModitApi().listInvoices(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createReturn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// Inventory
export function useInventory(warehouseId?: string) {
  return useQuery({
    queryKey: moditKeys.inventory(warehouseId),
    queryFn: () => getModitApi().listInventory(warehouseId),
    ...fastQueryOpts,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createInventory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateInventory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useInventoryAlerts(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.inventoryAlerts(organizationId),
    queryFn: () => getModitApi().getInventoryAlerts(organizationId),
    ...fastQueryOpts,
  });
}

// Coupons shown to buyers (same data checkout validates)
export function useServerCoupons() {
  return useQuery({
    queryKey: moditKeys.coupons(),
    queryFn: ({ signal }) => getModitApi().listCoupons({ signal }),
    ...fastQueryOpts,
  });
}

// Server-managed coupons (checkout validation truth)
export function useAdminCoupons() {
  return useQuery({
    queryKey: moditKeys.adminCoupons(),
    queryFn: ({ signal }) => getModitApi().listAdminCoupons({ signal }),
    ...fastQueryOpts,
  });
}

export function useCreateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => getModitApi().createAdminCoupon(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.adminCoupons() }),
  });
}

export function useUpdateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateAdminCoupon(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.adminCoupons() }),
  });
}

export function useDeleteAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getModitApi().deleteAdminCoupon(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.adminCoupons() }),
  });
}

export function useInventoryAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.inventoryAnalytics(organizationId),
    queryFn: () => getModitApi().getInventoryAnalytics(organizationId),
    ...fastQueryOpts,
  });
}

// Delivery
export function useDeliveries(purchaseOrderId?: string) {
  return useQuery({
    queryKey: moditKeys.deliveries(purchaseOrderId),
    queryFn: () => getModitApi().listDeliveries(purchaseOrderId),
    ...fastQueryOpts,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createDelivery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useDeliveryTrack(deliveryId: string | undefined) {
  return useQuery({
    queryKey: moditKeys.deliveryTrack(deliveryId ?? ""),
    queryFn: () => getModitApi().getDeliveryTrack(deliveryId!),
    enabled: Boolean(deliveryId),
    // Live tracking: poll every 15s while the page is open (public link, no login needed).
    refetchInterval: 15_000,
    ...fastQueryOpts,
  });
}

export function useOrderDelivery(orderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...moditKeys.deliveries(), "order", orderId ?? ""],
    queryFn: () => getModitApi().getOrderDelivery(orderId!),
    enabled: Boolean(orderId) && enabled,
    // 404 when no delivery yet — don't retry, the card hides itself.
    ...fastQueryOpts,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      getModitApi().updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moditKeys.orders() });
      queryClient.invalidateQueries({ queryKey: moditKeys.all });
    },
  });
}

export function useServerReturns(enabled = true) {
  return useQuery({
    queryKey: [...moditKeys.all, "server-returns"] as const,
    queryFn: () => getModitApi().listReturns(),
    enabled,
    ...fastQueryOpts,
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ returnId, status }: { returnId: string; status: string }) =>
      getModitApi().updateReturnStatus(returnId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...moditKeys.all, "server-returns"] });
    },
  });
}

export function useNearestWarehouse(lat?: number, lng?: number, organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.nearestWarehouse(lat, lng),
    queryFn: () => getModitApi().getNearestWarehouse(lat!, lng!, organizationId),
    enabled: typeof lat === "number" && typeof lng === "number",
    ...fastQueryOpts,
  });
}

export function useSupportConversations(enabled = true) {
  return useQuery({
    queryKey: moditKeys.supportConversations(),
    queryFn: () => getModitApi().listSupportConversations(),
    enabled,
    ...fastQueryOpts,
  });
}

export function useCreateSupportConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { subject: string; order_id?: string }) =>
      getModitApi().createSupportConversation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.supportConversations() }),
  });
}

export function useSupportConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: moditKeys.supportConversation(conversationId ?? ""),
    queryFn: () => getModitApi().getSupportConversation(conversationId!),
    enabled: Boolean(conversationId),
    // Pick up agent replies while the chat is open.
    refetchInterval: 15_000,
    ...fastQueryOpts,
  });
}

export function usePostSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      getModitApi().postSupportMessage(conversationId, body),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: moditKeys.supportConversation(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: moditKeys.supportConversations() });
    },
  });
}

export function useDrivers(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.drivers(organizationId),
    queryFn: () => getModitApi().listDrivers(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useVehicles(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.vehicles(organizationId),
    queryFn: () => getModitApi().listVehicles(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createVehicle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// Projects
export function useProjects(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.projects(organizationId),
    queryFn: () => getModitApi().listProjects(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: moditKeys.project(projectId),
    queryFn: () => getModitApi().getProject(projectId),
    enabled: Boolean(projectId),
    ...fastQueryOpts,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getModitApi().updateProject(id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: moditKeys.project(vars.id) });
      queryClient.invalidateQueries({ queryKey: moditKeys.all });
    },
  });
}

export function useCreateConstructionSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: Record<string, unknown> }) =>
      getModitApi().createConstructionSite(projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useMaterialRequests(projectId: string) {
  return useQuery({
    queryKey: moditKeys.materialRequests(projectId),
    queryFn: () => getModitApi().listMaterialRequests(projectId),
    enabled: Boolean(projectId),
    ...fastQueryOpts,
  });
}

export function useCreateMaterialRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createMaterialRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// AI Features
export function useAIMaterialRecommendation() {
  return useMutation({
    mutationFn: getModitApi().aiMaterialRecommendation,
  });
}

export function useAIBOQReader() {
  return useMutation({
    mutationFn: getModitApi().aiBOQReader,
  });
}

export function useAIQuoteComparison() {
  return useMutation({
    mutationFn: (rfqId: string) => getModitApi().aiQuoteComparison(rfqId),
  });
}

export function useAIVendorMatching() {
  return useMutation({
    mutationFn: getModitApi().aiVendorMatching,
  });
}

export function useAIProcurementAssistant() {
  return useMutation({
    mutationFn: ({ message, context }: { message: string; context?: Record<string, unknown> }) =>
      getModitApi().aiProcurementAssistant(message, context),
  });
}

export function useAIVoiceOrder() {
  return useMutation({
    mutationFn: getModitApi().aiVoiceOrder,
  });
}

export function useAISmartReorder() {
  return useMutation({
    mutationFn: getModitApi().aiSmartReorder,
  });
}

// Analytics
export function useModitAnalyticsSummary() {
  return useQuery({
    queryKey: moditKeys.analytics(),
    queryFn: () => getModitApi().analyticsSummary(),
    ...fastQueryOpts,
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: ({ eventName, properties }: { eventName: string; properties?: Record<string, unknown> }) =>
      getModitApi().trackEvent(eventName, properties),
  });
}

// Notifications
export function useModitNotifications(organizationId: string) {
  return useQuery({
    queryKey: moditKeys.notifications(organizationId),
    queryFn: () => getModitApi().listNotifications(organizationId),
    enabled: Boolean(organizationId),
    ...fastQueryOpts,
  });
}

export function useCreateModitNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, title, body }: { organizationId: string; title: string; body: string }) =>
      getModitApi().createNotification(organizationId, title, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// ── Layout (Server-Driven UI) ───────────────────────────────────────

import type { LayoutResponse } from "@foundation/api-client";

export function useHomeLayout(pincode?: string) {
  return useQuery({
    queryKey: moditKeys.layout("home", pincode),
    queryFn: () => getModitApi().getLayout("home", { pincode }),
    staleTime: 5 * 60 * 1000, // 5 min
    placeholderData: (prev) => prev, // keep previous data while refetching
  });
}

export type { LayoutResponse };

export { getModitApi };
