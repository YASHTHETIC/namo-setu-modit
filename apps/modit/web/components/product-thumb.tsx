"use client";

import { useState } from "react";
import { Package } from "lucide-react";

/**
 * Product thumbnail that never shows an ugly broken-image + alt-text spill.
 * On missing/failed src it renders a neutral branded tile instead.
 */
export function ProductThumb({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-[#F0ECF9] ${className}`}
      >
        <Package className="h-6 w-6 text-[#C9B8E8]" />
      </div>
    );
  }

  return (
    // Plain <img> is deliberate: callers size this via className, and the
    // onError fallback must fire synchronously to avoid broken-image spill.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={400}
      height={400}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={className}
      draggable={false}
    />
  );
}
