import { useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fetchAllModelsWithFields, fetchNotes } from "./providers/anki-connect";
import { NotesTable } from "./components/NotesTable";
import "./App.css";

const queryClient = new QueryClient();

// Subscribe to URL changes
function useUrlParam(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
    () => new URLSearchParams(window.location.search).get(key)
  );

  const setValue = (newValue: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, newValue);
    window.history.pushState({}, "", url);
    // Trigger re-render by dispatching popstate
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return [value, setValue];
}

function AppContent() {
  const [urlModel, setUrlModel] = useUrlParam("model");

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

  // Fetch notes only when we have a valid model
  const fields = urlModel && models?.[urlModel] ? models[urlModel] : [];
  const {
    data: notes = [],
    isLoading: notesLoading,
    error: notesError,
  } = useQuery({
    queryKey: ["notes", urlModel],
    queryFn: () => fetchNotes(urlModel!),
    enabled: !!urlModel && !!models?.[urlModel],
  });

  if (schemaLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Connecting to Anki...</p>
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
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
  }

  const modelNames = Object.keys(models ?? {});

  // No models in Anki
  if (modelNames.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No note types found in Anki</p>
      </div>
    );
  }

  const validModel = urlModel && models?.[urlModel];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Anki Browser</h1>
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
          {validModel && (
            <span className="text-sm text-muted-foreground">
              {notesLoading ? "Loading..." : `${notes.length} notes`}
            </span>
          )}
        </div>
      </header>
      <main className="flex-1 p-4">
        {!urlModel ? (
          <p className="text-muted-foreground">Select a note type to browse</p>
        ) : !validModel ? (
          <p className="text-destructive">Model "{urlModel}" not found</p>
        ) : notesError ? (
          <p className="text-destructive">Error loading notes: {notesError.message}</p>
        ) : (
          <NotesTable notes={notes} fields={fields} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
