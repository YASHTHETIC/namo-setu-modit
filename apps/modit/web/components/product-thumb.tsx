"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";

function PackagePlaceholder({ alt, fill, className = "" }: { alt: string; fill?: boolean; className?: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex items-center justify-center bg-[#F0ECF9] ${fill ? "absolute inset-0" : ""} ${className}`}
    >
      <Package className={className?.includes("h-full") ? "h-1/3 w-1/3 text-[#C9B8E8]" : "h-6 w-6 text-[#C9B8E8]"} />
    </div>
  );
}

/**
 * next/image wrapper that never receives an undefined/unreachable src:
 * next/image throws at runtime on a missing src (product cards with
 * empty persisted payloads used to crash whole pages).
 */
export function ImageGuard({
  src,
  alt,
  className,
  fill = false,
  sizes,
  width,
  height,
  priority,
  draggable,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  draggable?: boolean;
}) {
  if (!src) {
    return <PackagePlaceholder alt={alt} fill={fill} className={className} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill || undefined}
      sizes={sizes}
      width={width}
      height={height}
      priority={priority}
      draggable={draggable}
      className={className}
    />
  );
}

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

  const handleImgError = () => setBroken(true);

  return (
    // Plain img tag is deliberate: callers size this via className, and the
    // onError fallback must fire synchronously to avoid broken-image spill.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={400}
      height={400}
      loading="lazy"
      decoding="async"
      onError={handleImgError}
      className={className}
      draggable={false}
    />
  );
}
