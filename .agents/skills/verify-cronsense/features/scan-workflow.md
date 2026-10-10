# Scan a workflow file

The user pastes a GitHub Actions workflow YAML document; the tool extracts every `on.schedule` cron entry and renders one card per schedule, flags duplicate schedules, and reports parse problems.

## Sub-features

- `scan-cards` renders one card per `cron:` entry, each with its parsed expression and translation.
- `scan-dup` marks the second and later occurrences of a repeated schedule (the first stays unmarked).
- `scan-none` reports a workflow with no `schedule:` triggers.
- `scan-error` reports malformed YAML or an invalid cron inside the file.

## How to get to it (user POV)

- Open `/`, paste a workflow file into the `Cron expression` field (the label hint `or a workflow file` names this entry point).
- Open `/` + `#<urlencoded yaml>` as a manually-constructed link to the same state (the app never writes YAML to the hash itself).

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.
- A workflow document, e.g. `on%3A%0A%20%20schedule%3A%0A%20%20%20%20-%20cron%3A%20%270%209%20*%20*%201-5%27%0A%20%20%20%20-%20cron%3A%20%2730%2018%20*%20*%20*%27` decodes to a two-schedule `on.schedule` block.

- **Two schedules.** Load `/#<encoded two-schedule yaml>` and screenshot with `--wait-for-timeout 800`.
  Two schedule cards render, each showing the cron expression and its translation (cards have no firing table - clicking one loads that cron's full analysis into the results area).
- **Duplicate detection.** Load a hash encoding a workflow whose `schedule:` list repeats the same `cron:` twice.
  A duplicate indicator appears on the second and later occurrences; the first stays unmarked.
- **No schedule.** Load `/#on%3A%0A%20%20push%3A` (decodes to `on:\n  push:`).
  A block states the workflow has no `on.schedule` triggers - it renders with error styling (`role="alert"`), but it is the `none` state, not a YAML failure.
- **Malformed YAML.** Load `/#on%3A%0A%20%20schedule%3A%20%5B` (decodes to `on:\n  schedule: [`).
  A scan error block renders.
- **Proof.** Screenshot the populated multi-card state to `artifact/verify/<run>/workflow.png`.

## Gotchas

- YAML in the hash must be fully percent-encoded, including newlines (`%0A`) - an unencoded `#` inside a value would truncate the hash at parse time.
- A workflow document and a cron expression share the same field; detection is automatic.
  Do not treat an `on:`-leading document rendering schedule cards as an expression parse.
