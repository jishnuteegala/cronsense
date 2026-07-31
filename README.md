# cronsense

The cron checker that tells you when your GitHub Actions workflow will _actually_ fire.

## Why didn't my scheduled workflow run?

If you searched "why didn't my scheduled workflow run", "GitHub Actions cron not running", or "schedule workflow delayed", this tool is for you. GitHub Actions scheduled workflows have behaviours no generic cron checker knows about:

- "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour."
- "If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour."
- "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days."
- "The shortest interval you can run scheduled workflows is once every 5 minutes."
- "GitHub Actions does not support the non-standard syntax `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly`, and `@reboot`."

Paste a cron expression, get a plain-English translation and the next 10 firing times in UTC alongside your browser-local time.

## What it does

- Parses the cron grammar GitHub Actions documents: five fields (minute, hour, day-of-month, month or JAN-DEC, day-of-week or SUN-SAT) with `*`, `,`, `-`, `/`.
- Rejects syntax confirmed by the verification probes: `@`-shortcuts, a seconds field, and `L`/`W`/`#` tokens.
- Computes the next 10 firings in UTC; browser-local times are display-only, with a static DST note.
- Flags GitHub-specific scheduling caveats. GitHub does not document combined day-of-month/day-of-week semantics, but the verification repository observed OR behaviour on 2026-07-27, consistent with the POSIX specification linked by the docs.

## Gotcha pages

Every caveat has a pre-rendered, static, JavaScript-free page at a stable URL, one per warning. These are the citable pages an agent or crawler can fetch to get a complete, sourced explanation:

- `/gotchas/dom-dow-or-semantics` - day-of-month and day-of-week combine with OR (empirically confirmed)
- `/gotchas/uneven-step-reset` - uneven `*/N` steps reset at the field boundary
- `/gotchas/never-fires` - this expression will never fire
- `/gotchas/sub-minimum-interval` - firing more often than every 5 minutes
- `/gotchas/high-load-delay-drop` - scheduled runs can be delayed or dropped under high load
- `/gotchas/inactivity-pause` - in a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days

Each page carries the exact sourced quote, a dated verification stamp, the primary-source link, and the github/docs file paths. The `~15 minutes` delay figure is community lore and appears nowhere here.

## Agent usage

Everything runs client-side from a static bundle; no accounts, no analytics, no third-party requests. An `llms.txt` at the repository root and served at `/llms.txt` describes the tool, the six gotcha pages, and the URL scheme. The cron engine lives in `src/cron/` (`parse.ts`, `firings.ts`, `translate.ts`) with the parser's typed AST as the single source of truth; the caveats live as typed data in `src/cron/warnings.ts`, which is the single source for both the warning engine and the gotcha pages.

## Development

```
pnpm install
pnpm run check
```

## Self-hosting

Deploy from a tagged release, not an arbitrary commit. Every GitHub Release carries a prebuilt static dist archive (`cronsense-<version>.zip` and `.tar.gz`) plus a `SHA256SUMS` file.

### 1. Download and verify

```sh
VERSION=0.1.0
curl -fLO "https://github.com/jishnuteegala/cronsense/releases/download/v$VERSION/cronsense-$VERSION.tar.gz"
curl -fLO "https://github.com/jishnuteegala/cronsense/releases/download/v$VERSION/SHA256SUMS"
sha256sum --check --ignore-missing SHA256SUMS
mkdir -p dist && tar -xzf "cronsense-$VERSION.tar.gz" -C dist
```

The app is a static site with real static routes (`/design-system/`, `/gotchas/`, and `/llms.txt`), so any static file server works without rewrite rules.

### 2. Pick a host

**Cloudflare Pages**

```sh
pnpm dlx wrangler pages deploy dist --project-name cronsense
```

Or use git integration with build command `pnpm build` and output directory `dist`. The bundled `_headers` file sets the security headers automatically.

**Vercel**

```sh
pnpm dlx vercel deploy dist --prod
```

**GitHub Pages**

```sh
git checkout --orphan gh-pages && git rm -rf . && cp -r dist/. . && rm -rf dist
git add -A && git commit -m "deploy" && git push -f origin gh-pages
```

Then enable Pages for the `gh-pages` branch in the repository settings.

**VPS with nginx**

```nginx
server {
    listen 80;
    server_name cronsense.example.com;
    root /var/www/cronsense;
    index index.html;
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Copy the extracted `dist/` to `/var/www/cronsense` and reload nginx.

**VPS with Caddy**

```caddy
cronsense.example.com {
    root * /var/www/cronsense
    file_server
}
```

**Docker**

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

```sh
docker build -t cronsense . && docker run -p 8080:80 cronsense
```

Or with compose:

```yaml
services:
  cronsense:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    ports:
      - "8080:80"
```

## Releases

Releases are managed by [release-please](https://github.com/googleapis/release-please): merging the release PR tags the version, and the release stays a draft until the dist archives are built, checksummed, and uploaded.

## License

MIT - see [LICENSE](LICENSE)
