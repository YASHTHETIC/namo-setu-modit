import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Projects — Track Material Needs",
  description: "Plan construction projects on MODIT: organise requirements, request materials and track quotations per site.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "MODIT Projects", description: "Organise requirements and track material quotations per site.", url: "/projects", siteName: "MODIT", locale: "en_IN", images: ["/og-image.png"] },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

