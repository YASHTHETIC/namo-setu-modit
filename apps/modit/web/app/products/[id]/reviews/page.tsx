"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Star, Package, Users, TrendingUp } from "lucide-react";
import {
  Panel,
  Card,
  CardHeader,
  CardContent,
  MetricTile,
  Avatar,
  Badge,
  Skeleton,
  EmptyState,
} from "@/lib/modit-ui";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface Product {
  id: string;
  name: string;
  sku: string;
  image_url?: string;
  brand_name?: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  distribution: { stars: number; count: number }[];
}

export default function ProductReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = use(params);

  const { data: product } = useQuery({
    queryKey: ["modit", "product", productId],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      return client.request<Product>(`/api/v1/products/${productId}`, { method: "GET" });
    },
    enabled: Boolean(productId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["modit", "review-stats", productId],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const data = await client.request<ReviewStats>(
        `/api/v1/reviews/stats?target_type=product&target_id=${productId}`,
        { method: "GET" }
      );
      return data;
    },
    enabled: Boolean(productId),
  });

  const maxCount = stats ? Math.max(...stats.distribution.map((d) => d.count), 1) : 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          Catalog
        </p>
        <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Product Reviews
        </h2>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-[var(--text-muted)]">
          {product ? `Reviews for ${product.name}` : "Loading product details..."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Write a Review
              </h3>
            </CardHeader>
            <CardContent>
              <ReviewForm targetType="product" targetId={productId} />
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Reviews</h3>
            <ReviewList targetType="product" targetId={productId} />
          </div>
        </div>

        <div className="space-y-6">
          {statsLoading ? (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-4 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </Card>
          ) : stats ? (
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Rating Summary
                </h3>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-center">
                  <p className="text-5xl font-bold text-[var(--text-primary)]">
                    {stats.average_rating.toFixed(1)}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= Math.round(stats.average_rating)
                            ? "fill-[var(--brand)] text-[var(--brand)]"
                            : "fill-[var(--border)] text-[var(--border)]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Based on {stats.total_reviews.toLocaleString()} review
                    {stats.total_reviews !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {stats.distribution.map((d) => (
                    <div key={d.stars} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] w-4">
                        {d.stars}
                      </span>
                      <Star className="h-3.5 w-3.5 fill-[var(--brand)] text-[var(--brand)]" />
                      <div className="flex-1 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                          style={{ width: `${(d.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] w-8 text-right">
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Quick Stats</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <MetricTile
                label="Reviews"
                value={stats?.total_reviews ?? 0}
                icon={<Users className="h-4 w-4" />}
              />
              <MetricTile
                label="Average Rating"
                value={stats?.average_rating?.toFixed(1) ?? "0.0"}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
