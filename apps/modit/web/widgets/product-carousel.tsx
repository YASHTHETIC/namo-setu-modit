"use client";

import Link from "next/link";
import { ChevronRight, Star, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { products as allProducts } from "@/lib/product-data";
import type { ProductCarouselData, ProductSummary } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";
import { useState } from "react";

function MiniProductCard({ p }: { p: ProductSummary }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const full = allProducts.find((ap) => ap.id === p.id);
    if (full) {
      addItem(full);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div className="min-w-[160px] max-w-[160px] bg-white rounded-2xl border border-[var(--border)] overflow-hidden shrink-0">
      <div className="relative aspect-square bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)]">
        <Link href={`/products/${p.id}`}>
          <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        </Link>
        {p.badge && (
          <span className="absolute top-1.5 left-1.5 bg-[var(--green)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{p.badge}</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[9px] font-bold text-[var(--green)] uppercase">{p.brand}</p>
        <h3 className="text-[11px] font-semibold text-[var(--text)] mt-0.5 line-clamp-2 leading-tight">{p.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="inline-flex items-center gap-0.5 bg-[var(--brand)] text-white text-[8px] font-bold px-1 py-0.5 rounded">{p.rating} <Star className="h-1.5 w-1.5 fill-white" /></span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[14px] font-extrabold text-[var(--text)]">₹{p.price.toLocaleString()}</span>
          {p.mrp > p.price && <span className="text-[10px] text-[var(--text-muted)] line-through">₹{p.mrp.toLocaleString()}</span>}
        </div>
        <p className="text-[9px] text-[var(--green)] font-semibold mt-0.5 flex items-center gap-0.5">
          <Truck className="h-2.5 w-2.5" /> {p.delivery_text}
        </p>
        <button onClick={handleAdd} className={`w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${added ? 'bg-[var(--green)] text-white' : 'bg-gradient-to-r from-[var(--green)] to-[var(--green-hover)] text-white'}`}>
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export function ProductCarouselWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<ProductCarouselData>(data);

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[16px] font-bold text-[var(--text)]">{d.title}</h2>
        <Link href="/products" className="text-[12px] font-bold text-[var(--brand)] flex items-center gap-1">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {d.products.map((p) => (
          <MiniProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
