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
    })
  );
}

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
  deliveries: (poId?: string) => ["modit", "deliveries", poId] as const,
  drivers: (orgId?: string) => ["modit", "drivers", orgId] as const,
  vehicles: (orgId?: string) => ["modit", "vehicles", orgId] as const,
  projects: (orgId?: string) => ["modit", "projects", orgId] as const,
  project: (id: string) => ["modit", "project", id] as const,
  materialRequests: (projectId: string) => ["modit", "material-requests", projectId] as const,
  analytics: () => ["modit", "analytics"] as const,
  notifications: (orgId: string) => ["modit", "notifications", orgId] as const,
};

// Product Catalog
export function useProducts(params?: { search?: string; category_id?: string; brand_id?: string; page?: number }) {
  return useQuery({
    queryKey: moditKeys.products(params),
    queryFn: () => getModitApi().listProducts(params),
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: moditKeys.product(productId ?? ""),
    queryFn: () => getModitApi().getProduct(productId!),
    enabled: Boolean(productId),
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
  });
}

export function useSubCategories(categoryId?: string) {
  return useQuery({
    queryKey: moditKeys.subcategories(categoryId),
    queryFn: () => getModitApi().listSubCategories(categoryId),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: moditKeys.brands(),
    queryFn: () => getModitApi().listBrands(),
  });
}

export function useUnits() {
  return useQuery({
    queryKey: moditKeys.units(),
    queryFn: () => getModitApi().listUnits(),
  });
}

// Supplier Platform
export function useSuppliers() {
  return useQuery({
    queryKey: moditKeys.suppliers(),
    queryFn: () => getModitApi().listSuppliers(),
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
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// RFQ / Quotation
export function useRFQs(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.rfqs(organizationId),
    queryFn: () => getModitApi().listRFQs(organizationId),
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
  });
}

export function useRFQQuotations(rfqId: string) {
  return useQuery({
    queryKey: moditKeys.quotations(rfqId),
    queryFn: () => getModitApi().listRFQQuotations(rfqId),
    enabled: Boolean(rfqId),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createQuotation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

// Orders
export function useCreateCart() {
  return useMutation({
    mutationFn: getModitApi().createCart,
  });
}

export function useOrders(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.orders(organizationId),
    queryFn: () => getModitApi().listOrders(organizationId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: moditKeys.order(orderId),
    queryFn: () => getModitApi().getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

export function usePurchaseOrders(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.purchaseOrders(organizationId),
    queryFn: () => getModitApi().listPurchaseOrders(organizationId),
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
  });
}

export function useInventoryAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.inventoryAnalytics(organizationId),
    queryFn: () => getModitApi().getInventoryAnalytics(organizationId),
  });
}

// Delivery
export function useDeliveries(purchaseOrderId?: string) {
  return useQuery({
    queryKey: moditKeys.deliveries(purchaseOrderId),
    queryFn: () => getModitApi().listDeliveries(purchaseOrderId),
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getModitApi().createDelivery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moditKeys.all }),
  });
}

export function useDrivers(organizationId?: string) {
  return useQuery({
    queryKey: moditKeys.drivers(organizationId),
    queryFn: () => getModitApi().listDrivers(organizationId),
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

export { getModitApi };
