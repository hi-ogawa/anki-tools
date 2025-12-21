// API served by Anki addon on same origin (no CORS issues).
// Uses AnkiConnect-style JSON-RPC but with custom actions optimized for browsing.
const API_URL = "/api";

// JSON-RPC helper
export async function invoke<T>(
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

// Schema discovery
export async function fetchAllModelsWithFields(): Promise<
  Record<string, string[]>
> {
  return invoke<Record<string, string[]>>("getModels");
}

export interface Note {
  id: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
}

// Fetch notes for a model
// search: optional Anki search syntax (e.g., "field:value", "deck:name", "tag:name")
export async function fetchNotes(
  modelName: string,
  search?: string,
): Promise<Note[]> {
  const query = search
    ? `note:"${modelName}" ${search}`
    : `note:"${modelName}"`;
  return invoke<Note[]>("browseNotes", { query });
}

export interface Card {
  id: number;
  noteId: number;
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  // Card-specific
  flag: number; // 0 = none, 1-7 = flag colors
  queue: number; // -1 = suspended, 0 = new, 1 = learning, 2 = review
  due: number;
  interval: number;
}

// Fetch cards for a model
export async function fetchCards(
  modelName: string,
  search?: string,
): Promise<Card[]> {
  const query = search
    ? `note:"${modelName}" ${search}`
    : `note:"${modelName}"`;
  return invoke<Card[]>("browseCards", { query });
}

// Set flag on a card (0 = no flag, 1-7 = flag colors)
export async function setCardFlag(
  cardId: number,
  flag: number,
): Promise<boolean> {
  return invoke<boolean>("setCardFlag", { cardId, flag });
}

// Update note fields (currently UI updates one field at a time, but API supports batch)
export async function updateNoteFields(
  noteId: number,
  fields: Record<string, string>,
): Promise<boolean> {
  return invoke<boolean>("updateNoteFields", { noteId, fields });
}
