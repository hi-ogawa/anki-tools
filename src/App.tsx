import { useAnkiSchema } from "./hooks/useAnkiSchema";
import { AnkiBrowser } from "./components/AnkiBrowser";
import "./App.css";

function App() {
  const { models, loading, error, refresh } = useAnkiSchema();
  const modelNames = Object.keys(models);

  // Get model from URL, fallback to first
  const params = new URLSearchParams(window.location.search);
  const urlModel = params.get("model");
  const currentModel = urlModel && models[urlModel] ? urlModel : modelNames[0] ?? null;

  const setModel = (model: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("model", model);
    window.history.pushState({}, "", url);
    // Force re-render
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Connecting to Anki...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to connect to AnkiConnect</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={refresh}
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!currentModel) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No note types found in Anki</p>
      </div>
    );
  }

  return (
    <AnkiBrowser
      key={currentModel}
      model={currentModel}
      fields={models[currentModel]}
      modelNames={modelNames}
      onModelChange={setModel}
    />
  );
}

export default App;
