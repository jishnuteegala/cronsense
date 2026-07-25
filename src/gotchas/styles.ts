import { TOKENS_CSS } from "../tokens";

export const GOTCHA_CSS = `${TOKENS_CSS}* {
  box-sizing: border-box;
}
body {
  margin: 0;
  color: var(--fg);
  background: var(--bg);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
main {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) 4rem;
}
h1 {
  font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 var(--space-4);
}
h2 {
  font-size: 1.15rem;
  letter-spacing: -0.005em;
  margin-top: var(--space-6);
  margin-bottom: var(--space-2);
}
p {
  margin: var(--space-3) 0;
}
a {
  color: var(--accent);
  text-underline-offset: 2px;
}
a:hover {
  text-decoration-thickness: 2px;
}
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--surface);
  padding: 0.12em 0.36em;
  border-radius: var(--radius-sm);
}
blockquote {
  margin: var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  background: var(--quote-bg);
  border-left: 4px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
blockquote p {
  margin: 0;
}
blockquote code {
  background: transparent;
  padding: 0;
}
.crumb {
  color: var(--muted);
  font-size: 0.9rem;
  margin-top: 0;
}
.stamp,
.back {
  color: var(--muted);
  font-size: 0.9rem;
}
.back {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--rule);
}
.gate {
  padding: var(--space-4);
  background: var(--warn-bg);
  color: var(--warn-fg);
  border: 1px solid var(--warn-border);
  border-radius: var(--radius);
}
.gate strong {
  color: var(--warn-fg);
}
ul {
  padding-left: 1.25rem;
}
li {
  margin: var(--space-1) 0;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 10;
  background: var(--accent);
  color: var(--accent-contrast);
  padding: var(--space-2) var(--space-4);
  border-radius: 0 0 var(--radius-sm) 0;
}
.skip-link:focus {
  left: 0;
}
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;
