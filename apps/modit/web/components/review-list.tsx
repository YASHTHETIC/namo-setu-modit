"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  Star,
  ThumbsUp,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react";
import { Avatar, Badge, Button, EmptyState, Skeleton } from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface ReviewListProps {
  targetType: "product" | "supplier";
  targetId: string;
}

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
  comments: Comment[];
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  body: string;
  created_at: string;
}

interface ReviewsResponse {
  items: Review[];
  total: number;
  page: number;
  page_size: number;
}

export function ReviewList({ targetType, targetId }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["modit", "reviews", targetType, targetId, page],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const params = new URLSearchParams({
        target_type: targetType,
        target_id: targetId,
        page: String(page),
        page_size: String(pageSize),
      });
      const data = await client.request<ReviewsResponse>(
        `/api/v1/reviews?${params.toString()}`,
        { method: "GET" }
      );
      return data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <EmptyState
        icon={<Star className="h-6 w-6" />}
        title="No reviews yet"
        description="Be the first to share your feedback!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.items.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          targetType={targetType}
          targetId={targetId}
        />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  targetType,
  targetId,
}: {
  review: Review;
  targetType: string;
  targetId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const method = review.is_liked ? "DELETE" : "POST";
      await client.request(`/api/v1/reviews/${review.id}/like`, { method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "reviews", targetType, targetId] });
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      await client.request(`/api/v1/reviews/${review.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["modit", "reviews", targetType, targetId] });
    },
  });

  const initials = review.user_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={review.user_name} src={review.user_avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{review.user_name}</span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${
                  s <= review.rating
                    ? "fill-[var(--brand)] text-[var(--brand)]"
                    : "fill-[var(--border)] text-[var(--border)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{review.title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{review.body}</p>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-[var(--border-subtle)] pt-3">
        <button
          onClick={() => toggleLike.mutate()}
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--brand)]"
          disabled={toggleLike.isPending}
        >
          <ThumbsUp
            className={`h-4 w-4 ${
              review.is_liked ? "fill-[var(--brand)] text-[var(--brand)]" : "text-[var(--text-muted)]"
            }`}
          />
          <span
            className={review.is_liked ? "font-medium text-[var(--brand)]" : "text-[var(--text-muted)]"}
          >
            {review.likes_count}
          </span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{review.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-[var(--border-subtle)] pt-3">
          {review.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar
                name={comment.user_name}
                src={comment.user_avatar}
                size="sm"
              />
              <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{comment.user_name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{comment.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addComment.mutate()}
              disabled={!commentText.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
