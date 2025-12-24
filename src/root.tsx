import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import { Flag, RefreshCw } from "lucide-react";
import { Suspense, useMemo, useState, useEffect, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
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
import { useResize } from "./lib/use-resize";

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
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div className="flex h-screen flex-col items-center justify-center gap-4">
            <p className="text-destructive">Something went wrong</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={resetErrorBoundary}>Retry</Button>
          </div>
        )}
        onReset={() => queryClient.clear()}
      >
        <Suspense
          fallback={
            <div className="flex h-screen flex-col">
              <header className="shrink-0 border-b px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold">Anki Browser</span>
                  <div className="h-8 w-[180px] rounded-md bg-muted animate-pulse" />
                  <div className="h-8 w-[100px] rounded-md bg-muted animate-pulse" />
                </div>
              </header>
              <main className="flex-1 overflow-hidden p-4">
                <div className="space-y-3">
                  <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                </div>
              </main>
            </div>
          }
        >
          <App />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlModel = searchParams.get("model");
  // URL uses 1-based page, convert to 0-based for table
  const urlPage = parseInt(searchParams.get("page") ?? "1", 10);
  const pageIndex = Math.max(0, urlPage - 1);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const search = searchParams.get("search") ?? undefined;
  const flag = searchParams.get("flag") ?? undefined;
  const viewMode = (searchParams.get("view") ?? "cards") as ViewMode;

  // Fetch schema - suspends until ready, throws on error
  const { data: models } = useSuspenseQuery({
    ...api.getModels.queryOptions(),
    staleTime: Infinity,
    retry: false,
  });

  const modelNames = useMemo(() => Object.keys(models), [models]);

  // Persist last selected model
  const [lastModel, setLastModel] = useLocalStorage<string | null>(
    "anki-browse-last-model",
    null,
  );

  // Compute effective model synchronously - no flicker
  const effectiveModel = useMemo(() => {
    if (urlModel && models[urlModel]) return urlModel;
    if (lastModel && models[lastModel]) return lastModel;
    return null;
  }, [urlModel, lastModel, models]);

  const fields = effectiveModel ? models[effectiveModel] : [];

  // Sync URL with effective model (non-blocking)
  useEffect(() => {
    if (effectiveModel && effectiveModel !== urlModel) {
      setSearchParams(
        (prev) => {
          prev.set("model", effectiveModel);
          return prev;
        },
        { replace: true },
      );
    }
  }, [effectiveModel, urlModel, setSearchParams]);

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

  const setUrlState = (newState: UrlState) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(newState)) {
        if (value === undefined || value === "") {
          prev.delete(key);
        } else {
          prev.set(key, String(value));
        }
      }
      return prev;
    });
  };

  // Derive main content
  let mainContent: React.ReactNode;
  if (modelNames.length === 0) {
    mainContent = (
      <p className="text-muted-foreground">No note types found in Anki</p>
    );
  } else if (!effectiveModel) {
    mainContent = (
      <p className="text-muted-foreground">Select a note type to browse</p>
    );
  } else {
    mainContent = (
      <NotesView
        model={effectiveModel}
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
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            <Link to="/">Anki Browser</Link>
          </h1>
          <Select
            value={effectiveModel ?? undefined}
            onValueChange={setUrlModel}
          >
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue placeholder="Select model..." />
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
          >
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notes">Notes</SelectItem>
              <SelectItem value="cards">Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-4">{mainContent}</main>
    </div>
  );
}

interface UrlState {
  page?: number;
  pageSize?: number;
  search?: string;
  flag?: string;
}

interface NotesViewProps {
  model: string;
  fields: string[];
  page: number;
  pageSize: number;
  search?: string;
  flag?: string;
  viewMode: ViewMode;
  onStateChange: (newState: UrlState) => void;
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
  const [selected, setSelected] = useState<Item>();
  const [isStale, setIsStale] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Wrap state changes in transition to avoid suspending
  const handleStateChange = (newState: UrlState) => {
    startTransition(() => {
      onStateChange(newState);
    });
  };

  // Resizable panel
  const [panelWidth, setPanelWidth] = useLocalStorage(
    "anki-browse-panel-width",
    320,
  );
  const { panelRef, startResize } = useResize({
    onWidthChange: setPanelWidth,
    minWidth: 200,
    maxWidth: 700,
  });

  // Build full query with flag filter
  const fullSearch = useMemo(() => {
    const parts: string[] = [];
    if (search) parts.push(search);
    if (flag) parts.push(`flag:${flag}`);
    return parts.join(" ") || undefined;
  }, [search, flag]);

  const {
    data: items,
    isFetching,
    refetch,
  } = useSuspenseQuery({
    ...api.fetchItems.queryOptions({
      modelName: model,
      search: fullSearch,
      viewMode,
    }),
  });

  // TODO: optimistic updates
  const setFlagMutation = useMutation({
    ...api.setCardFlag.mutationOptions(),
    onSuccess: (_, { cardId, flag }) => {
      setIsStale(true);
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
      setIsStale(true);
      setSelected((prev) =>
        prev ? { ...prev, fields: { ...prev.fields, ...fields } } : undefined,
      );
    },
  });

  const updateTagsMutation = useMutation({
    ...api.updateNoteTags.mutationOptions(),
    onSuccess: (_, { tags }) => {
      setIsStale(true);
      setSelected((prev) => (prev ? { ...prev, tags } : undefined));
    },
  });

  const setSuspendedMutation = useMutation({
    ...api.setSuspended.mutationOptions(),
    onSuccess: (queue, { cardId }) => {
      setIsStale(true);
      setSelected((prev) =>
        prev?.type === "card" && prev.cardId === cardId
          ? { ...prev, queue }
          : prev,
      );
    },
  });

  // Local search state - synced with URL
  const [localSearch, setLocalSearch] = useState(search ?? "");
  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  const submitSearch = () => {
    if (localSearch !== (search ?? "")) {
      handleStateChange({ search: localSearch || undefined, page: 1 });
    }
  };

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
        value={flag ?? "none"}
        onValueChange={(value) =>
          handleStateChange({
            flag: value === "none" ? undefined : value,
            page: 1,
          })
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => refetch().then(() => setIsStale(false))}
        disabled={isPending || isFetching}
        title={isStale ? "Data may be outdated - click to refresh" : "Refresh"}
        data-testid="refresh-button"
        data-stale={isStale ? "true" : undefined}
        className={
          isStale
            ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
            : ""
        }
      >
        <RefreshCw
          className={`size-4 ${isPending || isFetching ? "animate-spin" : ""}`}
        />
      </Button>
    </>
  );

  return (
    <div className="flex h-full gap-4">
      <div
        className={`${
          selected
            ? "flex-1 min-w-[400px] overflow-auto"
            : "w-full overflow-auto"
        }`}
      >
        <BrowseTable
          data={items}
          viewMode={viewMode}
          model={model}
          fields={fields}
          page={page}
          pageSize={pageSize}
          onStateChange={handleStateChange}
          selected={selected}
          onSelect={setSelected}
          toolbarLeft={toolbarLeft}
        />
      </div>
      {selected && (
        <div
          ref={panelRef}
          data-testid="detail-panel"
          className="relative flex shrink-0"
          style={{ width: panelWidth }}
        >
          <div
            data-testid="panel-resize-handle"
            className="absolute left-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20"
            onMouseDown={startResize}
          />
          <div className="flex-1 overflow-hidden pl-1">
            <NoteDetail
              item={selected}
              fields={fields}
              onClose={() => setSelected(undefined)}
              onFlagChange={
                selected.type === "card"
                  ? (flag) =>
                      setFlagMutation.mutate({ cardId: selected.cardId, flag })
                  : undefined
              }
              onFieldsChange={(fields) =>
                updateFieldsMutation.mutate({ noteId: selected.noteId, fields })
              }
              onTagsChange={(tags) =>
                updateTagsMutation.mutate({ noteId: selected.noteId, tags })
              }
              onSuspendedChange={
                selected.type === "card"
                  ? (suspended) =>
                      setSuspendedMutation.mutate({
                        cardId: selected.cardId,
                        suspended,
                      })
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
