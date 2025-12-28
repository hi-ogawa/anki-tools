import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize Anki search query by fixing common typos and variations.
 * Specifically handles `is:suspend` -> `is:suspended`.
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return query;

  // Replace is:suspend with is:suspended (common typo)
  // Use word boundary to avoid matching is:suspended itself
  return query.replace(/\bis:suspend\b/g, "is:suspended");
}
