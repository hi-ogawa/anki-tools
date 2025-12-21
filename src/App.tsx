import { useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fetchAllModelsWithFields, fetchNotes } from "./providers/anki-connect";
import { NotesTable } from "./components/NotesTable";
import "./App.css";

function NotesView({ model, fields }: { model: string; fields: string[] }) {
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["notes", model],
    queryFn: () => fetchNotes(model),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading notes...</p>;
  if (error) return <p className="text-destructive">Error loading notes: {error.message}</p>;
  return <NotesTable notes={notes} fields={fields} />;
}

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

  const modelNames = Object.keys(models ?? {});
  const validModel = urlModel && models?.[urlModel];
  const fields = validModel ? models[urlModel] : [];

  // Derive main content
  let mainContent: React.ReactNode;
  if (schemaLoading) {
    mainContent = <p className="text-muted-foreground">Connecting to Anki...</p>;
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
    mainContent = <p className="text-muted-foreground">No note types found in Anki</p>;
  } else if (!urlModel) {
    mainContent = <p className="text-muted-foreground">Select a note type to browse</p>;
  } else if (!validModel) {
    mainContent = <p className="text-destructive">Model "{urlModel}" not found</p>;
  } else {
    mainContent = <NotesView model={urlModel} fields={fields} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Anki Browser</h1>
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
