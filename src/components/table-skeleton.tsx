import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columnCount?: number;
}

// Skeleton = not actionable = consistent placeholder
// Always show same skeleton for all loading states to avoid flicker
export function TableSkeleton({ columnCount = 7 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar placeholder */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-[400px] rounded bg-muted animate-pulse" />
          <div className="h-9 w-[140px] rounded bg-muted animate-pulse" />
          <div className="h-9 w-9 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded bg-muted animate-pulse" />
      </div>

      {/* Skeleton Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i}>
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <div
                    className="h-4 rounded bg-muted animate-pulse"
                    style={{ width: `${40 + ((rowIdx + colIdx) % 4) * 20}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Skeleton Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
