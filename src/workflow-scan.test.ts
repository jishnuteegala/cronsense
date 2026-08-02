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
    - name: missing cron
    - cron: "0 12 * * *"
    - cron: "0 12 * * *"`);
    expect(scan).toMatchObject({
      kind: "scan",
      crons: [{ duplicateOf: null }, { duplicateOf: 1 }, { duplicateOf: 1 }],
      entries: [
        { kind: "cron" },
        { kind: "unparseable" },
        { kind: "cron", cron: { duplicateOf: 1 } },
        { kind: "cron", cron: { duplicateOf: 1 } },
      ],
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
    expect(scanWorkflow("on:\n  schedule: []")).toEqual({ kind: "none" });
    expect(scanWorkflow("on:\n  schedule: [")).toMatchObject({ kind: "error" });
  });

  it("reports a present non-list schedule distinctly", () => {
    expect(scanWorkflow("on:\n  schedule:\n    cron: '0 12 * * *'")).toEqual({
      kind: "schedule-not-list",
    });
  });

  it("keeps plain crons with trailing newlines in cron mode", () => {
    expect(scanWorkflow("*/5 * * * *\n")).toEqual({ kind: "cron" });
    expect(scanWorkflow("@hourly\n")).toEqual({ kind: "cron" });
    expect(scanWorkflow("*/5 * * * * \nextra")).toMatchObject({ kind: "error" });
  });

  it("scans only the first document", () => {
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

  it("counts invalid literal crons as unparseable", () => {
    expect(
      scanWorkflow(`on:
  schedule:
    - cron: "99 99 * * *"`),
    ).toMatchObject({
      kind: "scan",
      crons: [],
      unparseable: [{ raw: "99 99 * * *", reason: "Invalid GitHub Actions cron expression." }],
    });
  });

  it("shows the raw schedule entry when cron is missing", () => {
    expect(
      scanWorkflow(`on:
  schedule:
    - name: no cron here`),
    ).toMatchObject({
      kind: "scan",
      unparseable: [{ raw: '{"name":"no cron here"}', reason: "Schedule entry has no cron key." }],
    });
  });
});
