import type { CronAst, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES, isRestricted } from "./parse";
import { firesMoreOftenThanEveryFiveMinutes, neverFiresReason } from "./firings";

type WarningId =
  | "dom-dow-or-semantics"
  | "uneven-step-reset"
  | "never-fires"
  | "sub-minimum-interval"
  | "high-load-delay-drop"
  | "inactivity-pause";

type Predicate =
  | { kind: "both-restricted"; fields: ["dayOfMonth", "dayOfWeek"] }
  | { kind: "uneven-step" }
  | { kind: "never-fires" }
  | { kind: "sub-minimum-interval" }
  | { kind: "always" };

interface WarningDefinition {
  id: WarningId;
  predicate: Predicate;
  message: string;
  verifiedOn: string;
  sourceUrl: string;
  sourcePath: string;
  rank: "diagnostic" | "informational" | "contextual";
  suppressed?: boolean;
}

export interface ActiveWarning {
  id: WarningId;
  message: string;
  verifiedOn: string;
  sourceUrl: string;
  sourcePath: string;
  rank: WarningDefinition["rank"];
  emphasised: boolean;
}

const SCHEDULE_URL =
  "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule";
const VERIFIED_ON = "2026-07-24";

export const WARNINGS: readonly WarningDefinition[] = [
  {
    id: "dom-dow-or-semantics",
    predicate: { kind: "both-restricted", fields: ["dayOfMonth", "dayOfWeek"] },
    message:
      "Empirical verification is required before this warning is shown. GitHub does not document how restricted day-of-month and day-of-week fields combine; the linked POSIX crontab specification implies OR semantics.",
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
    rank: "diagnostic",
    suppressed: true,
  },
  {
    id: "uneven-step-reset",
    predicate: { kind: "uneven-step" },
    message: "does not evenly divide its field range, so it resets at the field boundary.",
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "data/reusables/repositories/actions-scheduled-workflow-example.md",
    rank: "diagnostic",
  },
  {
    id: "never-fires",
    predicate: { kind: "never-fires" },
    message: "this expression will never fire: the field constraints admit no date",
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "data/reusables/repositories/cron.md",
    rank: "diagnostic",
  },
  {
    id: "sub-minimum-interval",
    predicate: { kind: "sub-minimum-interval" },
    message:
      'GitHub docs: "The shortest interval you can run scheduled workflows is once every 5 minutes." This expression fires more often; the docs do not say what happens to such an expression.',
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "data/reusables/repositories/actions-scheduled-workflow-example.md",
    rank: "diagnostic",
  },
  {
    id: "high-load-delay-drop",
    predicate: { kind: "always" },
    message:
      'GitHub docs: "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour." "If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour."',
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "data/reusables/actions/schedule-delay.md",
    rank: "informational",
  },
  {
    id: "inactivity-pause",
    predicate: { kind: "always" },
    message:
      'GitHub docs: "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days." This applies to public repositories; GitHub does not document an equivalent 60-day pause for private repositories.',
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePath: "data/reusables/actions/scheduled-workflows-disabled.md",
    rank: "contextual",
  },
];

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

function matches(predicate: Predicate, ast: CronAst): boolean {
  if (predicate.kind === "always") return true;
  if (predicate.kind === "never-fires") return neverFiresReason(ast) !== null;
  if (predicate.kind === "sub-minimum-interval") {
    return firesMoreOftenThanEveryFiveMinutes(ast);
  }
  if (predicate.kind === "uneven-step") return unevenStepFields(ast).length > 0;
  return predicate.fields.every((field) => isRestricted(ast[field]));
}

function messageFor(warning: WarningDefinition, ast: CronAst): string {
  if (warning.id === "never-fires") return neverFiresReason(ast) ?? warning.message;
  if (warning.id !== "uneven-step-reset") return warning.message;
  const fields = unevenStepFields(ast);
  const details = fields.map((field) => {
    const term = ast[field].terms.find(
      (candidate) => candidate.kind === "wildcard" && candidate.explicitStep,
    );
    return `${field} ${term?.kind === "wildcard" ? `*/${term.step}` : ""}`;
  });
  return `The ${details.join(" and ")} step ${warning.message}`;
}

export function evaluateWarnings(ast: CronAst): ActiveWarning[] {
  return WARNINGS.filter((warning) => !warning.suppressed && matches(warning.predicate, ast)).map(
    (warning) => ({
      id: warning.id,
      message: messageFor(warning, ast),
      verifiedOn: warning.verifiedOn,
      sourceUrl: warning.sourceUrl,
      sourcePath: warning.sourcePath,
      rank: warning.rank,
      emphasised:
        warning.id === "high-load-delay-drop" &&
        isRestricted(ast.minute) &&
        ast.minute.terms.some((term) => term.kind === "value" && term.value === 0),
    }),
  );
}
