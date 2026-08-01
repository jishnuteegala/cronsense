import { WARNINGS } from "../cron/warnings";

export function renderLlmsTxt(): string {
  const pages = WARNINGS.map(
    (warning) =>
      `- [/gotchas/${warning.gotcha.slug}](/gotchas/${warning.gotcha.slug}): ${warning.gotcha.title.replaceAll("`", "")}`,
  ).join("\n");

  return `# Cronsense

> The cron checker that tells you when your GitHub Actions workflow will actually fire.

Cronsense parses a GitHub Actions cron expression and reports the plain-English
translation, the next 10 firing times in UTC alongside browser-local time, and the
GitHub-Actions-specific caveats a generic cron tool misses. Every caveat is quoted
from GitHub's documentation, dated, and linked to its primary source. The tool runs
fully client-side: no accounts, no analytics, no third-party requests.

## URL scheme

- \`/\`: the interactive tool. Expression permalinks use the URL hash: \`/#<encoded-expression>\`.
- \`/gotchas/<slug>\`: pre-rendered, static, JavaScript-free explanation pages, one per caveat. These are the stable citable URLs for agents and crawlers.
- \`/llms.txt\`: this file.

## Gotcha pages

${pages}

## Notes

- GitHub documents no delay bound. The "~15 minutes" figure is community lore and appears nowhere in Cronsense.
- Day-of-month/day-of-week combined-field semantics are undocumented by GitHub; OR behaviour was empirically confirmed on 2026-07-27 in the Cronsense verification repository, consistent with the linked POSIX specification.
`;
}
