import { describe, expect, it } from "vitest";

import { VERIFICATION_URL, WARNINGS } from "../cron/warnings";
import {
  escapeHtml,
  gotchaPages,
  renderGotchaMarkdown,
  renderGotchaPage,
  renderGotchasIndex,
  renderInline,
} from "./render";
import { renderLlmsTxt } from "./llms";
import { staticAssets } from "./emit";
import rootLlmsTxt from "../../llms.txt?raw";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
  });
});

describe("renderInline", () => {
  it("renders backtick spans as code and escapes the rest", () => {
    expect(renderInline("neither is `*` here")).toBe("neither is <code>*</code> here");
  });

  it("escapes angle brackets outside code", () => {
    expect(renderInline("a < b")).toBe("a &lt; b");
  });
});

describe("gotchaPages", () => {
  it("produces exactly one page per warning", () => {
    expect(gotchaPages()).toHaveLength(WARNINGS.length);
    expect(WARNINGS).toHaveLength(6);
  });

  it("uses stable /gotchas/<slug>/index.html paths with no hash routing", () => {
    for (const page of gotchaPages()) {
      expect(page.path).toBe(`gotchas/${page.slug}/index.html`);
      expect(page.html).not.toContain("/#");
    }
  });

  it("has unique slugs matching the warning ids", () => {
    const slugs = gotchaPages().map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(WARNINGS.map((warning) => warning.gotcha.slug));
  });
});

describe("renderGotchaPage", () => {
  it("includes quote, explanation, source link, source paths, and dated stamp", () => {
    for (const warning of WARNINGS) {
      const html = renderGotchaPage(warning);
      expect(html).toContain(renderInline(warning.gotcha.quote));
      expect(html).toContain(`href="${escapeHtml(warning.sourceUrl)}"`);
      const stamp =
        warning.provenance === "empirical"
          ? `Empirically confirmed via <a href="${VERIFICATION_URL}">cronsense-verification</a> on ${warning.verifiedOn}`
          : `Verified against GitHub docs on ${warning.verifiedOn}`;
      expect(html).toContain(stamp);
      for (const path of warning.sourcePaths) {
        expect(html).toContain(escapeHtml(path));
      }
    }
  });

  it("is a complete HTML document readable without JavaScript", () => {
    for (const warning of WARNINGS) {
      const html = renderGotchaPage(warning);
      expect(html.startsWith("<!doctype html>")).toBe(true);
      expect(html).not.toContain("<script");
    }
  });

  it("includes an accessibility skip link targeting a focusable main", () => {
    for (const warning of WARNINGS) {
      const html = renderGotchaPage(warning);
      expect(html).toContain('class="skip-link" href="#content"');
      expect(html).toContain('<main id="content" tabindex="-1">');
    }
  });

  it("states the empirically confirmed DOM/DOW status honestly", () => {
    const warning = WARNINGS.find((candidate) => candidate.id === "dom-dow-or-semantics");
    const html = renderGotchaPage(warning!);
    expect(html).toContain("empirically confirmed");
    expect(html).toContain("2026-07-27");
    expect(html).toContain("GitHub does not document");
    expect(html).toContain("POSIX");
    expect(html).toContain("cronsense-verification");
    expect(html).not.toContain("pending verification");
  });

  it("never introduces the undocumented 15-minute figure", () => {
    for (const warning of WARNINGS) {
      expect(renderGotchaPage(warning)).not.toContain("15 minutes");
    }
  });

  it("carries an absolute canonical, og metadata, and the site footer", () => {
    for (const warning of WARNINGS) {
      const html = renderGotchaPage(warning);
      expect(html).toContain(
        `rel="canonical" href="https://cronsense.jishnuteegala.com/gotchas/${warning.gotcha.slug}/"`,
      );
      expect(html).toContain('property="og:title"');
      expect(html).toContain('name="twitter:card"');
      expect(html).toContain('href="https://jishnuteegala.com/privacy"');
      expect(html).toContain('href="https://github.com/jishnuteegala/cronsense"');
      expect(html).not.toContain("\u2014");
    }
  });
});

describe("renderGotchasIndex", () => {
  it("is a complete no-JS page linking every gotcha page and llms.txt", () => {
    const html = renderGotchasIndex();
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toContain("<script");
    expect(html).toContain('class="skip-link" href="#content"');
    for (const warning of WARNINGS) {
      expect(html).toContain(`href="/gotchas/${warning.gotcha.slug}/"`);
    }
    expect(html).toContain('href="/llms.txt"');
    expect(html).toContain('href="https://jishnuteegala.com/privacy"');
  });

  it("interpolates the warning count instead of hardcoding it", () => {
    expect(renderGotchasIndex()).toContain(`these ${WARNINGS.length} caveats`);
    expect(renderGotchasIndex()).not.toContain("Six caveats");
  });

  it("drops the item note when the quote restates the title", () => {
    const html = renderGotchasIndex();
    const items = html.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    const pause = items.find((item) => item.includes("/gotchas/inactivity-pause/")) ?? "";
    const domDow = items.find((item) => item.includes("/gotchas/dom-dow-or-semantics/")) ?? "";
    expect(pause).not.toContain("item-note");
    expect(domDow).toContain("item-note");
  });
});

describe("renderGotchaMarkdown", () => {
  it("carries the quote, explanation, source paths, and stamp in plain Markdown", () => {
    for (const warning of WARNINGS) {
      const markdown = renderGotchaMarkdown(warning);
      expect(markdown.startsWith(`# ${warning.gotcha.title}`)).toBe(true);
      expect(markdown).toContain(`> ${warning.gotcha.quote}`);
      expect(markdown).toContain(warning.gotcha.explanation);
      expect(markdown).toContain(warning.sourceUrl);
      expect(markdown).toContain(warning.verifiedOn);
      expect(markdown).not.toContain("<a href");
      for (const path of warning.sourcePaths) {
        expect(markdown).toContain(`\`${path}\``);
      }
    }
  });
});

describe("renderLlmsTxt", () => {
  it("describes the tool, the six pages, and the URL scheme", () => {
    const txt = renderLlmsTxt();
    expect(txt).toContain("# Cronsense");
    expect(txt).toContain("/gotchas/<slug>");
    expect(txt).toContain("/llms.txt");
    for (const warning of WARNINGS) {
      expect(txt).toContain(`/gotchas/${warning.gotcha.slug}`);
    }
  });

  it("does not contain the undocumented 15-minute figure as a fact", () => {
    expect(renderLlmsTxt()).not.toContain("delay of up to 15");
  });

  it("matches the committed llms.txt at the repository root", () => {
    expect(rootLlmsTxt).toBe(renderLlmsTxt());
  });
});

describe("staticAssets", () => {
  it("emits llms.txt, the stylesheet, the index, and one page plus Markdown per warning", () => {
    const fileNames = staticAssets().map((asset) => asset.fileName);
    expect(fileNames).toContain("llms.txt");
    expect(fileNames).toContain("gotchas/gotcha.css");
    expect(fileNames).toContain("gotchas/index.html");
    const pages = fileNames.filter((name) => /^gotchas\/[^/]+\/index\.html$/.test(name));
    expect(pages).toHaveLength(6);
    expect(pages).toEqual(WARNINGS.map((warning) => `gotchas/${warning.gotcha.slug}/index.html`));
    const markdown = fileNames.filter((name) => /^gotchas\/[^/]+\.md$/.test(name));
    expect(markdown).toEqual(WARNINGS.map((warning) => `gotchas/${warning.gotcha.slug}.md`));
  });

  it("carries the rendered source for each emitted asset", () => {
    for (const asset of staticAssets()) {
      expect(asset.source.length).toBeGreaterThan(0);
    }
  });
});
