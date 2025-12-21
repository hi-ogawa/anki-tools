import type { DataProvider } from "@refinedev/core";
import { YankiConnect } from "yanki-connect";

const client = new YankiConnect();

// AnkiConnect notesInfo response shape
interface AnkiNoteInfo {
  noteId: number;
  modelName: string;
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
}

function normalizeNote(note: AnkiNoteInfo) {
  const fields = note.fields;
  return {
    id: note.noteId,
    number: fields.number?.value ?? "",
    korean: fields.korean?.value ?? "",
    english: fields.english?.value ?? "",
    example_ko: fields.example_ko?.value ?? "",
    example_en: fields.example_en?.value ?? "",
    etymology: fields.etymology?.value ?? "",
    notes: fields.notes?.value ?? "",
    korean_audio: fields.korean_audio?.value ?? "",
    example_ko_audio: fields.example_ko_audio?.value ?? "",
    tags: note.tags,
  };
}

// Cast to DataProvider to avoid generic type issues
export const ankiConnectProvider = {
  getApiUrl: () => "http://localhost:8765",

  getList: async ({ pagination, filters }: { pagination?: { current?: number; page?: number; pageSize?: number }; filters?: Array<{ field?: string; value?: string }> }) => {
    // Build Anki search query
    let query = 'note:"Korean Vocabulary"';

    // Apply filters (e.g., search text)
    if (filters) {
      const searchFilter = filters.find((f) => f.field === "q");
      if (searchFilter?.value) {
        query += ` ${searchFilter.value}`;
      }
    }

    // Find matching note IDs
    const noteIds = await client.note.findNotes({ query });

    // Pagination - Refine uses 'current' or 'page' depending on version
    const page = pagination?.current ?? pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    const paginatedIds = noteIds.slice(start, start + pageSize);

    // Fetch note details
    const notesInfo = (await client.note.notesInfo({
      notes: paginatedIds,
    })) as AnkiNoteInfo[];

    const data = notesInfo.map(normalizeNote);

    return {
      data,
      total: noteIds.length,
    };
  },

  getOne: async ({ id }: { id: string | number }) => {
    const notesInfo = (await client.note.notesInfo({
      notes: [Number(id)],
    })) as AnkiNoteInfo[];

    if (notesInfo.length === 0) {
      throw new Error(`Note ${id} not found`);
    }

    return {
      data: normalizeNote(notesInfo[0]),
    };
  },

  // Read-only for MVP - these throw errors
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
