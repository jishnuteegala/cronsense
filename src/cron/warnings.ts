export type WarningId =
  | "dom-dow-or-semantics"
  | "uneven-step-reset"
  | "never-fires"
  | "sub-minimum-interval"
  | "high-load-delay-drop"
  | "inactivity-pause";

export type WarningPredicate =
  | { kind: "both-restricted"; fields: readonly ["dayOfMonth", "dayOfWeek"] }
  | { kind: "uneven-step" }
  | { kind: "never-fires" }
  | { kind: "sub-minimum-interval" }
  | { kind: "always" };

export type WarningMessage = "static" | "uneven-step" | "never-fires";

export interface WarningDefinition {
  id: WarningId;
  predicate: WarningPredicate;
  messageKind: WarningMessage;
  message: string;
  quotes: readonly string[];
  verifiedOn: string;
  sourceUrl: string;
  sourcePaths: readonly string[];
  rank: "diagnostic" | "informational" | "contextual";
  suppressed?: boolean;
  empiricalGate?: { sourceTicket: number; closesOn: string };
  emphasiseWhen?: { field: "minute"; includes: number };
}

const SCHEDULE_URL =
  "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule";
const VERIFIED_ON = "2026-07-24";

export const WARNINGS: readonly WarningDefinition[] = [
  {
    id: "dom-dow-or-semantics",
    predicate: { kind: "both-restricted", fields: ["dayOfMonth", "dayOfWeek"] },
    messageKind: "static",
    message:
      "Empirical verification is required before this warning is shown. GitHub does not document how restricted day-of-month and day-of-week fields combine; the linked POSIX crontab specification implies OR semantics.",
    quotes: [],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: [
      "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
    ],
    rank: "diagnostic",
    suppressed: true,
    empiricalGate: { sourceTicket: 9, closesOn: "2026-07-31" },
  },
  {
    id: "uneven-step-reset",
    predicate: { kind: "uneven-step" },
    messageKind: "uneven-step",
    message: "{details}.",
    quotes: [],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/repositories/actions-scheduled-workflow-example.md"],
    rank: "diagnostic",
  },
  {
    id: "never-fires",
    predicate: { kind: "never-fires" },
    messageKind: "never-fires",
    message: "{reason}",
    quotes: [],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/repositories/cron.md"],
    rank: "diagnostic",
  },
  {
    id: "sub-minimum-interval",
    predicate: { kind: "sub-minimum-interval" },
    messageKind: "static",
    message:
      "This expression fires more often than the documented minimum interval; the docs do not say what happens to such an expression.",
    quotes: ["The shortest interval you can run scheduled workflows is once every 5 minutes."],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/repositories/actions-scheduled-workflow-example.md"],
    rank: "diagnostic",
  },
  {
    id: "high-load-delay-drop",
    predicate: { kind: "always" },
    messageKind: "static",
    message: "Scheduled runs can be delayed or dropped during high load.",
    quotes: [
      "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour.",
      "If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.",
    ],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/actions/schedule-delay.md"],
    rank: "informational",
    emphasiseWhen: { field: "minute", includes: 0 },
  },
  {
    id: "inactivity-pause",
    predicate: { kind: "always" },
    messageKind: "static",
    message:
      "This applies to public repositories; GitHub does not document an equivalent 60-day pause for private repositories.",
    quotes: [
      "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
    ],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: [
      "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
      "data/reusables/actions/scheduled-workflows-disabled.md",
    ],
    rank: "contextual",
  },
];
