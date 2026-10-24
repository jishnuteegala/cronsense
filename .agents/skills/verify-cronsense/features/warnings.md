# Warning cards

Expressions that hit documented GitHub Actions caveats render warning cards: an exact quote from the docs, a dated verification stamp, and a source link (GitHub docs or the cronsense-verification repo).
Provisional syntax notes live as `<li>` items inside a collapsed `N notes` disclosure under the results, mixed with the always-present timezone note; each is labeled `provisional` in text.

## Sub-features

- `warn-card` shows the docs quote, verified-on date, and source link.
- `warn-provisional` shows a `provisional`-labeled note inside the collapsed notes disclosure (muted styling, not a card) for syntax the verification record could not confirm (e.g. a name token in a range or step).
- `warn-note` shows the contextual 60-day inactivity note below the input as a flat margin note; it is the only element carrying a `details` link (to `/gotchas/inactivity-pause/`).
- `warn-none` is unreachable for valid expressions - `high-load-delay-drop` has an `always` predicate, so every valid expression shows at least one card; card-free states are empty, invalid, or workflow-scan input.

## How to get to it (user POV)

- Enter a triggering expression on `/` or load its permalink; warnings render between the input and the results.

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.

- **High-load warning.** Load `/#*/5%20*%20*%20*%20*` (every five minutes) and screenshot.
  A warning card quotes the `schedule` delay/drop docs and shows `verified against GitHub docs on 2026-07-24` with the docs link.
- **Sub-minute warning.** Load `/#*%20*%20*%20*%20*` (every minute).
  The sub-minimum-interval card appears.
- **Provisional note.** Load `/#*/15%209-17%20*%20*%20MON-FRI` and open the `N notes` disclosure (`details.notes summary`) first - it renders collapsed.
  A `provisional`-labeled `<li>` states the name-token range interpretation is unconfirmed.
- **Contextual note.** On any non-empty input, the 60-day inactivity note sits under the input with quote, `verified 2026-07-24`, and a `details` link to `/gotchas/inactivity-pause/`.
- **Details link.** `curl -sf http://localhost:<PORT>/gotchas/inactivity-pause/` returns 200.
  Confirm the rendered link resolves, not just that it renders.
- **Proof.** Screenshot a warning state to `artifact/verify/<run>/warnings.png`.

## Gotchas

- Docs-verified cards stamp `verified against GitHub docs on 2026-07-24`; the `dom-dow-or-semantics` card stamps `empirically confirmed via cronsense-verification on 2026-07-27`.
  Provisional text must contain the word `provisional` - do not accept a warning that mixes the two registers.
- Warning cards have no `details` link; only the contextual note does.
  Screenshotting only proves the link renders, `curl` proves it resolves.
- `details` link means an `<a>` named `details` - warning cards and the notes block also contain `<details>` disclosure elements, so assert by link role/name, never by the tag.
