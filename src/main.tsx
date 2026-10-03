import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import "./index.css";
import App from "./App";

/**
 * En Capacitor, base "./" rompe BrowserRouter (pantalla en blanco).
 * HashRouter evita problemas de path en el WebView nativo.
 */
const nativo = Capacitor.isNativePlatform();
const baseRaw = import.meta.env.BASE_URL || "/";
const basename =
  baseRaw === "./" || baseRaw === "." ? undefined : baseRaw.replace(/\/$/, "") || undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {nativo ? (
      <HashRouter>
        <App />
      </HashRouter>
    ) : (
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
