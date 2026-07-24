import { describe, expect, it } from "vitest";

import { nextFirings } from "../src/cron/firings";
import { parseCron } from "../src/cron/parse";

const schedules = {
  "dom-dow-restricted": "0 12 1-7 * MON",
  "uneven-step-reset": "*/7 * * * *",
  "frequent-control": "*/5 * * * *",
  "month-rollover": "30 23 31 * *",
} as const;

describe("verification predictions", () => {
  it("prints the next ten firings from the Cronsense engine", () => {
    const from = new Date();
    console.log(`recorded-at: ${from.toISOString()}`);
    for (const [name, expression] of Object.entries(schedules)) {
      const parsed = parseCron(expression);
      if (!parsed.ok) throw new Error(`${name}: ${parsed.error}`);
      const firings = nextFirings(parsed.ast, from, 10);
      console.log(`${name}: ${expression}`);
      for (const firing of firings) console.log(`- ${firing.toISOString()}`);
      expect(firings).toHaveLength(10);
    }
  });
});
