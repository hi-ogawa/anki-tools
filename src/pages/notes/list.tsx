import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { ShowButton } from "@/components/refine-ui/buttons/show";

type Note = {
  id: number;
  korean: string;
  english: string;
  tags: string[];
};

export const NoteList = () => {
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Note>();

    return [
      columnHelper.accessor("korean", {
        id: "korean",
        header: "Korean",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="font-medium text-lg">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("english", {
        id: "english",
        header: "English",
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        id: "tags",
        header: "Tags",
        enableSorting: false,
        cell: ({ getValue }) => {
          const tags = getValue();
          if (!tags?.length) return "-";
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline">+{tags.length - 3}</Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ShowButton recordItemId={row.original.id} size="sm" />
        ),
        enableSorting: false,
        size: 100,
      }),
    ];
  }, []);

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
