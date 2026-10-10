---
name: verify-cronsense
description: Verify cronsense's web UI and static routes end to end - launch the built site, drive features via URL-hash input states and Playwright screenshots, capture evidence. Use before claiming a UI, route, or copy change works.
---

# Verify cronsense

Cronsense is a static SPA (React + Vite) plus emitted static routes (`/gotchas/`, `/gotchas/<slug>/`, `/gotchas/<slug>.md`, `/design-system/`, `/llms.txt`).
There is no backend, no auth, no persisted state (the app does seed `*/15 9-17 * * MON-FRI` as the default expression).
All user input is a single textarea; an expression's value is mirrored into the URL hash (`#<urlencoded expression>`), so every expression state is reachable by URL alone.
Workflow YAML input is never written to the hash (scan results are not shareable by URL), but a manually-encoded YAML hash still loads.

The feature map lives in `features/` - read it before driving.

## Launch

```bash
pnpm install          # once, if node_modules is stale
pnpm run build        # dist/ must exist; preview serves dist
pnpm exec vite preview --port <PORT> --strictPort
```

Ready signal: the `Local: http://localhost:<PORT>/` line appears in the log and `curl -sf http://localhost:<PORT>/` returns 200.
Use `localhost`, not `127.0.0.1` - on Windows the listener binds `localhost` and IPv4 loopback may refuse.

Pick an unused port (default 4173 is often taken by other work).
Run the command backgrounded and record the shell/PID it runs under - cleanup kills by PID, never by name.
The site is stateless, so two instances on different ports are safe.

For dev-server behavior (middleware routes, hot reload) use `pnpm run dev` instead; it serves the same routes.

## Doctor

Run `doctor.sh` from the skill directory:

```bash
bash .agents/skills/verify-cronsense/doctor.sh <PORT>
```

It curls every route in its `routes[]` list (`/`, the gotcha index and pages, `gotcha.css`, `.md` variants, `/llms.txt`, `/design-system/`) and prints `status path`; all must be 200, and `/` must serve HTML containing `<title>Cronsense</title>`.
It does not cover binary assets (icons, manifest, service worker); it exits non-zero at the end if any route failed.
A 404 on `/gotchas/` or a `.md` route means `dist` is stale - rebuild before driving.

## Drive

Harness: Playwright CLI via `pnpm dlx playwright@1.64.0 <cmd>` (pinned version, not a repo dependency; the cached Chromium shell is used when present, otherwise run `pnpm dlx playwright@1.64.0 install chromium` once) plus `curl` for route/MIME checks.

State is driven by URL, not by typing:

- `#<urlencoded textarea value>` loads any expression or workflow YAML (e.g. `#*/15%209-17%20*%20*%20MON-FRI`, or a percent-encoded `on: schedule:` document).
- `#<value>#<warning-slug>` deep-links to a warning card.

```bash
pnpm dlx playwright@1.64.0 screenshot \
  --viewport-size 1440,900 \
  --wait-for-timeout 800 \
  "http://localhost:<PORT>/#*/15%209-17%20*%20*%20MON-FRI" \
  artifact/verify/<run>/app.png
```

Useful flags: `--color-scheme dark`, `--viewport-size 390,844` (mobile), `--full-page`, `--wait-for-selector <css>`.
The next-firing relative time animates for 0.4s on value change - always pass `--wait-for-timeout 800` or the text captures mid-fade.

For interactions a URL cannot express (typing, focus order, skip link), write a one-off spec into the run's evidence dir and run `pnpm dlx -p @playwright/test@1.64.0 playwright test <spec> --browser chromium`.

## Evidence

Proof lives under `artifact/verify/<run>/` (`artifact/` is gitignored; pick a run dir like the date or ticket slug).
A proof captures the action and the resulting state:

- the command run (URL, flags) and the screenshot/DOM it produced
- `curl -sI` output for any route claim (status + `content-type`; `.md` routes are `text/markdown`, HTML routes `text/html`)
- for the SPA, the populated result (summary, next firing, table), not just the input field
- exit codes for any script-level check

## Cleanup

Kill only the preview process this run started, by PID (PowerShell `Stop-Process -Id <pid>` or the harness's shell teardown).
Never `taskkill`, `pkill`, or name-match a process.
Evidence in `artifact/verify/` is never deleted by cleanup.

## Helpers

- `doctor.sh <PORT>` - route smoke for the known content routes; described under Doctor above.
