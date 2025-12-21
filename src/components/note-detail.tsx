import { X } from "lucide-react";
import type { Note } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NoteDetailProps {
  note: Note;
  fields: string[];
  onClose: () => void;
}

export function NoteDetail({ note, fields, onClose }: NoteDetailProps) {
  return (
    <div className="flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">Note #{note.id}</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field}>
              <label className="text-sm font-medium text-muted-foreground">
                {field}
              </label>
              <div className="mt-1 rounded border bg-muted/50 p-2 text-sm">
                {note.fields[field] ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: note.fields[field] }}
                  />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          ))}

          {/* Deck */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Deck
            </label>
            <div className="mt-1 text-sm">{note.deckName || "-"}</div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tags
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {note.tags.length > 0 ? (
                note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
