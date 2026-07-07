"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Star, MapPin, Users, TrendingUp } from "lucide-react";
import {
  PageFrame,
  SectionHeader,
  Panel,
  PanelHeader,
  MetricTile,
  Avatar,
  Skeleton,
} from "@/components/namo-ui";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import { NamoShell } from "@/components/namo-shell";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  distribution: { stars: number; count: number }[];
}

export default function TempleReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: templeId } = use(params);

  const { data: temple } = useQuery({
    queryKey: ["namo", "temple", templeId],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      return client.request<{ id: string; name: string; city: string; image_url?: string }>(
        `/api/v1/temples/${templeId}`,
        { method: "GET" }
      );
    },
    enabled: Boolean(templeId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["namo", "review-stats", templeId],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const data = await client.request<ReviewStats>(
        `/api/v1/reviews/stats?target_type=temple&target_id=${templeId}`,
        { method: "GET" }
      );
      return data;
    },
    enabled: Boolean(templeId),
  });

  const maxCount = stats ? Math.max(...stats.distribution.map((d) => d.count), 1) : 1;

  return (
    <NamoShell>
    <PageFrame>
      <SectionHeader
        label="Community"
        title="Temple Reviews"
        subtitle={temple ? `Reviews and ratings for ${temple.name}` : "Loading temple details..."}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel>
            <PanelHeader title="Leave a Review" detail="Share your temple experience" />
            <div className="p-6">
              <ReviewForm targetType="temple" targetId={templeId} />
            </div>
          </Panel>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Reviews
            </h3>
            <ReviewList targetType="temple" targetId={templeId} />
          </div>
        </div>

        <div className="space-y-6">
          {statsLoading ? (
            <Panel className="p-6 space-y-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-4 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </Panel>
          ) : stats ? (
            <Panel>
              <PanelHeader title="Rating Summary" />
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <p className="text-5xl font-bold text-slate-900">
                    {stats.average_rating.toFixed(1)}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= Math.round(stats.average_rating)
                            ? "fill-orange-400 text-orange-400"
                            : "fill-slate-200 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Based on {stats.total_reviews.toLocaleString()} review
                    {stats.total_reviews !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {stats.distribution.map((d) => (
                    <div key={d.stars} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 w-4">{d.stars}</span>
                      <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500"
                          style={{ width: `${(d.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Quick Stats" />
            <div className="p-4 grid grid-cols-1 gap-3">
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
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
    </NamoShell>
  );
}
