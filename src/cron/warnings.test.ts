import { describe, expect, it } from "vitest";
import { parseCron } from "./parse";
import { WARNINGS, evaluateWarnings } from "./warnings";

function ast(input: string) {
  const result = parseCron(input);
  if (!result.ok) throw new Error(`failed to parse "${input}": ${result.error}`);
  return result.ast;
}

function warningIds(input: string): string[] {
  return evaluateWarnings(ast(input)).map((warning) => warning.id);
}

describe("warning definitions", () => {
  it("holds all six sourced caveats as typed declarative data", () => {
    expect(WARNINGS).toHaveLength(6);
    for (const warning of WARNINGS) {
      expect(warning.verifiedOn).toBe("2026-07-24");
      expect(warning.sourceUrl).toMatch(/^https:\/\/docs\.github\.com\//);
      expect(warning.sourcePath).toMatch(/\.md$/);
      expect(typeof warning.predicate.kind).toBe("string");
    }
  });

  it("suppresses the empirically gated DOM/DOW warning", () => {
    expect(warningIds("0 0 1 * MON")).not.toContain("dom-dow-or-semantics");
  });

  it("returns exact applicable warnings for a normal schedule", () => {
    expect(warningIds("17 4 * * *")).toEqual(["high-load-delay-drop", "inactivity-pause"]);
  });
});

describe("expression-specific warnings", () => {
  it("explains the actual uneven step field", () => {
    const warning = evaluateWarnings(ast("*/7 * * * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(warning?.message).toContain("minute */7");
  });

  it("identifies never-firing conflicting fields", () => {
    const warning = evaluateWarnings(ast("0 0 30 2 *")).find((item) => item.id === "never-fires");
    expect(warning?.message).toBe(
      "this expression will never fire: day-of-month 30 never occurs in month 2",
    );
  });

  it("quotes the minimum interval docs without inventing an outcome", () => {
    const warning = evaluateWarnings(ast("* * * * *")).find(
      (item) => item.id === "sub-minimum-interval",
    );
    expect(warning?.message).toContain(
      "The shortest interval you can run scheduled workflows is once every 5 minutes.",
    );
    expect(warning?.message).not.toContain("rejected");
  });
});

describe("contextual caveats", () => {
  it("emphasises high load risk at the start of an hour", () => {
    const warning = evaluateWarnings(ast("0 * * * *")).find(
      (item) => item.id === "high-load-delay-drop",
    );
    expect(warning?.emphasised).toBe(true);
    expect(warning?.message).toContain(
      "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour.",
    );
  });

  it("keeps the public-repository inactivity note contextual", () => {
    const warning = evaluateWarnings(ast("17 4 * * *")).find(
      (item) => item.id === "inactivity-pause",
    );
    expect(warning?.rank).toBe("contextual");
    expect(warning?.message).toContain(
      "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
    );
  });
});
