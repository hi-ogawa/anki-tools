import { Flag, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FLAG_OPTIONS } from "@/lib/constants";

interface BulkActionsProps {
  selectedCount: number;
  totalMatching: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExit: () => void;
  onSetFlag: (flag: number) => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  isPending?: boolean;
}

export function BulkActions({
  selectedCount,
  totalMatching,
  isAllSelected,
  onSelectAll,
  onClearSelection,
  onExit,
  onSetFlag,
  onSuspend,
  onUnsuspend,
  isPending,
}: BulkActionsProps) {
  const showSelectAllBanner =
    !isAllSelected && selectedCount > 0 && totalMatching > selectedCount;

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onExit} disabled={isPending}>
        <X className="size-4" />
        Exit
      </Button>

      <div className="h-4 w-px bg-border" />

      {selectedCount > 0 ? (
        <>
          <span className="text-sm text-muted-foreground">
            {isAllSelected
              ? `All ${totalMatching} selected`
              : `${selectedCount} selected`}
          </span>

          {showSelectAllBanner && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm"
              onClick={onSelectAll}
              disabled={isPending}
            >
              Select all {totalMatching} matching
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isPending}
          >
            Clear
          </Button>

          <div className="h-4 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                <Flag className="size-4" />
                Flag
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FLAG_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onSetFlag(opt.value)}
                >
                  <Flag
                    className="size-4"
                    style={{ color: opt.color }}
                    fill={opt.color ?? "none"}
                  />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onSuspend}
            disabled={isPending}
          >
            <Pause className="size-4" />
            Suspend
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onUnsuspend}
            disabled={isPending}
          >
            <Play className="size-4" />
            Unsuspend
          </Button>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">
          Select cards to edit
        </span>
      )}
    </div>
  );
}
