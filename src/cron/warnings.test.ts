import { describe, expect, it } from "vitest";
import { parseCron } from "./parse";
import { WARNINGS, evaluateWarnings } from "./warnings";

function ast(input: string) {
  const result = parseCron(input);
  if (!result.ok) {
    throw new Error(`failed to parse "${input}": ${result.error}`);
  }
  return result.ast;
}

describe("warning definitions", () => {
  it("every warning carries a verification date, primary-source URL, and docs-repo path", () => {
    for (const warning of WARNINGS) {
      expect(warning.id).not.toBe("");
      expect(warning.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(warning.sourceUrl).toMatch(/^https:\/\/docs\.github\.com\//);
      expect(warning.sourcePath).toMatch(/\.md$/);
      expect(typeof warning.predicate).toBe("function");
    }
  });

  it("warning ids are unique", () => {
    const ids = WARNINGS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sub-minimum-interval warning", () => {
  function subMinimum(input: string) {
    return evaluateWarnings(ast(input)).find((w) => w.id === "sub-minimum-interval");
  }

  it("fires for every-minute schedules quoting the docs exactly", () => {
    const warning = subMinimum("* * * * *");
    expect(warning).toBeDefined();
    expect(warning?.message).toContain(
      "The shortest interval you can run scheduled workflows is once every 5 minutes.",
    );
    expect(warning?.message).toContain("undocumented");
  });

  it("carries source metadata", () => {
    const warning = subMinimum("* * * * *");
    expect(warning?.verifiedOn).toBe("2026-07-24");
    expect(warning?.sourceUrl).toBe(
      "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
    );
    expect(warning?.sourcePath).toBe(
      "data/reusables/repositories/actions-scheduled-workflow-example.md",
    );
  });

  it("fires for */7 because of the 4-minute boundary gap", () => {
    expect(subMinimum("*/7 * * * *")).toBeDefined();
  });

  it("does not fire for */5", () => {
    expect(subMinimum("*/5 * * * *")).toBeUndefined();
  });

  it("does not fire for hourly schedules", () => {
    expect(subMinimum("0 * * * *")).toBeUndefined();
  });

  it("does not fire for never-firing expressions", () => {
    expect(subMinimum("0 0 30 2 *")).toBeUndefined();
  });
});
