"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { products as allProducts } from "@/lib/product-data";
import { useLiveSummary } from "@/lib/pricing";
import type { ProductGridData, ProductSummary } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";
import { useState } from "react";

function GridProductCard({ p }: { p: ProductSummary }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const live = useLiveSummary(p.id, { price: p.price, mrp: p.mrp, discount: p.discount });

  const handleAdd = () => {
    const full = allProducts.find((ap) => ap.id === p.id);
    if (full) {
      addItem(full);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  if (live.hidden) return null;

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden group hover:shadow-lg transition-all">
      <div className="relative aspect-square bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] overflow-hidden">
        <Link href={`/products/${p.id}`}>
          <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 640px) 50vw, 300px" loading="lazy" draggable={false} className="object-contain p-2" />
        </Link>
        {live.discount >= 20 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-[var(--pink)] to-[var(--pink-hover)] text-white text-tiny font-bold px-2 py-1 rounded-lg">{live.discount}% OFF</span>
        )}
        {live.onSale && (
          <span className="absolute bottom-2 left-2 bg-[#7CB518] text-white text-tiny font-bold px-2 py-0.5 rounded-lg">{live.saleName ?? "SALE"}</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-tiny font-bold text-[var(--green)] uppercase tracking-wider">{p.brand}</p>
        <Link href={`/products/${p.id}`}><h3 className="text-caption font-semibold text-[var(--text)] mt-0.5 line-clamp-2 leading-tight">{p.name}</h3></Link>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="inline-flex items-center gap-0.5 bg-[var(--brand)] text-white text-tiny font-bold px-1.5 py-0.5 rounded">{p.rating} <Star className="h-2 w-2 fill-white" /></span>
          <span className="text-tiny text-[var(--text-muted)]">({p.review_count.toLocaleString()})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-body-lg font-extrabold text-[var(--text)]">₹{live.price.toLocaleString()}</span>
          {live.mrp > live.price && <span className="text-micro text-[var(--text-muted)] line-through">₹{live.mrp.toLocaleString()}</span>}
          {live.discount > 0 && <span className="text-tiny font-bold text-[var(--pink)]">{live.discount}% off</span>}
        </div>
        <p className="text-tiny text-[var(--green)] font-semibold mt-1 flex items-center gap-1">
          <Truck className="h-3 w-3" /> Free delivery · {p.delivery_text}
        </p>
        <button onClick={handleAdd} className={`w-full mt-2.5 py-2 rounded-xl text-micro font-bold transition-all ${added ? 'bg-[var(--green)] text-white' : 'bg-gradient-to-r from-[var(--green)] to-[var(--green-hover)] text-white hover:shadow-lg'}`}>
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export function ProductGridWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<ProductGridData>(data);

  return (
    <section className="mt-5 mb-20 px-4">
      {d.title && (
        <h2 className="text-body-lg font-bold text-[var(--text)] mb-3">{d.title}</h2>
      )}
      <div className="grid grid-cols-2 gap-3">
        {d.products.map((p) => (
          <GridProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
