import { describe, expect, it } from "vitest";

import { WARNINGS } from "../cron/warnings";
import { escapeHtml, gotchaPages, renderGotchaPage, renderInline } from "./render";
import { renderLlmsTxt } from "./llms";
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
      expect(html).toContain(`Verified against GitHub docs on ${warning.verifiedOn}`);
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

  it("includes an accessibility skip link", () => {
    for (const warning of WARNINGS) {
      expect(renderGotchaPage(warning)).toContain('class="skip-link"');
    }
  });

  it("states the gated/pending status honestly on the DOM/DOW page", () => {
    const warning = WARNINGS.find((candidate) => candidate.id === "dom-dow-or-semantics");
    expect(warning?.empiricalGate).toBeDefined();
    const html = renderGotchaPage(warning!);
    expect(html).toContain("empirically gated");
    expect(html).toContain("undocumented by GitHub");
    expect(html).toContain("POSIX");
    expect(html).toContain(warning!.empiricalGate!.closesOn);
  });

  it("never introduces the undocumented 15-minute figure", () => {
    for (const warning of WARNINGS) {
      expect(renderGotchaPage(warning)).not.toContain("15 minutes");
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
