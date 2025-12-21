import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { fetchAllModelsWithFields, fetchNotes } from "./api";
import { NotesTable } from "./components/notes-table";
import { Input } from "./components/ui/input";

const queryClient = new QueryClient();

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
  const search = searchParams.get("search") ?? "";

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
  onStateChange: (newState: Record<string, string | number>) => void;
}

function NotesView({
  model,
  fields,
  page,
  pageSize,
  search,
  onStateChange,
}: NotesViewProps) {
  const {
    data: notes = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["notes", model, search],
    queryFn: () => fetchNotes(model, search || undefined),
    placeholderData: keepPreviousData,
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

  if (error)
    return (
      <p className="text-destructive">Error loading notes: {error.message}</p>
    );

  return (
    <div className="space-y-4">
      {/* Search input - always mounted */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Anki search: deck:name, tag:name, field:value, *wild*"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          onBlur={submitSearch}
          className="max-w-md"
        />
        {isFetching && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading notes...</p>
      ) : (
        <NotesTable
          notes={notes}
          model={model}
          fields={fields}
          page={page}
          pageSize={pageSize}
          onStateChange={onStateChange}
        />
      )}
    </div>
  );
}
