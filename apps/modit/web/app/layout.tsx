import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";

import { Providers } from "@/components/providers";
import { ModitShell } from "@/components/modit-shell";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MODIT — Building Materials, Delivered Fast",
  description: "Cement, Steel, Sand, Tiles & more. Compare prices from 200+ verified suppliers. AI-powered procurement for contractors and builders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="modit" className={`${dmSans.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Providers>
          <ModitShell>{children}</ModitShell>
        </Providers>
      </body>
    </html>
  );
}
