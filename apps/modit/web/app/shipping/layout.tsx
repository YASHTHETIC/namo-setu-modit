import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — Delivery Areas & Timelines",
  description: "How MODIT delivers construction materials: serviceable pincodes, delivery timelines, packaging and charges.",
  alternates: { canonical: "/shipping" },
  openGraph: { title: "MODIT Shipping Policy", description: "Serviceable pincodes, delivery timelines, packaging and charges for construction material orders.", url: "/shipping", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

