// Client-only entry used by the Capacitor Android build (vite.mobile.config.ts).
// Renders the TanStack Router as a pure SPA — no SSR, no Nitro, no shellComponent.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import { installMobileInputDiagnostics } from "./lib/mobileInputDiagnostics";
import "./styles.css";

installMobileInputDiagnostics();

const router = getRouter();

const container = document.getElementById("root");
if (!container) throw new Error("#root element not found");

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
