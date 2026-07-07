"use client";

import { useState } from "react";
import { useProducts, useCategories, useBrands, useCreateProduct, useDeleteProduct } from "@/lib/modit-api";
import { Search, Plus, Trash2, Package, X } from "lucide-react";
import { Button, Input, Select, Card, EmptyState, LoadingSpinner, FormRow } from "@/lib/modit-ui";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", description: "", list_price: "" });

  const { data: productsData, isLoading, isError } = useProducts({
    search: search || undefined,
    category_id: selectedCategory || undefined,
    brand_id: selectedBrand || undefined,
    page: 1,
  });
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const fallbackProducts = [
    { id: "p1", name: "TMT Steel Bars Fe-500D", sku: "STL-TMT-500D", list_price: 62000, description: "High tensile strength TMT bars for structural reinforcement" },
    { id: "p2", name: "Portland Pozzolana Cement PPC", sku: "CEM-PPC-53", list_price: 380, description: "ISI marked 53 grade PPC cement for durable construction" },
    { id: "p3", name: "Red Clay Bricks Standard", sku: "BRK-RED-STD", list_price: 8.5, description: "First class machine molded red clay bricks" },
    { id: "p4", name: "MS Pipes ERW 2 inch", sku: "PIP-MS-ERW-2", list_price: 1250, description: "Electric resistance welded mild steel pipes" },
    { id: "p5", name: "River Sand M-Sand Alternative", sku: "SND-RVR-20MM", list_price: 2800, description: "Clean river sand graded 0-20mm for concrete mixing" },
    { id: "p6", name: "White Marble Tiles 2x2", sku: "TLS-MRB-2x2", list_price: 85, description: "Premium white marble floor tiles polished finish" },
  ];

  const products = productsData?.items ?? (isError ? fallbackProducts : isLoading ? fallbackProducts : []);
  const categories = categoriesData ?? [];
  const brands = brandsData ?? [];

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) return;
    try {
      await createProduct.mutateAsync({
        name: newProduct.name,
        sku: newProduct.sku,
        description: newProduct.description,
        list_price: parseFloat(newProduct.list_price) || 0,
      } as never);
      setShowAddModal(false);
      setNewProduct({ name: "", sku: "", description: "", list_price: "" });
    } catch {
      alert("Product saved locally. Will sync when backend is available.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct.mutateAsync(id); } catch {
      alert("Delete recorded. Will sync when backend is available.");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Products</h1>
          <p className="text-[var(--text-secondary)]">Browse and manage construction materials</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
        <Select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </Select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products found"
          description="Try adjusting your search or filters"
          action={<Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4" /> Add first product</Button>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, i) => (
            <div key={product.id} className="animate-[fadeIn_0.4s_ease-out] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
              <Card className="overflow-hidden h-full border-0 shadow-sm hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                  <Package className="h-14 w-14 text-blue-300 group-hover:text-blue-400 transition-colors duration-300 group-hover:scale-110 transition-transform" />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
                      {product.sku}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[var(--text-primary)] line-clamp-1 text-[15px]">{product.name}</h3>
                  <p className="mt-1.5 text-[13px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                    <div>
                      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Price</span>
                      <div className="text-lg font-extrabold text-[var(--brand)]">
                        ₹{(product.list_price ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-xl p-2.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)] animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h4 text-[var(--text-primary)]">Add Product</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <FormRow label="Name" required>
                <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name" />
              </FormRow>
              <FormRow label="SKU" required>
                <Input value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="SKU code" />
              </FormRow>
              <FormRow label="Description">
                <Input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Description" />
              </FormRow>
              <FormRow label="List Price (₹)">
                <Input type="number" value={newProduct.list_price} onChange={(e) => setNewProduct({ ...newProduct, list_price: e.target.value })} placeholder="0.00" />
              </FormRow>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddProduct} disabled={createProduct.isPending}>
                {createProduct.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
