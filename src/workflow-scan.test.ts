import { describe, expect, it } from "vitest";
import { scanWorkflow } from "./workflow-scan";

describe("scanWorkflow", () => {
  it("extracts schedules with an unquoted on key", () => {
    const scan = scanWorkflow(`on:
  schedule:
    - cron: "0 12 * * *"
    - cron: "30 6 * * MON"`);
    expect(scan).toMatchObject({
      kind: "scan",
      crons: [{ value: "0 12 * * *" }, { value: "30 6 * * MON" }],
      unparseable: [],
    });
  });

  it("keeps duplicate entries and identifies their first occurrence", () => {
    const scan = scanWorkflow(`on:
  schedule:
    - cron: "0 12 * * *"
    - cron: "0 12 * * *"
    - cron: "0 12 * * *"`);
    expect(scan).toMatchObject({
      kind: "scan",
      crons: [{ duplicateOf: null }, { duplicateOf: 1 }, { duplicateOf: 1 }],
    });
  });

  it("reports expressions and resolves literal aliases", () => {
    const scan = scanWorkflow(`daily: &daily "0 12 * * *"
on:
  schedule:
    - cron: *daily
    - cron: "\${{ github.event.schedule }}"`);
    expect(scan).toMatchObject({
      kind: "scan",
      crons: [{ value: "0 12 * * *" }],
      unparseable: [
        {
          raw: "${{ github.event.schedule }}",
          reason: expect.stringContaining("${{ }}"),
        },
      ],
    });
  });

  it("reports workflows with no schedule and malformed YAML", () => {
    expect(scanWorkflow("on:\n  push:")).toEqual({ kind: "none" });
    expect(scanWorkflow("on:\n  schedule: [")).toMatchObject({ kind: "error" });
  });

  it("keeps plain crons with trailing newlines in cron mode and scans only the first document", () => {
    expect(scanWorkflow("*/5 * * * *\n")).toEqual({ kind: "cron" });
    expect(
      scanWorkflow(`on:
  schedule:
    - cron: "0 12 * * *"
---
on:
  schedule:
    - cron: "30 6 * * MON"`),
    ).toMatchObject({ kind: "scan", crons: [{ value: "0 12 * * *" }] });
  });
});
