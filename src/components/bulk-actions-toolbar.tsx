import { Flag, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { FLAG_OPTIONS } from "@/lib/constants";

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

  const handleFlagChange = (value: string) => {
    const flag = parseInt(value, 10);
    if (!isNaN(flag) && flag >= 0 && flag <= 7) {
      onSetFlag(flag);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 border border-primary/20">
      <span className="text-sm font-medium">
        {selectedCount} card{selectedCount === 1 ? "" : "s"} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Select onValueChange={handleFlagChange}>
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
          {FLAG_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              <span className="flex items-center gap-2">
                <Flag
                  className="size-4"
                  style={opt.color ? { color: opt.color } : undefined}
                  fill={opt.color ?? "none"}
                />
                {opt.label}
              </span>
            </SelectItem>
          ))}
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
