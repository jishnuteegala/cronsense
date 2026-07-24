import { describe, expect, it } from "vitest";
import { parseCron } from "./parse";
import { evaluateWarnings } from "./warning-engine";
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
      expect(warning.verifiedOn).toBe("2026-07-24");
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
    expect(WARNINGS.find((warning) => warning.id === "sub-minimum-interval")?.message).toBe(
      'GitHub docs: "The shortest interval you can run scheduled workflows is once every 5 minutes." This expression fires more often; the docs do not say what happens to such an expression.',
    );
    expect(WARNINGS.find((warning) => warning.id === "high-load-delay-drop")?.message).toBe(
      'GitHub docs: "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour." "If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour."',
    );
    expect(WARNINGS.find((warning) => warning.id === "inactivity-pause")?.message).toBe(
      'GitHub docs: "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days." This applies to public repositories; GitHub does not document an equivalent 60-day pause for private repositories.',
    );
  });

  it("suppresses the empirically gated DOM/DOW warning", () => {
    expect(warningIds("0 0 1 * MON")).not.toContain("dom-dow-or-semantics");
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
    expect(warning?.message).toContain("The minute */7 schedule");
    expect(warning?.message).toContain(
      "0, ..., 56; it resets at 0 when the field wraps, creating a 4-minute gap",
    );
  });

  it("detects stepped ranges whose boundary gap differs from their step", () => {
    expect(warningIds("5-55/10 * * * *")).not.toContain("uneven-step-reset");
    expect(warningIds("0-20/10,30-50/10 * * * *")).not.toContain("uneven-step-reset");
    expect(warningIds("0-50/10,55 * * * *")).not.toContain("uneven-step-reset");
    const warning = evaluateWarnings(ast("0-59/7 * * * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(warning?.message).toContain(
      "The minute 0-59/7 schedule selects 0, ..., 56; it resets at 0 when the field wraps, creating a 4-minute gap",
    );
    expect(
      evaluateWarnings(ast("*/8 * * * *")).find((item) => item.id === "uneven-step-reset")?.message,
    ).toContain("56; it resets at 0 when the field wraps, creating a 4-minute gap");
  });

  it("uses documented labels for non-minute uneven steps", () => {
    const warning = evaluateWarnings(ast("0 0 */7 * *")).find(
      (item) => item.id === "uneven-step-reset",
    );
    expect(warning?.message).toContain("The day of the month */7 schedule");
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
    expect(warning?.message).toContain(
      "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour.",
    );
  });

  it("keeps the public-repository inactivity note contextual", () => {
    const warning = WARNINGS.find((item) => item.id === "inactivity-pause");
    expect(warning?.rank).toBe("contextual");
    expect(warning?.message).toContain(
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
