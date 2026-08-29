"use client";

import Link from "next/link";
import { ArrowLeft, X, Star, Truck, Shield, Package, Trash2 } from "lucide-react";
import { useComparisonStore } from "@/lib/comparison-store";
import { useCartStore } from "@/lib/cart-store";

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useComparisonStore();
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F6FC]">
        <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
            <Link href="/products" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-[16px] font-bold text-white">Compare Products</h1>
          </div>
        </header>
        <div className="mx-auto max-w-[600px] py-20 text-center px-4">
          <Package className="h-16 w-16 text-[#9B8CB5]/30 mx-auto mb-4" />
          <h2 className="text-[18px] font-bold text-[#150726]">No products to compare</h2>
          <p className="text-[13px] text-[#9B8CB5] mt-2">Add products from the catalog to compare them side by side.</p>
          <Link href="/products" className="mt-4 inline-flex items-center gap-2 bg-[#7CB518] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#6A9C14] transition-all">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const allSpecKeys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specifications))));

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      <header className="sticky top-0 z-50 bg-[#150726]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/products" className="text-white/70 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-[16px] font-bold text-white flex-1">Compare ({items.length})</h1>
          <button onClick={clearCompare} className="text-[11px] font-bold text-[#E91E63] hover:text-white transition-colors">Clear All</button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] py-4 px-4 sm:px-6 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Product headers */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-[#DDD6EE] p-4 relative">
                <button onClick={() => removeFromCompare(product.id)} className="absolute top-2 right-2 p-1 rounded-full bg-[#F0ECF9] text-[#9B8CB5] hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
                <img src={product.images[0]} alt={product.name} className="w-full aspect-square object-contain rounded-xl bg-[#F8F6FC]" />
                <p className="text-[9px] font-bold text-[#7CB518] uppercase mt-2">{product.brand}</p>
                <p className="text-[12px] font-semibold text-[#150726] line-clamp-2 mt-0.5">{product.name}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[16px] font-extrabold text-[#2D1B69]">₹{product.price.toLocaleString()}</span>
                  {product.mrp > product.price && <span className="text-[11px] text-[#9B8CB5] line-through">₹{product.mrp.toLocaleString()}</span>}
                </div>
                <button onClick={() => addItem(product)} className="mt-3 w-full py-2 rounded-lg bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6A9C14] transition-all">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="mt-4 bg-white rounded-2xl border border-[#DDD6EE] overflow-hidden">
            <div className="p-4 border-b border-[#F0ECF9]">
              <h3 className="text-[13px] font-bold text-[#150726]">Specifications</h3>
            </div>

            {/* Rating row */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase">Rating</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#FF9800] text-[#FF9800]" />
                  <span className="text-[12px] font-bold text-[#150726]">{p.rating}</span>
                  <span className="text-[10px] text-[#9B8CB5]">({p.reviewCount.toLocaleString()})</span>
                </div>
              ))}
            </div>

            {/* Category row */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase">Category</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3 text-[12px] text-[#150726]">{p.category}</div>
              ))}
            </div>

            {/* Unit row */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase">Unit</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3 text-[12px] text-[#150726]">{p.unit}</div>
              ))}
            </div>

            {/* Delivery */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3">
                  <span className={`text-[12px] font-semibold ${p.freeDelivery ? "text-[#7CB518]" : "text-[#150726]"}`}>
                    {p.freeDelivery ? "FREE" : `${p.deliveryDays} days`}
                  </span>
                </div>
              ))}
            </div>

            {/* GST */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase">GST Rate</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3 text-[12px] text-[#150726]">{p.gstRate}%</div>
              ))}
            </div>

            {/* Bulk */}
            <div className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase flex items-center gap-1"><Package className="h-3 w-3" /> Bulk Price</div>
              {items.map((p) => (
                <div key={p.id} className="px-4 py-3 text-[12px]">
                  {p.bulkPrice ? <span className="font-bold text-[#FF9800]">₹{p.bulkPrice.toLocaleString()} ({p.bulkMinQty}+)</span> : <span className="text-[#9B8CB5]">—</span>}
                </div>
              ))}
            </div>

            {/* Specs */}
            {allSpecKeys.map((key) => (
              <div key={key} className="grid items-center border-b border-[#F0ECF9]" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
                <div className="px-4 py-3 text-[11px] font-bold text-[#9B8CB5] uppercase">{key}</div>
                {items.map((p) => (
                  <div key={p.id} className="px-4 py-3 text-[12px] text-[#150726]">{p.specifications[key] || "—"}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
