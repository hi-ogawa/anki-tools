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
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns3 } from "lucide-react";
import type { Note } from "@/providers/anki-connect";

// TODO: Add "Smart Search" mode with toggle button
// - Client-side filtering with modern UX
// - Pattern matching: field:value, deck:name, tag:name, *wildcards*
// - For now, only "Anki Query" mode is supported (passes search directly to AnkiConnect)

interface NotesTableProps {
  notes: Note[];
  model: string;
  fields: string[];
  page: number;
  pageSize: number;
  search: string;
  onStateChange: (newState: Record<string, string | number>) => void;
}

function getStorageKey(model: string) {
  return `anki-browse-columns:${model}`;
}

export function NotesTable({
  notes,
  model,
  fields,
  page,
  pageSize,
  search,
  onStateChange,
}: NotesTableProps) {
  const columns = useMemo<ColumnDef<Note>[]>(() => {
    const cols: ColumnDef<Note>[] = [];

    // All fields as columns
    for (const field of fields) {
      cols.push({
        id: field,
        accessorFn: (row) => row.fields[field] ?? "",
        header: field,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <span className="text-muted-foreground">-</span>;
          const text = value.replace(/<[^>]*>/g, "");
          const display = text.length > 100 ? text.slice(0, 100) + "..." : text;
          return <span>{display}</span>;
        },
      });
    }

    // Deck column
    cols.push({
      id: "deck",
      accessorKey: "deckName",
      header: "Deck",
      cell: ({ getValue }) => {
        const deck = getValue() as string;
        if (!deck) return <span className="text-muted-foreground">-</span>;
        return <span className="text-sm">{deck}</span>;
      },
    });

    // Flags column
    cols.push({
      id: "flags",
      accessorKey: "flags",
      header: "Flags",
      cell: ({ getValue }) => {
        const flags = getValue() as number[];
        if (!flags?.length) return <span className="text-muted-foreground">-</span>;
        const flagColors: Record<number, string> = {
          1: "bg-red-500",
          2: "bg-orange-500",
          3: "bg-green-500",
          4: "bg-blue-500",
          5: "bg-pink-500",
          6: "bg-teal-500",
          7: "bg-purple-500",
        };
        return (
          <div className="flex gap-1">
            {flags.map((flag) => (
              <span
                key={flag}
                className={`inline-block size-3 rounded-full ${flagColors[flag] ?? "bg-gray-500"}`}
              />
            ))}
          </div>
        );
      },
    });

    // Suspended column
    cols.push({
      id: "suspended",
      accessorKey: "suspended",
      header: "Status",
      cell: ({ getValue }) => {
        const suspended = getValue() as boolean;
        if (suspended) {
          return <Badge variant="destructive" className="text-xs">Suspended</Badge>;
        }
        return <span className="text-muted-foreground text-xs">Active</span>;
      },
    });

    // Tags column
    cols.push({
      id: "tags",
      accessorKey: "tags",
      header: "Tags",
      cell: ({ getValue }) => {
        const tags = getValue() as string[];
        if (!tags?.length) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{tags.length - 3}</Badge>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [fields]);

  // Default: show first 3 fields + deck + tags
  const getDefaultVisibility = (): VisibilityState => {
    const visibility: VisibilityState = {};
    fields.forEach((field, index) => {
      visibility[field] = index < 3;
    });
    visibility["deck"] = true;
    visibility["flags"] = false;
    visibility["suspended"] = false;
    visibility["tags"] = true;
    return visibility;
  };

  const getInitialVisibility = (): VisibilityState => {
    try {
      const stored = localStorage.getItem(getStorageKey(model));
      if (stored) return JSON.parse(stored);
    } catch {}
    return getDefaultVisibility();
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(getInitialVisibility);

  // Reset visibility when model changes
  useEffect(() => {
    setColumnVisibility(getInitialVisibility());
  }, [model]);

  // Persist visibility to localStorage
  useEffect(() => {
    localStorage.setItem(getStorageKey(model), JSON.stringify(columnVisibility));
  }, [model, columnVisibility]);

  // Search on submit (Enter key)
  const [localSearch, setLocalSearch] = useState(search);

  // Sync from parent when search prop changes (e.g., URL navigation)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const submitSearch = () => {
    if (localSearch !== search) {
      onStateChange({ search: localSearch, page: 1 });
    }
  };

  const pagination: PaginationState = {
    pageIndex: page,
    pageSize,
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newState = typeof updater === "function" ? updater(pagination) : updater;
    // Convert 0-based pageIndex to 1-based page for URL
    onStateChange({
      page: newState.pageIndex + 1,
      pageSize: newState.pageSize,
    });
  };

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
      columnVisibility,
    },
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Anki search: deck:name, tag:name, field:value, *wild*"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          onBlur={submitSearch}
          className="max-w-md"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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
                No notes found.
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
            {notes.length > 0
              ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
              : 0}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              notes.length
            )}
            {" "}of {notes.length}
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
              {[10, 25, 50, 100].map((size) => (
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
