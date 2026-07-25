import type { CronAst, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES, hasWildcardOrigin } from "./parse";
import { expandField, firesMoreOftenThanEveryFiveMinutes, neverFiresReason } from "./firings";
import {
  WARNINGS,
  type WarningDefinition,
  type WarningId,
  type WarningPredicate,
} from "./warnings";

export interface ActiveWarning {
  id: WarningId;
  message: string;
  quotes: readonly string[];
  verifiedOn: string;
  sourceUrl: string;
  sourcePaths: readonly string[];
  rank: WarningDefinition["rank"];
  emphasised: boolean;
}

const FIELD_LABELS: Record<FieldName, string> = {
  minute: "minute",
  hour: "hour",
  dayOfMonth: "day of the month",
  month: "month",
  dayOfWeek: "day of the week",
};

interface UnevenStepField {
  field: FieldName;
  values: number[];
  gaps: number[];
}

function unevenStepField(field: FieldAst): UnevenStepField | null {
  if (!field.terms.some((term) => term.kind !== "value" && term.step > 1)) return null;
  const { min, max } = FIELD_RANGES[field.field];
  const span = max - min + 1;
  const values = [...expandField(field)].sort((a, b) => a - b);
  if (values.length < 2) return null;
  const gaps = values.slice(1).map((value, index) => value - (values[index] ?? value));
  gaps.push((values[0] ?? min) + span - (values.at(-1) ?? max));
  return gaps.every((gap) => gap === gaps[0]) ? null : { field: field.field, values, gaps };
}

function unevenStepFields(ast: CronAst): UnevenStepField[] {
  return [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]
    .map(unevenStepField)
    .filter((field): field is UnevenStepField => field !== null);
}

export function matchesWarningPredicate(predicate: WarningPredicate, ast: CronAst): boolean {
  if (predicate.kind === "always") return true;
  if (predicate.kind === "never-fires") return neverFiresReason(ast) !== null;
  if (predicate.kind === "sub-minimum-interval") return firesMoreOftenThanEveryFiveMinutes(ast);
  if (predicate.kind === "uneven-step") return unevenStepFields(ast).length > 0;
  return predicate.fields.every((field) => !hasWildcardOrigin(ast[field]));
}

function messageFor(warning: WarningDefinition, ast: CronAst): string {
  if (warning.messageKind === "static") return warning.message;
  if (warning.messageKind === "never-fires") {
    return warning.message.replace("{reason}", neverFiresReason(ast) ?? "");
  }
  const details = unevenStepFields(ast).map(
    ({ field, values, gaps }) =>
      `The ${FIELD_LABELS[field]} schedule selects ${values.join(", ")}; its consecutive gaps are ${gaps.join(", ")} ${FIELD_LABELS[field]} values`,
  );
  return warning.message.replace("{details}", details.join("; "));
}

function activate(warning: WarningDefinition, ast: CronAst): ActiveWarning {
  return {
    id: warning.id,
    message: messageFor(warning, ast),
    quotes: warning.quotes,
    verifiedOn: warning.verifiedOn,
    sourceUrl: warning.sourceUrl,
    sourcePaths: warning.sourcePaths,
    rank: warning.rank,
    emphasised:
      warning.emphasiseWhen !== undefined &&
      expandField(ast[warning.emphasiseWhen.field]).has(warning.emphasiseWhen.includes),
  };
}

export function evaluateWarnings(ast: CronAst): ActiveWarning[] {
  return WARNINGS.filter(
    (warning) =>
      warning.rank !== "contextual" &&
      !warning.suppressed &&
      matchesWarningPredicate(warning.predicate, ast),
  ).map((warning) => activate(warning, ast));
}

export const CONTEXTUAL_NOTES = WARNINGS.filter((warning) => warning.rank === "contextual");
