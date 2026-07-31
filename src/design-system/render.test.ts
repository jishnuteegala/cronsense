import { describe, expect, it } from "vitest";
import { renderDesignSystem } from "./render";

describe("renderDesignSystem", () => {
  const html = renderDesignSystem();

  it("is a complete HTML document readable without JavaScript", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toContain("<script");
  });

  it("documents the named colour and spacing tokens", () => {
    for (const token of ["--accent", "--fg", "--bg", "--space-1", "--space-7"]) {
      expect(html).toContain(token);
    }
  });

  it("has an accessibility skip link targeting its focusable main landmark", () => {
    expect(html).toContain('class="skip-link" href="#main-content"');
    expect(html).toContain('id="main-content"');
  });

  it("links its footer only to cronsense origins", () => {
    expect(html).toContain("https://jishnuteegala.com/privacy");
    expect(html).toContain("https://github.com/jishnuteegala/cronsense");
  });
});
