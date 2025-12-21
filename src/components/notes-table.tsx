import { type ColumnDef, type VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/api";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "./data-table";

interface NotesTableProps {
  notes: Note[];
  model: string;
  fields: string[];
  page: number;
  pageSize: number;
  onStateChange: (newState: Record<string, string | number>) => void;
  selectedNoteId: number | null;
  onNoteSelect: (note: Note) => void;
  toolbarLeft?: React.ReactNode;
}

function getStorageKey(model: string) {
  return `anki-browse-columns:${model}`;
}

export function NotesTable({
  notes,
  model,
  fields,
  page,
  pageSize,
  onStateChange,
  selectedNoteId,
  onNoteSelect,
  toolbarLeft,
}: NotesTableProps) {
  const columns = useMemo<ColumnDef<Note>[]>(() => {
    const cols: ColumnDef<Note>[] = [];

    // All fields as columns
    for (const field of fields) {
      cols.push({
        id: field,
        accessorFn: (row) => row.fields[field] ?? "",
        header: field,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <span className="text-muted-foreground">-</span>;
          const text = value.replace(/<[^>]*>/g, "");
          const display = text.length > 100 ? text.slice(0, 100) + "..." : text;
          return <span>{display}</span>;
        },
      });
    }

    // Deck column
    cols.push({
      id: "deck",
      accessorKey: "deckName",
      header: "Deck",
      cell: ({ getValue }) => {
        const deck = getValue() as string;
        if (!deck) return <span className="text-muted-foreground">-</span>;
        return <span className="text-sm">{deck}</span>;
      },
    });

    // Tags column
    cols.push({
      id: "tags",
      accessorKey: "tags",
      header: "Tags",
      cell: ({ getValue }) => {
        const tags = getValue() as string[];
        if (!tags?.length)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [fields]);

  // Default: show first 3 fields + deck + tags
  const getDefaultVisibility = (): VisibilityState => {
    const visibility: VisibilityState = {};
    fields.forEach((field, index) => {
      visibility[field] = index < 3;
    });
    visibility["deck"] = true;
    visibility["tags"] = true;
    return visibility;
  };

  const getInitialVisibility = (): VisibilityState => {
    try {
      const stored = localStorage.getItem(getStorageKey(model));
      if (stored) return JSON.parse(stored);
    } catch {}
    return getDefaultVisibility();
  };

  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(getInitialVisibility);

  // Reset visibility when model changes
  useEffect(() => {
    setColumnVisibility(getInitialVisibility());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // Persist visibility to localStorage
  useEffect(() => {
    localStorage.setItem(
      getStorageKey(model),
      JSON.stringify(columnVisibility),
    );
  }, [model, columnVisibility]);

  return (
    <DataTable
      data={notes}
      columns={columns}
      page={page}
      pageSize={pageSize}
      onStateChange={onStateChange}
      getRowId={(note) => note.id}
      selectedId={selectedNoteId}
      onSelect={onNoteSelect}
      toolbarLeft={toolbarLeft}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
    />
  );
}
