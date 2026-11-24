"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductExplorer from "./product-explorer";
import { AmbientLightingProvider } from "@/lib/ambient-lighting";

export default function ProductsPageClient({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = useSearchParams();
  const [category, setCategory] = useState("");
  useEffect(() => {
    setCategory(sp.get("category") || "");
  }, [sp]);

  return (
    <AmbientLightingProvider categorySlug={category || undefined}>
      <ProductExplorer />
    </AmbientLightingProvider>
  );
}
