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

// AnkiConnect cardsInfo response shape
interface AnkiCardInfo {
  cardId: number;
  note: number; // noteId
  deckName: string;
  flags: number; // 0=none, 1=red, 2=orange, 3=green, 4=blue, 5=pink, 6=turquoise, 7=purple
  queue: number; // -1=suspended, 0=new, 1=learning, 2=review, 3=relearning
}

export interface Note {
  id: number;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  // Card-level fields (aggregated if multiple cards)
  deckName: string;
  flags: number[];
  suspended: boolean;
}

interface CardInfoByNote {
  deckName: string;
  flags: number[];
  suspended: boolean;
}

function normalizeNote(note: AnkiNoteInfo, cardInfo?: CardInfoByNote): Note {
  return {
    id: note.noteId,
    modelName: note.modelName,
    fields: Object.fromEntries(
      Object.entries(note.fields).map(([k, v]) => [k, v.value])
    ),
    tags: note.tags,
    deckName: cardInfo?.deckName ?? "",
    flags: cardInfo?.flags ?? [],
    suspended: cardInfo?.suspended ?? false,
  };
}

// Fetch notes for a model with card info
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
    invoke<number[]>("findCards", { query: `note:"${modelName}"` }),
  ]);

  // Fetch card details
  const cardsInfo = cardIds.length > 0
    ? await invoke<AnkiCardInfo[]>("cardsInfo", { cards: cardIds })
    : [];

  // Group cards by noteId
  const cardsByNote = new Map<number, AnkiCardInfo[]>();
  for (const card of cardsInfo) {
    const existing = cardsByNote.get(card.note) ?? [];
    existing.push(card);
    cardsByNote.set(card.note, existing);
  }

  // Aggregate card info per note
  function aggregateCardInfo(cards: AnkiCardInfo[]): CardInfoByNote {
    // Use first card's deck, collect all unique flags, check if any card is suspended
    const decks = [...new Set(cards.map(c => c.deckName))];
    const flags = [...new Set(cards.map(c => c.flags).filter(f => f > 0))];
    const suspended = cards.some(c => c.queue === -1);
    return {
      deckName: decks.length === 1 ? decks[0] : `${decks[0]} (+${decks.length - 1})`,
      flags,
      suspended,
    };
  }

  return notesInfo.map(note => {
    const cards = cardsByNote.get(note.noteId);
    const cardInfo = cards ? aggregateCardInfo(cards) : undefined;
    return normalizeNote(note, cardInfo);
  });
}
