# Permalinks

The input is mirrored into the URL hash, so every check is shareable as a link; a second hash segment deep-links to a specific warning card.

## Sub-features

- `link-expr` loading `/#<encoded expression>` populates the field and results.
- `link-warn` loading `/#<encoded expression>#<slug>` focuses the matching warning card.
- `link-legacy` the legacy `e=` prefix (`#e=<encoded>`) still loads, including the compound form `#e=<encoded>#<slug>`.
- `link-write` typing an expression updates the hash without a reload in the `encodeURIComponent` form (`#0%200%20*%20*%20*` - `/` is written as `%2F`); input that scans as workflow content is never mirrored (see `scan-workflow.md`).

## How to get to it (user POV)

- Copy the URL after typing an expression; share it. The UI only ever writes the single-segment `#<expr>` form - a two-segment warning-anchor link is always constructed by hand.
- Follow a `details`-adjacent warning anchor from a shared link.

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.

- **Load expression.** Open `/#*/2%20*%20*%20*%20*`.
  The field contains `*/2 * * * *` and results render.
- **Warning anchor.** Open `/#*%20*%20*%20*%20*#sub-minimum-interval`.
  The sub-minimum-interval card is rendered and receives focus/scroll.
- **Legacy hash.** Open `/#e=*/2%20*%20*%20*%20*`.
  Same populated state as the modern form.
- **Round-trip.** In an `@playwright/test` spec, fill the `Cron expression` textbox with `0 0 * * *` and assert `location.hash` becomes `#0%200%20*%20*%20*`.
- **Non-tool pages.** Hash handling is disabled off `/` - load `/gotchas/#anything`; the static page renders normally.
- **Proof.** Screenshot the deep-linked state to `artifact/verify/<run>/permalink.png`.

## Gotchas

- The second `#` segment is looked up with `document.getElementById` unvalidated - a warning slug from `WARNINGS` (e.g. `sub-minimum-interval`, `high-load-delay-drop`) focuses its card, but a slug colliding with a page element id (`main-content`, `cron-expression`, `results`) focuses or scrolls that element instead. Only a slug matching no element is a no-op.
  `inactivity-pause` is a valid slug that also focuses nothing: it renders as the contextual `<aside>` note, which has no `id` to target.
- A hash that fails `decodeURIComponent` (e.g. `#%zz`) is silently ignored on load - the default expression renders. A live `hashchange` to a bare `#` clears the field instead.
- Hash behavior is gated to `/` and `/index.html`; do not expect it on `/gotchas/` or `/design-system/`.
