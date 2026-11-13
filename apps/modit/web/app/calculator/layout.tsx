import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Material Calculator — Materials on Door",
  description: "Estimate material quantities and costs for your project — cement, paint, tiles and more with live MODIT prices.",
  alternates: { canonical: "/calculator" },
  openGraph: { title: "MODIT Material Calculator", description: "Estimate material quantities and costs with live prices.", url: "/calculator", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

