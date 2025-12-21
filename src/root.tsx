import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  fetchAllModelsWithFields,
  fetchNotes,
  fetchCards,
  setCardFlag,
  type Note,
  type Card,
} from "./api";
import { BrowseTable } from "./components/browse-table";
import { NoteDetail } from "./components/note-detail";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

const FLAG_OPTIONS = [
  { value: "none", label: "All", color: undefined },
  { value: "1", label: "Red", color: "#ef4444" },
  { value: "2", label: "Orange", color: "#f97316" },
  { value: "3", label: "Green", color: "#22c55e" },
  { value: "4", label: "Blue", color: "#3b82f6" },
  { value: "5", label: "Pink", color: "#ec4899" },
  { value: "6", label: "Turquoise", color: "#14b8a6" },
  { value: "7", label: "Purple", color: "#a855f7" },
] as const;

const queryClient = new QueryClient();

export function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

type ViewMode = "notes" | "cards";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlModel = searchParams.get("model");
  // URL uses 1-based page, convert to 0-based for table
  const urlPage = parseInt(searchParams.get("page") ?? "1", 10);
  const pageIndex = Math.max(0, urlPage - 1);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const search = searchParams.get("search") ?? "";
  const flag = searchParams.get("flag") ?? "";
  const viewMode = (searchParams.get("view") ?? "notes") as ViewMode;

  // Fetch schema
  const {
    data: models,
    isLoading: schemaLoading,
    error: schemaError,
    refetch: refetchSchema,
  } = useQuery({
    queryKey: ["anki-schema"],
    queryFn: fetchAllModelsWithFields,
    staleTime: Infinity,
    retry: false,
  });

  const modelNames = useMemo(() => Object.keys(models ?? {}), [models]);
  const validModel = urlModel && models?.[urlModel];
  const fields = validModel ? models[urlModel] : [];

  const setUrlModel = (model: string) => {
    setSearchParams((prev) => {
      prev.set("model", model);
      // Reset pagination/search when model changes
      prev.delete("page");
      prev.delete("pageSize");
      prev.delete("search");
      return prev;
    });
  };

  const setUrlState = (newState: Record<string, string | number>) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(newState)) {
        prev.set(key, String(value));
      }
      return prev;
    });
  };

  // Derive main content
  let mainContent: React.ReactNode;
  if (schemaLoading) {
    mainContent = (
      <p className="text-muted-foreground">Connecting to Anki...</p>
    );
  } else if (schemaError) {
    mainContent = (
      <div className="flex flex-col items-center gap-4">
        <p className="text-destructive">Failed to connect to AnkiConnect</p>
        <p className="text-sm text-muted-foreground">{schemaError.message}</p>
        <button
          onClick={() => refetchSchema()}
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  } else if (modelNames.length === 0) {
    mainContent = (
      <p className="text-muted-foreground">No note types found in Anki</p>
    );
  } else if (!urlModel) {
    mainContent = (
      <p className="text-muted-foreground">Select a note type to browse</p>
    );
  } else if (!validModel) {
    mainContent = (
      <p className="text-destructive">Model "{urlModel}" not found</p>
    );
  } else {
    mainContent = (
      <NotesView
        model={urlModel}
        fields={fields}
        page={pageIndex}
        pageSize={pageSize}
        search={search}
        flag={flag}
        viewMode={viewMode}
        onStateChange={setUrlState}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            <Link to="/">Anki Browser</Link>
          </h1>
          {modelNames.length > 0 && (
            <>
              <select
                value={validModel ? urlModel : ""}
                onChange={(e) => setUrlModel(e.target.value)}
                className="rounded border bg-background px-2 py-1 text-sm"
              >
                {!validModel && <option value="">Select model...</option>}
                {modelNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <div className="flex rounded border text-sm">
                <button
                  onClick={() =>
                    setSearchParams((p) => {
                      p.set("view", "notes");
                      return p;
                    })
                  }
                  className={`px-3 py-1 ${viewMode === "notes" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  Notes
                </button>
                <button
                  onClick={() =>
                    setSearchParams((p) => {
                      p.set("view", "cards");
                      return p;
                    })
                  }
                  className={`px-3 py-1 ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  Cards
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 p-4">{mainContent}</main>
    </div>
  );
}

interface NotesViewProps {
  model: string;
  fields: string[];
  page: number;
  pageSize: number;
  search: string;
  flag: string;
  viewMode: ViewMode;
  onStateChange: (newState: Record<string, string | number>) => void;
}

function NotesView({
  model,
  fields,
  page,
  pageSize,
  search,
  flag,
  viewMode,
  onStateChange,
}: NotesViewProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Build full query with flag filter
  const fullSearch = useMemo(() => {
    const parts: string[] = [];
    if (search) parts.push(search);
    if (flag && flag !== "none") parts.push(`flag:${flag}`);
    return parts.join(" ") || undefined;
  }, [search, flag]);

  const {
    data: notes = [],
    isLoading: notesLoading,
    isFetching: notesFetching,
    error: notesError,
  } = useQuery({
    queryKey: ["notes", model, fullSearch],
    queryFn: () => fetchNotes(model, fullSearch),
    placeholderData: keepPreviousData,
    enabled: viewMode === "notes",
  });

  const {
    data: cards = [],
    isLoading: cardsLoading,
    isFetching: cardsFetching,
    error: cardsError,
  } = useQuery({
    queryKey: ["cards", model, fullSearch],
    queryFn: () => fetchCards(model, fullSearch),
    placeholderData: keepPreviousData,
    enabled: viewMode === "cards",
  });

  const isLoading = viewMode === "notes" ? notesLoading : cardsLoading;
  const isFetching = viewMode === "notes" ? notesFetching : cardsFetching;
  const error = viewMode === "notes" ? notesError : cardsError;

  // Local search state - synced with URL
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const submitSearch = () => {
    if (localSearch !== search) {
      onStateChange({ search: localSearch, page: 1 });
    }
  };

  if (error)
    return (
      <p className="text-destructive">Error loading notes: {error.message}</p>
    );

  const flagValue = flag || "none";
  const selectedFlag = FLAG_OPTIONS.find((f) => f.value === flagValue);

  const toolbarLeft = (
    <>
      <Input
        placeholder="Anki search: deck:name, tag:name, field:value, *wild*"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitSearch()}
        onBlur={submitSearch}
        className="w-80"
      />
      <Select
        value={flagValue}
        onValueChange={(value) =>
          onStateChange({ flag: value === "none" ? "" : value, page: 1 })
        }
      >
        <SelectTrigger className="w-[140px]">
          <Flag
            className="size-4"
            style={{ color: selectedFlag?.color }}
            fill={selectedFlag?.color ?? "none"}
          />
          <SelectValue placeholder="Flag" />
        </SelectTrigger>
        <SelectContent>
          {FLAG_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-2">
                {opt.color && (
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isFetching && (
        <span className="text-sm text-muted-foreground">Loading...</span>
      )}
    </>
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Loading {viewMode}...</p>;
  }

  const data = viewMode === "notes" ? notes : cards;
  const selected = viewMode === "notes" ? selectedNote : selectedCard;
  const setSelected =
    viewMode === "notes"
      ? (item: Note | Card) => setSelectedNote(item as Note)
      : (item: Note | Card) => setSelectedCard(item as Card);
  const clearSelected = () => {
    setSelectedNote(null);
    setSelectedCard(null);
  };

  return (
    <div className="flex gap-4">
      <div className={selected ? "flex-1" : "w-full"}>
        <BrowseTable
          data={data}
          viewMode={viewMode}
          model={model}
          fields={fields}
          page={page}
          pageSize={pageSize}
          onStateChange={onStateChange}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          toolbarLeft={toolbarLeft}
        />
      </div>
      {selected && (
        <div className="w-80 shrink-0">
          <NoteDetail
            item={selected}
            fields={fields}
            onClose={clearSelected}
            onFlagChange={async (cardId, flag) => {
              try {
                await setCardFlag(cardId, flag);
                // Update local state to reflect the change
                setSelectedCard((prev) =>
                  prev?.id === cardId ? { ...prev, flag } : prev,
                );
              } catch (e) {
                alert(
                  `Failed to set flag: ${e instanceof Error ? e.message : e}`,
                );
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
