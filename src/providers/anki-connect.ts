import type { DataProvider } from "@refinedev/core";

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
export async function fetchModelNames(): Promise<string[]> {
  return invoke<string[]>("modelNames");
}

export async function fetchModelFieldNames(modelName: string): Promise<string[]> {
  return invoke<string[]>("modelFieldNames", { modelName });
}

export async function fetchAllModelsWithFields(): Promise<Record<string, string[]>> {
  const modelNames = await fetchModelNames();
  const models: Record<string, string[]> = {};
  for (const name of modelNames) {
    models[name] = await fetchModelFieldNames(name);
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

function normalizeNote(note: AnkiNoteInfo, fields: string[]) {
  return {
    id: note.noteId,
    modelName: note.modelName,
    ...Object.fromEntries(
      fields.map(f => [f, note.fields[f]?.value ?? ""])
    ),
    tags: note.tags,
  };
}

// Factory to create data provider for a specific model
export function createAnkiDataProvider(modelName: string, fields: string[]): DataProvider {
  return {
    getApiUrl: () => ANKI_CONNECT_URL,

    getList: async ({ pagination, filters }: { pagination?: { current?: number; page?: number; pageSize?: number }; filters?: Array<{ field?: string; value?: string }> }) => {
      // Build Anki search query
      let query = `note:"${modelName}"`;

      // Apply filters (e.g., search text)
      if (filters) {
        const searchFilter = filters.find((f) => f.field === "q");
        if (searchFilter?.value) {
          query += ` ${searchFilter.value}`;
        }
      }

      // Find matching note IDs
      const noteIds = await invoke<number[]>("findNotes", { query });

      // Pagination
      const page = pagination?.current ?? pagination?.page ?? 1;
      const pageSize = pagination?.pageSize ?? 50;
      const start = (page - 1) * pageSize;
      const paginatedIds = noteIds.slice(start, start + pageSize);

      // Fetch note details
      const notesInfo = await invoke<AnkiNoteInfo[]>("notesInfo", { notes: paginatedIds });
      const data = notesInfo.map(note => normalizeNote(note, fields));

      return {
        data,
        total: noteIds.length,
      };
    },

    getOne: async ({ id }: { id: string | number }) => {
      const notesInfo = await invoke<AnkiNoteInfo[]>("notesInfo", { notes: [Number(id)] });

      if (notesInfo.length === 0) {
        throw new Error(`Note ${id} not found`);
      }

      return {
        data: normalizeNote(notesInfo[0], fields),
      };
    },

    // Read-only for MVP
    create: async () => {
      throw new Error("Create not implemented");
    },
    update: async () => {
      throw new Error("Update not implemented");
    },
    deleteOne: async () => {
      throw new Error("Delete not implemented");
    },
  } as DataProvider;
}
