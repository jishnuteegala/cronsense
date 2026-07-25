export const TOKENS_CSS = `:root {
  color-scheme: light dark;
  --fg: #1a1a1a;
  --muted: #5a5f66;
  --bg: #ffffff;
  --surface: #f4f6f8;
  --surface-2: #eceff2;
  --accent: #0b5cad;
  --accent-contrast: #ffffff;
  --rule: #d5dae0;
  --quote-bg: #f4f6f8;
  --warn-fg: #7a4a00;
  --warn-border: #b8791f;
  --warn-bg: #fdf6ec;
  --danger-fg: #a3001a;
  --danger-border: #cf3040;
  --danger-bg: #fdeff0;
  --radius: 8px;
  --radius-sm: 5px;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
  --shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.05);
}
@media (prefers-color-scheme: dark) {
  :root {
    --fg: #f2f2f2;
    --muted: #a2a9b3;
    --bg: #121212;
    --surface: #1c1f24;
    --surface-2: #24282e;
    --accent: #7cb7ff;
    --accent-contrast: #0a0f16;
    --rule: #3a3f47;
    --quote-bg: #1e1e1e;
    --warn-fg: #f0c27a;
    --warn-border: #b8862f;
    --warn-bg: #2a2213;
    --danger-fg: #ff9aa5;
    --danger-border: #cf3040;
    --danger-bg: #2a1618;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
`;
