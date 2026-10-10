# Check a cron expression

The user pastes or links a five-field cron expression and gets a plain-English translation, the next firing time, and a table of the next ten firings in UTC and local time.

## Sub-features

- `expr-translate` renders the expression as a sentence in the summary block.
- `expr-next` shows the next UTC firing plus a relative time ("in N minutes").
- `expr-table` lists ten firings with UTC and local columns; the soonest row is marked.
- `expr-never` shows the never-fires state for unsatisfiable expressions like `0 0 30 2 *` (February 30).
- `expr-error` shows an error block for invalid syntax such as `60 * * * *` or `@hourly`.
- `expr-empty` is unreachable on fresh load (the app seeds a default expression); an in-page navigation to an empty `#` does clear the input, so verify via a spec or the unit test.

## How to get to it (user POV)

- Open `/` and type or paste an expression into the `Cron expression` field.
- Open a permalink `/` + `#<urlencoded expression>`.

## Driving it with playwright/curl

Preconditions:

- Preview is healthy per `doctor.sh` at `http://localhost:<PORT>`.
- Run dir exists: `mkdir -p artifact/verify/<run>`.

- **Translate + next firing.** Load `http://localhost:<PORT>/#*/15%209-17%20*%20*%20MON-FRI` and screenshot with `--wait-for-timeout 800`.
  The summary reads as a sentence starting `At every 15 minutes`, a `Next firing` UTC time appears, and a ten-row table renders.
- **Never-fires.** Load `/#0%200%2030%202%20*`.
  The summary still renders the translation, but a `never-fires` warning card states the reason (day-of-month 30 never occurs in month 2) and no firing rows render.
- **Parse error.** Load `/#%40hourly`.
  An error block states the rejection (`@hourly` carries the empirical stamp `confirmed empirically on 2026-07-24`).
- **Invalid field.** Load `/#60%20*%20*%20*%20*`.
  An error block explains minute 60 is out of range.
- **Dark theme.** Repeat the first load with `--color-scheme dark`.
  All content remains readable.
- **Mobile.** Repeat the first load at `--viewport-size 390,844 --full-page`.
  No horizontal overflow; the table wraps cleanly.

## Gotchas

- The app seeds `*/15 9-17 * * MON-FRI` when the hash is empty, so bare `/` is already a populated state - do not screenshot `/` as proof of an empty state.
- The relative time (`in N minutes`) re-renders on a live minute tick; assert its presence, not its exact text.
- Every `@`-shortcut (`@hourly`, `@daily`, ...) is rejected - GitHub Actions does not document them.
  `@hourly` alone carries the empirical confirmation stamp; the rest are static rejections.
