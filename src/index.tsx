import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./root";
import { RouterProvider } from "react-router/dom";
import { createBrowserRouter } from "react-router";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
