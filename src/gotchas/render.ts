import { VERIFICATION_URL, WARNINGS, type WarningDefinition } from "../cron/warnings";

const SITE_NAME = "Cronsense";
const SITE_URL = "https://cronsense.jishnuteegala.com";
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

function provenanceStamp(warning: WarningDefinition): string {
  if (warning.provenance === "empirical") {
    return `Empirically confirmed via <a href="${VERIFICATION_URL}">cronsense-verification</a> on ${escapeHtml(warning.verifiedOn)}.`;
  }
  return `Verified against GitHub docs on ${escapeHtml(warning.verifiedOn)}.`;
}

function sourcePaths(warning: WarningDefinition): string {
  const items = warning.sourcePaths
    .map((path) => `          <li><code>${escapeHtml(path)}</code></li>`)
    .join("\n");
  return `        <h2>Source files</h2>\n        <ul>\n${items}\n        </ul>\n`;
}

function siteFooter(): string {
  return `    <footer class="site-footer">
      <span>&copy; ${new Date().getFullYear()} Jishnu Teegala</span>
      <a href="https://jishnuteegala.com/privacy">Privacy</a>
      <a href="https://github.com/jishnuteegala/cronsense">Source</a>
    </footer>`;
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%234f46e5'/%3E%3Cg fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='16' cy='16' r='8.5'/%3E%3Cpath d='M16 11.5V16l3 2'/%3E%3C/g%3E%3C/svg%3E";

function head(title: string, description: string, canonicalPath: string): string {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const escapedTitle = escapeHtml(title);
  return `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="color-scheme" content="light dark" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <link rel="icon" href="${FAVICON}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="stylesheet" href="/gotchas/gotcha.css" />
  </head>`;
}

function metaDescription(text: string): string {
  const plain = text.replaceAll("`", "");
  if (plain.length <= 155) return plain;
  const cut = plain.slice(0, 155);
  const boundary = cut.lastIndexOf(" ");
  return `${boundary === -1 ? cut : cut.slice(0, boundary).replace(/[.,;:]$/, "")}\u2026`;
}

export function renderGotchaPage(warning: WarningDefinition): string {
  const { gotcha } = warning;
  const title = renderInline(gotcha.title);
  const plainTitle = gotcha.title.replaceAll("`", "");
  const description = metaDescription(gotcha.explanation);
  const url = escapeHtml(warning.sourceUrl);
  return `<!doctype html>
<html lang="en">
${head(`${plainTitle} - ${SITE_NAME}`, description, `/gotchas/${escapeHtml(gotcha.slug)}/`)}
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <main id="content" tabindex="-1">
      <article>
        <p class="crumb"><a href="/">${SITE_NAME}</a> / <a href="/gotchas/">Gotchas</a></p>
        <h1>${title}</h1>
        <h2>What GitHub documents</h2>
        <blockquote><p>${renderInline(gotcha.quote)}</p></blockquote>
        <h2>Why it matters</h2>
        <p>${renderInline(gotcha.explanation)}</p>
${sourcePaths(warning)}        <h2>Source</h2>
        <p>
          Primary source:
          <a href="${url}">${url}</a>
        </p>
        <p class="stamp">${provenanceStamp(warning)}</p>
        <p class="back"><a href="/">${TAGLINE}</a></p>
      </article>
    </main>
${siteFooter()}
  </body>
</html>
`;
}

export function renderGotchasIndex(): string {
  const items = WARNINGS.map((warning) => {
    const { title, quote } = warning.gotcha;
    const note =
      quote.replace(/\.$/, "") === title
        ? ""
        : `\n          <p class="item-note">${renderInline(quote)}</p>`;
    return `        <li>
          <a href="/gotchas/${escapeHtml(warning.gotcha.slug)}/">${renderInline(title)}</a>${note}
        </li>`;
  }).join("\n");
  const description = `${WARNINGS.length} GitHub Actions cron caveats a generic cron checker misses, each verified against GitHub docs or confirmed empirically.`;
  return `<!doctype html>
<html lang="en">
${head(`Gotchas - ${SITE_NAME}`, description, "/gotchas/")}
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <main id="content" tabindex="-1">
      <article>
        <p class="crumb"><a href="/">${SITE_NAME}</a> / Gotchas</p>
        <h1>GitHub Actions cron gotchas</h1>
        <p>
          A generic cron checker will not warn you about any of these ${WARNINGS.length} caveats.
          Each page is static, dated, and sourced; a Markdown variant lives at
          <code>/gotchas/&lt;slug&gt;.md</code>.
        </p>
        <ul class="index-list">
${items}
        </ul>
        <p class="stamp"><a href="/llms.txt">llms.txt</a> describes the URL scheme for agents.</p>
      </article>
    </main>
${siteFooter()}
  </body>
</html>
`;
}

export function renderGotchaMarkdown(warning: WarningDefinition): string {
  const { gotcha } = warning;
  const stamp =
    warning.provenance === "empirical"
      ? `Empirically confirmed via [cronsense-verification](${VERIFICATION_URL}) on ${warning.verifiedOn}.`
      : `Verified against GitHub docs on ${warning.verifiedOn}.`;
  const paths = warning.sourcePaths.map((path) => `- \`${path}\``).join("\n");
  return `# ${gotcha.title}

> ${gotcha.quote}

${gotcha.explanation}

## Source files

${paths}

## Source

Primary source: ${warning.sourceUrl}

${stamp}

Part of [Cronsense](${SITE_URL}/), the cron checker for GitHub Actions.
`;
}

export function gotchaPages(): GotchaPage[] {
  return WARNINGS.map((warning) => ({
    slug: warning.gotcha.slug,
    path: `gotchas/${warning.gotcha.slug}/index.html`,
    html: renderGotchaPage(warning),
  }));
}

export interface GotchaMarkdown {
  slug: string;
  path: string;
  markdown: string;
}

export function gotchaMarkdown(): GotchaMarkdown[] {
  return WARNINGS.map((warning) => ({
    slug: warning.gotcha.slug,
    path: `gotchas/${warning.gotcha.slug}.md`,
    markdown: renderGotchaMarkdown(warning),
  }));
}
