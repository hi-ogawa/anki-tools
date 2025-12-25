import { useMutation } from "@tanstack/react-query";
import { Play, Download, Clock, Copy, Check } from "lucide-react";
import { useState } from "react";
import { api } from "@/api";
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
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_QUERIES = [
  {
    label: "Decks",
    sql: `SELECT id, name FROM decks ORDER BY name`,
  },
  {
    label: "Deck stats",
    sql: `SELECT
    d.name as deck,
    COUNT(*) as cards,
    ROUND(AVG(c.factor)/10.0, 1) as avg_ease,
    SUM(c.lapses) as total_lapses
FROM cards c
JOIN decks d ON c.did = d.id
WHERE c.queue >= 0
GROUP BY d.name`,
  },
  {
    label: "Problem cards",
    sql: `SELECT
    SUBSTR(n.flds, 1, 50) as front,
    c.factor/10 as ease_pct,
    c.lapses,
    c.reps,
    c.ivl as interval_days
FROM cards c
JOIN notes n ON c.nid = n.id
WHERE c.factor > 0 AND c.factor < 2000
ORDER BY c.factor ASC
LIMIT 50`,
  },
  {
    label: "Review time",
    sql: `SELECT
    DATE(id/1000, 'unixepoch', 'localtime') as day,
    COUNT(*) as reviews,
    ROUND(SUM(time)/1000.0/60, 1) as total_min,
    ROUND(AVG(time)/1000.0, 1) as avg_sec
FROM revlog
WHERE id > (strftime('%s', 'now', '-14 days') * 1000)
GROUP BY day
ORDER BY day DESC`,
  },
  {
    label: "Retention",
    sql: `SELECT
    COUNT(*) as total_reviews,
    SUM(CASE WHEN ease = 1 THEN 1 ELSE 0 END) as again_count,
    ROUND(100.0 - (100.0 * SUM(CASE WHEN ease = 1 THEN 1 ELSE 0 END) / COUNT(*)), 1) as retention_pct
FROM revlog
WHERE type = 1
  AND id > (strftime('%s', 'now', '-30 days') * 1000)`,
  },
];

type QueryResult = {
  columns: string[];
  rows: unknown[][];
  count: number;
  time_ms: number;
};

export function SqlConsole() {
  const [sql, setSql] = useState(EXAMPLE_QUERIES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    ...api.executeQuery.mutationOptions(),
    onSuccess: (data) => setResult(data),
    onError: () => {}, // Prevent global alert - errors shown inline
  });

  const handleRun = () => {
    mutation.mutate({ sql });
  };

  const generateCsv = () => {
    if (!result) return "";

    const escapeCsvField = (value: unknown): string => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = result.columns.map(escapeCsvField).join(",");
    const rows = result.rows
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\n");
    return `${header}\n${rows}`;
  };

  const handleExportCsv = () => {
    const csv = generateCsv();
    if (!csv) return;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anki-query-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = async () => {
    const csv = generateCsv();
    if (!csv) return;

    await navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Example queries */}
      <div className="flex items-center gap-2">
        <Select
          onValueChange={(label) => {
            const query = EXAMPLE_QUERIES.find((q) => q.label === label);
            if (query) setSql(query.sql);
          }}
        >
          <SelectTrigger className="w-[180px]" data-testid="example-select">
            <SelectValue placeholder="Load example..." />
          </SelectTrigger>
          <SelectContent>
            {EXAMPLE_QUERIES.map((q) => (
              <SelectItem key={q.label} value={q.label}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SQL input */}
      <Textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="SELECT * FROM cards LIMIT 10"
        className="min-h-[150px] font-mono text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleRun();
          }
        }}
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRun}
          disabled={mutation.isPending || !sql.trim()}
          title="Run query (Ctrl+Enter)"
        >
          <Play className="size-4" />
          Run
        </Button>

        {result && (
          <>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>

            <Button variant="outline" onClick={handleCopyClipboard}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>

            <span className="text-sm text-muted-foreground">
              <Clock className="mr-1 inline size-3" />
              {result.count} rows in {result.time_ms}ms
            </span>
          </>
        )}

        {mutation.isError && (
          <span className="text-sm text-destructive">
            {mutation.error.message}
          </span>
        )}
      </div>

      {/* Results table */}
      {result && result.columns.length > 0 && (
        <div className="flex-1 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {result.columns.map((col, i) => (
                  <TableHead key={i} className="whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.slice(0, 200).map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className="max-w-[400px] truncate">
                      {String(cell ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {result.rows.length > 200 && (
                <TableRow>
                  <TableCell
                    colSpan={result.columns.length}
                    className="text-center text-muted-foreground"
                  >
                    Showing 200 of {result.rows.length} rows (export to see all)
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
