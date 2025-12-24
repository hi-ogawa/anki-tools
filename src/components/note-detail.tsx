import { Flag, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { Item } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_OPTIONS } from "@/lib/constants";

interface NoteDetailProps {
  item: Item;
  fields: string[];
  onClose: () => void;
  onFlagChange?: (flag: number) => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
}

export function NoteDetail({
  item,
  fields,
  onClose,
  onFlagChange,
  onFieldsChange,
}: NoteDetailProps) {
  const isCard = item.type === "card";

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
                  <SelectTrigger className="h-8 w-[120px]">
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

              {/* Status - TODO: implement suspend/unsuspend */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Select value={String(item.queue)} disabled>
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: -1, label: "Suspended" },
                      { value: 0, label: "New" },
                      { value: 1, label: "Learning" },
                      { value: 2, label: "Review" },
                      { value: 3, label: "Relearning" },
                    ].map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
