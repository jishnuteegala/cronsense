export const GOTCHA_CSS = `:root {
  color-scheme: light dark;
  --fg: #1a1a1a;
  --muted: #454545;
  --bg: #ffffff;
  --accent: #0b5cad;
  --rule: #cccccc;
  --quote-bg: #f4f6f8;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fg: #f2f2f2;
    --muted: #c8c8c8;
    --bg: #121212;
    --accent: #7cb7ff;
    --rule: #444444;
    --quote-bg: #1e1e1e;
  }
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  color: var(--fg);
  background: var(--bg);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
h1 {
  font-size: 1.8rem;
  line-height: 1.2;
}
h2 {
  font-size: 1.1rem;
  margin-top: 2rem;
}
a {
  color: var(--accent);
}
code {
  font-family: ui-monospace, monospace;
  background: var(--quote-bg);
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
blockquote {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--quote-bg);
  border-left: 4px solid var(--accent);
}
blockquote code {
  background: transparent;
  padding: 0;
}
.crumb,
.stamp,
.back {
  color: var(--muted);
  font-size: 0.9rem;
}
.gate {
  padding: 0.75rem 1rem;
  border: 1px solid var(--accent);
  border-radius: 4px;
}
ul {
  padding-left: 1.25rem;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--bg);
  padding: 0.5rem 1rem;
}
.skip-link:focus {
  left: 0;
}
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
`;
