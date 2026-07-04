"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts, useCategories, useBrands, useCreateProduct, useDeleteProduct } from "@/lib/modit-api";
import { Search, Plus, Trash2, Package, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Input, Select, Card, EmptyState, LoadingSpinner, FormRow } from "@/lib/modit-ui";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", description: "", list_price: "" });

  const { data: productsData, isLoading, isError, error, refetch } = useProducts({
    search: search || undefined,
    category_id: selectedCategory || undefined,
    brand_id: selectedBrand || undefined,
    page: 1,
  });
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const products = productsData?.items ?? [];
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
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct.mutateAsync(id); } catch {}
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

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-900">Failed to load data</h3>
              <p className="mt-1 text-sm text-red-700/80">{error?.message || "Please try again later"}</p>
            </div>
            <button onClick={() => refetch()} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-all hover:bg-red-700">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products found"
          description="Try adjusting your search or filters"
          action={<Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4" /> Add first product</Button>}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={fadeUp} whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
              <Card className="overflow-hidden h-full">
                <div className="flex h-36 items-center justify-center bg-[var(--bg-subtle)]">
                  <Package className="h-12 w-12 text-[var(--text-muted)]" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{product.name}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">SKU: {product.sku}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      ₹{(product.list_price ?? 0).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)]"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
