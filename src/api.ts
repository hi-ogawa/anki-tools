// API served by Anki addon on same origin (no CORS issues).
// Uses AnkiConnect-style JSON-RPC but with custom actions optimized for browsing.
const API_URL = "/api";

// ============================================================================
// Domain Types
// ============================================================================

export interface Note {
  id: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
}

// TODO: refactor Card as Note + extra fields
export interface Card {
  id: number;
  noteId: number;
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  flag: number; // 0 = none, 1-7 = flag colors
  queue: number; // -1 = suspended, 0 = new, 1 = learning, 2 = review
  due: number;
  interval: number;
}

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
// API Methods
// ============================================================================

function buildQuery(modelName: string, search?: string) {
  return search ? `note:"${modelName}" ${search}` : `note:"${modelName}"`;
}

export const api = {
  fetchAllModelsWithFields: () => {
    return invoke<Record<string, string[]>>("getModels");
  },

  // search: optional Anki search syntax (e.g., "field:value", "deck:name", "tag:name")
  fetchNotes: (input: { modelName: string; search?: string }) => {
    return invoke<Note[]>("browseNotes", {
      query: buildQuery(input.modelName, input.search),
    });
  },

  fetchCards: (input: { modelName: string; search?: string }) => {
    return invoke<Card[]>("browseCards", {
      query: buildQuery(input.modelName, input.search),
    });
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
