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
  gotcha: GotchaContent;
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
    gotcha: {
      slug: "dom-dow-or-semantics",
      title: "Day-of-month and day-of-week combine with OR (pending verification)",
      quote: "Use POSIX cron syntax to schedule workflows to run at specific times.",
      explanation:
        "When both the day-of-month and day-of-week fields are restricted (neither is `*`), how they combine decides which days fire. GitHub does not document whether the fields combine with OR or AND. The docs only link to the POSIX crontab specification, which specifies OR when both fields are restricted, so a day matching either field would fire. This is an inference from the linked POSIX spec, not a documented GitHub behaviour. This warning is empirically gated: it does not appear in the tool until the verification repository confirms GitHub's actual behaviour. The observation window closes on 2026-07-31; until confirmed, treat the OR reading as a POSIX inference only.",
    },
    suppressed: true,
    empiricalGate: { sourceTicket: 9, closesOn: "2026-07-31" },
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
    gotcha: {
      slug: "uneven-step-reset",
      title: "Uneven `*/N` steps reset at the field boundary",
      quote:
        "Cron syntax has five fields separated by a space, and each field represents a unit of time.",
      explanation:
        "A step value `*/N` counts from the start of the field's range and resets when the range ends. When `N` does not evenly divide the field's span, the step from the last matching value back to the first is shorter than `N`. For example, `*/7` in the minute field fires at :00, :07, :14, :21, :28, :35, :42, :49, :56, then resets to :00 of the next hour, leaving a 4-minute gap instead of 7. This is arithmetic over the documented step operator; the boundary reset is verified in the deterministic edge-case matrix.",
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
    gotcha: {
      slug: "never-fires",
      title: "This expression will never fire",
      quote:
        "minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12 or JAN-DEC), day of the week (0 - 6 or SUN-SAT)",
      explanation:
        "Some expressions describe a date-time that cannot exist, so the schedule never runs. This happens when the field constraints admit no satisfiable combination, for example day-of-month 30 in February, or a day-of-month and day-of-week pairing that can never co-occur. Cronsense reports which fields conflict. This is pure computation over the documented field ranges.",
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
    gotcha: {
      slug: "sub-minimum-interval",
      title: "Firing more often than every 5 minutes",
      quote: "The shortest interval you can run scheduled workflows is once every 5 minutes.",
      explanation:
        "This expression's shortest gap between consecutive firings is under 5 minutes. GitHub documents the 5-minute minimum but does not document what happens to an expression that asks for a shorter interval: whether it is rejected, coerced, or throttled. Cronsense reports only the documented minimum and does not invent an outcome. The verification repository establishes the actual behaviour, and this wording is updated to the observed result, marked as empirical, once known.",
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
    gotcha: {
      slug: "high-load-delay-drop",
      title: "Scheduled runs can be delayed or dropped under high load",
      quote:
        "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.",
      explanation:
        "Scheduled runs are not guaranteed to start on time. GitHub documents that the `schedule` event can be delayed under high load, that high-load times include the start of every hour, and that sufficiently high load can cause queued jobs to be dropped. Expressions that fire at the start of the hour (minute 0) are most exposed. To reduce the chance of delay, schedule the workflow at a different time of the hour. GitHub documents no delay bound; any specific delay figure repeated in community discussions is undocumented lore, not a documented value.",
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
    gotcha: {
      slug: "inactivity-pause",
      title: "Scheduled workflows pause after 60 days of inactivity",
      quote:
        "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.",
      explanation:
        "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days. This is documented for public repositories only; GitHub does not document an equivalent 60-day pause for private repositories, so Cronsense does not claim one. This is a contextual note about repository state, not a diagnosis of the expression itself.",
    },
  },
];
