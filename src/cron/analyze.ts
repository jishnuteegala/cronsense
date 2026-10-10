import { expandCron, neverFiresReason, nextFirings } from "./firings";
import type { ParseResult } from "./parse";
import { type Translation, translate } from "./translate";
import { type ActiveWarning, evaluateWarnings } from "./warning-engine";

export interface Analysis {
  translation: Translation;
  provisionalNotes: string[];
  never: string | null;
  firings: Date[];
  warnings: ActiveWarning[];
}

export function analyze(result: Extract<ParseResult, { ok: true }>, from: Date): Analysis {
  const expanded = expandCron(result.ast);
  const never = neverFiresReason(result.ast, expanded);
  return {
    translation: translate(result.ast),
    provisionalNotes: result.provisionalNotes,
    never,
    warnings: evaluateWarnings(result.ast, expanded),
    firings: never ? [] : nextFirings(result.ast, from, 10, expanded),
  };
}
