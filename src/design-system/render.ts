import { TOKENS_CSS } from "../tokens";

const CSS = `
body { margin: 0; color: var(--fg); background: var(--bg); font-family: var(--font-sans); line-height: 1.6; }
.page { max-width: 680px; margin: 0 auto; padding: var(--space-7) var(--space-4); }
h1, h2, h3 { color: var(--fg-strong); line-height: 1.2; }
h1 { margin-top: 0; font-size: 2rem; letter-spacing: -0.035em; }
h2 { margin-top: var(--space-7); font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; }
code { padding: 0.1em 0.36em; border: 1px solid var(--rule); border-radius: var(--radius-sm); background: var(--surface-2); font-family: var(--font-mono); }
.skip-link { position: absolute; left: -9999px; top: 0; padding: var(--space-2) var(--space-4); background: var(--accent); color: var(--accent-contrast); }
.skip-link:focus-visible { left: 0; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.swatches, .token-list { display: grid; gap: var(--space-2); padding: 0; list-style: none; }
.swatches li { display: flex; align-items: center; gap: var(--space-2); }
.swatch { width: var(--space-5); height: var(--space-5); border: 1px solid var(--rule); border-radius: var(--radius-sm); }
.fg { background: var(--fg); } .muted { background: var(--muted); } .bg { background: var(--bg); } .surface { background: var(--surface); } .surface-2 { background: var(--surface-2); } .accent { background: var(--accent); } .accent-soft { background: var(--accent-soft); } .warning { background: var(--warn-bg); } .danger { background: var(--danger-bg); }
.bar { display: inline-block; height: var(--space-2); margin-left: var(--space-2); background: var(--accent); vertical-align: middle; }
.s1 { width: var(--space-1); } .s2 { width: var(--space-2); } .s3 { width: var(--space-3); } .s4 { width: var(--space-4); } .s5 { width: var(--space-5); } .s6 { width: var(--space-6); } .s7 { width: var(--space-7); }
.primitive { padding: var(--space-4); border: 1px solid var(--rule); border-radius: var(--radius); background: var(--surface); }
.input { width: 100%; box-sizing: border-box; padding: var(--space-3) var(--space-4); border: 1px solid var(--rule-strong); border-radius: var(--radius); color: var(--fg-strong); background: var(--surface-inset); font: 1rem var(--font-mono); }
.notice { padding: var(--space-4); border: 1px solid var(--warn-border); border-radius: var(--radius); color: var(--warn-fg); background: var(--warn-bg); }
.site-footer { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4); margin-top: var(--space-2); padding-top: var(--space-4); padding-bottom: var(--space-6); border-top: 1px solid var(--rule); color: var(--muted); font-size: 0.9rem; }
.site-footer a { color: var(--muted); text-decoration: none; }
.site-footer a:hover { color: var(--fg); text-decoration: underline; }
`;

const swatches = [
  ["fg", "--fg"],
  ["muted", "--muted"],
  ["bg", "--bg"],
  ["surface", "--surface"],
  ["surface-2", "--surface-2"],
  ["accent", "--accent"],
  ["accent-soft", "--accent-soft"],
  ["warning", "--warn-bg"],
  ["danger", "--danger-bg"],
];

const spaces = [1, 2, 3, 4, 5, 6, 7];

export function renderDesignSystem(): string {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cronsense design system</title><style>${TOKENS_CSS}\n${CSS}</style></head><body><a class="skip-link" href="#main-content">Skip to main content</a><main id="main-content" class="page" tabindex="-1"><h1>Cronsense design system</h1><p>The named tokens and reusable primitives behind the GitHub Actions cron checker.</p><h2>Colour tokens</h2><ul class="swatches">${swatches.map(([className, token]) => `<li><span class="swatch ${className}"></span><code>${token}</code></li>`).join("")}</ul><h2>Type tokens</h2><ul class="token-list"><li><code>--font-sans</code> Inter Variable with system fallbacks</li><li><code>--font-mono</code> system monospace stack</li><li>Readable body text with high-contrast foreground, muted, warning, and danger roles.</li></ul><h2>Spacing and shape</h2><ul class="token-list">${spaces.map((space) => `<li><code>--space-${space}</code><span class="bar s${space}"></span></li>`).join("")}<li><code>--radius-sm</code>, <code>--radius</code>, and <code>--radius-lg</code></li><li><code>--shadow-sm</code>, <code>--shadow</code>, and <code>--shadow-lg</code></li></ul><h2>Primitives</h2><h3>Cron input</h3><div class="primitive"><input class="input" value="*/15 9-17 * * MON-FRI" readonly aria-label="Cron expression example"></div><h3>Warning</h3><div class="notice">Scheduled runs can be delayed or dropped during high load.</div></main><footer class="page site-footer"><a href="../">Back to Cronsense</a><a href="https://jishnuteegala.com/privacy">Privacy</a><a href="https://github.com/jishnuteegala/cronsense">Source</a></footer></body></html>`;
}
