import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/dm-sans";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
