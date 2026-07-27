import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { TOKENS_CSS } from "./tokens.ts";
import "./index.css";

const tokenStyle = document.createElement("style");
tokenStyle.textContent = TOKENS_CSS;
document.head.prepend(tokenStyle);

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
