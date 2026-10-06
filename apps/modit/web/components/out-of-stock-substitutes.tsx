"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { products, type Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { useRequireLogin } from "@/lib/use-auth";

interface OutOfStockSubstitutesProps {
  product: Product;
}

export function OutOfStockSubstitutes({ product }: OutOfStockSubstitutesProps) {
  const addItem = useCartStore((s) => s.addItem);
  const requireLogin = useRequireLogin();
  if (product.inStock) return null;

  const substitutes = (product.substitutes || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.inStock);

  if (substitutes.length === 0) {
    return (
      <div className="rounded-2xl border border-[#FF9800]/20 bg-[#FFF8E1] p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-[#FF9800]" />
          <p className="text-body-sm font-bold text-[#150726]">Currently out of stock</p>
        </div>
        <p className="text-micro text-[#5C4A7A]">No alternatives right now — use Notify Me above and we&apos;ll alert you when it&apos;s back.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#FF9800]/20 bg-[#FFF8E1] p-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-[#FF9800]" />
        <p className="text-body-sm font-bold text-[#150726]">Currently out of stock</p>
      </div>
      <p className="text-micro text-[#5C4A7A] mb-3">Try these similar in-stock products instead:</p>
      <div className="space-y-2">
        {substitutes.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#DDD6EE] hover:border-[#7CB518] transition-all"
          >
            <Link href={`/products/${sub.id}`} className="relative h-12 w-12 rounded-lg bg-[#F8F6FC] flex-shrink-0 overflow-hidden">
              <Image src={sub.images[0]} alt={sub.name} fill sizes="48px" loading="lazy" draggable={false} className="object-contain" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-micro font-bold text-[#7CB518]">{sub.brand}</p>
              <Link href={`/products/${sub.id}`}>
                <p className="text-caption font-semibold text-[#150726] truncate hover:text-[#2D1B69]">{sub.name}</p>
              </Link>
              <p className="text-body-md font-extrabold text-[#2D1B69]">₹{sub.price.toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => { if (requireLogin()) addItem(sub); }}
              className="rounded-lg bg-white px-4 py-1.5 text-caption font-black text-[#5A8010] shadow-md border border-[#5A8010]/40 active:scale-95 transition-transform flex-shrink-0"
            >
              ADD
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
