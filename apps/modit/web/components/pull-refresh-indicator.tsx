"use client";

import { PULL_THRESHOLD } from "@/lib/use-pull-to-refresh";

/**
 * Floating pill shown while a pull-to-refresh gesture is in progress:
 * a rotating arrow that flips once the threshold is crossed, then a
 * spinner while refreshing. Fixed near the viewport top so it reads like
 * a native app's status spinner.
 */
export function PullRefreshIndicator({ pull, refreshing }: { pull: number; refreshing: boolean }) {
  if (!refreshing && pull <= 0) return null;
  const progress = Math.min(1, pull / PULL_THRESHOLD);
  const ready = pull >= PULL_THRESHOLD;

  return (
    <div
      className="ptr-indicator is-visible"
      style={{ transform: `translateX(-50%) translateY(${Math.min(pull * 0.3, 24)}px)` }}
      role="status"
      aria-live="polite"
    >
      {refreshing ? (
        <span className="ptr-spinner" aria-hidden="true" />
      ) : (
        <svg
          className="ptr-arrow"
          style={{ transform: `rotate(${progress * 180}deg)` }}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      )}
      <span>{refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull to refresh"}</span>
    </div>
  );
}
