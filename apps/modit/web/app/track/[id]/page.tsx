"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";

import { DeliveryTracker } from "@/components/delivery-tracker";
import { useDeliveryTrack } from "@/lib/modit-api";

export default function TrackDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: track, isLoading, isError } = useDeliveryTrack(id);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D1B69]"
      >
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      <h1 className="mb-4 text-2xl font-extrabold text-[#2D1B69]">Track delivery</h1>

      {isLoading && (
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-8 text-center shadow-sm">
          <p className="animate-pulse text-sm font-semibold text-[#9B8CB5]">
            Locating your rider…
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-bold text-red-600">
            Couldn&apos;t find this delivery.
          </p>
          <p className="mt-1 text-xs text-red-500">
            Check the tracking link from your SMS or order updates.
          </p>
        </div>
      )}

      {track && <DeliveryTracker track={track} />}
    </main>
  );
}
