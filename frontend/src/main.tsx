import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/dm-sans";
import "./styles.css";
import "./studio.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
