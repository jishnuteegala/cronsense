import type { CronAst, FieldAst, FieldName, FieldTerm } from "./parse";
import { FIELD_RANGES, isRestricted } from "./parse";
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
  verifiedOn: string;
  sourceUrl: string;
  sourcePaths: readonly string[];
  rank: WarningDefinition["rank"];
  emphasised: boolean;
}

type SteppedTerm = Exclude<FieldTerm, { kind: "value" }>;

function unevenStepTerms(field: FieldAst): SteppedTerm[] {
  const { min, max } = FIELD_RANGES[field.field];
  return field.terms.filter((term): term is SteppedTerm => {
    if (term.kind === "value") return false;
    const span = term.kind === "wildcard" ? max - min + 1 : term.to - term.from + 1;
    return term.step > 1 && span % term.step !== 0;
  });
}

function unevenStepFields(ast: CronAst): FieldName[] {
  return [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]
    .filter((field) => unevenStepTerms(field).length > 0)
    .map((field) => field.field);
}

function matches(predicate: WarningPredicate, ast: CronAst): boolean {
  if (predicate.kind === "always") return true;
  if (predicate.kind === "never-fires") return neverFiresReason(ast) !== null;
  if (predicate.kind === "sub-minimum-interval") return firesMoreOftenThanEveryFiveMinutes(ast);
  if (predicate.kind === "uneven-step") return unevenStepFields(ast).length > 0;
  return predicate.fields.every((field) => isRestricted(ast[field]));
}

function messageFor(warning: WarningDefinition, ast: CronAst): string {
  if (warning.messageKind === "static") return warning.message;
  if (warning.messageKind === "never-fires") return neverFiresReason(ast) ?? warning.message;
  const details = [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek].flatMap(
    (field) =>
      unevenStepTerms(field).map((term) => {
        const { min, max } = FIELD_RANGES[field.field];
        const from = term.kind === "wildcard" ? min : term.from;
        const to = term.kind === "wildcard" ? max : term.to;
        const last = from + Math.floor((to - from) / term.step) * term.step;
        return `${field.field} ${term.kind === "wildcard" ? `*/${term.step}` : `${from}-${to}/${term.step}`} fires at ${from}, ..., ${last}, then ${from} after ${term.step - (to - last)} units`;
      }),
  );
  return `The ${details.join("; ")} and resets at the field boundary.`;
}

function activate(warning: WarningDefinition, ast: CronAst): ActiveWarning {
  return {
    id: warning.id,
    message: messageFor(warning, ast),
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
      warning.rank !== "contextual" && !warning.suppressed && matches(warning.predicate, ast),
  ).map((warning) => activate(warning, ast));
}

export const CONTEXTUAL_NOTES = WARNINGS.filter((warning) => warning.rank === "contextual");
