import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact MODIT — Support, Bulk Orders & Sales",
  description: "Reach the MODIT team for order support, delivery help, bulk pricing and supplier onboarding.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact MODIT", description: "Order support, delivery help, bulk pricing and supplier onboarding.", url: "/contact", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

