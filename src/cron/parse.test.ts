import { describe, expect, it } from "vitest";
import { hasWildcardOrigin, isRestricted, parseCron } from "./parse";

function expectOk(input: string) {
  const result = parseCron(input);
  if (!result.ok) {
    throw new Error(`expected "${input}" to parse, got: ${result.error}`);
  }
  return result.ast;
}

function expectError(input: string): string {
  const result = parseCron(input);
  if (result.ok) {
    throw new Error(`expected "${input}" to be rejected`);
  }
  return result.error;
}

describe("parseCron acceptance", () => {
  it("accepts the wildcard expression", () => {
    const ast = expectOk("* * * * *");
    expect(ast.minute.terms).toEqual([{ kind: "wildcard", step: 1, explicitStep: false }]);
  });

  it("accepts plain values in every field", () => {
    const ast = expectOk("30 5 15 6 3");
    expect(ast.minute.terms).toEqual([{ kind: "value", value: 30 }]);
    expect(ast.hour.terms).toEqual([{ kind: "value", value: 5 }]);
    expect(ast.dayOfMonth.terms).toEqual([{ kind: "value", value: 15 }]);
    expect(ast.month.terms).toEqual([{ kind: "value", value: 6 }]);
    expect(ast.dayOfWeek.terms).toEqual([{ kind: "value", value: 3 }]);
  });

  it("accepts lists", () => {
    const ast = expectOk("0,15,30,45 * * * *");
    expect(ast.minute.terms).toEqual([
      { kind: "value", value: 0 },
      { kind: "value", value: 15 },
      { kind: "value", value: 30 },
      { kind: "value", value: 45 },
    ]);
  });

  it("accepts ranges", () => {
    const ast = expectOk("* 9-17 * * *");
    expect(ast.hour.terms).toEqual([{ kind: "range", from: 9, to: 17, step: 1 }]);
  });

  it("accepts wildcard steps", () => {
    const ast = expectOk("*/15 * * * *");
    expect(ast.minute.terms).toEqual([{ kind: "wildcard", step: 15, explicitStep: true }]);
  });

  it("accepts range steps", () => {
    const ast = expectOk("0 8-18/2 * * *");
    expect(ast.hour.terms).toEqual([{ kind: "range", from: 8, to: 18, step: 2 }]);
  });

  it("accepts value-with-step as range to field max", () => {
    const ast = expectOk("5/10 * * * *");
    expect(ast.minute.terms).toEqual([{ kind: "range", from: 5, to: 59, step: 10 }]);
  });

  it("accepts month names", () => {
    const ast = expectOk("0 0 1 JAN *");
    expect(ast.month.terms).toEqual([{ kind: "value", value: 1 }]);
  });

  it("accepts day-of-week names case-insensitively", () => {
    const ast = expectOk("0 0 * * sun");
    expect(ast.dayOfWeek.terms).toEqual([{ kind: "value", value: 0 }]);
  });

  it("accepts name tokens in ranges (provisional pending GHA-validator arbitration)", () => {
    const ast = expectOk("0 9 * * MON-FRI");
    expect(ast.dayOfWeek.terms).toEqual([{ kind: "range", from: 1, to: 5, step: 1 }]);
  });

  it("accepts name tokens in steps (provisional pending GHA-validator arbitration)", () => {
    const ast = expectOk("0 0 1 JAN/2 *");
    expect(ast.month.terms).toEqual([{ kind: "range", from: 1, to: 12, step: 2 }]);
  });

  it("accepts mixed lists of ranges and values", () => {
    const ast = expectOk("0 0 1,15,20-25 * *");
    expect(ast.dayOfMonth.terms).toEqual([
      { kind: "value", value: 1 },
      { kind: "value", value: 15 },
      { kind: "range", from: 20, to: 25, step: 1 },
    ]);
  });

  it("accepts boundary values", () => {
    expectOk("59 23 31 12 6");
    expectOk("0 0 1 1 0");
  });

  it("tolerates surrounding whitespace and multiple spaces", () => {
    expectOk("  0  0  *  *  *  ");
  });
});

describe("parseCron rejection", () => {
  it.each(["@yearly", "@annually", "@monthly", "@weekly", "@daily", "@hourly", "@reboot"])(
    "rejects %s citing GHA non-support",
    (shortcut) => {
      const error = expectError(shortcut);
      expect(error).toContain("GitHub Actions does not support");
    },
  );

  it("rejects unknown @-shortcuts", () => {
    expect(expectError("@fortnightly")).toContain("@-shortcuts");
  });

  it("rejects a sixth (seconds) field as presumed-rejected", () => {
    const error = expectError("0 * * * * *");
    expect(error).toContain("seconds");
    expect(error).toContain("presumed rejected");
  });

  it("rejects too few fields", () => {
    expect(expectError("* * * *")).toContain("expected 5 fields");
  });

  it.each(["0 0 L * *", "0 0 15W * *", "0 0 * * 5#3"])(
    "rejects L/W/# tokens as presumed-rejected: %s",
    (input) => {
      const error = expectError(input);
      expect(error).toContain("presumed rejected");
    },
  );

  it.each(["*/W * * * *", "*/L * * * *", "1-10/W * * * *", "0 0 1-L * *"])(
    "rejects L/W tokens in step and range positions: %s",
    (input) => {
      const error = expectError(input);
      expect(error).toContain("presumed rejected");
    },
  );

  it.each(["0 0 1LW * *", "0 0 WL * *", "0 0 L5 * *"])(
    "rejects compound L/W forms as presumed-rejected: %s",
    (input) => {
      const error = expectError(input);
      expect(error).toContain("presumed rejected");
    },
  );

  it("still accepts names containing L or W letters like JUL and WED", () => {
    expectOk("0 0 1 JUL WED");
  });

  it("rejects steps above the safe-integer range", () => {
    expect(expectError("*/999999999999999999999 * * * *")).toContain("too large");
    expect(
      expectError(
        "*/99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999 * * * *",
      ),
    ).toContain("too large");
  });

  it.each(["0 0 *,15 * *", "0 0 15 * *,MON", "*,5 * * * *", "0 0 */2,15 * *"])(
    "rejects wildcard mixed into a value list: %s",
    (input) => {
      const error = expectError(input);
      expect(error).toContain('mixes "*" with a value list');
      expect(error).toContain("presumed rejected");
    },
  );

  it("rejects the ? token", () => {
    expect(expectError("0 0 ? * *")).toContain("not part of GitHub Actions cron syntax");
  });

  it("rejects out-of-range minute", () => {
    expect(expectError("60 * * * *")).toContain("out of range");
  });

  it("rejects out-of-range hour", () => {
    expect(expectError("0 24 * * *")).toContain("out of range");
  });

  it("rejects out-of-range day-of-month", () => {
    expect(expectError("0 0 32 * *")).toContain("out of range");
    expect(expectError("0 0 0 * *")).toContain("out of range");
  });

  it("rejects out-of-range month", () => {
    expect(expectError("0 0 1 13 *")).toContain("out of range");
    expect(expectError("0 0 1 0 *")).toContain("out of range");
  });

  it("rejects out-of-range day-of-week", () => {
    expect(expectError("0 0 * * 7")).toContain("out of range");
  });

  it("rejects unknown names", () => {
    expect(expectError("0 0 * * FUN")).toContain("not a valid dayOfWeek name");
  });

  it("rejects names in the wrong field", () => {
    expect(expectError("0 0 * MON *")).toContain("not a valid month name");
    expect(expectError("MON 0 * * *")).toContain("minute");
  });

  it("rejects reversed ranges", () => {
    expect(expectError("0 17-9 * * *")).toContain("reversed");
  });

  it("rejects zero steps", () => {
    expect(expectError("*/0 * * * *")).toContain("at least 1");
  });

  it("rejects non-numeric steps", () => {
    expect(expectError("*/x * * * *")).toContain("must be a positive number");
  });

  it("rejects empty list entries", () => {
    expect(expectError("1,,2 * * * *")).toContain("empty entry");
  });

  it("rejects double slashes", () => {
    expect(expectError("*/2/3 * * * *")).toContain('more than one "/"');
  });

  it("rejects multi-part ranges", () => {
    expect(expectError("1-2-3 * * * *")).toContain('more than one "-"');
  });

  it("rejects the empty string", () => {
    expect(expectError("")).toContain("empty");
  });
});

describe("provisional notes", () => {
  it("flags name tokens in ranges", () => {
    const result = parseCron("0 9 * * MON-FRI");
    if (!result.ok) throw new Error(result.error);
    expect(result.provisionalNotes).toHaveLength(1);
    expect(result.provisionalNotes[0]).toContain("awaits GHA-validator arbitration");
  });

  it("flags name tokens in steps", () => {
    const result = parseCron("0 0 1 JAN/2 *");
    if (!result.ok) throw new Error(result.error);
    expect(result.provisionalNotes).toHaveLength(1);
    expect(result.provisionalNotes[0]).toContain("JAN/2");
  });

  it("does not flag numeric ranges or plain name values", () => {
    const result = parseCron("0 9-17 * JAN MON");
    if (!result.ok) throw new Error(result.error);
    expect(result.provisionalNotes).toEqual([]);
  });
});

describe("isRestricted", () => {
  it("treats bare * as unrestricted", () => {
    const ast = expectOk("* * * * *");
    expect(isRestricted(ast.dayOfMonth)).toBe(false);
  });

  it("treats */N as restricted", () => {
    const ast = expectOk("0 0 */2 * *");
    expect(isRestricted(ast.dayOfMonth)).toBe(true);
  });

  it("treats */1 as restricted (syntactically not a bare *)", () => {
    const ast = expectOk("0 0 */1 * *");
    expect(isRestricted(ast.dayOfMonth)).toBe(true);
  });

  it("treats values and ranges as restricted", () => {
    const ast = expectOk("0 0 1 * MON-FRI");
    expect(isRestricted(ast.dayOfMonth)).toBe(true);
    expect(isRestricted(ast.dayOfWeek)).toBe(true);
  });
});

describe("hasWildcardOrigin", () => {
  it("is true for bare * and */N, false for values and ranges", () => {
    const ast = expectOk("0 0 */2 * MON");
    expect(hasWildcardOrigin(ast.dayOfMonth)).toBe(true);
    expect(hasWildcardOrigin(ast.dayOfWeek)).toBe(false);
    const ast2 = expectOk("0 0 1-15 * *");
    expect(hasWildcardOrigin(ast2.dayOfMonth)).toBe(false);
    expect(hasWildcardOrigin(ast2.dayOfWeek)).toBe(true);
  });
});
