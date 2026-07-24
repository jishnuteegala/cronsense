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

- Parses the cron grammar GitHub Actions documents: five fields (minute, hour, day-of-month, month or JAN-DEC, day-of-week or SUN-SAT) with `*`, `,`, `-`, `/`; interpretations the docs leave open are flagged as provisional until verified against the real GHA validator.
- Rejects what GHA rejects: `@`-shortcuts are documented as unsupported; a seconds field and `L`/`W`/`#` tokens are presumed rejected pending confirmation against the real GHA validator.
- Computes the next 10 firings in UTC; browser-local times are display-only, with a static DST note.
- Flags undocumented behaviours as provisional: name tokens in ranges/steps, and combined day-of-month/day-of-week semantics. When both day fields are restricted and neither originates from a wildcard, the POSIX/Vixie OR union applies (a day matching either field fires); a wildcard-origin day field (`*` or `*/N`) retains wildcard status and the day fields intersect, matching Vixie cron source precedent. GHA's actual behaviour is undocumented and awaits empirical verification via the verification repo, at which point this may change.

## Agent usage

Everything runs client-side from a static bundle; no accounts, no analytics, no third-party requests. The cron engine lives in `src/cron/` (`parse.ts`, `firings.ts`, `translate.ts`) with the parser's typed AST as the single source of truth.

## Development

```
pnpm install
pnpm run check
```

## License

MIT - see [LICENSE](LICENSE)
