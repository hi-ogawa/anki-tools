import { Flag, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { Note, Card } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FLAG_OPTIONS = [
  { value: 0, label: "None", color: undefined },
  { value: 1, label: "Red", color: "#ef4444" },
  { value: 2, label: "Orange", color: "#f97316" },
  { value: 3, label: "Green", color: "#22c55e" },
  { value: 4, label: "Blue", color: "#3b82f6" },
  { value: 5, label: "Pink", color: "#ec4899" },
  { value: 6, label: "Turquoise", color: "#14b8a6" },
  { value: 7, label: "Purple", color: "#a855f7" },
] as const;

interface NoteDetailProps {
  item: Note | Card;
  fields: string[];
  onClose: () => void;
  onFlagChange?: (cardId: number, flag: number) => void;
  onFieldsChange?: (noteId: number, fields: Record<string, string>) => void;
}

function isCard(item: Note | Card): item is Card {
  return "flag" in item;
}

export function NoteDetail({
  item,
  fields,
  onClose,
  onFlagChange,
  onFieldsChange,
}: NoteDetailProps) {
  const card = isCard(item) ? item : null;
  const noteId = card ? card.noteId : item.id;

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div className="flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">
          {card ? `Card #${item.id}` : `Note #${item.id}`}
        </span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Flag selector for cards */}
          {card && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Flag
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {FLAG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onFlagChange?.(card.id, opt.value)}
                    className={`flex size-7 items-center justify-center rounded border ${
                      card.flag === opt.value
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                    title={opt.label}
                  >
                    {opt.color ? (
                      <Flag
                        className="size-4"
                        style={{ color: opt.color }}
                        fill={opt.color}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          {fields.map((field) => (
            <div key={field}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  {field}
                </label>
                {editingField !== field && onFieldsChange && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => {
                      setEditingField(field);
                      setEditValue(item.fields[field] ?? "");
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                )}
              </div>
              {editingField === field ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    className="w-full rounded border bg-background p-2 text-sm"
                    rows={4}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onFieldsChange?.(noteId, { [field]: editValue });
                        setEditingField(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 rounded border bg-muted/50 p-2 text-sm">
                  {item.fields[field] ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: item.fields[field] }}
                    />
                  ) : (
                    <span className="text-muted-foreground italic">empty</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Deck */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Deck
            </label>
            <div className="mt-1 text-sm">{item.deckName || "-"}</div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tags
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.length > 0 ? (
                item.tags.map((tag) => (
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
