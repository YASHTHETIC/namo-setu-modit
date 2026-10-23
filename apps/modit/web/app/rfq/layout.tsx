import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request for Quote — Bulk Material RFQ",
  description: "Post your bulk material requirement and get quotes from verified MODIT suppliers — cement, steel, paint and more.",
  alternates: { canonical: "/rfq" },
  openGraph: { title: "MODIT Bulk RFQ", description: "Get quotes from verified suppliers for bulk construction materials.", url: "/rfq", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

