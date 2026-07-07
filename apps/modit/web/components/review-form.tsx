"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import { Star, Send, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Card, CardHeader, CardContent, CardFooter } from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface ReviewFormProps {
  targetType: "product" | "supplier";
  targetId: string;
  onSubmitted?: () => void;
}

interface ReviewPayload {
  target_type: string;
  target_id: string;
  rating: number;
  title: string;
  body: string;
}

export function ReviewForm({ targetType, targetId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const submitReview = useMutation({
    mutationFn: async (payload: ReviewPayload) => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const data = await client.request<{ id: string }>("/api/v1/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modit", "reviews", targetType, targetId] });
      setRating(0);
      setTitle("");
      setBody("");
      onSubmitted?.();
    },
  });

  const handleSubmit = () => {
    if (rating === 0 || !title.trim()) return;
    submitReview.mutate({
      target_type: targetType,
      target_id: targetId,
      rating,
      title: title.trim(),
      body: body.trim(),
    });
  };

  const displayRating = hoveredStar || rating;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Write a {targetType === "product" ? "Product" : "Supplier"} Review
        </h3>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Rating</label>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= displayRating
                      ? "fill-[var(--brand)] text-[var(--brand)]"
                      : "fill-[var(--border)] text-[var(--border)]"
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm text-[var(--text-muted)]">
                {displayRating === 1 && "Poor"}
                {displayRating === 2 && "Fair"}
                {displayRating === 3 && "Good"}
                {displayRating === 4 && "Very Good"}
                {displayRating === 5 && "Excellent"}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Title</label>
          <Input
            placeholder={targetType === "product" ? "Summarize product quality" : "Summarize supplier experience"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Your Review</label>
          <Textarea
            placeholder={
              targetType === "product"
                ? "Describe the product quality, durability, value for money..."
                : "Describe delivery speed, communication, pricing..."
            }
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 min-h-[120px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || !title.trim() || submitReview.isPending}
        >
          {submitReview.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit Review
        </Button>
      </CardFooter>
    </Card>
  );
}
