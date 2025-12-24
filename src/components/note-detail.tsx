import { Flag, Pause, Pencil, Play, X } from "lucide-react";
import { useState } from "react";
import type { Item } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_OPTIONS, QUEUE_LABELS } from "@/lib/constants";

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
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-medium">
          <div>Note #{item.noteId}</div>
          {isCard && <div>Card #{item.cardId}</div>}
          <div className="text-muted-foreground">Deck - {item.deckName}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
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
            <>
              <hr className="border-border" />

              {/* Flag selector */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Flag:</span>
                <Select
                  value={String(item.flag)}
                  onValueChange={(v) => onFlagChange?.(Number(v))}
                >
                  <SelectTrigger
                    className="h-8 w-[120px]"
                    data-testid="flag-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FLAG_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        <span className="flex items-center gap-2">
                          <Flag
                            className="size-4"
                            style={{ color: opt.color }}
                            fill={opt.color ?? "none"}
                          />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    {item.interval <= 0
                      ? "-"
                      : item.interval >= 365
                        ? `${Math.round(item.interval / 365)}y`
                        : item.interval >= 30
                          ? `${Math.round(item.interval / 30)}mo`
                          : `${item.interval}d`}
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
