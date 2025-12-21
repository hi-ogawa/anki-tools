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
}

function normalizeNote(note: AnkiNoteInfo): Note {
  return {
    id: note.noteId,
    modelName: note.modelName,
    fields: Object.fromEntries(
      Object.entries(note.fields).map(([k, v]) => [k, v.value])
    ),
    tags: note.tags,
  };
}

// Fetch notes for a model
export async function fetchNotes(modelName: string): Promise<Note[]> {
  const noteIds = await invoke<number[]>("findNotes", { query: `note:"${modelName}"` });
  if (noteIds.length === 0) return [];
  const notesInfo = await invoke<AnkiNoteInfo[]>("notesInfo", { notes: noteIds });
  return notesInfo.map(normalizeNote);
}
