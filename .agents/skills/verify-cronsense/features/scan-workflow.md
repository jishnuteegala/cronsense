# Scan a workflow file

The user pastes a GitHub Actions workflow YAML document; the tool extracts every `on.schedule` cron entry and renders one card per schedule, flags duplicate schedules, and reports parse problems.

## Sub-features

- `scan-cards` renders one card per `schedule:` entry under a `N parsed, N unparseable` summary line, each card with its parsed expression and translation; an entry that fails to parse still renders a card with the raw value and the reason. The list ends with `Extracts on.schedule crons; does not lint workflows.` Clicking a card's cron button loads that cron's full analysis into `#results` and writes its cron permalink to the hash.
- `scan-dup` marks the second and later occurrences of a repeated schedule with the literal text `duplicate of #N`, where N is the first occurrence's 1-based position counting unparseable entries too; matching is exact raw-string equality and unparseable entries are never flagged.
- `scan-none` reports a workflow with no `schedule:` triggers (also fires for a YAML map with no `on` key at all - the message still names `on.schedule`).
- `scan-notlist` reports `on.schedule` present but not a list (`on.schedule is present but not a list; expected a list of cron entries`); `schedule: null` or a scalar hits the same state.
- `scan-error` reports malformed YAML (`Unable to parse workflow YAML: <msg>`); an invalid `cron:` value inside an otherwise valid file is an unparseable card, not this block. All three alert states share `role="alert"` styling and `id="cron-expression-error"`.

## How to get to it (user POV)

- Open `/`, paste a workflow file into the `Cron expression` field (the `or workflow YAML` hint next to the label names this entry point).
- Open `/` + `#<urlencoded yaml>` as a manually-constructed link to the same state (the app does not mirror newline-containing input that scans as workflow content - schedule cards, the none/not-list alerts, or a YAML error; multi-line input that still classifies as a cron expression, e.g. a plain scalar document, is mirrored, and single-line input always is).

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.
- A workflow document, e.g. `on%3A%0A%20%20schedule%3A%0A%20%20%20%20-%20cron%3A%20%270%209%20*%20*%201-5%27%0A%20%20%20%20-%20cron%3A%20%2730%2018%20*%20*%20*%27` decodes to a two-schedule `on.schedule` block.

- **Two schedules.** Load `/#<encoded two-schedule yaml>` and screenshot with `--wait-for-timeout 800`.
  Two schedule cards render, each showing the cron expression and its translation (cards have no firing table - clicking one loads that cron's full analysis into the results area).
- **Duplicate detection.** Load `/#on%3A%0A%20%20schedule%3A%0A%20%20%20%20-%20cron%3A%20%270%209%20*%20*%201-5%27%0A%20%20%20%20-%20cron%3A%20%270%209%20*%20*%201-5%27` (the same two-schedule workflow with `0 9 * * 1-5` repeated).
  A duplicate indicator appears on the second and later occurrences; the first stays unmarked.
- **No schedule.** Load `/#on%3A%0A%20%20push%3A` (decodes to `on:\n  push:`).
  A block states the workflow has no `on.schedule` triggers - it renders with error styling (`role="alert"`), but it is the `none` state, not a YAML failure.
- **Non-list schedule.** Load `/#on%3A%0A%20%20schedule%3A%0A%20%20%20%20cron%3A%20%270%2012%20*%20*%20*%27` (decodes to `on:\n  schedule:\n    cron: '0 12 * * *'`).
  A block states `on.schedule is present but not a list; expected a list of cron entries`.
- **Malformed YAML.** Load `/#on%3A%0A%20%20schedule%3A%20%5B` (decodes to `on:\n  schedule: [`).
  A scan error block renders (`Unable to parse workflow YAML: <parser message>`).
- **Proof.** Screenshot the populated multi-card state to `artifact/verify/<run>/workflow.png`.

## Gotchas

- YAML in the hash must be fully percent-encoded, including newlines (`%0A`) - an unencoded `#` inside a value would truncate the hash at parse time.
- A workflow document and a cron expression share the same field; detection is automatic for multi-line input.
  Do not treat an `on:`-leading document rendering schedule cards as an expression parse.
- Detection requires a newline in the input: single-line flow-style YAML (`on: {schedule: [...]}`) never reaches the scanner and errors as a cron expression instead.
- Only the first YAML document is scanned - `---`-separated later documents are ignored.
- Unparseable entries keep their raw value (non-string raws render JSON-stringified, e.g. `{"name":"missing cron"}`) plus a fixed reason; the four reasons are `Schedule entry has no cron key.`, `Cron value must be a literal string.`, a `Can't evaluate ` + `${{ }}` + ` expressions.` concatenation (literal spacing), and `Invalid GitHub Actions cron expression.`
