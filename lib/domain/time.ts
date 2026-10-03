import type { PostedWithin } from "@/lib/domain/types";

/** Sample posts are dated against this instant so hour windows stay stable. */
export const BOARD_NOW = Date.parse("2026-09-25T15:00:00.000Z");

const HOURS: Record<PostedWithin, number> = {
  "6h": 6,
  "12h": 12,
  "24h": 24,
  "3d": 72,
  "7d": 168,
  "14d": 336,
  "30d": 720,
  any: Number.POSITIVE_INFINITY,
};

export const POSTED_WITHIN_OPTIONS: { id: PostedWithin; label: string }[] = [
  { id: "6h", label: "6 hours" },
  { id: "12h", label: "12 hours" },
  { id: "24h", label: "24 hours" },
  { id: "3d", label: "3 days" },
  { id: "7d", label: "7 days" },
  { id: "14d", label: "14 days" },
  { id: "30d", label: "30 days" },
  { id: "any", label: "Any time" },
];

export function hoursAgo(iso: string, now = BOARD_NOW): number {
  return (now - Date.parse(iso)) / 3_600_000;
}

export function withinPostedWindow(iso: string, window: PostedWithin): boolean {
  const age = hoursAgo(iso);
  return age >= 0 && age <= HOURS[window];
}

export function postedAgoLabel(iso: string): string {
  const hours = hoursAgo(iso);
  if (hours < 1) return "Just posted";
  if (hours < 24) {
    const rounded = Math.max(1, Math.round(hours));
    return `${rounded}h ago`;
  }
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
