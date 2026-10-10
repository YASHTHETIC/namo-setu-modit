import Link from "next/link";
import { Home, PackageSearch, Truck, Phone } from "lucide-react";
import { FxBackdrop } from "@/components/fx";

const shortcuts = [
  { icon: Home, label: "Home", href: "/" },
  { icon: PackageSearch, label: "All products", href: "/products" },
  { icon: Truck, label: "Track order", href: "/orders" },
  { icon: Phone, label: "Contact us", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <FxBackdrop tone="light" />
      <div className="relative w-full max-w-[560px] rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center sm:p-10">
        <p className="fx-float-slow text-7xl font-black text-[#2D1B69]">404</p>
        <h1 className="mt-2 text-title-lg font-extrabold text-[#150726]">This aisle is empty</h1>
        <p className="mx-auto mt-2 max-w-[380px] text-body-sm text-[#6B5B83] leading-relaxed">
          The page you asked for moved, sold out, or never existed. Let&apos;s get your site work back on track.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {shortcuts.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#DDD6EE] px-3 py-3 text-body-sm font-bold text-[#150726] transition-colors hover:border-[#7CB518] hover:text-[#2D1B69]"
            >
              <s.icon className="h-4 w-4 text-[#7CB518]" />
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
