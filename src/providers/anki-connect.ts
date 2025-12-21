// https://git.sr.ht/~foosoft/anki-connect

const ANKI_CONNECT_URL = "http://localhost:8765";

// AnkiConnect JSON-RPC helper
export async function invoke<T>(action: string, params?: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params }),
  });
  const { result, error } = await response.json();
  if (error) throw new Error(error);
  return result;
}

// Schema discovery
export async function fetchAllModelsWithFields(): Promise<Record<string, string[]>> {
  const modelNames = await invoke<string[]>("modelNames");
  const models: Record<string, string[]> = {};
  for (const name of modelNames) {
    models[name] = await invoke<string[]>("modelFieldNames", { modelName: name });
  }
  return models;
}

// AnkiConnect notesInfo response shape
interface AnkiNoteInfo {
  noteId: number;
  modelName: string;
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
}

export interface Note {
  id: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
}

function normalizeNote(note: AnkiNoteInfo, deckName: string): Note {
  return {
    id: note.noteId,
    modelName: note.modelName,
    fields: Object.fromEntries(
      Object.entries(note.fields).map(([k, v]) => [k, v.value])
    ),
    tags: note.tags,
    deckName,
  };
}

// Fetch notes for a model
// search: optional Anki search syntax (e.g., "field:value", "deck:name", "tag:name")
export async function fetchNotes(modelName: string, search?: string): Promise<Note[]> {
  // Build query: always filter by model, optionally add user search
  const query = search
    ? `note:"${modelName}" ${search}`
    : `note:"${modelName}"`;
  const noteIds = await invoke<number[]>("findNotes", { query });
  if (noteIds.length === 0) return [];

  // Fetch notes and cards in parallel
  const [notesInfo, cardIds] = await Promise.all([
    invoke<AnkiNoteInfo[]>("notesInfo", { notes: noteIds }),
    invoke<number[]>("findCards", { query }),
  ]);

  // Get deck names via getDecks (much faster than cardsInfo)
  // Returns: { "DeckName": [cardId, ...], ... }
  const decksByName = cardIds.length > 0
    ? await invoke<Record<string, number[]>>("getDecks", { cards: cardIds })
    : {};

  // Find primary deck (the one with most cards)
  // Note: We can't map individual cards to notes without cardsInfo,
  // but most note types have all cards in one deck
  let primaryDeck = "";
  let maxCards = 0;
  for (const [deckName, cards] of Object.entries(decksByName)) {
    if (cards.length > maxCards) {
      maxCards = cards.length;
      primaryDeck = deckName;
    }
  }

  return notesInfo.map(note => normalizeNote(note, primaryDeck));
}
