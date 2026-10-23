import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns — 7-Day Return Policy",
  description: "MODIT return policy: how to return damaged or incorrect construction material orders within 7 days of delivery.",
  alternates: { canonical: "/returns" },
  openGraph: { title: "MODIT Return Policy", description: "Return damaged or incorrect orders within 7 days of delivery.", url: "/returns", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

