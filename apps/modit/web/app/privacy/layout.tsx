import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MODIT collects, uses and protects your data: accounts, orders, payments and analytics.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "MODIT Privacy Policy", description: "How MODIT collects, uses and protects your data.", url: "/privacy", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

