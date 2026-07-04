import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers";
import { ModitShell } from "@/components/modit-shell";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MODIT | Construction Material Procurement",
  description: "B2B building material marketplace for construction procurement",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand="modit" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          <ModitShell>{children}</ModitShell>
        </Providers>
      </body>
    </html>
  );
}
