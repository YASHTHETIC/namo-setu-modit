import type { ApiClient } from "./index";

// Product Catalog
export interface ProductRead {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  brand_id: string | null;
  category_id: string;
  sub_category_id: string | null;
  unit_id: string;
  gst_id: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  specification_json: string | null;
  mrp: number | null;
  list_price: number;
  approval_status: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductDetailRead extends ProductRead {
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string };
  sub_category: { id: string; name: string; slug: string } | null;
  unit: { id: string; name: string; code: string; symbol: string | null };
  gst: { id: string; code: string; rate_percent: number } | null;
  images: Array<{ id: string; media_id: string; caption: string | null; sort_order: number; is_primary: boolean }>;
}

export interface ProductSearchResponse {
  items: ProductRead[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
  filters: Record<string, string[]>;
}

export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_category_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubCategoryRead {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BrandRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UnitRead {
  id: string;
  name: string;
  code: string;
  symbol: string | null;
  is_active: boolean;
  created_at: string;
}

// Supplier
export interface SupplierRead {
  id: string;
  organization_id: string;
  supplier_code: string;
  is_verified: boolean;
  created_at: string;
}

export interface VendorRead {
  id: string;
  supplier_id: string;
  vendor_code: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseRead {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  city_id: string;
  warehouse_code: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  pincode: string;
  is_active: boolean;
  created_at: string;
}

// RFQ
export interface RFQRead {
  id: string;
  organization_id: string;
  project_id: string | null;
  rfq_number: string;
  status: string;
  requested_by_user_id: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface RFQItemRead {
  id: string;
  rfq_id: string;
  product_id: string;
  requested_quantity: number;
  unit_price_hint: number | null;
  notes: string | null;
  created_at: string;
}

export interface RFQDetailRead extends RFQRead {
  items: RFQItemRead[];
  quotations: Array<{
    id: string;
    quotation_number: string;
    supplier_id: string;
    status: string;
    grand_total: number;
    valid_until: string | null;
  }>;
}

export interface QuotationRead {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quotation_number: string;
  status: string;
  valid_until: string | null;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  terms_and_conditions: string | null;
  created_at: string;
}

export interface QuotationDetailRead extends QuotationRead {
  items: Array<{
    id: string;
    quotation_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    line_total: number;
  }>;
}

// Orders
export interface OrderRead {
  id: string;
  organization_id: string;
  purchase_order_id: string | null;
  order_number: string;
  status: string;
  placed_at: string;
  notes: string | null;
  created_at: string;
}

export interface OrderDetailRead extends OrderRead {
  items: Array<{
    id: string;
    order_id: string;
    purchase_order_id: string | null;
    product_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    line_total: number;
  }>;
}

export interface PurchaseOrderRead {
  id: string;
  organization_id: string;
  project_id: string | null;
  rfq_id: string | null;
  order_number: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  total_amount: number;
  created_at: string;
}

export interface CartRead {
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  subtotal: number;
  gst_total: number;
  grand_total: number;
}

export interface InvoiceRead {
  id: string;
  organization_id: string;
  order_id: string | null;
  invoice_number: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  created_at: string;
}

export interface ReturnRead {
  id: string;
  purchase_order_id: string;
  return_number: string;
  status: string;
  requested_at: string;
  reason: string | null;
  approved_at: string | null;
  created_at: string;
}

// Inventory
export interface InventoryRead {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  reorder_level: number;
  status: string;
  last_restocked_at: string | null;
  created_at: string;
}

export interface InventoryAlert {
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  current_stock: number;
  reorder_level: number;
  alert_type: string;
}

export interface InventoryAnalytics {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_value: number;
  warehouse_breakdown: Array<{
    warehouse_id: string;
    warehouse_name: string;
    product_count: number;
    total_stock: number;
  }>;
}

// Delivery
export interface DeliveryRead {
  id: string;
  purchase_order_id: string;
  delivery_number: string;
  status: string;
  driver_id: string | null;
  vehicle_id: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface DriverRead {
  id: string;
  organization_id: string;
  full_name: string;
  phone_number: string;
  license_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VehicleRead {
  id: string;
  organization_id: string;
  registration_number: string;
  vehicle_type: string;
  capacity_kg: number | null;
  is_active: boolean;
  created_at: string;
}

// Projects
export interface ProjectRead {
  id: string;
  organization_id: string;
  project_code: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectDetailRead extends ProjectRead {
  construction_sites: Array<{
    id: string;
    project_id: string;
    city_id: string;
    site_code: string;
    name: string;
    address_line1: string;
    address_line2: string | null;
    pincode: string;
    status: string;
  }>;
  material_requests: Array<{
    id: string;
    project_id: string;
    requested_by_user_id: string;
    request_number: string;
    status: string;
    required_by_date: string | null;
    notes: string | null;
  }>;
  boq: Array<{
    id: string;
    project_id: string;
    version_number: number;
    title: string;
    status: string;
  }>;
}

export interface ConstructionSiteRead {
  id: string;
  project_id: string;
  city_id: string;
  site_code: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  pincode: string;
  status: string;
  created_at: string;
}

export interface MaterialRequestRead {
  id: string;
  project_id: string;
  requested_by_user_id: string;
  request_number: string;
  status: string;
  required_by_date: string | null;
  notes: string | null;
  created_at: string;
}

// AI Features
export interface AIMaterialRecommendationResponse {
  recommendations: Array<{
    product_id: string;
    name: string;
    sku: string;
    category_id: string;
    list_price: number;
    unit: string;
    description: string | null;
  }>;
  estimated_cost: number;
  alternatives: Array<Record<string, unknown>>;
  reasoning: string;
}

export interface BOQReaderResponse {
  items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
    estimated_rate: number;
  }>;
  total_estimated_cost: number;
  confidence_score: number;
  extracted_text: string;
}

export interface AIQuoteComparisonResponse {
  comparison: Array<{
    quotation_id: string;
    quotation_number: string;
    supplier_id: string;
    grand_total: number;
    subtotal: number;
    gst_total: number;
    valid_until: string | null;
    delivery_timeline: string;
  }>;
  best_value: Record<string, unknown>;
  recommendations: string[];
  savings_potential: number;
}

export interface AIVendorMatchingResponse {
  matched_vendors: Array<{
    supplier_id: string;
    supplier_code: string;
    is_verified: boolean;
    rating: number;
    delivery_area: string;
    estimated_delivery: string;
  }>;
  ranking_criteria: string[];
  top_recommendation: Record<string, unknown>;
}

export interface AIProcurementAssistantResponse {
  answer: string;
  suggested_actions: string[];
  relevant_data: Array<Record<string, unknown>>;
}

export interface VoiceOrderResponse {
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
  }>;
  confidence: number;
  confirmation_message: string;
}

export interface SmartReorderResponse {
  reorder_suggestions: Array<{
    product_id: string;
    product_name: string;
    current_stock: number;
    suggested_quantity: number;
    urgency: string;
  }>;
  total_estimated_cost: number;
  urgency_levels: string[];
}

// Analytics
export interface ModitAnalyticsSummary {
  total_organizations: number;
  total_products: number;
  total_suppliers: number;
  total_orders: number;
  total_revenue: number;
  active_projects: number;
  pending_rfqs: number;
  low_stock_items: number;
}

export function createModitApi(client: ApiClient) {
  const base = "/modit";

  return {
    // Product Catalog
    listProducts(params?: { page?: number; page_size?: number; search?: string; category_id?: string; brand_id?: string }) {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.page_size) query.set("page_size", String(params.page_size));
      if (params?.search) query.set("search", params.search);
      if (params?.category_id) query.set("category_id", params.category_id);
      if (params?.brand_id) query.set("brand_id", params.brand_id);
      const qs = query.toString();
      return client.request<ProductSearchResponse>(`${base}/products${qs ? `?${qs}` : ""}`);
    },

    createProduct(payload: Record<string, unknown>) {
      return client.request<ProductRead>(`${base}/products`, { method: "POST", body: JSON.stringify(payload) });
    },

    getProduct(productId: string) {
      return client.request<ProductDetailRead>(`${base}/products/${productId}`);
    },

    updateProduct(productId: string, payload: Record<string, unknown>) {
      return client.request<ProductRead>(`${base}/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },

    deleteProduct(productId: string) {
      return client.request<{ message: string; data: string }>(`${base}/products/${productId}`, { method: "DELETE" });
    },

    addProductImage(productId: string, payload: Record<string, unknown>) {
      return client.request(`${base}/products/${productId}/images`, { method: "POST", body: JSON.stringify(payload) });
    },

    listCategories() {
      return client.request<CategoryRead[]>(`${base}/categories`);
    },

    createCategory(payload: Record<string, unknown>) {
      return client.request(`${base}/categories`, { method: "POST", body: JSON.stringify(payload) });
    },

    listSubCategories(categoryId?: string) {
      const qs = categoryId ? `?category_id=${categoryId}` : "";
      return client.request<SubCategoryRead[]>(`${base}/subcategories${qs}`);
    },

    listBrands() {
      return client.request<BrandRead[]>(`${base}/brands`);
    },

    listUnits() {
      return client.request<UnitRead[]>(`${base}/units`);
    },

    // Supplier Platform
    listSuppliers() {
      return client.request<SupplierRead[]>(`${base}/suppliers`);
    },

    createSupplier(payload: Record<string, unknown>) {
      return client.request<SupplierRead>(`${base}/suppliers`, { method: "POST", body: JSON.stringify(payload) });
    },

    listSupplierVendors(supplierId: string) {
      return client.request<VendorRead[]>(`${base}/suppliers/${supplierId}/vendors`);
    },

    createVendor(supplierId: string, payload: Record<string, unknown>) {
      return client.request<VendorRead>(`${base}/suppliers/${supplierId}/vendors`, { method: "POST", body: JSON.stringify(payload) });
    },

    listWarehouses(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<WarehouseRead[]>(`${base}/warehouses${qs}`);
    },

    createWarehouse(payload: Record<string, unknown>) {
      return client.request<WarehouseRead>(`${base}/warehouses`, { method: "POST", body: JSON.stringify(payload) });
    },

    // RFQ / Quotation
    listRFQs(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<RFQRead[]>(`${base}/rfq${qs}`);
    },

    createRFQ(payload: Record<string, unknown>) {
      return client.request<RFQDetailRead>(`${base}/rfq`, { method: "POST", body: JSON.stringify(payload) });
    },

    getRFQ(rfqId: string) {
      return client.request<RFQDetailRead>(`${base}/rfq/${rfqId}`);
    },

    listRFQQuotations(rfqId: string) {
      return client.request<QuotationRead[]>(`${base}/rfq/${rfqId}/quotations`);
    },

    createQuotation(payload: Record<string, unknown>) {
      return client.request<QuotationDetailRead>(`${base}/quotations`, { method: "POST", body: JSON.stringify(payload) });
    },

    getQuotation(quotationId: string) {
      return client.request<QuotationDetailRead>(`${base}/quotations/${quotationId}`);
    },

    // Orders
    createCart(payload: Record<string, unknown>) {
      return client.request<CartRead>(`${base}/cart`, { method: "POST", body: JSON.stringify(payload) });
    },

    listOrders(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<OrderRead[]>(`${base}/orders${qs}`);
    },

    createOrder(payload: Record<string, unknown>) {
      return client.request<OrderDetailRead>(`${base}/orders`, { method: "POST", body: JSON.stringify(payload) });
    },

    getOrder(orderId: string) {
      return client.request<OrderDetailRead>(`${base}/orders/${orderId}`);
    },

    listPurchaseOrders(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<PurchaseOrderRead[]>(`${base}/purchase-orders${qs}`);
    },

    createPurchaseOrder(payload: Record<string, unknown>) {
      return client.request<PurchaseOrderRead>(`${base}/purchase-orders`, { method: "POST", body: JSON.stringify(payload) });
    },

    listInvoices(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<InvoiceRead[]>(`${base}/invoices${qs}`);
    },

    createInvoice(payload: Record<string, unknown>) {
      return client.request<InvoiceRead>(`${base}/invoices`, { method: "POST", body: JSON.stringify(payload) });
    },

    createReturn(payload: Record<string, unknown>) {
      return client.request<ReturnRead>(`${base}/returns`, { method: "POST", body: JSON.stringify(payload) });
    },

    // Inventory
    listInventory(warehouseId?: string) {
      const qs = warehouseId ? `?warehouse_id=${warehouseId}` : "";
      return client.request<InventoryRead[]>(`${base}/inventory${qs}`);
    },

    createInventory(payload: Record<string, unknown>) {
      return client.request<InventoryRead>(`${base}/inventory`, { method: "POST", body: JSON.stringify(payload) });
    },

    updateInventory(inventoryId: string, payload: Record<string, unknown>) {
      return client.request<InventoryRead>(`${base}/inventory/${inventoryId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },

    getInventoryAlerts(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<InventoryAlert[]>(`${base}/inventory/alerts${qs}`);
    },

    getInventoryAnalytics(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<InventoryAnalytics>(`${base}/inventory/analytics${qs}`);
    },

    // Delivery
    listDeliveries(purchaseOrderId?: string) {
      const qs = purchaseOrderId ? `?purchase_order_id=${purchaseOrderId}` : "";
      return client.request<DeliveryRead[]>(`${base}/deliveries${qs}`);
    },

    createDelivery(payload: Record<string, unknown>) {
      return client.request<DeliveryRead>(`${base}/deliveries`, { method: "POST", body: JSON.stringify(payload) });
    },

    listDrivers(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<DriverRead[]>(`${base}/drivers${qs}`);
    },

    createDriver(payload: Record<string, unknown>) {
      return client.request<DriverRead>(`${base}/drivers`, { method: "POST", body: JSON.stringify(payload) });
    },

    listVehicles(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<VehicleRead[]>(`${base}/vehicles${qs}`);
    },

    createVehicle(payload: Record<string, unknown>) {
      return client.request<VehicleRead>(`${base}/vehicles`, { method: "POST", body: JSON.stringify(payload) });
    },

    // Projects
    listProjects(organizationId?: string) {
      const qs = organizationId ? `?organization_id=${organizationId}` : "";
      return client.request<ProjectRead[]>(`${base}/projects${qs}`);
    },

    createProject(payload: Record<string, unknown>) {
      return client.request<ProjectDetailRead>(`${base}/projects`, { method: "POST", body: JSON.stringify(payload) });
    },

    getProject(projectId: string) {
      return client.request<ProjectDetailRead>(`${base}/projects/${projectId}`);
    },

    updateProject(projectId: string, payload: Record<string, unknown>) {
      return client.request<ProjectRead>(`${base}/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },

    createConstructionSite(projectId: string, payload: Record<string, unknown>) {
      return client.request<ConstructionSiteRead>(`${base}/projects/${projectId}/sites`, { method: "POST", body: JSON.stringify(payload) });
    },

    listMaterialRequests(projectId: string) {
      return client.request<MaterialRequestRead[]>(`${base}/projects/${projectId}/material-requests`);
    },

    createMaterialRequest(payload: Record<string, unknown>) {
      return client.request<MaterialRequestRead>(`${base}/material-requests`, { method: "POST", body: JSON.stringify(payload) });
    },

    // AI Features
    aiMaterialRecommendation(payload: Record<string, unknown>) {
      return client.request<AIMaterialRecommendationResponse>(`${base}/ai/material-recommendation`, { method: "POST", body: JSON.stringify(payload) });
    },

    aiBOQReader(payload: { file_url: string; project_id: string }) {
      return client.request<BOQReaderResponse>(`${base}/ai/boq-reader`, { method: "POST", body: JSON.stringify(payload) });
    },

    aiQuoteComparison(rfqId: string) {
      return client.request<AIQuoteComparisonResponse>(`${base}/ai/quote-comparison?rfq_id=${rfqId}`, { method: "POST" });
    },

    aiVendorMatching(payload: Record<string, unknown>) {
      return client.request<AIVendorMatchingResponse>(`${base}/ai/vendor-matching`, { method: "POST", body: JSON.stringify(payload) });
    },

    aiProcurementAssistant(message: string, context?: Record<string, unknown>) {
      return client.request<AIProcurementAssistantResponse>(`${base}/ai/procurement-assistant`, { method: "POST", body: JSON.stringify({ message, context }) });
    },

    aiVoiceOrder(payload: { transcript: string; organization_id: string }) {
      return client.request<VoiceOrderResponse>(`${base}/ai/voice-order`, { method: "POST", body: JSON.stringify(payload) });
    },

    aiSmartReorder(payload: { organization_id: string; warehouse_id?: string }) {
      return client.request<SmartReorderResponse>(`${base}/ai/smart-reorder`, { method: "POST", body: JSON.stringify(payload) });
    },

    // Analytics
    analyticsSummary() {
      return client.request<ModitAnalyticsSummary>(`${base}/analytics/summary`);
    },

    trackEvent(eventName: string, properties?: Record<string, unknown>) {
      return client.request<{ message: string; data: string }>(`${base}/analytics/events?event_name=${eventName}`, {
        method: "POST",
        body: JSON.stringify({ properties }),
      });
    },

    // Notifications
    listNotifications(organizationId: string) {
      return client.request(`${base}/notifications?organization_id=${organizationId}`);
    },

    createNotification(organizationId: string, title: string, body: string) {
      return client.request(`${base}/notifications?organization_id=${organizationId}&title=${title}&body=${body}`, { method: "POST" });
    },
  };
}

export type ModitApi = ReturnType<typeof createModitApi>;
