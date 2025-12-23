import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Flag,
  Pause,
} from "lucide-react";
import { useMemo } from "react";
import type { Item, ViewMode } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FLAG_COLORS } from "@/lib/constants";
import { useLocalStorage } from "@/lib/use-local-storage";

interface BrowseTableProps {
  data: Item[];
  viewMode: ViewMode;
  model: string;
  fields: string[];
  page: number;
  pageSize: number;
  onStateChange: (newState: Record<string, string | number>) => void;
  selectedId: number | null;
  onSelect: (item: Item) => void;
  toolbarLeft?: React.ReactNode;
}

export function BrowseTable({
  data,
  viewMode,
  model,
  fields,
  page,
  pageSize,
  onStateChange,
  selectedId,
  onSelect,
  toolbarLeft,
}: BrowseTableProps) {
  // Build columns
  const columns = useMemo<ColumnDef<Item>[]>(() => {
    const cols: ColumnDef<Item>[] = [];

    // Field columns
    for (const field of fields) {
      cols.push({
        id: field,
        accessorFn: (row) => row.fields?.[field] ?? "",
        header: field,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <span className="text-muted-foreground">-</span>;
          const text = value.replace(/<[^>]*>/g, "");
          const display = text.length > 80 ? text.slice(0, 80) + "..." : text;
          return <span>{display}</span>;
        },
      });
    }

    // Deck column
    cols.push({
      id: "deck",
      accessorFn: (row) => row.deckName ?? "",
      header: "Deck",
      cell: ({ getValue }) => {
        const deck = getValue() as string;
        if (!deck) return <span className="text-muted-foreground">-</span>;
        return <span className="text-sm">{deck}</span>;
      },
    });

    // Tags column
    cols.push({
      id: "tags",
      accessorFn: (row) => row.tags ?? [],
      header: "Tags",
      cell: ({ getValue }) => {
        const tags = getValue() as string[];
        if (!tags?.length)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    });

    // Card-specific columns (only in cards view)
    if (viewMode === "cards") {
      cols.push({
        id: "flag",
        accessorFn: (row) => (row.type === "card" ? row.flag : undefined),
        header: "Flag",
        cell: ({ getValue }) => {
          const flag = getValue() as number | undefined;
          if (!flag) return <span className="text-muted-foreground">-</span>;
          return (
            <Flag
              className="size-4"
              style={{ color: FLAG_COLORS[flag] }}
              fill={FLAG_COLORS[flag]}
            />
          );
        },
      });

      cols.push({
        id: "status",
        accessorFn: (row) => (row.type === "card" ? row.queue : undefined),
        header: "Status",
        cell: ({ getValue }) => {
          const queue = getValue() as number | undefined;
          if (queue === undefined)
            return <span className="text-muted-foreground">-</span>;
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
      });

      cols.push({
        id: "interval",
        accessorFn: (row) => (row.type === "card" ? row.interval : undefined),
        header: "Interval",
        cell: ({ getValue }) => {
          const ivl = getValue() as number | undefined;
          if (ivl === undefined || ivl <= 0)
            return <span className="text-muted-foreground">-</span>;
          if (ivl >= 365) return `${Math.round(ivl / 365)}y`;
          if (ivl >= 30) return `${Math.round(ivl / 30)}mo`;
          return `${ivl}d`;
        },
      });
    }

    return cols;
  }, [fields, viewMode]);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    `anki-browse-columns:${model}`,
    (): VisibilityState => {
      const v: VisibilityState = {};
      fields.forEach((field, i) => (v[field] = i < 3));
      v["deck"] = true;
      return v;
    },
  );

  // Table setup
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newState =
      typeof updater === "function" ? updater(pagination) : updater;
    onStateChange({
      page: newState.pageIndex + 1,
      pageSize: newState.pageSize,
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination, columnVisibility },
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
  });

  // Group columns for dropdown
  const fieldColumnIds = fields;
  const noteColumnIds = ["deck", "tags"];
  const cardColumnIds = ["flag", "status", "interval"];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{toolbarLeft}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Fields</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((col) => fieldColumnIds.includes(col.id))
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Note</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((col) => noteColumnIds.includes(col.id))
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            {viewMode === "cards" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Card</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((col) => cardColumnIds.includes(col.id))
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
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
            table.getRowModel().rows.map((row) => {
              const item = row.original;
              const itemId = item.type === "card" ? item.cardId : item.noteId;
              return (
                <TableRow
                  key={row.id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer"
                  data-state={itemId === selectedId ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {data.length > 0 ? pagination.pageIndex * pagination.pageSize + 1 : 0}
          -
          {Math.min(
            (pagination.pageIndex + 1) * pagination.pageSize,
            data.length,
          )}{" "}
          of {data.length}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onStateChange({ pageSize: Number(value), page: 1 })
            }
          >
            <SelectTrigger size="sm" className="w-[120px]">
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
