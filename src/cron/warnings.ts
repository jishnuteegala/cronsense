import type { CronAst } from "./parse";
import { minimumIntervalMinutes } from "./firings";

export interface WarningDefinition {
  id: string;
  predicate: (ast: CronAst) => boolean;
  message: string;
  verifiedOn: string;
  sourceUrl: string;
  sourcePath: string;
}

export interface ActiveWarning {
  id: string;
  message: string;
  verifiedOn: string;
  sourceUrl: string;
  sourcePath: string;
}

export const WARNINGS: WarningDefinition[] = [
  {
    id: "sub-minimum-interval",
    predicate: (ast) => {
      const min = minimumIntervalMinutes(ast);
      return min !== null && min < 5;
    },
    message:
      'GitHub docs: "The shortest interval you can run scheduled workflows is once every 5 minutes." This expression fires more often; the docs do not say what happens to such an expression, so the outcome on GitHub Actions is undocumented.',
    verifiedOn: "2026-07-24",
    sourceUrl:
      "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule",
    sourcePath: "data/reusables/repositories/actions-scheduled-workflow-example.md",
  },
];

export function evaluateWarnings(ast: CronAst): ActiveWarning[] {
  return WARNINGS.filter((warning) => warning.predicate(ast)).map(
    ({ id, message, verifiedOn, sourceUrl, sourcePath }) => ({
      id,
      message,
      verifiedOn,
      sourceUrl,
      sourcePath,
    }),
  );
}
