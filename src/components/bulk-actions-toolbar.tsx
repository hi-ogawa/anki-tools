import { Flag, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { FLAG_COLORS } from "@/lib/constants";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSetFlag: (flag: number) => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  isLoading?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onSetFlag,
  onSuspend,
  onUnsuspend,
  isLoading,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 border border-primary/20">
      <span className="text-sm font-medium">
        {selectedCount} card{selectedCount === 1 ? "" : "s"} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Select onValueChange={(value) => onSetFlag(Number(value))}>
        <SelectTrigger
          className="w-auto"
          size="sm"
          disabled={isLoading}
          data-testid="bulk-flag-select"
        >
          <Flag className="size-4" />
          Set Flag
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">
            <span className="flex items-center gap-2">
              <Flag className="size-4" />
              No Flag
            </span>
          </SelectItem>
          <SelectItem value="1">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[1] }}
                fill={FLAG_COLORS[1]}
              />
              Red
            </span>
          </SelectItem>
          <SelectItem value="2">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[2] }}
                fill={FLAG_COLORS[2]}
              />
              Orange
            </span>
          </SelectItem>
          <SelectItem value="3">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[3] }}
                fill={FLAG_COLORS[3]}
              />
              Green
            </span>
          </SelectItem>
          <SelectItem value="4">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[4] }}
                fill={FLAG_COLORS[4]}
              />
              Blue
            </span>
          </SelectItem>
          <SelectItem value="5">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[5] }}
                fill={FLAG_COLORS[5]}
              />
              Pink
            </span>
          </SelectItem>
          <SelectItem value="6">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[6] }}
                fill={FLAG_COLORS[6]}
              />
              Turquoise
            </span>
          </SelectItem>
          <SelectItem value="7">
            <span className="flex items-center gap-2">
              <Flag
                className="size-4"
                style={{ color: FLAG_COLORS[7] }}
                fill={FLAG_COLORS[7]}
              />
              Purple
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={onSuspend}
        disabled={isLoading}
        data-testid="bulk-suspend-button"
      >
        <Pause className="size-4" />
        Suspend
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onUnsuspend}
        disabled={isLoading}
        data-testid="bulk-unsuspend-button"
      >
        <Play className="size-4" />
        Unsuspend
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={isLoading}
      >
        <X className="size-4" />
        Clear
      </Button>
    </div>
  );
}
