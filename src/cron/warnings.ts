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

export interface GotchaContent {
  slug: string;
  title: string;
  quote: string;
  explanation: string;
}

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
  provenance: "docs" | "empirical";
  gotcha: GotchaContent;
  emphasiseWhen?: { field: "minute"; includes: number };
}

const SCHEDULE_URL =
  "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule";
export const VERIFICATION_URL =
  "https://github.com/jishnuteegala/cronsense-verification/blob/main/VERIFICATION.md";
const VERIFIED_ON = "2026-07-24";

export const WARNINGS: readonly WarningDefinition[] = [
  {
    id: "dom-dow-or-semantics",
    predicate: { kind: "both-restricted", fields: ["dayOfMonth", "dayOfWeek"] },
    messageKind: "static",
    message:
      "GitHub does not document this combination. Cronsense verification empirically confirmed OR behaviour on 2026-07-27: a Monday outside the restricted day-of-month range fired, consistent with the POSIX crontab specification linked by the docs.",
    quotes: [
      "Use POSIX cron syntax to schedule workflows to run at specific times.",
      "Empirical observation: https://github.com/jishnuteegala/cronsense-verification/blob/main/VERIFICATION.md",
    ],
    verifiedOn: "2026-07-27",
    sourceUrl: SCHEDULE_URL,
    sourcePaths: [
      "content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md",
    ],
    rank: "diagnostic",
    provenance: "empirical",
    gotcha: {
      slug: "dom-dow-or-semantics",
      title: "Day-of-month and day-of-week combine with OR",
      quote: "Use POSIX cron syntax to schedule workflows to run at specific times.",
      explanation:
        "When both the day-of-month and day-of-week fields are restricted (neither is `*`), GitHub does not document whether they combine with OR or AND. The docs link to the POSIX crontab specification, which specifies OR. Cronsense verification empirically confirmed that behaviour on 2026-07-27: `0 12 1-7 * MON` fired on a Monday whose day-of-month was outside 1-7. Read the recorded observation in https://github.com/jishnuteegala/cronsense-verification/blob/main/VERIFICATION.md. This confirms GitHub behaviour while leaving clear that GitHub itself does not document the combination.",
    },
  },
  {
    id: "uneven-step-reset",
    predicate: { kind: "uneven-step" },
    messageKind: "uneven-step",
    message: "{details}.",
    quotes: [
      "You can use these operators in any of the five fields:",
      "* (any value)",
      ", (value list separator)",
      "- (range of values)",
      "/ (step values)",
    ],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/repositories/actions-scheduled-workflow-example.md"],
    rank: "diagnostic",
    provenance: "docs",
    gotcha: {
      slug: "uneven-step-reset",
      title: "Uneven `*/N` steps reset at the field boundary",
      quote: "You can use these operators in any of the five fields:",
      explanation:
        "GitHub documents the `/` step operator for all five fields. A step value `*/N` counts from the start of the field's range and resets when the range ends. When `N` does not evenly divide the field's span, the step from the last matching value back to the first is shorter than `N`. For example, `*/7` in the minute field fires at :00, :07, :14, :21, :28, :35, :42, :49, :56, then resets to :00 of the next hour, leaving a 4-minute gap instead of 7. The deterministic edge-case matrix observed this reset; its firing set was a correct superset of the predicted set. GitHub does not separately document the boundary-reset detail.",
    },
  },
  {
    id: "never-fires",
    predicate: { kind: "never-fires" },
    messageKind: "never-fires",
    message: "{reason}",
    quotes: [
      "Cron syntax has five fields separated by a space, and each field represents a unit of time.",
      "minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12 or JAN-DEC), day of the week (0 - 6 or SUN-SAT)",
    ],
    verifiedOn: VERIFIED_ON,
    sourceUrl: SCHEDULE_URL,
    sourcePaths: ["data/reusables/repositories/cron.md"],
    rank: "diagnostic",
    provenance: "docs",
    gotcha: {
      slug: "never-fires",
      title: "This expression will never fire",
      quote:
        "minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12 or JAN-DEC), day of the week (0 - 6 or SUN-SAT)",
      explanation:
        "Some expressions describe a date-time that cannot exist, so the schedule never runs. This happens when the field constraints admit no satisfiable combination, for example day-of-month 30 in February, which is an impossible calendar date. Cronsense reports which fields conflict. This is pure computation over the documented field ranges.",
    },
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
    provenance: "docs",
    gotcha: {
      slug: "sub-minimum-interval",
      title: "Firing more often than every 5 minutes",
      quote: "The shortest interval you can run scheduled workflows is once every 5 minutes.",
      explanation:
        "This expression's shortest gap between consecutive firings is under 5 minutes. GitHub documents the 5-minute minimum but does not document what happens to an expression that asks for a shorter interval: whether it is rejected, coerced, or throttled. The verification matrix observed the deterministic edge cases and high-load skips; Cronsense still does not invent a general undocumented outcome for every expression.",
    },
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
    provenance: "docs",
    gotcha: {
      slug: "high-load-delay-drop",
      title: "Scheduled runs can be delayed or dropped under high load",
      quote:
        "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.",
      explanation:
        "Scheduled runs are not guaranteed to start on time. GitHub documents that the `schedule` event can be delayed under high load, that high-load times include the start of every hour, and that sufficiently high load can cause queued jobs to be dropped. GitHub identifies the start of every hour as a high-load time, so expressions that fire at minute 0 coincide with it. During the 2026-07-24 to 2026-07-31 observation window, a `*/5` control delivered about 4.6% of its nominal runs. To reduce the chance of delay, schedule the workflow at a different time of the hour. GitHub documents no delay bound; any specific delay figure repeated in community discussions is undocumented lore, not a documented value.",
    },
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
    provenance: "docs",
    gotcha: {
      slug: "inactivity-pause",
      title:
        "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days",
      quote:
        "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
      explanation:
        "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days. This is documented for public repositories only; GitHub does not document an equivalent 60-day pause for private repositories, so Cronsense does not claim one. This is a contextual note about repository state, not a diagnosis of the expression itself.",
    },
  },
];
