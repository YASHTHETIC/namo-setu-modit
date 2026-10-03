import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { ModitShell } from "@/components/modit-shell";
import { SupportChat } from "@/components/support-chat";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { PincodeProvider } from "@/lib/pincode-context";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://modit.in"),
  title: "MODIT — Construction Materials Delivered",
  description: "Construction materials delivered to your site. Cement, paint, lighting, tiling — all at the lowest prices with 60-minute delivery.",
  keywords: ["MODIT", "modit.in", "construction materials", "cement online", "paint online", "building material delivery India"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "MODIT — Construction Materials Delivered",
    description: "Cement, paint, lighting, tiling — delivered to your site in 60 minutes.",
    url: "https://modit.in",
    siteName: "MODIT",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MODIT — Construction Materials Delivered",
    description: "Cement, paint, lighting, tiling — delivered to your site in 60 minutes.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MODIT",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2D1B69",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="modit" className={inter.variable}>
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased bg-[var(--bg)] text-[var(--text)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://modit.in/#organization",
                  name: "MODIT",
                  url: "https://modit.in",
                  logo: "https://modit.in/icons/icon-192.png",
                  description:
                    "Online store for construction materials — cement, paint, lighting, tiling delivered to site.",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://modit.in/#website",
                  url: "https://modit.in",
                  name: "MODIT",
                  publisher: { "@id": "https://modit.in/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://modit.in/products?search={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <Providers>
          <PincodeProvider>
            <ModitShell>{children}</ModitShell>
            <SupportChat />
            <WebVitalsReporter />
          </PincodeProvider>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
