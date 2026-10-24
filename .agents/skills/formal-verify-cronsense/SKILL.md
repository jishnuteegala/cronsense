---
name: formal-verify-cronsense
description: "Verify cronsense's firing engine (src/cron/firings.ts) against an independent oracle - nextFirings output must equal a linear day-scan enumeration, canEverFire must match brute-force satisfiability over a Gregorian cycle, and minimumIntervalMinutes must equal the true minimum gap. Run after any change to firings.ts or parse.ts field semantics."
---

# Formal verify: cronsense firing engine

## What it proves

`nextFirings` is the number the whole product shows: "your workflow fires at these times." If it skips a firing, emits one the expression does not allow, or orders them wrong, the user learns their deploy ships at the wrong time. `canEverFire` guards the "this will never run" warning - a false positive says Feb 31 fires; a false negative says a real schedule is dead. The subtle risk is DOM/DOW semantics: GitHub unions plain restricted fields (`0 0 15 * MON` = the 15th OR Mondays) but intersects when a field came from `*/n` - a one-character `||`→`&&` change silently halves the schedule.

`check.test.ts` runs the **real** functions against an independent spec: per-term membership predicates and a linear day scan (every day, no skipping logic) that shares no code with `firings.ts`. Corpus: ~120 combinatorially sampled expressions over all field grammars plus 15 curated edge cases (Feb 29/31, union-vs-intersection pairs, multi-decade-gap schedules), each at 3 `from` dates including pre-leap and the non-leap century 2100.

## Run

```bash
pnpm vitest run .agents/skills/formal-verify-cronsense/check.test.ts
```

Uses the repo's vitest (required - the src imports are extensionless, so plain `node` cannot resolve them). ~5s, exits nonzero with the full mismatch list.

## Coverage record

| Covered               | Functions                                             | Oracle                                        |
| --------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `src/cron/firings.ts` | `nextFirings`                                         | day-scan enumeration, count=5                 |
| `src/cron/firings.ts` | `canEverFire`, `neverFiresReason`                     | 400-year cycle satisfiability scan            |
| `src/cron/firings.ts` | `minimumIntervalMinutes`                              | full-cycle minimum gap (10-expression subset) |
| `src/cron/firings.ts` | `firesMoreOftenThanEveryFiveMinutes`                  | consistency with `minimumIntervalMinutes`     |
| `src/cron/parse.ts`   | `dayCombination`, `isRestricted`, `hasWildcardOrigin` | via the day-semantics cases above             |

**Sync commit:** `3b882d5` (2026-10-24). Move this forward only after re-running the check and confirming the oracle describes the code at the new commit.

Not covered, on purpose: `parseCron` syntax edge cases (the corpus only exercises it as the input front door), `analyze.ts`/`warnings.ts`/`translate.ts`, and all rendering. DST does not exist in this domain - GitHub Actions cron is UTC-only.

## Reading a failure

Failures print `expr @from: got [...] want [...]` - ISO timestamps line up 1:1. If the oracle's list is the schedule the expression actually describes (check it by hand - the oracle is ~20 lines of obvious code), `firings.ts` regressed. If the oracle is wrong, the `fieldMatches`/`dayMatchesSpec` spec block misstates the documented semantics - fix the check, not the code.

## Updating the verification

When a change is intended (new field syntax, different day semantics, a new helper - evidence in the change: tests, commit message, docs), update all of: the corpus lists, `fieldMatches`/`dayMatchesSpec`, and the oracle bounds. Then break the code the way the property guards against (the `||`→`&&` flip in `dayMatches` is the canonical break) and confirm a failure appears before restoring. Record the new sync commit above.
