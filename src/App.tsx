import { useState, useMemo } from "react";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";

import { NoteList } from "./pages/notes";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { createAnkiDataProvider } from "./providers/anki-connect";
import { useAnkiSchema } from "./hooks/useAnkiSchema";
import "./App.css";

function App() {
  const { models, loading, error, refresh } = useAnkiSchema();
  const modelNames = Object.keys(models);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Auto-select first model when loaded
  const currentModel = selectedModel ?? modelNames[0] ?? null;
  const fields = currentModel ? models[currentModel] : [];

  // Create data provider for selected model
  const dataProvider = useMemo(() => {
    if (!currentModel || fields.length === 0) return null;
    return createAnkiDataProvider(currentModel, fields);
  }, [currentModel, fields]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Connecting to Anki...</p>
      </div>
    );
  }

  // Error state
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

  // No models found
  if (!dataProvider || !currentModel) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No note types found in Anki</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <Refine
            dataProvider={dataProvider}
            notificationProvider={useNotificationProvider()}
            routerProvider={routerProvider}
            resources={[
              {
                name: "notes",
                list: "/notes",
                show: "/notes/show/:id",
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Layout
                    modelSelector={
                      <select
                        value={currentModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-sm"
                      >
                        {modelNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    }
                  >
                    <Outlet />
                  </Layout>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="notes" />}
                />
                <Route path="/notes">
                  <Route index element={<NoteList fields={fields} />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>

            <Toaster />
            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
