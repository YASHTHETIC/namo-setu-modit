import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { ModitShell } from "@/components/modit-shell";
import { SupportChat } from "@/components/support-chat";
import { AppInstallSheetHost } from "@/components/app-install-sheet";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { PhoneVerificationModal } from "@/components/phone-verification-modal";
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
  title: {
    default: "MODIT — Materials on Door",
    template: "%s | MODIT",
  },
  description: "Materials on Door delivered in 60 minutes. Cement, paint, lighting, tiling — genuine products from verified sellers.",
  keywords: ["MODIT", "modit.in", "materials on door", "cement online", "paint online", "doorstep delivery India"],
  openGraph: {
    title: "MODIT — Materials on Door",
    description: "Materials on Door delivered in 60 minutes. Cement, paint, lighting, tiling.",
    url: "https://modit.in",
    siteName: "MODIT",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MODIT — Materials on Door delivered in 60 minutes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MODIT — Materials on Door",
    description: "Materials on Door delivered in 60 minutes. Cement, paint, lighting, tiling.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  // Search Console ownership proof (optional): build with
  // NEXT_PUBLIC_GSC_VERIFICATION=<value-from-search-console> and the meta tag
  // ships to <head>. DNS TXT verification (recommended path, see
  // SEO-LAUNCH-STEPS) needs no rebuild.
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MODIT - Materials on Door",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D1B69",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  // Edge-to-edge: viewport spans under Android's gesture bar / iOS home
  // indicator, and every fixed bar reads env(safe-area-inset-*) instead of
  // assuming a fixed device chin. Keyboard shrinks the layout viewport so
  // fixed bottom bars (checkout pay CTA) rise above the keyboard.
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="modit" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MODIT - Materials on Door" />
        <meta name="application-name" content="MODIT - Materials on Door" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.__moditInstallPrompt = null;
                try {
                  var nav = window.navigator || {};
                  var ua = nav.userAgent || '';
                  var isStand = (
                    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                    (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
                    (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) ||
                    (window.matchMedia && window.matchMedia('(display-mode: window-controls-overlay)').matches) ||
                    nav.standalone === true ||
                    (document.referrer && (
                      document.referrer.indexOf('android-app://') !== -1 ||
                      document.referrer.indexOf('in.modit.app') !== -1
                    )) ||
                    window.location.search.indexOf('source=pwa') !== -1 ||
                    window.location.search.indexOf('utm_source=pwa') !== -1 ||
                    window.location.search.indexOf('utm_source=playstore') !== -1 ||
                    window.location.search.indexOf('pwa=1') !== -1 ||
                    window.location.search.indexOf('twa=1') !== -1 ||
                    window.location.search.indexOf('source=twa') !== -1 ||
                    window.location.search.indexOf('app=1') !== -1 ||
                    window.location.search.indexOf('package=in.modit.app') !== -1 ||
                    window.location.search.indexOf('standalone=1') !== -1 ||
                    (window.sessionStorage && window.sessionStorage.getItem('modit_is_standalone') === 'true') ||
                    /;\s*wv\b/i.test(ua) ||
                    (/Android/i.test(ua) && /Version\/[\d.]+/i.test(ua) && /Chrome\/[\d.]+/i.test(ua)) ||
                    /in\.modit\.app|MODIT-APP|Bubblewrap/i.test(ua)
                  );
                  if (isStand) {
                    window.__modit_is_standalone = true;
                    if (window.sessionStorage) window.sessionStorage.setItem('modit_is_standalone', 'true');
                    if (document.documentElement) {
                      document.documentElement.classList.add('is-standalone', 'is-app');
                      document.documentElement.setAttribute('data-is-app', 'true');
                    }
                  }
                } catch(e) {}

                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__moditInstallPrompt = e;
                  try {
                    window.dispatchEvent(new CustomEvent('modit:pwa-prompt-ready'));
                  } catch(_) {}
                });

                window.addEventListener('appinstalled', function() {
                  window.__moditInstallPrompt = null;
                  window.__modit_is_standalone = true;
                  try {
                    localStorage.setItem('modit_app_installed', 'true');
                    sessionStorage.setItem('modit_is_standalone', 'true');
                    if (document.documentElement) {
                      document.documentElement.classList.add('is-standalone', 'is-app');
                      document.documentElement.setAttribute('data-is-app', 'true');
                    }
                  } catch(_) {}
                  try {
                    window.dispatchEvent(new CustomEvent('modit:pwa-installed'));
                  } catch(_) {}
                });

                if ('serviceWorker' in navigator) {
                  function registerSW() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  }
                  if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    registerSW();
                  } else {
                    window.addEventListener('load', registerSW);
                  }
                }
              })();
            `,
          }}
        />
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
                    "Materials on Door — cement, paint, lighting, tiling delivered in 60 minutes.",
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
            <AppInstallSheetHost />
            <PwaInstallPrompt />
            <PhoneVerificationModal />
            <WebVitalsReporter />
          </PincodeProvider>
        </Providers>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
