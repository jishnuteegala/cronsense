import type { CronAst, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES, hasWildcardOrigin, isRestricted } from "./parse";

export function expandField(field: FieldAst): Set<number> {
  const { min, max } = FIELD_RANGES[field.field];
  const values = new Set<number>();
  for (const term of field.terms) {
    if (term.kind === "wildcard") {
      for (let v = min; v <= max; v += term.step) {
        values.add(v);
      }
    } else if (term.kind === "value") {
      values.add(term.value);
    } else {
      for (let v = term.from; v <= term.to; v += term.step) {
        values.add(v);
      }
    }
  }
  return values;
}

export interface ExpandedCron {
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
  domRestricted: boolean;
  dowRestricted: boolean;
  domWildcardOrigin: boolean;
  dowWildcardOrigin: boolean;
}

export function expandCron(ast: CronAst): ExpandedCron {
  return {
    minutes: expandField(ast.minute),
    hours: expandField(ast.hour),
    daysOfMonth: expandField(ast.dayOfMonth),
    months: expandField(ast.month),
    daysOfWeek: expandField(ast.dayOfWeek),
    domRestricted: isRestricted(ast.dayOfMonth),
    dowRestricted: isRestricted(ast.dayOfWeek),
    domWildcardOrigin: hasWildcardOrigin(ast.dayOfMonth),
    dowWildcardOrigin: hasWildcardOrigin(ast.dayOfWeek),
  };
}

export function usesDayUnion(ast: CronAst): boolean {
  return !hasWildcardOrigin(ast.dayOfMonth) && !hasWildcardOrigin(ast.dayOfWeek);
}

function dayMatches(expanded: ExpandedCron, date: Date): boolean {
  const dom = date.getUTCDate();
  const dow = date.getUTCDay();
  const domMatch = expanded.daysOfMonth.has(dom);
  const dowMatch = expanded.daysOfWeek.has(dow);
  if (!expanded.domWildcardOrigin && !expanded.dowWildcardOrigin) {
    return domMatch || dowMatch;
  }
  return domMatch && dowMatch;
}

// The Gregorian calendar repeats exactly every 400 years (146097 days, which is
// divisible by 7), so any satisfiable (month, day-of-month, day-of-week) pattern
// matches at least once in every 400-year window. Searching up to 400 years past
// the previous firing (or the start) is therefore provably sufficient for 5-field
// cron: canEverFire filters unsatisfiable expressions, and every satisfiable
// expression fires within the window. This covers sparse schedules such as
// "0 0 */31 2 MON" (Feb 1 on a Monday, gaps of up to 11 years) and leap-day
// schedules spanning the non-leap century year 2100 (gaps of up to 8 years).
const MAX_YEARS_PER_FIRING = 400;

// Maximum timestamp representable by a JavaScript Date (ECMA-262: 8.64e15 ms).
const MAX_DATE_TIME = 8640000000000000;

function utcDate(year: number, monthIndex: number, day: number, hour = 0, minute = 0): Date {
  const date = new Date(Date.UTC(2000, monthIndex, day, hour, minute));
  date.setUTCFullYear(year + (date.getUTCFullYear() - 2000));
  return date;
}

// Clamped to the Date range: near the upper representable boundary the
// 400-year horizon would otherwise overflow to an invalid Date (NaN) and
// silently disable the search.
function horizonLimit(year: number): number {
  const time = utcDate(year + MAX_YEARS_PER_FIRING, 0, 1).getTime();
  return Number.isNaN(time) ? MAX_DATE_TIME : Math.min(time, MAX_DATE_TIME);
}

const MONTH_MAX_DAYS = new Map<number, number>([
  [1, 31],
  [2, 29],
  [3, 31],
  [4, 30],
  [5, 31],
  [6, 30],
  [7, 31],
  [8, 31],
  [9, 30],
  [10, 31],
  [11, 30],
  [12, 31],
]);

function domFitsSomeMonth(expanded: ExpandedCron): boolean {
  return [...expanded.months].some((month) => {
    const maxDays = MONTH_MAX_DAYS.get(month) ?? 31;
    return [...expanded.daysOfMonth].some((day) => day <= maxDays);
  });
}

export function canEverFire(ast: CronAst): boolean {
  const expanded = expandCron(ast);
  if (expanded.minutes.size === 0 || expanded.hours.size === 0 || expanded.months.size === 0) {
    return false;
  }
  if (usesDayUnion(ast)) {
    return (
      (expanded.daysOfMonth.size > 0 && domFitsSomeMonth(expanded)) || expanded.daysOfWeek.size > 0
    );
  }
  if (expanded.daysOfWeek.size === 0) return false;
  if (expanded.daysOfMonth.size === 0) return false;
  return domFitsSomeMonth(expanded);
}

export function neverFiresReason(ast: CronAst): string | null {
  if (canEverFire(ast)) return null;
  const expanded = expandCron(ast);
  if (expanded.daysOfMonth.size > 0 && !domFitsSomeMonth(expanded)) {
    const months = [...expanded.months].sort((a, b) => a - b);
    const days = [...expanded.daysOfMonth].sort((a, b) => a - b);
    return `this expression will never fire: day-of-month ${days.join(", ")} never occurs in month ${months.join(", ")}`;
  }
  return "this expression will never fire: the field constraints admit no date";
}

export function nextFirings(ast: CronAst, from: Date, count: number): Date[] {
  const expanded = expandCron(ast);
  const results: Date[] = [];
  if (!Number.isSafeInteger(count) || count <= 0) return results;
  if (Number.isNaN(from.getTime())) return results;
  if (!canEverFire(ast)) return results;
  const sortedMinutes = [...expanded.minutes].sort((a, b) => a - b);
  const sortedHours = [...expanded.hours].sort((a, b) => a - b);
  const start = utcDate(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    from.getUTCHours(),
    from.getUTCMinutes() + 1,
  );
  let limit = horizonLimit(start.getUTCFullYear());
  const day = utcDate(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  let isFirstDay = true;
  while (day.getTime() <= limit && results.length < count) {
    const month = day.getUTCMonth() + 1;
    if (!expanded.months.has(month)) {
      day.setUTCMonth(day.getUTCMonth() + 1, 1);
      isFirstDay = false;
      continue;
    }
    if (dayMatches(expanded, day)) {
      const startHour = isFirstDay ? start.getUTCHours() : 0;
      const startMinute = isFirstDay ? start.getUTCMinutes() : 0;
      for (const hour of sortedHours) {
        if (hour < startHour) continue;
        for (const minute of sortedMinutes) {
          if (hour === startHour && isFirstDay && minute < startMinute) continue;
          const firing = utcDate(
            day.getUTCFullYear(),
            day.getUTCMonth(),
            day.getUTCDate(),
            hour,
            minute,
          );
          if (Number.isNaN(firing.getTime())) return results;
          results.push(firing);
          if (results.length >= count) return results;
          limit = horizonLimit(day.getUTCFullYear());
        }
      }
    }
    day.setUTCDate(day.getUTCDate() + 1);
    isFirstDay = false;
  }
  return results;
}

const GREGORIAN_CYCLE_DAYS = 146097;

function sortedDayTimes(expanded: ExpandedCron): number[] {
  const times: number[] = [];
  for (const hour of expanded.hours) {
    for (const minute of expanded.minutes) {
      times.push(hour * 60 + minute);
    }
  }
  return times.sort((a, b) => a - b);
}

function minWithinDayGap(times: number[]): number {
  let min = Infinity;
  for (let i = 1; i < times.length; i += 1) {
    const gap = (times[i] ?? 0) - (times[i - 1] ?? 0);
    if (gap < min) min = gap;
  }
  return min;
}

export function minimumIntervalMinutes(ast: CronAst): number | null {
  if (!canEverFire(ast)) return null;
  const expanded = expandCron(ast);
  const times = sortedDayTimes(expanded);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  if (firstTime === undefined || lastTime === undefined) return null;
  const minWithinDay = minWithinDayGap(times);
  const day = new Date(Date.UTC(2000, 0, 1));
  let firstMatch: number | null = null;
  let lastMatch: number | null = null;
  let minDayGap = Infinity;
  for (let i = 0; i < GREGORIAN_CYCLE_DAYS; i += 1) {
    if (expanded.months.has(day.getUTCMonth() + 1) && dayMatches(expanded, day)) {
      if (lastMatch !== null) {
        const gap = i - lastMatch;
        if (gap < minDayGap) minDayGap = gap;
      }
      if (firstMatch === null) firstMatch = i;
      lastMatch = i;
      if (minDayGap === 1) break;
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  if (firstMatch === null || lastMatch === null) return null;
  if (minDayGap !== 1) {
    const wrapGap = firstMatch + GREGORIAN_CYCLE_DAYS - lastMatch;
    if (wrapGap < minDayGap) minDayGap = wrapGap;
  }
  const crossDay = minDayGap * 1440 - (lastTime - firstTime);
  return Math.min(minWithinDay, crossDay);
}

// Fast predicate for the sub-minimum-interval warning: avoids the full
// Gregorian-cycle day scan on the render path whenever the answer is
// decidable from within-day gaps alone.
export function firesMoreOftenThanEveryFiveMinutes(ast: CronAst): boolean {
  if (!canEverFire(ast)) return false;
  const expanded = expandCron(ast);
  const times = sortedDayTimes(expanded);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  if (firstTime === undefined || lastTime === undefined) return false;
  if (minWithinDayGap(times) < 5) return true;
  if (1440 - (lastTime - firstTime) >= 5) return false;
  const min = minimumIntervalMinutes(ast);
  return min !== null && min < 5;
}

export const DOM_DOW_PROVISIONAL_NOTE =
  "This expression restricts both day-of-month and day-of-week. GitHub does not document how these combine; the firing times below assume the POSIX/Vixie OR union (a day matching either field fires) and are provisional until empirically verified against GitHub Actions via the verification repo (ticket #9), at which point this may change.";

export const DOM_DOW_INTERSECTION_PROVISIONAL_NOTE =
  'This expression combines a wildcard-origin day field ("*" or "*/N") with the other day field. Following Vixie cron source precedent, wildcard-origin fields retain wildcard status and the two day fields intersect (a day must match both). GitHub does not document this behaviour; the firing times below are provisional until empirically verified against GitHub Actions via the verification repo (ticket #9), at which point this may change.';

export function domDowProvisionalNote(ast: CronAst): string | null {
  if (!isRestricted(ast.dayOfMonth) || !isRestricted(ast.dayOfWeek)) {
    return null;
  }
  return usesDayUnion(ast) ? DOM_DOW_PROVISIONAL_NOTE : DOM_DOW_INTERSECTION_PROVISIONAL_NOTE;
}

export function restrictedFields(ast: CronAst): FieldName[] {
  const fields: FieldName[] = [];
  for (const field of [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]) {
    if (isRestricted(field)) fields.push(field.field);
  }
  return fields;
}
