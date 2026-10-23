import { NextRequest, NextResponse } from "next/server";

/**
 * Robots policy without touching client "use client" page files:
 * URL segments that gate accounts, orders, checkout, carts, ops dashboards,
 * or per-order utilities must never be indexed. Matching paths get an
 * `X-Robots-Tag: noindex` response header (respected by Google/Bing for
 * rendered URLs) in addition to the Disallow rules in robots.ts.
 *
 * Public content (/, /products, /products/[slug], /products/[id]/reviews,
 * policy pages, /rfq, /calculator, /projects, /contact, /supplier/apply)
 * falls through to Next unchanged.
 */
const PRIVATE_PREFIXES = [
  "/admin",
  "/supplier", // /supplier/apply stays public via robots Allow + exception below
  "/api",
  "/auth",
  "/cart",
  "/checkout",
  "/orders",
  "/dashboard",
  "/track",
  "/payment",
  "/notifications",
  "/wishlist",
  "/compare",
  "/analytics",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const response = NextResponse.next();
  if (isPrivate) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|products|sw.js|manifest.json|favicon).*)"],
};
