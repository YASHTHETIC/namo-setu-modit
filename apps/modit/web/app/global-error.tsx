"use client";

import Link from "next/link";
import { TriangleAlert, RotateCcw, Home } from "lucide-react";

/**
 * Root-layout failure fallback. Replaces the whole document (html/body), so
 * it cannot rely on the root layout's stylesheet links — critical styles are
 * inlined here to stay on-brand even when nothing else loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          background: "#F8F6FC",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 16,
            border: "1px solid #DDD6EE",
            background: "#FFFFFF",
            padding: 32,
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(21,7,38,0.08)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto",
              borderRadius: 16,
              background: "#F0F9E8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TriangleAlert size={28} color="#FF9800" />
          </div>
          <h1 style={{ margin: "16px 0 0", fontSize: 22, fontWeight: 800, color: "#150726" }}>
            Something jammed on site
          </h1>
          <p style={{ margin: "8px auto 0", maxWidth: 380, fontSize: 14, lineHeight: 1.6, color: "#6B5B83" }}>
            This hiccup is on us, not your order. Reload the page — your cart and orders are safe.
          </p>
          {error.digest && (
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#9B8CB5" }}>Ref: {error.digest}</p>
          )}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: 0,
                cursor: "pointer",
                borderRadius: 16,
                background: "#2D1B69",
                color: "#FFFFFF",
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <RotateCcw size={16} />
              Try again
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 16,
                border: "1px solid #DDD6EE",
                color: "#150726",
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Home size={16} color="#7CB518" />
              Back to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
