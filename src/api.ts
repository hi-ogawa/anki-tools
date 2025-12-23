// API served by Anki addon on same origin (no CORS issues).
// Uses AnkiConnect-style JSON-RPC but with custom actions optimized for browsing.
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
};

// Discriminated union for UI
export type Note = NoteData & { type: "note" };
export type Card = NoteData & CardData & { type: "card" };
export type Item = Note | Card;

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
  };
}

// ============================================================================
// Implementations
// ============================================================================

type ViewMode = "notes" | "cards";

const implementations = {
  getModels: () => {
    return invoke<Record<string, string[]>>("getModels");
  },

  // search: optional Anki search syntax (e.g., "field:value", "deck:name", "tag:name")
  fetchItems: async (input: {
    modelName: string;
    search?: string;
    viewMode: ViewMode;
  }): Promise<Item[]> => {
    const query = `note:"${input.modelName}" ${input.search || ""}`;
    if (input.viewMode === "notes") {
      const raw = await invoke<RawNote[]>("browseNotes", { query });
      return raw.map(toNote);
    } else {
      const raw = await invoke<RawCard[]>("browseCards", { query });
      return raw.map(toCard);
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
};

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
