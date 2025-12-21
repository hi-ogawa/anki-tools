import { useTable } from "@refinedev/react-table";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";

interface NoteListProps {
  fields: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Note = Record<string, any>;

export const NoteList = ({ fields }: NoteListProps) => {
  const columns = useMemo(() => {
    const cols: ColumnDef<Note>[] = [];

    // Show first 3 fields as columns (or fewer if less fields)
    const displayFields = fields.slice(0, 3);

    for (const field of displayFields) {
      cols.push({
        id: field,
        accessorKey: field,
        header: field,
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <span className="text-muted-foreground">-</span>;
          // Truncate long content
          const display = value.length > 100 ? value.slice(0, 100) + "..." : value;
          // Strip HTML tags for display
          const text = display.replace(/<[^>]*>/g, "");
          return <span>{text}</span>;
        },
      });
    }

    // Always show tags
    cols.push({
      id: "tags",
      accessorKey: "tags",
      header: "Tags",
      enableSorting: false,
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

  const table = useTable({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
    },
  });

  return (
    <ListView>
      <DataTable table={table} />
    </ListView>
  );
};
