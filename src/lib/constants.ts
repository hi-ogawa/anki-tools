// Flag definitions (single source of truth)
const FLAGS = [
  { value: 1, label: "Red", color: "#ef4444" },
  { value: 2, label: "Orange", color: "#f97316" },
  { value: 3, label: "Green", color: "#22c55e" },
  { value: 4, label: "Blue", color: "#3b82f6" },
  { value: 5, label: "Pink", color: "#ec4899" },
  { value: 6, label: "Turquoise", color: "#14b8a6" },
  { value: 7, label: "Purple", color: "#a855f7" },
] as const;

// Flag colors lookup (for browse-table)
export const FLAG_COLORS: Record<number, string> = Object.fromEntries(
  FLAGS.map((f) => [f.value, f.color]),
);

// Flag options for UI (number values for API, used in note-detail)
export const FLAG_OPTIONS = [
  { value: 0, label: "None", color: undefined },
  ...FLAGS,
] as const;

// Flag filter options for search (string values for URL params, used in root)
export const FLAG_FILTER_OPTIONS = [
  { value: "none", label: "All", color: undefined },
  ...FLAGS.map((f) => ({ ...f, value: String(f.value) })),
] as const;

// Card queue labels (used in note-detail)
export const QUEUE_LABELS: Record<number, string> = {
  [-1]: "Suspended",
  [0]: "New",
  [1]: "Learning",
  [2]: "Review",
  [3]: "Relearning",
};

// Column definitions for browse table
export const NOTE_COLUMNS = ["deck", "tags"] as const;
export const CARD_COLUMNS = [
  "flag",
  "status",
  "interval",
  "ease",
  "lapses",
  "reviews",
] as const;

// Format interval as human-readable string
export function formatInterval(days: number): string {
  if (days <= 0) return "-";
  if (days >= 365) return `${Math.round(days / 365)}y`;
  if (days >= 30) return `${Math.round(days / 30)}mo`;
  return `${days}d`;
}
