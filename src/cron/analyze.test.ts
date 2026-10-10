import { describe, expect, it } from "vitest";
import { analyze } from "./analyze";
import { parseCron } from "./parse";

const FROM = new Date(Date.UTC(2026, 9, 9, 12, 0)); // 2026-10-09 12:00 UTC, a Friday

function result(input: string) {
  const parsed = parseCron(input);
  if (!parsed.ok) throw new Error(`test expression failed to parse: ${input}`);
  return parsed;
}

describe("analyze", () => {
  it("returns translation, firings, warnings, and provisional notes in one verdict", () => {
    const output = analyze(result("*/15 9-17 * * MON-FRI"), FROM);
    expect(output.translation.sentence).toContain("Monday through Friday");
    expect(output.translation.timezoneNote).toBeTruthy();
    expect(output.firings).toHaveLength(10);
    expect(output.warnings.map((w) => w.id)).toEqual(["high-load-delay-drop"]);
    expect(output.provisionalNotes.length).toBeGreaterThan(0);
  });

  it("reports never-firing expressions with an empty firing list and the reason", () => {
    const output = analyze(result("0 0 30 2 *"), FROM);
    expect(output.never).toContain("day-of-month 30");
    expect(output.firings).toEqual([]);
  });

  it("still evaluates every warning when the expression can never fire", () => {
    const output = analyze(result("0 0 30 2 *"), FROM);
    const ids = output.warnings.map((w) => w.id);
    expect(ids).toContain("never-fires");
    const neverWarning = output.warnings.find((w) => w.id === "never-fires");
    expect(neverWarning?.message).toContain("day-of-month 30");
  });

  it("marks DOM/DOW wildcard-origin expressions as intersection, not union", () => {
    const output = analyze(result("0 0 */2 * MON"), FROM);
    expect(output.warnings.map((w) => w.id)).not.toContain("dom-dow-or-semantics");
  });

  it("emits the DOM/DOW OR-semantics warning only for the union combination", () => {
    const union = analyze(result("0 0 1 * MON"), FROM);
    expect(union.warnings.map((w) => w.id)).toContain("dom-dow-or-semantics");
  });
});
