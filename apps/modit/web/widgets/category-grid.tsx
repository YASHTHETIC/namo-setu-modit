"use client";

import Image from "next/image";
import Link from "next/link";
import type { CategoryGridData } from "@/lib/layout-types";
import { castSectionData } from "@/lib/layout-types";

export function CategoryGridWidget({ data }: { data: Record<string, unknown> }) {
  const d = castSectionData<CategoryGridData>(data);

  return (
    <section className="mt-4 px-4">
      <div className="grid grid-cols-4 gap-3">
        {d.categories.map((cat) => (
          <Link key={cat.id} href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 group">
            <div className="relative w-full aspect-square rounded-2xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center group-hover:border-[var(--brand)] group-hover:shadow-md transition-all">
              <Image src={cat.image_url} alt={cat.name} fill sizes="160px" loading="lazy" draggable={false} className="object-contain p-2" />
            </div>
            <p className="text-tiny font-semibold text-[var(--text)] text-center leading-tight whitespace-pre-line">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
