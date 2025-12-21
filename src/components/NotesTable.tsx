import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/providers/anki-connect";

interface NotesTableProps {
  notes: Note[];
  fields: string[];
}

export function NotesTable({ notes, fields }: NotesTableProps) {
  const columns = useMemo<ColumnDef<Note>[]>(() => {
    const cols: ColumnDef<Note>[] = [];

    // Show first 3 fields as columns
    for (const field of fields.slice(0, 3)) {
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

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
  );
}
