import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
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

interface NotesTableProps {
  notes: Note[];
  fields: string[];
  page: number;
  pageSize: number;
  search: string;
  onStateChange: (newState: Record<string, string | number>) => void;
}

export function NotesTable({
  notes,
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

  // Default: show first 3 fields + tags
  const getDefaultVisibility = (): VisibilityState => {
    const visibility: VisibilityState = {};
    fields.forEach((field, index) => {
      visibility[field] = index < 3;
    });
    visibility["tags"] = true;
    return visibility;
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(getDefaultVisibility);

  const pagination: PaginationState = {
    pageIndex: page,
    pageSize,
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newState = typeof updater === "function" ? updater(pagination) : updater;
    onStateChange({
      page: newState.pageIndex,
      pageSize: newState.pageSize,
    });
  };

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      globalFilter: search,
      columnVisibility,
    },
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (value) => onStateChange({ search: value, page: 0 }),
    manualPagination: false, // Client-side pagination
    manualFiltering: false, // Client-side filtering
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search all fields..."
          value={search}
          onChange={(e) => onStateChange({ search: e.target.value, page: 0 })}
          className="max-w-sm"
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
            {table.getRowModel().rows.length > 0
              ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
              : 0}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
            {" "}of {table.getFilteredRowModel().rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onStateChange({ pageSize: Number(value), page: 0 })
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
              onClick={() => onStateChange({ page: 0 })}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page: page - 1 })}
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
              onClick={() => onStateChange({ page: page + 1 })}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onStateChange({ page: table.getPageCount() - 1 })}
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
