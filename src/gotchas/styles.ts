import { TOKENS_CSS } from "../tokens";

export const GOTCHA_CSS = `${TOKENS_CSS}* {
  box-sizing: border-box;
}
body {
  margin: 0;
  color: var(--fg);
  background: var(--bg);
  background-image: var(--bg-tint);
  background-attachment: fixed;
  font-family: var(--font-sans);
  font-feature-settings: "cv11", "ss01";
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
main {
  max-width: 680px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-4) 5rem;
}
article {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow);
}
h1 {
  font-size: clamp(1.5rem, 1.2rem + 1.4vw, 1.9rem);
  font-weight: 680;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--fg-strong);
  margin: 0 0 var(--space-5);
}
h2 {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--faint);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
}
p {
  margin: var(--space-3) 0;
}
a {
  color: var(--accent);
  text-underline-offset: 2px;
  text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
  transition: text-decoration-color 0.15s ease;
}
a:hover {
  text-decoration-color: currentColor;
}
code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--surface-2);
  border: 1px solid var(--rule);
  padding: 0.1em 0.36em;
  border-radius: var(--radius-sm);
}
blockquote {
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  color: var(--fg);
}
blockquote p {
  margin: 0;
}
blockquote code {
  background: transparent;
  border: none;
  padding: 0;
}
.crumb {
  color: var(--muted);
  font-size: 0.85rem;
  letter-spacing: 0.01em;
  margin: 0 0 var(--space-4);
}
.stamp,
.back {
  color: var(--faint);
  font-size: 0.88rem;
}
.back {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--rule);
}
.gate {
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: var(--warn-bg);
  color: var(--warn-fg);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--warn-accent);
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
  box-shadow: var(--shadow);
}
.skip-link:focus {
  left: 0;
}
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 3px;
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;
