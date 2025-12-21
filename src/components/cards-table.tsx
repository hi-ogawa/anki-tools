import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Pause,
} from "lucide-react";
import { useMemo } from "react";
import type { Card } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FLAG_COLORS: Record<number, string> = {
  1: "#ef4444", // Red
  2: "#f97316", // Orange
  3: "#22c55e", // Green
  4: "#3b82f6", // Blue
  5: "#ec4899", // Pink
  6: "#14b8a6", // Turquoise
  7: "#a855f7", // Purple
};

interface CardsTableProps {
  cards: Card[];
  page: number;
  pageSize: number;
  onStateChange: (newState: Record<string, string | number>) => void;
  selectedCardId: number | null;
  onCardSelect: (card: Card) => void;
  toolbarLeft?: React.ReactNode;
}

export function CardsTable({
  cards,
  page,
  pageSize,
  onStateChange,
  selectedCardId,
  onCardSelect,
  toolbarLeft,
}: CardsTableProps) {
  const columns = useMemo<ColumnDef<Card>[]>(
    () => [
      {
        id: "sortField",
        accessorKey: "sortField",
        header: "Sort Field",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <span className="text-muted-foreground">-</span>;
          const text = value.replace(/<[^>]*>/g, "");
          const display = text.length > 50 ? text.slice(0, 50) + "..." : text;
          return <span>{display}</span>;
        },
      },
      {
        id: "deck",
        accessorKey: "deckName",
        header: "Deck",
      },
      {
        id: "flag",
        accessorKey: "flag",
        header: "Flag",
        cell: ({ getValue }) => {
          const flag = getValue() as number;
          if (!flag) return <span className="text-muted-foreground">-</span>;
          return (
            <Flag
              className="size-4"
              style={{ color: FLAG_COLORS[flag] }}
              fill={FLAG_COLORS[flag]}
            />
          );
        },
      },
      {
        id: "status",
        accessorKey: "queue",
        header: "Status",
        cell: ({ getValue }) => {
          const queue = getValue() as number;
          if (queue === -1) {
            return (
              <span className="flex items-center gap-1 text-yellow-600">
                <Pause className="size-3" />
                Suspended
              </span>
            );
          }
          const labels: Record<number, string> = {
            0: "New",
            1: "Learning",
            2: "Review",
            3: "Relearning",
          };
          return <span>{labels[queue] ?? queue}</span>;
        },
      },
      {
        id: "interval",
        accessorKey: "interval",
        header: "Interval",
        cell: ({ getValue }) => {
          const ivl = getValue() as number;
          if (ivl <= 0) return <span className="text-muted-foreground">-</span>;
          if (ivl >= 365) return `${Math.round(ivl / 365)}y`;
          if (ivl >= 30) return `${Math.round(ivl / 30)}mo`;
          return `${ivl}d`;
        },
      },
    ],
    [],
  );

  const pagination: PaginationState = {
    pageIndex: page,
    pageSize,
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newState =
      typeof updater === "function" ? updater(pagination) : updater;
    onStateChange({
      page: newState.pageIndex + 1,
      pageSize: newState.pageSize,
    });
  };

  const table = useReactTable({
    data: cards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{toolbarLeft}</div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onCardSelect(row.original)}
                className="cursor-pointer"
                data-state={
                  row.original.id === selectedCardId ? "selected" : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No cards found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing{" "}
            {cards.length > 0
              ? table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1
              : 0}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              cards.length,
            )}{" "}
            of {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onStateChange({ pageSize: Number(value), page: 1 })
            }
          >
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page: 1 })}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page })}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-sm">
              {page + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page: page + 2 })}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page: table.getPageCount() })}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
