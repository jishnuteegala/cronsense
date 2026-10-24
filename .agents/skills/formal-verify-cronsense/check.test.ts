import { describe, expect, it } from "vitest";
import { parseCron, type CronAst, type FieldAst } from "../../../src/cron/parse";
import {
  canEverFire,
  firesMoreOftenThanEveryFiveMinutes,
  minimumIntervalMinutes,
  neverFiresReason,
  nextFirings,
} from "../../../src/cron/firings";

// Oracle-based verifier for src/cron/firings.ts.
// nextFirings/canEverFire/minimumIntervalMinutes are checked against an
// independent spec: direct per-term membership predicates plus a linear
// day scan (no skipping logic, no shared code with firings.ts).
// Failures print the expression, the from date, and the divergent firing.

const CYCLE_DAYS = 146097; // one full Gregorian cycle (400 years, divisible by 7)
const ORACLE_CYCLES = 6;
const COUNT = 5;

function ast(input: string): CronAst {
  const result = parseCron(input);
  if (!result.ok) throw new Error(`parse failed for "${input}": ${result.error}`);
  return result.ast;
}

// --- independent spec -----------------------------------------------------

// Direct term membership: v matches a term iff it is a listed value, inside a
// stepped range, or on a wildcard step grid.
// Bounds restated locally on purpose: importing FIELD_RANGES would let one
// wrong edit corrupt the implementation and the oracle identically.
const FIELD_BOUNDS: Record<FieldAst["field"], { min: number; max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

function fieldMatches(field: FieldAst, v: number): boolean {
  const { min, max } = FIELD_BOUNDS[field.field];
  return field.terms.some((t) => {
    if (t.kind === "wildcard") return v >= min && v <= max && (v - min) % t.step === 0;
    if (t.kind === "value") return v === t.value;
    return v >= t.from && v <= t.to && (v - t.from) % t.step === 0;
  });
}

const isBareStar = (f: FieldAst) => f.terms.some((t) => t.kind === "wildcard" && !t.explicitStep);
const hasSteppedWildcard = (f: FieldAst) => f.terms.some((t) => t.kind === "wildcard");

// Documented day semantics: when only one of dom/dow is restricted it decides;
// both restricted intersect iff either field came from a */n wildcard,
// otherwise they union (plain cron behavior).
function dayMatchesSpec(a: CronAst, d: Date): boolean {
  const domR = !isBareStar(a.dayOfMonth);
  const dowR = !isBareStar(a.dayOfWeek);
  if (!domR && !dowR) return true;
  const dom = fieldMatches(a.dayOfMonth, d.getUTCDate());
  const dow = fieldMatches(a.dayOfWeek, d.getUTCDay());
  if (domR !== dowR) return domR ? dom : dow;
  return hasSteppedWildcard(a.dayOfMonth) || hasSteppedWildcard(a.dayOfWeek)
    ? dom && dow
    : dom || dow;
}

function satisfies(a: CronAst, d: Date): boolean {
  return (
    fieldMatches(a.minute, d.getUTCMinutes()) &&
    fieldMatches(a.hour, d.getUTCHours()) &&
    fieldMatches(a.month, d.getUTCMonth() + 1) &&
    dayMatchesSpec(a, d)
  );
}

// Linear day scan: every day in the window, all satisfying times emitted in
// order. Stops at COUNT results, or ORACLE_CYCLES cycles. Any satisfiable
// (month, dom, dow) combo occurs at least once per cycle, so one cycle is
// enough to decide satisfiability and a few cycles cover even the sparsest
// real schedules.
function oracleFirings(a: CronAst, from: Date): Date[] {
  const results: Date[] = [];
  const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 0; i < ORACLE_CYCLES * CYCLE_DAYS && results.length < COUNT; i++) {
    if (fieldMatches(a.month, day.getUTCMonth() + 1) && dayMatchesSpec(a, day)) {
      for (let h = 0; h <= 23; h++) {
        if (!fieldMatches(a.hour, h)) continue;
        for (let m = 0; m <= 59; m++) {
          if (!fieldMatches(a.minute, m)) continue;
          const t = new Date(
            Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m),
          );
          if (t.getTime() > from.getTime()) results.push(t);
          if (results.length >= COUNT) break;
        }
        if (results.length >= COUNT) break;
      }
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return results;
}

// Minimum consecutive gap over one cycle, lazily emitted, O(1) memory.
function oracleMinInterval(a: CronAst): number | null {
  const day = new Date(Date.UTC(2000, 0, 1));
  let prev: number | null = null;
  let first: number | null = null;
  let last: number | null = null;
  let min = Infinity;
  for (let i = 0; i < CYCLE_DAYS; i++) {
    if (fieldMatches(a.month, day.getUTCMonth() + 1) && dayMatchesSpec(a, day)) {
      for (let h = 0; h <= 23; h++) {
        if (!fieldMatches(a.hour, h)) continue;
        for (let m = 0; m <= 59; m++) {
          if (!fieldMatches(a.minute, m)) continue;
          const t = day.getTime() + h * 3600000 + m * 60000;
          if (first === null) first = t;
          if (prev !== null) min = Math.min(min, (t - prev) / 60000);
          prev = t;
          last = t;
        }
      }
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  if (first === null || last === null) return null;
  min = Math.min(min, (first + CYCLE_DAYS * 86400000 - last) / 60000);
  return min;
}

// --- corpus ---------------------------------------------------------------

const MIN = ["*", "*/15", "0,30", "5-25/10", "0", "45"];
const HRS = ["*", "*/6", "9", "9-17", "23"];
const DOM = ["*", "1", "15", "29", "31", "*/2", "1-15/3"];
const MON = ["*", "2", "*/3", "JAN,JUL", "12"];
const DOW = ["*", "MON", "1-5", "0", "*/2", "MON,WED"];

const corpus: string[] = [];
{
  let i = 0;
  for (const mi of MIN)
    for (const h of HRS)
      for (const d of DOM)
        for (const mo of MON)
          for (const w of DOW) {
            if (i++ % 53 === 0) corpus.push(`${mi} ${h} ${d} ${mo} ${w}`);
          }
}
corpus.push(
  "0 0 29 2 *",
  "0 0 29 2 MON",
  "0 0 31 2 *",
  "0 0 31 * *",
  "0 0 */31 2 MON",
  "*/5 9-17 1-15/2 */3 MON-FRI",
  "0 0 1 1 *",
  "*/2 */4 */3 */2 */2",
  "0 0 15 * MON",
  "0 0 */15 * MON",
  "59 23 31 12 *",
  "0 9 * * 1-5",
  "5/10 * * * *",
  "0 9/4 * * *",
  "*/1 * * * *",
  "0,59 0,23 * * *",
  "0 0 1,15 JAN-JUN *",
  "0 9 * * MON-FRI/2",
  "1,10-20/2 * * * *",
);

const FROMS = [
  new Date(Date.UTC(2026, 9, 24, 12, 34)),
  new Date(Date.UTC(2028, 1, 28, 23, 59)),
  new Date(Date.UTC(2100, 1, 28, 0, 0)),
];

const INTERVAL_SUBSET = [
  "0 0 * * *",
  "0 0 1 * *",
  "0 0 29 2 *",
  "0,30 8 * * *",
  "0 0 15 * MON",
  "0 0 */15 * MON",
  "*/20 0 * * *",
  "0 */6 * * *",
  "0 0 31 2 *",
  "10 10 10 10 *",
  "0,59 0,23 * * *",
];

// --- checks ----------------------------------------------------------------

const iso = (d: Date) => d.toISOString();

describe("formal verify: firings oracle", () => {
  it(
    "I1-I4 nextFirings equals the independent day-scan oracle on every corpus case",
    { timeout: 60000 },
    () => {
      const bad: string[] = [];
      for (const expr of corpus) {
        const a = ast(expr);
        for (const from of FROMS) {
          const got = nextFirings(a, from, COUNT);
          const want = oracleFirings(a, from);
          for (const f of got) {
            if (f.getTime() <= from.getTime())
              bad.push(`${expr} @${iso(from)}: firing ${iso(f)} not strictly after from`);
            if (!satisfies(a, f))
              bad.push(`${expr} @${iso(from)}: firing ${iso(f)} violates a field`);
          }
          for (let i = 1; i < got.length; i++) {
            const [prev, cur] = [got[i - 1], got[i]];
            if (prev !== undefined && cur !== undefined && cur.getTime() <= prev.getTime())
              bad.push(`${expr} @${iso(from)}: firings not strictly increasing at ${iso(cur)}`);
          }
          if (got.map(iso).join(",") !== want.map(iso).join(","))
            bad.push(
              `${expr} @${iso(from)}: got [${got.map(iso).join(", ")}] want [${want.map(iso).join(", ")}]`,
            );
        }
      }
      expect(bad).toEqual([]);
    },
  );

  it(
    "I5 canEverFire/neverFiresReason iff the oracle finds a match in one cycle",
    { timeout: 60000 },
    () => {
      const bad: string[] = [];
      for (const expr of corpus) {
        const a = ast(expr);
        // A match anywhere in the scan window means satisfiable; since the
        // window starts at a Gregorian-cycle boundary, every satisfiable combo
        // appears within the first 146097 days.
        const oracleSatisfiable = oracleFirings(a, new Date(Date.UTC(2000, 0, 1))).length > 0;
        if (canEverFire(a) !== oracleSatisfiable)
          bad.push(
            `${expr}: canEverFire=${canEverFire(a)} but oracle satisfiable=${oracleSatisfiable}`,
          );
        if ((neverFiresReason(a) === null) !== oracleSatisfiable)
          bad.push(
            `${expr}: neverFiresReason null=${neverFiresReason(a) === null} but satisfiable=${oracleSatisfiable}`,
          );
      }
      expect(bad).toEqual([]);
    },
  );

  it(
    "I6 minimumIntervalMinutes equals the oracle cycle gap on the subset",
    { timeout: 60000 },
    () => {
      const bad: string[] = [];
      for (const expr of INTERVAL_SUBSET) {
        const a = ast(expr);
        const got = minimumIntervalMinutes(a);
        const want = oracleMinInterval(a);
        if (got !== want) bad.push(`${expr}: got ${got} want ${want}`);
      }
      expect(bad).toEqual([]);
    },
  );

  it(
    "I7 firesMoreOftenThanEveryFiveMinutes is consistent with minimumIntervalMinutes",
    { timeout: 60000 },
    () => {
      const bad: string[] = [];
      for (const expr of corpus) {
        const a = ast(expr);
        const min = minimumIntervalMinutes(a);
        const want = min !== null && min < 5;
        if (firesMoreOftenThanEveryFiveMinutes(a) !== want)
          bad.push(`${expr}: predicate=${firesMoreOftenThanEveryFiveMinutes(a)} but min=${min}`);
      }
      expect(bad).toEqual([]);
    },
  );
});
