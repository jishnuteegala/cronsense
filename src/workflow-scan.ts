import { parseAllDocuments } from "yaml";
import { parseCron } from "./cron/parse";
import { translate } from "./cron/translate";

export interface WorkflowCron {
  value: string;
  summary: string;
  duplicateOf: number | null;
}

export interface UnparseableWorkflowCron {
  raw: string;
  reason: string;
}

export type WorkflowScanEntry =
  | { kind: "cron"; cron: WorkflowCron }
  | { kind: "unparseable"; cron: UnparseableWorkflowCron };

export type WorkflowScan =
  | { kind: "cron" }
  | { kind: "none" }
  | { kind: "schedule-not-list" }
  | { kind: "error"; error: string }
  | {
      kind: "scan";
      crons: WorkflowCron[];
      unparseable: UnparseableWorkflowCron[];
      entries: WorkflowScanEntry[];
    };

function rawValue(value: unknown): string {
  return typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));
}

export function scanWorkflow(input: string): WorkflowScan {
  const normalizedInput = input.trim();
  if (parseCron(normalizedInput).ok || !normalizedInput.includes("\n")) return { kind: "cron" };

  const [document] = parseAllDocuments(input, { version: "1.2" });
  if (!document) return { kind: "cron" };
  const [error] = document.errors;
  if (error) return { kind: "error", error: error.message };

  const workflow = document.toJS();
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) return { kind: "cron" };
  const on = (workflow as Record<string, unknown>).on;
  const schedule =
    on && typeof on === "object" && !Array.isArray(on)
      ? (on as Record<string, unknown>).schedule
      : undefined;
  if (schedule !== undefined && !Array.isArray(schedule)) return { kind: "schedule-not-list" };
  if (!schedule || schedule.length === 0) return { kind: "none" };

  const crons: WorkflowCron[] = [];
  const unparseable: UnparseableWorkflowCron[] = [];
  const entries: WorkflowScanEntry[] = [];
  const seen = new Map<string, number>();
  for (const [index, entry] of schedule.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || !("cron" in entry)) {
      const cron = {
        raw: rawValue(entry),
        reason: "Schedule entry has no cron key.",
      };
      unparseable.push(cron);
      entries.push({ kind: "unparseable", cron });
      continue;
    }
    const value = (entry as Record<string, unknown>).cron;
    if (typeof value !== "string") {
      const cron = {
        raw: rawValue(value),
        reason: "Cron value must be a literal string.",
      };
      unparseable.push(cron);
      entries.push({ kind: "unparseable", cron });
      continue;
    }
    if (value.includes("${{")) {
      const cron = {
        raw: value,
        reason: "Can't evaluate `${{ }}` expressions.",
      };
      unparseable.push(cron);
      entries.push({ kind: "unparseable", cron });
      continue;
    }
    const parsed = parseCron(value);
    if (!parsed.ok) {
      const cron = {
        raw: value,
        reason: "Invalid GitHub Actions cron expression.",
      };
      unparseable.push(cron);
      entries.push({ kind: "unparseable", cron });
      continue;
    }
    const duplicateOf = seen.get(value) ?? null;
    if (!seen.has(value)) seen.set(value, index + 1);
    const cron = {
      value,
      summary: translate(parsed.ast).sentence,
      duplicateOf,
    };
    crons.push(cron);
    entries.push({ kind: "cron", cron });
  }
  return { kind: "scan", crons, unparseable, entries };
}
