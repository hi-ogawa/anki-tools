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
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{item.deckName}</div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        {/* Flag and suspend controls */}
        {isCard && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="flex rounded border bg-muted/50 p-0.5"
              data-testid="flag-buttons"
            >
              {FLAG_OPTIONS.slice(1).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    onFlagChange?.(item.flag === opt.value ? 0 : opt.value)
                  }
                  className={cn(
                    "rounded p-1.5",
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
                      "size-4",
                      item.flag !== opt.value && "opacity-50 hover:opacity-100",
                    )}
                    style={{ color: opt.color }}
                    fill={opt.color}
                  />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8.5 min-w-24 justify-center",
                item.queue === -1 &&
                  "text-yellow-600 hover:text-yellow-600",
              )}
              onClick={() => onSuspendedChange?.(item.queue !== -1)}
              data-testid="suspend-toggle"
            >
              {item.queue === -1 ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {item.queue === -1 ? "Suspended" : "Suspend"}
            </Button>
          </div>
        )}
      </div>

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
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Status:{" "}
                <span
                  className={
                    item.queue === -1 ? "text-yellow-600" : "text-foreground"
                  }
                  data-testid="status-label"
                >
                  {QUEUE_LABELS[item.queue]}
                </span>
              </span>
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
          )}
        </div>
      </div>
    </div>
  );
}
