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
    <div className="mt-6">
      <h2 className="text-[15px] font-extrabold text-[#150726] mb-3">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map(({ product }) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </div>
  );
}
