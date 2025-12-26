import { Flag, Pause, Pencil, Play, X } from "lucide-react";
import { useState } from "react";
import type { Item } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_OPTIONS, formatInterval, QUEUE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NoteDetailProps {
  item: Item;
  fields: string[];
  onClose: () => void;
  onFlagChange?: (flag: number) => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
  onTagsChange?: (tags: string[]) => void;
  onSuspendedChange?: (suspended: boolean) => void;
}

export function NoteDetail({
  item,
  fields,
  onClose,
  onFlagChange,
  onFieldsChange,
  onTagsChange,
  onSuspendedChange,
}: NoteDetailProps) {
  const isCard = item.type === "card";

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");

  return (
    <div className="flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1">
        <div className="text-sm">
          <span className="text-muted-foreground">Deck:</span>{" "}
          <span className="font-medium">{item.deckName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      {/* Flag buttons */}
      {isCard && (
        <div className="border-b px-4 py-2">
          <div
            className="flex w-fit rounded border bg-muted/50"
            data-testid="flag-buttons"
          >
            {FLAG_OPTIONS.slice(1).map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  onFlagChange?.(item.flag === opt.value ? 0 : opt.value)
                }
                className={cn(
                  "group rounded p-2",
                  item.flag === opt.value && "ring-2",
                )}
                style={
                  item.flag === opt.value
                    ? { ["--tw-ring-color" as string]: opt.color }
                    : undefined
                }
                title={item.flag === opt.value ? "Clear flag" : opt.label}
              >
                <Flag
                  className={cn(
                    "size-4.5",
                    item.flag !== opt.value &&
                      "opacity-50 group-hover:opacity-100",
                  )}
                  style={{ color: opt.color }}
                  fill={opt.color}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field} data-testid={`field-${field}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  {field}
                </label>
                {editingField !== field && onFieldsChange && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    data-testid={`edit-${field}`}
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
                  <Textarea
                    rows={4}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onFieldsChange?.({ [field]: editValue });
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

          {/* Tags */}
          <div data-testid="tags-section">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Tags
              </label>
              {!editingTags && onTagsChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  data-testid="edit-tags"
                  onClick={() => {
                    setEditingTags(true);
                    setTagInput(item.tags.join(" "));
                  }}
                >
                  <Pencil className="size-3" />
                </Button>
              )}
            </div>
            {editingTags ? (
              <div className="mt-1 space-y-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tags separated by spaces"
                  autoFocus
                  data-testid="tags-input"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const tags = tagInput
                        .split(/\s+/)
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0);
                      onTagsChange?.(tags);
                      setEditingTags(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTags(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Card metadata */}
          {isCard && (
            <>
              <hr className="border-border" />

              {/* Status display + suspend toggle */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={
                    item.queue === -1
                      ? "flex items-center gap-1 text-yellow-600"
                      : "text-foreground"
                  }
                  data-testid="status-label"
                >
                  {item.queue === -1 && <Pause className="size-3" />}
                  {QUEUE_LABELS[item.queue]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  data-testid="suspend-button"
                  onClick={() => onSuspendedChange?.(item.queue !== -1)}
                >
                  {item.queue === -1 ? (
                    <>
                      <Play className="size-3" />
                      Unsuspend
                    </>
                  ) : (
                    <>
                      <Pause className="size-3" />
                      Suspend
                    </>
                  )}
                </Button>
              </div>

              {/* Interval / Due */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  Interval:{" "}
                  <span className="text-foreground">
                    {formatInterval(item.interval)}
                  </span>
                </span>
                <span>
                  Due: <span className="text-foreground">{item.due}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
