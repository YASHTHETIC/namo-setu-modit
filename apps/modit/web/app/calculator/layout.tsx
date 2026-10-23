import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Construction Cost Calculator",
  description: "Estimate material quantities and costs for your build — cement, paint, tiles and more with live MODIT prices.",
  alternates: { canonical: "/calculator" },
  openGraph: { title: "MODIT Construction Cost Calculator", description: "Estimate material quantities and costs with live prices.", url: "/calculator", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

