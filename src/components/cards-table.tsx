import { type ColumnDef } from "@tanstack/react-table";
import { Flag, Pause } from "lucide-react";
import { useMemo } from "react";
import type { Card } from "@/api";
import { DataTable } from "./data-table";

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

  return (
    <DataTable
      data={cards}
      columns={columns}
      page={page}
      pageSize={pageSize}
      onStateChange={onStateChange}
      getRowId={(card) => card.id}
      selectedId={selectedCardId}
      onSelect={onCardSelect}
      toolbarLeft={toolbarLeft}
    />
  );
}
