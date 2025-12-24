import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { CircleHelp, Flag, Library, RefreshCw, Tag } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { api, type Item, type ViewMode } from "./api";
import { BrowseTable } from "./components/browse-table";
import { BulkActionsToolbar } from "./components/bulk-actions-toolbar";
import { NoteDetail } from "./components/note-detail";
import { TableSkeleton } from "./components/table-skeleton";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { FLAG_COLORS, FLAG_FILTER_OPTIONS, CARD_ROW_ID_PREFIX } from "./lib/constants";
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
      <App />
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
  const deck = searchParams.get("deck") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",") : undefined;
  const viewMode = (searchParams.get("view") ?? "cards") as ViewMode;

  // Fetch schema (models + decks)
  const {
    data: schema,
    isLoading: schemaLoading,
    error: schemaError,
    refetch: refetchSchema,
  } = useQuery({
    ...api.getSchema.queryOptions(),
    staleTime: Infinity,
    retry: false,
  });

  const models = schema?.models;
  const decks = schema?.decks ?? [];
  const allTags = schema?.tags ?? [];
  const modelNames = useMemo(() => Object.keys(models ?? {}), [models]);
  const validModel = urlModel && models?.[urlModel];
  const fields = validModel ? models[urlModel] : undefined;

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

  const setUrlState = (newState: UrlState) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(newState)) {
        if (
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          prev.delete(key);
        } else if (Array.isArray(value)) {
          prev.set(key, value.join(","));
        } else {
          prev.set(key, String(value));
        }
      }
      return prev;
    });
  };

  // Derive main content
  let mainContent: React.ReactNode;
  if (schemaLoading) {
    mainContent = <TableSkeleton />;
  } else if (schemaError) {
    mainContent = (
      <div className="flex flex-col items-center gap-4">
        <p className="text-destructive">Failed to load Anki data</p>
        <p className="text-sm text-muted-foreground">
          Make sure Anki is running with the addon installed.
        </p>
        <p className="text-xs text-muted-foreground">{schemaError.message}</p>
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
      <p className="text-destructive">Note type "{urlModel}" not found</p>
    );
  } else {
    mainContent = (
      <NotesView
        key={`${urlModel}-${viewMode}`}
        model={urlModel}
        fields={fields!}
        decks={decks}
        allTags={allTags}
        page={pageIndex}
        pageSize={pageSize}
        search={search}
        flag={flag}
        deck={deck}
        tags={tags}
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
            value={validModel ? urlModel : undefined}
            onValueChange={setUrlModel}
            disabled={schemaLoading || !!schemaError}
          >
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue placeholder="Select note type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Note type</SelectLabel>
                {modelNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
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
            disabled={schemaLoading || !!schemaError}
          >
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>View mode</SelectLabel>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="cards">Cards</SelectItem>
              </SelectGroup>
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
  deck?: string;
  tags?: string[] | undefined;
}

interface NotesViewProps {
  model: string;
  fields: string[];
  decks: string[];
  allTags: string[];
  page: number;
  pageSize: number;
  search?: string;
  flag?: string;
  deck?: string;
  tags?: string[];
  viewMode: ViewMode;
  onStateChange: (newState: UrlState) => void;
}

function NotesView({
  model,
  fields,
  decks,
  allTags,
  page,
  pageSize,
  search,
  flag,
  deck,
  tags,
  viewMode,
  onStateChange,
}: NotesViewProps) {
  const [selected, setSelected] = useState<Item>();
  const [isStale, setIsStale] = useState(false);

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

  // Build full query with filters
  const fullSearch = useMemo(() => {
    const parts: string[] = [];
    if (search) parts.push(search);
    if (flag) parts.push(`flag:${flag}`);
    if (deck) parts.push(`deck:"${deck}"`);
    if (tags?.length) {
      // Use OR logic for multiple tags: (tag:a OR tag:b)
      const tagQuery = tags.map((t) => `tag:"${t}"`).join(" OR ");
      parts.push(`(${tagQuery})`);
    }
    return parts.join(" ") || undefined;
  }, [search, flag, deck, tags]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    ...api.fetchItems.queryOptions({
      modelName: model,
      search: fullSearch,
      viewMode,
      limit: pageSize,
      offset: page * pageSize,
    }),
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

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

  // Bulk operations state and mutations (only for cards view)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const bulkSetFlagMutation = useMutation({
    ...api.bulkSetCardFlag.mutationOptions(),
    onSuccess: () => {
      setIsStale(true);
      setRowSelection({});
    },
  });

  const bulkSetSuspendedMutation = useMutation({
    ...api.bulkSetSuspended.mutationOptions(),
    onSuccess: () => {
      setIsStale(true);
      setRowSelection({});
    },
  });

  // Get selected card IDs from row selection
  const selectedCardIds = useMemo(() => {
    if (viewMode !== "cards") return [];
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => {
        const id = key.replace(CARD_ROW_ID_PREFIX, "");
        return parseInt(id, 10);
      })
      .filter((id) => !isNaN(id));
  }, [rowSelection, viewMode]);

  const handleBulkSetFlag = (flag: number) => {
    if (selectedCardIds.length === 0) return;
    bulkSetFlagMutation.mutate({ cardIds: selectedCardIds, flag });
  };

  const handleBulkSuspend = () => {
    if (selectedCardIds.length === 0) return;
    bulkSetSuspendedMutation.mutate({
      cardIds: selectedCardIds,
      suspended: true,
    });
  };

  const handleBulkUnsuspend = () => {
    if (selectedCardIds.length === 0) return;
    bulkSetSuspendedMutation.mutate({
      cardIds: selectedCardIds,
      suspended: false,
    });
  };

  const isBulkOperationLoading =
    bulkSetFlagMutation.isPending || bulkSetSuspendedMutation.isPending;

  // Local search state - synced with URL
  const [localSearch, setLocalSearch] = useState(search ?? "");
  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  const submitSearch = () => {
    if (localSearch !== (search ?? "")) {
      onStateChange({ search: localSearch || undefined, page: 1 });
    }
  };

  const toolbarLeft = (
    <>
      <div className="relative">
        <Input
          placeholder="Search (supports Anki query syntax)"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          className="w-[400px] pr-8"
        />
        <a
          href="https://docs.ankiweb.net/searching.html"
          target="_blank"
          rel="noopener noreferrer"
          title="Search syntax help"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <CircleHelp className="size-4" />
        </a>
      </div>
      <Select
        value={flag ?? "none"}
        onValueChange={(value) =>
          onStateChange({ flag: value === "none" ? undefined : value, page: 1 })
        }
      >
        <SelectTrigger
          className="w-auto"
          data-testid="flag-filter"
          style={
            flag
              ? {
                  backgroundColor: `${FLAG_COLORS[Number(flag)]}20`,
                  borderColor: FLAG_COLORS[Number(flag)],
                }
              : undefined
          }
        >
          <Flag
            className="size-4"
            style={flag ? { color: FLAG_COLORS[Number(flag)] } : undefined}
            fill={flag ? FLAG_COLORS[Number(flag)] : "none"}
          />
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
      <Select
        value={deck ?? "all"}
        onValueChange={(value) =>
          onStateChange({ deck: value === "all" ? undefined : value, page: 1 })
        }
      >
        <SelectTrigger
          className={`w-auto ${deck ? "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600" : ""}`}
          data-testid="deck-filter"
        >
          <Library className="size-4" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All decks</SelectItem>
          {decks.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`px-2 ${tags?.length ? "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600" : ""}`}
            data-testid="tag-filter"
          >
            <Tag className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          {allTags.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No tags
            </div>
          ) : (
            allTags.map((t) => (
              <DropdownMenuCheckboxItem
                key={t}
                checked={tags?.includes(t) ?? false}
                onCheckedChange={(checked) => {
                  const newTags = checked
                    ? [...(tags ?? []), t]
                    : (tags ?? []).filter((tag) => tag !== t);
                  onStateChange({ tags: newTags, page: 1 });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {t}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => refetch().then(() => setIsStale(false))}
        disabled={isFetching}
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
          className={`size-4 ${!isLoading && isFetching ? "animate-spin" : ""}`}
        />
      </Button>
    </>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-destructive">Failed to load {viewMode}</p>
        <p className="text-sm text-muted-foreground">
          Make sure Anki is running with the addon installed.
        </p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="flex h-full gap-4">
      <div
        className={
          selected
            ? "flex-1 min-w-[400px] overflow-auto"
            : "w-full overflow-auto"
        }
      >
        <BrowseTable
          data={items}
          total={total}
          viewMode={viewMode}
          model={model}
          fields={fields}
          page={page}
          pageSize={pageSize}
          onStateChange={onStateChange}
          selected={selected}
          onSelect={setSelected}
          toolbarLeft={toolbarLeft}
          rowSelection={viewMode === "cards" ? rowSelection : undefined}
          onRowSelectionChange={
            viewMode === "cards" ? setRowSelection : undefined
          }
          bulkActionsToolbar={
            viewMode === "cards" ? (
              <BulkActionsToolbar
                selectedCount={selectedCardIds.length}
                onClearSelection={() => setRowSelection({})}
                onSetFlag={handleBulkSetFlag}
                onSuspend={handleBulkSuspend}
                onUnsuspend={handleBulkUnsuspend}
                isLoading={isBulkOperationLoading}
              />
            ) : undefined
          }
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
