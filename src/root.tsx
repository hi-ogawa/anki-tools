import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import {
  fetchAllModelsWithFields,
  fetchNotes,
  fetchCards,
  setCardFlag,
  updateNoteFields,
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
import { useLocalStorage } from "./lib/use-local-storage";

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

// TODO: separate singleton state and component
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
  // TODO: model type-safe search params
  const [searchParams, setSearchParams] = useSearchParams();
  const urlModel = searchParams.get("model");
  // URL uses 1-based page, convert to 0-based for table
  const urlPage = parseInt(searchParams.get("page") ?? "1", 10);
  const pageIndex = Math.max(0, urlPage - 1);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const search = searchParams.get("search") ?? "";
  const flag = searchParams.get("flag") ?? "";
  const viewMode = (searchParams.get("view") ?? "cards") as ViewMode;

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

  // Persist last selected model
  const [lastModel, setLastModel] = useLocalStorage<string | null>(
    "anki-browse-last-model",
    null,
  );
  const hasAutoSelected = useRef(false);

  // Auto-select last model when models load and no URL model
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (!models || urlModel) return;
    if (lastModel && models[lastModel]) {
      hasAutoSelected.current = true;
      setSearchParams((prev) => {
        prev.set("model", lastModel);
        return prev;
      });
    }
  }, [models, urlModel, lastModel, setSearchParams]);

  const setUrlModel = (model: string) => {
    setLastModel(model);
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
          {!schemaError && (
            <>
              <select
                value={validModel ? urlModel : ""}
                onChange={(e) => setUrlModel(e.target.value)}
                className="rounded border bg-background px-2 py-1 text-sm"
                disabled={schemaLoading}
              >
                {(schemaLoading || !validModel) && (
                  <option value="">
                    {schemaLoading ? "Loading..." : "Select model..."}
                  </option>
                )}
                {modelNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <Select
                value={viewMode}
                onValueChange={(value) =>
                  setSearchParams((p) => {
                    p.set("view", value);
                    return p;
                  })
                }
                disabled={schemaLoading}
              >
                <SelectTrigger size="sm" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                </SelectContent>
              </Select>
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

  // Resizable panel
  const [panelWidth, setPanelWidth] = useLocalStorage(
    "anki-browse-panel-width",
    320,
  );
  const isResizing = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX - 24; // 16 = padding
      setPanelWidth(Math.max(300, Math.min(600, newWidth)));
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [setPanelWidth]);

  // Build full query with flag filter
  const fullSearch = useMemo(() => {
    const parts: string[] = [];
    if (search) parts.push(search);
    if (flag && flag !== "none") parts.push(`flag:${flag}`);
    return parts.join(" ") || undefined;
  }, [search, flag]);

  // TOOD: two queries should abstracted as query function level?
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

  // TODO: suspend and transition?
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

  if (error) {
    return (
      <p className="text-destructive">Error loading notes: {error.message}</p>
    );
  }

  const flagValue = flag || "none";

  const toolbarLeft = (
    <>
      <Input
        placeholder="Search by: deck:name, tag:name, field:value, *wild*, ..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitSearch()}
        className="w-[400px]"
      />
      <Select
        value={flagValue}
        onValueChange={(value) =>
          onStateChange({ flag: value === "none" ? "" : value, page: 1 })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Flag" />
        </SelectTrigger>
        <SelectContent>
          {FLAG_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-2">
                <Flag
                  className="size-4"
                  style={{ color: opt.color }}
                  fill={opt.color ?? "none"}
                />
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
      {/* TODO: small panelWidth breaks layout. it depends on field data length. */}
      {selected && (
        <div className="relative flex shrink-0" style={{ width: panelWidth }}>
          <div
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20"
            onMouseDown={() => {
              isResizing.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          />
          <div className="flex-1 pl-1">
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
              onFieldsChange={async (noteId, updatedFields) => {
                try {
                  await updateNoteFields(noteId, updatedFields);
                  // Update local state to reflect the change
                  const updateItem = <T extends Note | Card>(
                    prev: T | null,
                  ): T | null => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      fields: { ...prev.fields, ...updatedFields },
                    };
                  };
                  setSelectedNote(updateItem);
                  setSelectedCard(updateItem);
                } catch (e) {
                  alert(
                    `Failed to update fields: ${e instanceof Error ? e.message : e}`,
                  );
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
