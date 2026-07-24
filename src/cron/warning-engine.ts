import type { CronAst, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES, isRestricted } from "./parse";
import { firesMoreOftenThanEveryFiveMinutes, neverFiresReason } from "./firings";
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

function hasUnevenStep(field: FieldAst): boolean {
  const { min, max } = FIELD_RANGES[field.field];
  const span = max - min + 1;
  return field.terms.some(
    (term) => term.kind === "wildcard" && term.explicitStep && span % term.step !== 0,
  );
}

function unevenStepFields(ast: CronAst): FieldName[] {
  return [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]
    .filter(hasUnevenStep)
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
  if (warning.id === "never-fires") return neverFiresReason(ast) ?? warning.message;
  if (warning.id !== "uneven-step-reset") return warning.message;
  const details = unevenStepFields(ast).map((field) => {
    const term = ast[field].terms.find(
      (candidate) => candidate.kind === "wildcard" && candidate.explicitStep,
    );
    return `${field} ${term?.kind === "wildcard" ? `*/${term.step}` : ""}`;
  });
  return `The ${details.join(" and ")} step ${warning.message}`;
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
      warning.id === "high-load-delay-drop" &&
      isRestricted(ast.minute) &&
      ast.minute.terms.some((term) => term.kind === "value" && term.value === 0),
  };
}

export function evaluateWarnings(ast: CronAst): ActiveWarning[] {
  return WARNINGS.filter((warning) => !warning.suppressed && matches(warning.predicate, ast)).map(
    (warning) => activate(warning, ast),
  );
}

export const INACTIVITY_NOTE = WARNINGS.find((warning) => warning.id === "inactivity-pause");
