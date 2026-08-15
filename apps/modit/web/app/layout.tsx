import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers";
import { ModitShell } from "@/components/modit-shell";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MODIT — Premium Building Materials Marketplace",
  description: "A premium B2B marketplace for construction materials, procurement workflows, supplier sourcing, and enterprise checkout.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="modit" className={inter.variable}>
      <body className="antialiased bg-[var(--bg)] text-[var(--text)]">
        <Providers>
          <ModitShell>{children}</ModitShell>
        </Providers>
      </body>
    </html>
  );
}
