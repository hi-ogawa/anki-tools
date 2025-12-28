import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  CircleHelp,
  Clipboard,
  Download,
  Flag,
  Library,
  MoreVertical,
  Pencil,
  RefreshCw,
  Tag,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { api, cardsToCSV, type Card, type Item, type ViewMode } from "./api";
import { BrowseTable } from "./components/browse-table";
import { BulkActions } from "./components/bulk-actions";
import { CreateNoteDialog } from "./components/create-note-dialog";
import { NoteDetail } from "./components/note-detail";
import { TableSkeleton } from "./components/table-skeleton";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { FLAG_FILTER_OPTIONS, FLAG_OPTIONS } from "./lib/constants";
import { useLocalStorage } from "./lib/use-local-storage";
import { useResize } from "./lib/use-resize";

// TODO: separate singleton state and component
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => toast.error(error.message),
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
  const flagParam = searchParams.get("flag");
  const flags = flagParam ? flagParam.split(",") : undefined;
  const deckParam = searchParams.get("deck");
  const decks = deckParam ? deckParam.split(",") : undefined;
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
  const allDecks = schema?.decks ?? [];
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
        allDecks={allDecks}
        allTags={allTags}
        page={pageIndex}
        pageSize={pageSize}
        search={search}
        flag={flags}
        deck={decks}
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
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {schema && (
            <CreateNoteDialog
              schema={schema}
              defaultModel={validModel ? urlModel : undefined}
            />
          )}
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
  flag?: string[] | undefined;
  deck?: string[] | undefined;
  tags?: string[] | undefined;
}

interface NotesViewProps {
  model: string;
  fields: string[];
  allDecks: string[];
  allTags: string[];
  page: number;
  pageSize: number;
  search?: string;
  flag?: string[];
  deck?: string[];
  tags?: string[];
  viewMode: ViewMode;
  onStateChange: (newState: UrlState) => void;
}

function NotesView({
  model,
  fields,
  allDecks,
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

  // Bulk edit state (undefined = not in bulk edit mode)
  const [bulkEdit, setBulkEdit] = useState<{
    rowSelection: RowSelectionState;
    isAllSelected: boolean;
  }>();

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

  // Build full Anki query with model and filters
  const query = useMemo(() => {
    const parts: string[] = [`note:"${model}"`];
    if (search) parts.push(search);
    if (flag?.length) {
      // Use OR logic for multiple flags: (flag:1 OR flag:2)
      const flagQuery = flag.map((f) => `flag:${f}`).join(" OR ");
      parts.push(`(${flagQuery})`);
    }
    if (deck?.length) {
      // Use OR logic for multiple decks: (deck:"a" OR deck:"b")
      const deckQuery = deck.map((d) => `deck:"${d}"`).join(" OR ");
      parts.push(`(${deckQuery})`);
    }
    if (tags?.length) {
      // Use OR logic for multiple tags: (tag:a OR tag:b)
      const tagQuery = tags.map((t) => `tag:"${t}"`).join(" OR ");
      parts.push(`(${tagQuery})`);
    }
    return parts.join(" ");
  }, [model, search, flag, deck, tags]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    ...api.fetchItems.queryOptions({
      query,
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

  // Bulk mutations
  const bulkSetFlagMutation = useMutation({
    ...api.bulkSetCardFlags.mutationOptions(),
    onSuccess: () => {
      setBulkEdit(undefined);
      refetch();
    },
  });

  const bulkSuspendMutation = useMutation({
    ...api.bulkSuspendCards.mutationOptions(),
    onSuccess: () => {
      setBulkEdit(undefined);
      refetch();
    },
  });

  const isBulkPending =
    bulkSetFlagMutation.isPending || bulkSuspendMutation.isPending;

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async ({
      format,
      action,
    }: {
      format: "csv" | "json";
      action: "copy" | "download";
    }) => {
      const result = await api.fetchItems({ query, viewMode: "cards" });
      const cards = result.items as Card[];
      const data =
        format === "json" ? JSON.stringify(cards, null, 2) : cardsToCSV(cards);

      if (action === "copy") {
        await navigator.clipboard.writeText(data);
      } else {
        const mimeType = format === "json" ? "application/json" : "text/csv";
        const ext = format === "json" ? "json" : "csv";
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `anki-export-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      return { count: cards.length, action };
    },
    onSuccess: ({ count, action }) => {
      if (action === "copy") {
        toast.success(`Copied ${count} cards to clipboard`);
      }
    },
  });

  const getBulkTarget = () => {
    if (!bulkEdit) {
      return { cardIds: [], count: 0 };
    }
    if (bulkEdit.isAllSelected) {
      return { query, count: total };
    }
    const cardIds = Object.keys(bulkEdit.rowSelection)
      .filter((k) => bulkEdit.rowSelection[k])
      .map(Number);
    return { cardIds, count: cardIds.length };
  };

  const handleBulkSetFlag = (flag: number) => {
    const { count, ...target } = getBulkTarget();
    const label = FLAG_OPTIONS.find((f) => f.value === flag)?.label ?? flag;
    if (!window.confirm(`Set flag to ${label} for ${count} cards?`)) return;
    bulkSetFlagMutation.mutate({ ...target, flag });
  };

  const handleBulkSuspend = (suspended: boolean) => {
    const { count, ...target } = getBulkTarget();
    const action = suspended ? "Suspend" : "Unsuspend";
    if (!window.confirm(`${action} ${count} cards?`)) return;
    bulkSuspendMutation.mutate({ ...target, suspended });
  };

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`px-2 ${flag?.length ? "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600" : ""}`}
            data-testid="flag-filter"
          >
            <Flag className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          {FLAG_FILTER_OPTIONS.filter((opt) => opt.value !== "none").map(
            (opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={flag?.includes(opt.value) ?? false}
                onCheckedChange={(checked) =>
                  onStateChange({
                    flag: toggleArrayValue(flag, opt.value, checked),
                    page: 1,
                  })
                }
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2">
                  <Flag
                    className="size-4"
                    style={{ color: opt.color }}
                    fill={opt.color ?? "none"}
                  />
                  {opt.label}
                </span>
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`px-2 ${deck?.length ? "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600" : ""}`}
            data-testid="deck-filter"
          >
            <Library className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          {allDecks.map((d) => (
            <DropdownMenuCheckboxItem
              key={d}
              checked={deck?.includes(d) ?? false}
              onCheckedChange={(checked) =>
                onStateChange({
                  deck: toggleArrayValue(deck, d, checked),
                  page: 1,
                })
              }
              onSelect={(e) => e.preventDefault()}
            >
              {d}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
                onCheckedChange={(checked) =>
                  onStateChange({
                    tags: toggleArrayValue(tags, t, checked),
                    page: 1,
                  })
                }
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="more-menu">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              setBulkEdit({ rowSelection: {}, isAllSelected: false })
            }
            disabled={viewMode === "notes"}
            data-testid="bulk-edit-button"
          >
            <Pencil className="size-4" />
            Bulk Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              exportMutation.mutate({ format: "csv", action: "copy" })
            }
            disabled={viewMode === "notes" || exportMutation.isPending}
          >
            <Clipboard className="size-4" />
            Copy to Clipboard
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              exportMutation.mutate({ format: "csv", action: "download" })
            }
            disabled={viewMode === "notes" || exportMutation.isPending}
            data-testid="export-button"
          >
            <Download className="size-4" />
            Download CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              exportMutation.mutate({ format: "json", action: "download" })
            }
            disabled={viewMode === "notes" || exportMutation.isPending}
          >
            <Download className="size-4" />
            Download JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const bulkToolbar = (
    <BulkActions
      selectedCount={getBulkTarget().count}
      totalMatching={total}
      isAllSelected={!!bulkEdit?.isAllSelected}
      onSelectAll={() => setBulkEdit({ rowSelection: {}, isAllSelected: true })}
      onExit={() => setBulkEdit(undefined)}
      onSetFlag={handleBulkSetFlag}
      onSuspend={() => handleBulkSuspend(true)}
      onUnsuspend={() => handleBulkSuspend(false)}
      isPending={isBulkPending}
    />
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
            ? "flex-1 min-w-[400px] overflow-auto p-1 -m-1"
            : "w-full overflow-auto p-1 -m-1"
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
          toolbarLeft={bulkEdit ? bulkToolbar : toolbarLeft}
          bulkEdit={bulkEdit}
          onBulkEditRawSelectionChange={(selection) =>
            bulkEdit && setBulkEdit({ ...bulkEdit, rowSelection: selection })
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

function toggleArrayValue<T>(
  arr: T[] | undefined,
  value: T,
  checked: boolean,
): T[] {
  return checked
    ? [...(arr ?? []), value]
    : (arr ?? []).filter((v) => v !== value);
}
