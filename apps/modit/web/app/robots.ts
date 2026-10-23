import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://modit.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/supplier/apply"],
        disallow: [
          "/admin/",
          "/supplier/",
          "/api/",
          "/checkout",
          "/cart",
          "/orders",
          "/dashboard",
          "/auth",
          "/track",
          "/payment",
          "/notifications",
          "/wishlist",
          "/compare",
          "/analytics",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
