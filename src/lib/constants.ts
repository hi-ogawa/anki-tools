// Flag colors used by Anki
export const FLAG_COLORS: Record<number, string> = {
  1: "#ef4444", // Red
  2: "#f97316", // Orange
  3: "#22c55e", // Green
  4: "#14b8a6", // Turquoise (Anki's order: green, blue, turquoise)
  5: "#ec4899", // Pink
  6: "#3b82f6", // Blue
  7: "#a855f7", // Purple
};

// Flag options for UI (number values for API)
export const FLAG_OPTIONS = [
  { value: 0, label: "None", color: undefined },
  { value: 1, label: "Red", color: "#ef4444" },
  { value: 2, label: "Orange", color: "#f97316" },
  { value: 3, label: "Green", color: "#22c55e" },
  { value: 4, label: "Blue", color: "#3b82f6" },
  { value: 5, label: "Pink", color: "#ec4899" },
  { value: 6, label: "Turquoise", color: "#14b8a6" },
  { value: 7, label: "Purple", color: "#a855f7" },
] as const;

// Flag filter options for search (string values for URL params)
export const FLAG_FILTER_OPTIONS = [
  { value: "none", label: "All", color: undefined },
  { value: "1", label: "Red", color: "#ef4444" },
  { value: "2", label: "Orange", color: "#f97316" },
  { value: "3", label: "Green", color: "#22c55e" },
  { value: "4", label: "Blue", color: "#3b82f6" },
  { value: "5", label: "Pink", color: "#ec4899" },
  { value: "6", label: "Turquoise", color: "#14b8a6" },
  { value: "7", label: "Purple", color: "#a855f7" },
] as const;
