# Cronsense verification map

This directory is the maintained source for verifying the user-facing behavior of Cronsense.
Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Build is fresh: `pnpm run build` has run since the last source edit.
- Instance was started by this run: `pnpm exec vite preview --port <PORT> --strictPort` (see `../SKILL.md` Launch).
- `bash .agents/skills/verify-cronsense/doctor.sh <PORT>` exits 0.
- Use `http://localhost:<PORT>` - not `127.0.0.1`.
- Evidence goes to `artifact/verify/<run>/`; never inside `dist/` or `src/`.

## Driving conventions

- Input state is set through the URL hash `#<urlencoded textarea value>`; a hash URL is the same state a user gets by typing.
  The app only mirrors expressions into the hash - pasted workflow YAML never updates it.
- Percent-encode `#`, spaces, and newlines in hash values; `*` and `/` may stay literal (the examples keep them literal).
- Pass `--wait-for-timeout 800` to every screenshot so the next-firing fade finishes.
- Assert rendered text with `--wait-for-selector` or by inspecting the screenshot, not by trusting HTTP 200 - `/` and every unknown path return 200 via SPA fallback.
- Static routes (`/gotchas/*`, `/design-system/`, `/llms.txt`) render without JavaScript; verify them with `curl` body checks, not only screenshots.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof: a screenshot naming the URL and flags used.
- Route proof: `curl -sI` output with status and `content-type`.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior.
It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with playwright/curl` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map.
Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Check a cron expression](./check-expression.md) covers translation, next firing, the firing table, the never-fires state, and parse errors.
- [Scan a workflow file](./scan-workflow.md) covers pasted GitHub Actions YAML, schedule cards, duplicate detection, and scan errors.
- [Warning cards](./warnings.md) covers gotcha warnings, provisional notes, quote provenance, and details links.
- [Permalinks](./permalinks.md) covers hash loading and warning-anchor deep links.
- [Gotcha pages](./gotcha-pages.md) covers the static index, detail pages, and Markdown variants.
