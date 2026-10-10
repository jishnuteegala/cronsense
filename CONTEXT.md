# CONTEXT

Domain glossary for cronsense.
Architecture reviews and design discussions use these names; modules and UI copy should say these words rather than inventing synonyms.

## Terms

- **Expression** - the five-field cron string the user types or a workflow carries (`minute hour day-of-month month day-of-week`).
  GitHub Actions takes five fields only.
- **Field** - one of the five positions of an expression.
  Each field parses to a list of **terms**.
- **Term** - a single list member inside a field: a `wildcard` (`*` or `*/N`), `value`, or `range`; wildcard and range terms may carry a `/N` step.
- **Wildcard-origin** - a field whose terms include a `*` wildcard, whether bare or as a `*/N` step.
  Wildcard-origin fields retain wildcard status in cron semantics, which changes how the two day fields combine.
- **AST** - the parsed `CronAst`: five `FieldAst` nodes.
  It travels inside the parse result alongside the `provisionalNotes` collected while parsing.
- **Provisional note** - a parse-time caveat for constructs GitHub may reject but has not confirmed rejecting (e.g. name tokens in ranges).
  Travels with the parse result, rendered as subnotes.
- **Expansion** (`ExpandedCron`) - the derived form of an AST: each field expanded to its `Set<number>` of matching values plus the `dayCombination`.
- **Day combination** - how day-of-month and day-of-week combine: `union` (both restricted, no wildcard-origin; a day matching either fires), `intersection` (both restricted, at least one wildcard-origin; a day must match both), `single` (only one restricted), `unrestricted` (neither restricted).
- **Analysis** - the verdict for one valid expression: translation, provisional notes, never-fire reason, next firings, and active warnings, produced by `cron/analyze`.
  The expansion is derived once per analysis and shared by the firing and warning predicates.
- **Firing** - an instant the expression runs, always computed in UTC.
- **Warning** - a gotcha attached to an expression when its predicate matches; carries quotes, provenance (`empirical` vs `docs`), and a verified-on date.
  Defined in `cron/warnings`, evaluated in `cron/warning-engine`.
- **Gotcha page** - a static per-warning page under `/gotchas/<slug>/` (HTML plus a Markdown variant) generated from `WARNINGS` at build time.
- **Workflow scan** - the pasted-workflow mode: extracts `on.schedule` entries, parses each as an expression, and lists them as cards.
