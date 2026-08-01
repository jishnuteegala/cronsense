import { describe, expect, it } from "vitest";
import { parseCron } from "./parse";
import { evaluateWarnings, matchesWarningPredicate } from "./warning-engine";
import { WARNINGS } from "./warnings";

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
      expect(warning.verifiedOn).toMatch(/^2026-07-(24|27)$/);
      expect(warning.sourceUrl).toMatch(/^https:\/\/docs\.github\.com\//);
      expect(warning.sourcePaths.every((path) => path.endsWith(".md"))).toBe(true);
      expect(typeof warning.predicate.kind).toBe("string");
      expect(warning.message).not.toBe("");
    }
  });

  it("locks the sourced quotes and docs watch paths", () => {
    expect(WARNINGS.map((warning) => [warning.id, warning.sourceUrl, warning.sourcePaths])).toEqual(
      [
        [
          "dom-dow-or-semantics",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          ["content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md"],
        ],
        [
          "uneven-step-reset",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          ["data/reusables/repositories/actions-scheduled-workflow-example.md"],
        ],
        [
          "never-fires",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          ["data/reusables/repositories/cron.md"],
        ],
        [
          "sub-minimum-interval",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          ["data/reusables/repositories/actions-scheduled-workflow-example.md"],
        ],
        [
          "high-load-delay-drop",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          ["data/reusables/actions/schedule-delay.md"],
        ],
        [
          "inactivity-pause",
          "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
          [
            "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
            "data/reusables/actions/scheduled-workflows-disabled.md",
          ],
        ],
      ],
    );
    expect(WARNINGS.find((warning) => warning.id === "sub-minimum-interval")?.quotes).toEqual([
      "The shortest interval you can run scheduled workflows is once every 5 minutes.",
    ]);
    expect(WARNINGS.find((warning) => warning.id === "high-load-delay-drop")?.quotes).toEqual([
      "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour.",
      "If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.",
    ]);
    expect(WARNINGS.find((warning) => warning.id === "inactivity-pause")?.quotes).toEqual([
      "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
    ]);
  });

  it("carries verbatim sourced quotes onto activated warnings", () => {
    const active = evaluateWarnings(ast("* * * * *"));
    const subMinimum = active.find((warning) => warning.id === "sub-minimum-interval");
    expect(subMinimum?.quotes).toEqual([
      "The shortest interval you can run scheduled workflows is once every 5 minutes.",
    ]);
    const highLoad = active.find((warning) => warning.id === "high-load-delay-drop");
    expect(highLoad?.quotes).toHaveLength(2);
  });

  it("gives every warning stable metadata: id, anchor target, and quote field", () => {
    const expressions = ["* * * * *", "0 0 30 2 *", "*/7 * * * *", "17 4 * * *"];
    const seen = new Set<string>();
    for (const expression of expressions) {
      for (const warning of evaluateWarnings(ast(expression))) {
        expect(warning.id).toMatch(/^[a-z-]+$/);
        expect(document.getElementById).toBeDefined();
        expect(Array.isArray(warning.quotes)).toBe(true);
        expect(warning.sourceUrl).toMatch(/^https:\/\/docs\.github\.com\//);
        expect(warning.sourcePaths.length).toBeGreaterThan(0);
        seen.add(warning.id);
      }
    }
    expect(seen).toContain("sub-minimum-interval");
    expect(seen).toContain("never-fires");
    expect(seen).toContain("uneven-step-reset");
    expect(seen).toContain("high-load-delay-drop");
  });

  it("gives every renderable warning a non-empty sourced quote", () => {
    for (const warning of WARNINGS) {
      expect(Array.isArray(warning.quotes)).toBe(true);
      expect(warning.quotes.length).toBeGreaterThan(0);
    }
  });

  it("shows the empirically confirmed DOM/DOW warning", () => {
    const warning = WARNINGS.find((candidate) => candidate.id === "dom-dow-or-semantics");
    expect(warningIds("0 0 1 * MON")).toContain("dom-dow-or-semantics");
    expect(warning?.verifiedOn).toBe("2026-07-27");
    expect(warning?.provenance).toBe("empirical");
    expect(warning?.message).toContain("empirically confirmed");
    expect(warning?.message).toContain("2026-07-27");
  });

  it("only considers both non-wildcard-origin day fields for DOM/DOW semantics", () => {
    const predicate = { kind: "both-restricted", fields: ["dayOfMonth", "dayOfWeek"] } as const;
    expect(matchesWarningPredicate(predicate, ast("0 0 1 * MON"))).toBe(true);
    expect(matchesWarningPredicate(predicate, ast("0 0 */2 * 1"))).toBe(false);
    expect(matchesWarningPredicate(predicate, ast("0 0 1 * */2"))).toBe(false);
  });

  it("returns exact applicable warnings for a normal schedule", () => {
    expect(warningIds("17 4 * * *")).toEqual(["high-load-delay-drop"]);
  });
});

describe("expression-specific warnings", () => {
  it("explains the actual uneven step field", () => {
    const warning = evaluateWarnings(ast("*/7 * * * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(warning?.message).toContain(
      "The minute schedule selects 0, 7, 14, 21, 28, 35, 42, 49, 56",
    );
    expect(warning?.message).toContain(
      "its consecutive gaps are 7, 7, 7, 7, 7, 7, 7, 7, 4 minute values",
    );
  });

  it("derives stepped range and list gaps from the complete selected field values", () => {
    expect(warningIds("5-55/10 * * * *")).not.toContain("uneven-step-reset");
    expect(warningIds("0-20/10,30-50/10 * * * *")).not.toContain("uneven-step-reset");
    expect(warningIds("0-50/10,55 * * * *")).toContain("uneven-step-reset");
    expect(warningIds("0-20/10 * * * *")).toEqual(["uneven-step-reset", "high-load-delay-drop"]);
    expect(warningIds("0-20/7,21-59/7 * * * *")).toEqual([
      "uneven-step-reset",
      "sub-minimum-interval",
      "high-load-delay-drop",
    ]);
    const rangeWarning = evaluateWarnings(ast("0-20/10 * * * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(rangeWarning?.message).toContain(
      "selects 0, 10, 20; its consecutive gaps are 10, 10, 40 minute values",
    );
    const listWarning = evaluateWarnings(ast("0-20/7,21-59/7 * * * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(listWarning?.message).toContain(
      "selects 0, 7, 14, 21, 28, 35, 42, 49, 56; its consecutive gaps are 7, 7, 7, 7, 7, 7, 7, 7, 4 minute values",
    );
  });

  it("uses documented labels for non-minute uneven steps", () => {
    const warning = evaluateWarnings(ast("0 0 */7 * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(warning?.message).toContain("The day of the month schedule");
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
    expect(warning?.quotes).toContain(
      "The shortest interval you can run scheduled workflows is once every 5 minutes.",
    );
    expect(warningIds("* * * * *")).toEqual(["sub-minimum-interval", "high-load-delay-drop"]);
    expect(warningIds("*/4 * * * *")).toEqual(["sub-minimum-interval", "high-load-delay-drop"]);
    expect(warningIds("0 0 30 2 *")).toEqual(["never-fires", "high-load-delay-drop"]);
    expect(warningIds("0 * * * *")).toEqual(["high-load-delay-drop"]);
    expect(warning?.message).not.toContain("rejected");
  });
});

describe("contextual caveats", () => {
  it("emphasises high load risk at the start of an hour", () => {
    const warning = evaluateWarnings(ast("0 * * * *")).find(
      (item) => item.id === "high-load-delay-drop",
    );
    expect(warning?.emphasised).toBe(true);
    expect(warning?.quotes).toContain(
      "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour.",
    );
  });

  it("keeps the public-repository inactivity note contextual", () => {
    const warning = WARNINGS.find((item) => item.id === "inactivity-pause");
    expect(warning?.rank).toBe("contextual");
    expect(warning?.quotes).toContain(
      "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
    );
  });

  it("excludes contextual notes from expression-specific warnings", () => {
    expect(warningIds("17 4 * * *")).not.toContain("inactivity-pause");
  });

  it("records both sourced inactivity-note paths", () => {
    expect(WARNINGS.find((warning) => warning.id === "inactivity-pause")?.sourcePaths).toEqual([
      "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
      "data/reusables/actions/scheduled-workflows-disabled.md",
    ]);
  });
});
