// API served by Anki addon on same origin.
const API_URL = "/api";

// ============================================================================
// Domain Types
// ============================================================================

// Shared note content (underlying data)
export type NoteData = {
  noteId: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
};

// Card-specific practice metadata
export type CardData = {
  cardId: number;
  flag: number; // 0 = none, 1-7 = flag colors
  queue: number; // -1 = suspended, 0 = new, 1 = learning, 2 = review
  due: number;
  interval: number;
  ease: number; // 250 = 250% ease factor
  lapses: number; // times card went to relearning
  reviews: number; // total review count
};

// Discriminated union for UI
export type Note = NoteData & { type: "note" };
export type Card = NoteData & CardData & { type: "card" };
export type Item = Note | Card;

export type ViewMode = "notes" | "cards";

// Raw API responses (before transformation)
type RawNote = {
  id: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
};

type RawCard = {
  id: number;
  noteId: number;
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  flag: number;
  queue: number;
  due: number;
  interval: number;
  ease: number;
  lapses: number;
  reviews: number;
};

// Timing stats from API
export type ApiTiming = {
  find_ms: number;
  fetch_ms: number;
  count: number;
};

type BrowseResponse<T> = {
  items: T[];
  total: number;
  timing: ApiTiming;
};

function toNote(raw: RawNote): Note {
  return {
    type: "note",
    noteId: raw.id,
    modelName: raw.modelName,
    fields: raw.fields,
    tags: raw.tags,
    deckName: raw.deckName,
  };
}

function toCard(raw: RawCard): Card {
  return {
    type: "card",
    noteId: raw.noteId,
    modelName: raw.modelName,
    fields: raw.fields,
    tags: raw.tags,
    deckName: raw.deckName,
    cardId: raw.id,
    flag: raw.flag,
    queue: raw.queue,
    due: raw.due,
    interval: raw.interval,
    ease: raw.ease,
    lapses: raw.lapses,
    reviews: raw.reviews,
  };
}

// ============================================================================
// Implementations
// ============================================================================

export type Schema = {
  models: Record<string, string[]>;
  decks: string[];
  tags: string[];
};

const implementations = {
  getSchema: () => {
    return invoke<Schema>("getSchema");
  },

  // query: Anki search syntax (e.g., "note:Basic", "deck:name", "tag:name")
  // limit/offset: server-side pagination (optional, fetches all if not provided)
  fetchItems: async (input: {
    query: string;
    viewMode: ViewMode;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Item[]; total: number; timing: ApiTiming }> => {
    const { query } = input;
    const pagination =
      input.limit !== undefined
        ? { limit: input.limit, offset: input.offset ?? 0 }
        : {};
    if (input.viewMode === "notes") {
      const raw = await invoke<BrowseResponse<RawNote>>("browseNotes", {
        query,
        ...pagination,
      });
      return {
        items: raw.items.map(toNote),
        total: raw.total,
        timing: raw.timing,
      };
    } else {
      const raw = await invoke<BrowseResponse<RawCard>>("browseCards", {
        query,
        ...pagination,
      });
      return {
        items: raw.items.map(toCard),
        total: raw.total,
        timing: raw.timing,
      };
    }
  },

  // flag: 0 = no flag, 1-7 = flag colors
  setCardFlag: (input: { cardId: number; flag: number }) => {
    return invoke<boolean>("setCardFlag", input);
  },

  updateNoteFields: (input: {
    noteId: number;
    fields: Record<string, string>;
  }) => {
    return invoke<boolean>("updateNoteFields", input);
  },

  updateNoteTags: (input: { noteId: number; tags: string[] }) => {
    return invoke<boolean>("updateNoteTags", input);
  },

  // Returns the new queue value after suspend/unsuspend
  setSuspended: (input: { cardId: number; suspended: boolean }) => {
    return invoke<number>("setSuspended", input);
  },

  // Bulk operations - accepts either cardIds array or query string
  // Returns count of affected cards
  bulkSetCardFlags: (
    input: ({ cardIds: number[] } | { query: string }) & { flag: number },
  ) => {
    return invoke<number>("bulkSetCardFlags", input);
  },

  bulkSuspendCards: (
    input: ({ cardIds: number[] } | { query: string }) & { suspended: boolean },
  ) => {
    return invoke<number>("bulkSuspendCards", input);
  },

  addNote: (input: {
    deckName: string;
    modelName: string;
    fields: Record<string, string>;
    tags?: string[];
  }) => {
    return invoke<{ noteId: number }>("addNote", input);
  },

  bulkAddNotes: (input: {
    deckName: string;
    modelName: string;
    notes: Array<{
      fields: Record<string, string>;
      tags?: string[];
    }>;
  }) => {
    return invoke<{ notes: Array<{ noteId: number }>; count: number }>(
      "bulkAddNotes",
      input,
    );
  },
};

// Column ID to header/accessor mapping for export
type ColumnMapping = {
  header: string;
  accessor: (card: Card) => string | number;
};

const COLUMN_MAPPINGS: Record<string, ColumnMapping> = {
  deck: { header: "deckName", accessor: (c) => c.deckName },
  tags: { header: "tags", accessor: (c) => c.tags.join(", ") },
  flag: { header: "flag", accessor: (c) => c.flag },
  status: { header: "queue", accessor: (c) => c.queue },
  interval: { header: "interval", accessor: (c) => c.interval },
  ease: { header: "ease", accessor: (c) => c.ease },
  lapses: { header: "lapses", accessor: (c) => c.lapses },
  reviews: { header: "reviews", accessor: (c) => c.reviews },
};

// CSV escape helper
function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert cards to CSV format with only visible columns
export function cardsToCSV(
  cards: Card[],
  visibleColumns: string[],
  visibleFields: string[],
): string {
  if (cards.length === 0) return "";

  // Build headers from visible columns
  const headers: string[] = [];
  const accessors: Array<(card: Card) => string | number> = [];

  for (const colId of visibleColumns) {
    if (visibleFields.includes(colId)) {
      // Field column
      headers.push(colId);
      accessors.push((card) => card.fields[colId] ?? "");
    } else if (COLUMN_MAPPINGS[colId]) {
      // Known metadata column
      const mapping = COLUMN_MAPPINGS[colId];
      headers.push(mapping.header);
      accessors.push(mapping.accessor);
    }
  }

  // Build data rows
  const rows = cards.map((card) =>
    accessors.map((acc) => escapeCSV(acc(card))),
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// Convert cards to JSON with only visible columns
export function cardsToJSON(
  cards: Card[],
  visibleColumns: string[],
  visibleFields: string[],
): string {
  const result = cards.map((card) => {
    const obj: Record<string, unknown> = {};
    for (const colId of visibleColumns) {
      if (visibleFields.includes(colId)) {
        obj[colId] = card.fields[colId] ?? "";
      } else if (COLUMN_MAPPINGS[colId]) {
        const mapping = COLUMN_MAPPINGS[colId];
        obj[mapping.header] = mapping.accessor(card);
      }
    }
    return obj;
  });
  return JSON.stringify(result, null, 2);
}

export const api = deriveQueryHelpers(implementations);

// ============================================================================
// JSON-RPC helper
// ============================================================================

async function invoke<T>(
  action: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params }),
  });
  const { result, error } = await response.json();
  if (error) throw new Error(error);
  return result;
}

// ============================================================================
// Derive helpers
// ============================================================================

import type { queryOptions, mutationOptions } from "@tanstack/react-query";

type AnyFn = (...args: never[]) => Promise<unknown>;

type DerivedQueryHelper<TFn extends AnyFn> = TFn & {
  queryOptions: (
    ...args: Parameters<TFn>
  ) => ReturnType<typeof queryOptions<Awaited<ReturnType<TFn>>>>;
  mutationOptions: () => ReturnType<
    typeof mutationOptions<Awaited<ReturnType<TFn>>, Error, Parameters<TFn>[0]>
  >;
};

function deriveQueryHelpers<T extends Record<string, AnyFn>>(
  implementations: T,
): { [K in keyof T]: DerivedQueryHelper<T[K]> } {
  const result = {} as { [K in keyof T]: DerivedQueryHelper<T[K]> };
  for (const [name, fn] of Object.entries(implementations)) {
    (result as Record<string, unknown>)[name] = Object.assign(
      (...args: unknown[]) => fn(...(args as never[])),
      {
        queryOptions: (...args: unknown[]) => ({
          queryKey: [name, ...args],
          queryFn: () => fn(...(args as never[])),
        }),
        mutationOptions: () => ({ mutationFn: fn as never }),
      },
    );
  }
  return result;
}
