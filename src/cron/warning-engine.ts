import type { CronAst, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES } from "./parse";
import {
  type ExpandedCron,
  expandCron,
  firesMoreOftenThanEveryFiveMinutes,
  neverFiresReason,
} from "./firings";
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
  provenance: WarningDefinition["provenance"];
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

const EXPANDED_SETS: Record<FieldName, (expanded: ExpandedCron) => Set<number>> = {
  minute: (expanded) => expanded.minutes,
  hour: (expanded) => expanded.hours,
  dayOfMonth: (expanded) => expanded.daysOfMonth,
  month: (expanded) => expanded.months,
  dayOfWeek: (expanded) => expanded.daysOfWeek,
};

function unevenStepField(field: FieldAst, expanded: ExpandedCron): UnevenStepField | null {
  if (!field.terms.some((term) => term.kind !== "value" && term.step > 1)) return null;
  const { min, max } = FIELD_RANGES[field.field];
  const span = max - min + 1;
  const values = [...EXPANDED_SETS[field.field](expanded)].sort((a, b) => a - b);
  if (values.length < 2) return null;
  const gaps = values.slice(1).map((value, index) => value - (values[index] ?? value));
  gaps.push((values[0] ?? min) + span - (values.at(-1) ?? max));
  return gaps.every((gap) => gap === gaps[0]) ? null : { field: field.field, values, gaps };
}

function unevenStepFields(ast: CronAst, expanded: ExpandedCron): UnevenStepField[] {
  return [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]
    .map((field) => unevenStepField(field, expanded))
    .filter((field): field is UnevenStepField => field !== null);
}

interface WarningContext {
  expanded: ExpandedCron;
  uneven: UnevenStepField[];
  never: string | null;
}

function matchesPredicate(predicate: WarningPredicate, ast: CronAst, ctx: WarningContext): boolean {
  if (predicate.kind === "always") return true;
  if (predicate.kind === "never-fires") return ctx.never !== null;
  if (predicate.kind === "sub-minimum-interval")
    return firesMoreOftenThanEveryFiveMinutes(ast, ctx.expanded);
  if (predicate.kind === "uneven-step") return ctx.uneven.length > 0;
  if (predicate.kind === "day-union") return ctx.expanded.dayCombination === "union";
  const exhaustive: never = predicate;
  return exhaustive;
}

export function matchesWarningPredicate(
  predicate: WarningPredicate,
  ast: CronAst,
  expanded: ExpandedCron = expandCron(ast),
): boolean {
  return matchesPredicate(predicate, ast, {
    expanded,
    uneven: predicate.kind === "uneven-step" ? unevenStepFields(ast, expanded) : [],
    never: predicate.kind === "never-fires" ? neverFiresReason(ast, expanded) : null,
  });
}

function messageFor(warning: WarningDefinition, ctx: WarningContext): string {
  if (warning.messageKind === "static") return warning.message;
  if (warning.messageKind === "never-fires") {
    return warning.message.replace("{reason}", ctx.never ?? "");
  }
  const details = ctx.uneven.map(
    ({ field, values, gaps }) =>
      `The ${FIELD_LABELS[field]} schedule selects ${values.join(", ")}; its consecutive gaps are ${gaps.join(", ")} ${FIELD_LABELS[field]} values`,
  );
  return warning.message.replace("{details}", details.join("; "));
}

function activate(warning: WarningDefinition, ctx: WarningContext): ActiveWarning {
  return {
    id: warning.id,
    message: messageFor(warning, ctx),
    quotes: warning.quotes,
    verifiedOn: warning.verifiedOn,
    sourceUrl: warning.sourceUrl,
    sourcePaths: warning.sourcePaths,
    rank: warning.rank,
    provenance: warning.provenance,
    emphasised:
      warning.emphasiseWhen !== undefined &&
      EXPANDED_SETS[warning.emphasiseWhen.field](ctx.expanded).has(warning.emphasiseWhen.includes),
  };
}

export function evaluateWarnings(
  ast: CronAst,
  expanded: ExpandedCron = expandCron(ast),
): ActiveWarning[] {
  const ctx: WarningContext = {
    expanded,
    uneven: unevenStepFields(ast, expanded),
    never: neverFiresReason(ast, expanded),
  };
  return WARNINGS.filter(
    (warning) => warning.rank !== "contextual" && matchesPredicate(warning.predicate, ast, ctx),
  ).map((warning) => activate(warning, ctx));
}

export const CONTEXTUAL_NOTES = WARNINGS.filter((warning) => warning.rank === "contextual");
