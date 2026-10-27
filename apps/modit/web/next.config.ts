import type { NextConfig } from "next";

// Same-origin /api/* forwarding to the backend. The frontend uses a relative
// API base; on Vercel this rewrite connects the app to api.modit.in
// (override with MODIT_API_ORIGIN at build time). On the VPS, nginx proxies
// /api/ directly so this never triggers there.
const API_ORIGIN = process.env.MODIT_API_ORIGIN || "https://api.modit.in";

// Baseline CSP: 'unsafe-inline' scripts/styles are required by Next.js RSC
// hydration inline payloads and Tailwind-injected styles; Razorpay hosts are
// allow-listed for the checkout widget (script + iframe + analytics). This
// still blocks every other remote script/unknown frame if a catalog string
// ever breaks out of a sink.
//
// connect-src must keep listing the absolute API host: a deploy that builds
// with NEXT_PUBLIC_API_BASE_URL=https://api.modit.in (instead of the
// same-origin /api/v1 + rewrite) talks to the API cross-origin, and blocking
// it there broke every client call — checkout, login, coupons ("Failed to
// fetch"). The same-origin base remains the preferred setup; this is the
// belt-and-braces entry for builds that override it.
// cdn.razorpay.com serves the risk-detection bundle and widget assets.
const DEV_CSP_EXTRA =
  process.env.NODE_ENV === "development" ? " 'unsafe-eval' 'wasm-unsafe-eval'" : "";
const DEV_CONNECT_EXTRA =
  process.env.NODE_ENV === "development"
    ? " http://localhost:8000 http://127.0.0.1:8000 ws://localhost:* ws://127.0.0.1:*"
    : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV_CSP_EXTRA} https://checkout.razorpay.com https://cdn.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://cdn.razorpay.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdn.razorpay.com",
  `connect-src 'self' https://api.modit.in https://api.razorpay.com https://lumberjack.razorpay.com${DEV_CONNECT_EXTRA}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@foundation/ui", "@foundation/utils", "@foundation/api-client"],
  poweredByHeader: false,
  compress: true,
  // Baseline security headers for every response (nginx adds TLS/HSTS
  // upstream on the VPS; these apply wherever the app is served).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
          // geolocation=(self) — the header location picker uses GPS
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // Removed buyer pages - managed in admin only
      { source: "/inventory", destination: "/admin/products", permanent: false },
      { source: "/suppliers", destination: "/admin/suppliers", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
