import { useMemo } from "react";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";

import { NoteList } from "@/pages/notes";
import { ErrorComponent } from "@/components/refine-ui/layout/error-component";
import { Layout } from "@/components/refine-ui/layout/layout";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { createAnkiDataProvider } from "@/providers/anki-connect";

interface AnkiBrowserProps {
  model: string;
  fields: string[];
  modelNames: string[];
  onModelChange: (model: string) => void;
}

export function AnkiBrowser({ model, fields, modelNames, onModelChange }: AnkiBrowserProps) {
  const dataProvider = useMemo(
    () => createAnkiDataProvider(model, fields),
    [model, fields]
  );

  const modelSelector = (
    <select
      value={model}
      onChange={(e) => onModelChange(e.target.value)}
      className="rounded border bg-background px-2 py-1 text-sm"
    >
      {modelNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );

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
                  <Layout modelSelector={modelSelector}>
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
