import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
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
  title: "Namo Setu — Your Sacred Journey Starts Here",
  description: "Temple discovery, darshan booking, puja scheduling, AI pilgrimage support — all in one beautiful platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="namo" className={`${dmSerif.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
