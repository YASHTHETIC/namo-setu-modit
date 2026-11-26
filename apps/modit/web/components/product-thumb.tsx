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
  loading,
  quality = 85,
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
  loading?: "eager" | "lazy";
  quality?: number;
  draggable?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
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
      loading={priority ? undefined : loading}
      quality={quality}
      draggable={draggable}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}

/**
 * Product thumbnail that never shows an ugly broken-image + alt-text spill.
 * Uses Next.js image optimization (AVIF/WebP + responsive sizing) with a
 * synchronous onError fallback to a branded tile.
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
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
    <Image
      src={src}
      alt={alt}
      width={160}
      height={160}
      sizes="96px"
      quality={85}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
      draggable={false}
    />
  );
}
