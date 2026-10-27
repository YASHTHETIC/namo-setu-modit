import type { Metadata } from "next";

import HomeClient from "@/components/home-client";

// Homepage metadata lives here (server component) because the page tree is a
// client component: "/" is the money URL and must carry an explicit canonical
// (root layout deliberately does not set one — it would leak onto every page).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
