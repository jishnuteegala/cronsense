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

export type WorkflowScan =
  | { kind: "cron" }
  | { kind: "none" }
  | { kind: "error"; error: string }
  | { kind: "scan"; crons: WorkflowCron[]; unparseable: UnparseableWorkflowCron[] };

function rawValue(value: unknown): string {
  return typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));
}

export function scanWorkflow(input: string): WorkflowScan {
  if (parseCron(input.trim()).ok || !input.includes("\n")) return { kind: "cron" };

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
  if (!Array.isArray(schedule)) return { kind: "none" };

  const crons: WorkflowCron[] = [];
  const unparseable: UnparseableWorkflowCron[] = [];
  const seen = new Map<string, number>();
  for (const entry of schedule) {
    const value =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>).cron
        : undefined;
    if (typeof value !== "string" || value.includes("${{")) {
      unparseable.push({
        raw: rawValue(value),
        reason: "Can't evaluate `${{ }}` expressions or non-literal cron values.",
      });
      continue;
    }
    const parsed = parseCron(value);
    const duplicateOf = seen.get(value) ?? null;
    if (!seen.has(value)) seen.set(value, crons.length + 1);
    crons.push({
      value,
      summary: parsed.ok
        ? translate(parsed.ast).sentence
        : "Invalid GitHub Actions cron expression.",
      duplicateOf,
    });
  }
  return { kind: "scan", crons, unparseable };
}
