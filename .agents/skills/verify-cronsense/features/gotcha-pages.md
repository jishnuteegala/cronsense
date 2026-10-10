# Gotcha pages

Six static, JavaScript-free deep-dive pages (one per documented GitHub Actions cron caveat), a `/gotchas/` index, and a `text/markdown` variant per page for agents.

## Sub-features

- `gotcha-index` lists all six caveats at `/gotchas/` with title plus quote snippet where the quote differs from the title.
- `gotcha-page` renders each caveat at `/gotchas/<slug>/` with the docs quote, why it matters, source files, primary source link, and verified-on date.
- `gotcha-md` serves the same content as `text/markdown` at `/gotchas/<slug>.md`.
- `gotcha-nojs` every route renders fully with JavaScript disabled (static HTML).
- `gotcha-furniture` each page carries canonical URL, OG meta, breadcrumb back to `Gotchas`, and the site footer (Privacy, Source).

## How to get to it (user POV)

- Follow the `details` link on the contextual note in the app (leads to `/gotchas/inactivity-pause/`).
- Open `/gotchas/` or a `/gotchas/<slug>/` URL directly.
- Request `/gotchas/<slug>.md` (agent-facing variant).

## Driving it with playwright/curl

Preconditions:

- Preview healthy at `http://localhost:<PORT>`; `artifact/verify/<run>` exists.

- **Index.** `curl -sf http://localhost:<PORT>/gotchas/` contains all six slugs as links; screenshot renders the list.
- **Detail.** `curl -sf http://localhost:<PORT>/gotchas/never-fires/` contains the docs quote and `Verified against GitHub docs`; a canonical `<link>` uses the absolute `https://cronsense.jishnuteegala.com/gotchas/never-fires/` URL.
- **Markdown.** `curl -sI http://localhost:<PORT>/gotchas/never-fires.md` returns `content-type: text/markdown` and the body has `# ` heading plus the source link.
- **No-JS.** Serve HTML statically: `curl` body checks above are the no-JS proof - nothing on these pages requires script.
- **Theme.** Screenshot a detail page with `--color-scheme dark`; contrast holds.
- **Proof.** Screenshots + curl outputs saved under `artifact/verify/<run>/`.

## Gotchas

- Unknown paths return 200 with the SPA fallback (single-page-application handling) - a 200 on a random URL does not prove a gotcha route exists; assert on body content.
- Canonical links are absolute; a relative canonical is a defect, not a variant.
