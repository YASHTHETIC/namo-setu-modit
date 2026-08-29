"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { products, type Product } from "@/lib/product-data";

interface OutOfStockSubstitutesProps {
  product: Product;
}

export function OutOfStockSubstitutes({ product }: OutOfStockSubstitutesProps) {
  if (product.inStock) return null;

  const substitutes = (product.substitutes || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.inStock);

  if (substitutes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#FF9800]/20 bg-[#FFF8E1] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-[#FF9800]" />
        <p className="text-[13px] font-bold text-[#150726]">Currently out of stock</p>
      </div>
      <p className="text-[11px] text-[#6B5B8A] mb-3">Try these similar products instead:</p>
      <div className="space-y-2">
        {substitutes.map((sub) => (
          <Link
            key={sub.id}
            href={`/products/${sub.id}`}
            className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#DDD6EE] hover:border-[#7CB518] transition-all group"
          >
            <img src={sub.images[0]} alt={sub.name} className="h-12 w-12 rounded-lg object-contain bg-[#F8F6FC]" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#7CB518]">{sub.brand}</p>
              <p className="text-[12px] font-semibold text-[#150726] truncate">{sub.name}</p>
              <p className="text-[14px] font-extrabold text-[#2D1B69]">₹{sub.price.toLocaleString("en-IN")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#9B8CB5] group-hover:text-[#7CB518] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
