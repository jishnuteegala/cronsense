# Warning cards

Expressions that hit documented GitHub Actions caveats render warning cards: one or more exact quotes from the docs inside a collapsed `docs quote` disclosure, a dated verification stamp inside the same disclosure, and an always-visible `.warning-meta` line (`verified <date> · GitHub docs`).
Provisional syntax notes live as `<li>` items inside a collapsed `N notes` disclosure (`1 note` when singular) under the results, mixed with the timezone note (present only when the expression analyzes) and a DST note (the only note whenever no analysis renders - invalid input and every workflow-scan state each leave `1 note` holding the DST note alone; empty input renders no disclosure at all); each provisional note is labeled `provisional` in text.

## Sub-features

- `warn-card` shows the docs quote, verified-on date, and `GitHub docs` link; the empirical card (`dom-dow-or-semantics`) additionally links `cronsense-verification` inside its `docs quote`. Diagnostic-rank cards carry `role="alert"`; informational ones (`high-load-delay-drop`) carry no role. `high-load-delay-drop` gets `.warning.emphasised` (amber left border) whenever the minute set includes 0. A card's `id` equals its warning slug and is the permalink deep-link target.
- `warn-provisional` shows a `provisional`-labeled note inside the collapsed notes disclosure (muted styling, not a card) for syntax the verification record could not confirm (e.g. a name token in a range or step).
- `warn-note` shows the contextual 60-day inactivity note below the input as a flat margin note; it is the only element carrying a `details` link (to `/gotchas/inactivity-pause/`).
- `warn-none` is unreachable for valid expressions - `high-load-delay-drop` has an `always` predicate, so every valid expression shows at least one card; card-free states are empty, invalid, or workflow-scan input.

## How to get to it (user POV)

- Enter a triggering expression on `/` or load its permalink; warning cards render inside `#results` after the firing table (directly after the translation in the `never-fires` state, which renders no table - the element between input and results is the contextual note, not the cards).

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.

- **High-load warning.** Load `/#*/5%20*%20*%20*%20*` (every five minutes) and screenshot.
  The card carries `.warning.emphasised` (minute set includes 0) and no `role`; the visible stamp is the card's `.warning-meta` line `verified 2026-07-24 · GitHub docs`; the quoted docs and the fuller `verified against GitHub docs on 2026-07-24` text sit inside the collapsed `details.warning-quote` disclosure - open its `docs quote` summary before asserting them.
- **Sub-minute warning.** Load `/#*%20*%20*%20*%20*` (every minute).
  The sub-minimum-interval card appears with `role="alert"` (diagnostic rank).
- **Empirical card.** Load `/#0%200%201%20*%20MON`.
  The `dom-dow-or-semantics` card's `docs quote` holds `empirically confirmed via cronsense-verification on 2026-07-27` while `.warning-meta` still reads `verified 2026-07-27 · GitHub docs`.
- **Computed card.** Load `/#0-20/10%20*%20*%20*%20*`.
  The `uneven-step-reset` card renders a computed body: `The minute schedule selects 0, 10, 20; its consecutive gaps are 10, 10, 40 minute values.` The `never-fires` body is computed the same way (`this expression will never fire: <reason>`).
- **Provisional note.** Load `/#*/15%209-17%20*%20*%20MON-FRI` and open the `2 notes` disclosure (`details.notes summary`) first - it renders collapsed.
  A `provisional`-labeled `<li>` states the name-token range interpretation is unconfirmed, alongside the timezone note.
- **Contextual note.** On any non-empty input, the 60-day inactivity note sits under the input with quote, `verified 2026-07-24`, and a `details` link to `/gotchas/inactivity-pause/`.
- **Details link.** `curl -sf http://localhost:<PORT>/gotchas/inactivity-pause/` returns 200.
  Confirm the rendered link resolves, not just that it renders.
- **Proof.** Screenshot a warning state to `artifact/verify/<run>/warnings.png`.

## Gotchas

- Docs-verified cards stamp `verified against GitHub docs on 2026-07-24` inside the collapsed `docs quote` disclosure (the always-visible `.warning-meta` reads `verified 2026-07-24 · GitHub docs`); the `dom-dow-or-semantics` card stamps `empirically confirmed via cronsense-verification on 2026-07-27` in the same hidden spot - open `docs quote` before asserting either stamp.
  Provisional text must contain the word `provisional` - do not accept a warning that mixes the two registers.
- Warning cards have no `details` link; only the contextual note does.
  Screenshotting only proves the link renders, `curl` proves it resolves.
- `details` link means an `<a>` named `details` - warning cards and the notes block also contain `<details>` disclosure elements, so assert by link role/name, never by the tag.
