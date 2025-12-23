import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { api, type Item, type ViewMode } from "./api";
import { BrowseTable } from "./components/browse-table";
import { NoteDetail } from "./components/note-detail";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { FLAG_FILTER_OPTIONS } from "./lib/constants";
import { useLocalStorage } from "./lib/use-local-storage";

// TODO: separate singleton state and component
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => alert(error.message),
    },
  },
});

export function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

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
    ...api.getModels.queryOptions(),
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
        <Button onClick={() => refetchSchema()}>Retry</Button>
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
        key={`${urlModel}-${viewMode}`}
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
              <Select
                value={validModel ? urlModel : undefined}
                onValueChange={setUrlModel}
                disabled={schemaLoading}
              >
                <SelectTrigger size="sm" className="w-[180px]">
                  <SelectValue
                    placeholder={
                      schemaLoading ? "Loading..." : "Select model..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modelNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  const [selected, setSelected] = useState<Item | null>(null);

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

  const {
    data: items = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    ...api.fetchItems.queryOptions({
      modelName: model,
      search: fullSearch,
      viewMode,
    }),
    placeholderData: keepPreviousData,
  });

  // TODO: optimistic updates
  const setFlagMutation = useMutation({
    ...api.setCardFlag.mutationOptions(),
    onSuccess: (_, { cardId, flag }) => {
      setSelected((prev) =>
        prev?.type === "card" && prev.cardId === cardId
          ? { ...prev, flag }
          : prev,
      );
    },
  });

  const updateFieldsMutation = useMutation({
    ...api.updateNoteFields.mutationOptions(),
    onSuccess: (_, { fields }) => {
      setSelected((prev) =>
        prev ? { ...prev, fields: { ...prev.fields, ...fields } } : null,
      );
    },
  });

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
          {FLAG_FILTER_OPTIONS.map((opt) => (
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

  // Get unique ID for selection (noteId for notes, cardId for cards)
  const getItemId = (item: Item) =>
    item.type === "card" ? item.cardId : item.noteId;

  return (
    <div className="flex gap-4">
      <div className={selected ? "flex-1" : "w-full"}>
        <BrowseTable
          data={items}
          viewMode={viewMode}
          model={model}
          fields={fields}
          page={page}
          pageSize={pageSize}
          onStateChange={onStateChange}
          selectedId={selected ? getItemId(selected) : null}
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
              onClose={() => setSelected(null)}
              onFlagChange={
                selected.type === "card"
                  ? (flag) =>
                      setFlagMutation.mutate({ cardId: selected.cardId, flag })
                  : undefined
              }
              onFieldsChange={(fields) =>
                updateFieldsMutation.mutate({ noteId: selected.noteId, fields })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
