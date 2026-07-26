import { WARNINGS, type WarningDefinition } from "../cron/warnings";

const SITE_NAME = "Cronsense";
const TAGLINE =
  "The cron checker that tells you when your GitHub Actions workflow will actually fire.";

export interface GotchaPage {
  slug: string;
  path: string;
  html: string;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderInline(text: string): string {
  return escapeHtml(text).replaceAll(
    /`([^`]+)`/g,
    (_match, code: string) => `<code>${code}</code>`,
  );
}

function gateBanner(warning: WarningDefinition): string {
  if (warning.empiricalGate === undefined) return "";
  const repo = escapeHtml(warning.empiricalGate.verificationRepo);
  const ticket = warning.empiricalGate.sourceTicket;
  return `        <p class="gate" role="note"><strong>Status: empirically gated.</strong> This behaviour is undocumented by GitHub and inferred from the linked POSIX specification. It is pending empirical verification and does not appear as a live warning until confirmed. The observation window is in progress, tracked in ticket #${ticket} and the ${repo} repository.</p>\n`;
}

function sourcePaths(warning: WarningDefinition): string {
  const items = warning.sourcePaths
    .map((path) => `          <li><code>${escapeHtml(path)}</code></li>`)
    .join("\n");
  return `        <h2>Source files</h2>\n        <ul>\n${items}\n        </ul>\n`;
}

export function renderGotchaPage(warning: WarningDefinition): string {
  const { gotcha } = warning;
  const title = renderInline(gotcha.title);
  const plainTitle = escapeHtml(gotcha.title.replaceAll("`", ""));
  const description = escapeHtml(gotcha.explanation.replaceAll("`", "").slice(0, 155));
  const url = escapeHtml(warning.sourceUrl);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${plainTitle} \u2014 ${SITE_NAME}</title>
    <meta name="description" content="${description}" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%234f46e5'/%3E%3Cg fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='16' cy='16' r='8.5'/%3E%3Cpath d='M16 11.5V16l3 2'/%3E%3C/g%3E%3C/svg%3E" />
    <link rel="canonical" href="/gotchas/${escapeHtml(gotcha.slug)}" />
    <link rel="stylesheet" href="/gotchas/gotcha.css" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <main id="content" tabindex="-1">
      <article>
        <p class="crumb"><a href="/">${SITE_NAME}</a> / Gotchas</p>
        <h1>${title}</h1>
${gateBanner(warning)}        <h2>What GitHub documents</h2>
        <blockquote><p>${renderInline(gotcha.quote)}</p></blockquote>
        <h2>Why it matters</h2>
        <p>${renderInline(gotcha.explanation)}</p>
${sourcePaths(warning)}        <h2>Source</h2>
        <p>
          Primary source:
          <a href="${url}">${url}</a>
        </p>
        <p class="stamp">Verified against GitHub docs on ${escapeHtml(warning.verifiedOn)}.</p>
        <p class="back"><a href="/">${TAGLINE}</a></p>
      </article>
    </main>
  </body>
</html>
`;
}

export function gotchaPages(): GotchaPage[] {
  return WARNINGS.map((warning) => ({
    slug: warning.gotcha.slug,
    path: `gotchas/${warning.gotcha.slug}/index.html`,
    html: renderGotchaPage(warning),
  }));
}
