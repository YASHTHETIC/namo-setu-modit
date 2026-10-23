import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of use for the MODIT construction materials marketplace: accounts, ordering, payments and supplier obligations.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "MODIT Terms of Service", description: "Accounts, ordering, payments and supplier obligations.", url: "/terms", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

