import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a MODIT Supplier",
  description: "Apply to sell construction materials on MODIT: reach buyers with 60-minute delivery and get verified supplier status.",
  alternates: { canonical: "/supplier/apply" },
  openGraph: { title: "Become a MODIT Supplier", description: "Sell construction materials on MODIT with verified supplier status.", url: "/supplier/apply", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

