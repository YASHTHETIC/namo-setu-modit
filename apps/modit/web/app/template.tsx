"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Spatial page transitions.
 *
 * Next.js remounts this on every navigation. On mount we add .page-in
 * (rotateX+scale 3D entrance). The wrapper is layout-invisible; pages keep
 * their own spacing, and the sticky shell header lives outside this tree.
 *
 * Reduced-motion: instant, no 3D rotation (handled in globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("page-transition-active");
    const timer = setTimeout(() => root.classList.remove("page-transition-active"), 700);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="page-in" data-route={pathname}>
      {children}
    </div>
  );
}
