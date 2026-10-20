"use client";

import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard } from "@/widgets/product-card";

export function RecentlyViewed() {
  const [mounted, setMounted] = useState(false);
  const allItems = useRecentlyViewed((s) => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const items = allItems.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="mt-3 sm:mt-6">
      <h2 className="section-header px-0 !mb-1 text-[17px] font-extrabold text-[#150726] tracking-tight">Recently Viewed</h2>
      <div className="scroll-rail">
        {items.map(({ product }) => (
          <div key={product.id} className="w-[140px] sm:w-[168px] flex-shrink-0">
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
