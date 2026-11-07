import type { CronAst, DayCombination, FieldAst, FieldName } from "./parse";
import { FIELD_RANGES, dayCombination } from "./parse";

function rangeSet({ min, max }: (typeof FIELD_RANGES)[FieldName]): ReadonlySet<number> {
  return new Set(Array.from({ length: max - min + 1 }, (_, i) => min + i));
}

// Copying a Set is several times faster than adding the same values one by
// one, and a lone "*" is the most common field.
const FULL_FIELDS: Record<FieldName, ReadonlySet<number>> = {
  minute: rangeSet(FIELD_RANGES.minute),
  hour: rangeSet(FIELD_RANGES.hour),
  dayOfMonth: rangeSet(FIELD_RANGES.dayOfMonth),
  month: rangeSet(FIELD_RANGES.month),
  dayOfWeek: rangeSet(FIELD_RANGES.dayOfWeek),
};

export function expandField(field: FieldAst): Set<number> {
  const first = field.terms[0];
  if (field.terms.length === 1 && first?.kind === "wildcard" && first.step === 1) {
    return new Set(FULL_FIELDS[field.field]);
  }
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
  dayCombination: DayCombination;
}

export function expandCron(ast: CronAst): ExpandedCron {
  return {
    minutes: expandField(ast.minute),
    hours: expandField(ast.hour),
    daysOfMonth: expandField(ast.dayOfMonth),
    months: expandField(ast.month),
    daysOfWeek: expandField(ast.dayOfWeek),
    dayCombination: dayCombination(ast),
  };
}

function dayMatches(expanded: ExpandedCron, dom: number, dow: number): boolean {
  const domMatch = expanded.daysOfMonth.has(dom);
  const dowMatch = expanded.daysOfWeek.has(dow);
  if (expanded.dayCombination === "union") {
    return domMatch || dowMatch;
  }
  return domMatch && dowMatch;
}

const GREGORIAN_CYCLE_DAYS = 146097;

// Maximum timestamp representable by a JavaScript Date (ECMA-262: 8.64e15 ms).
const MAX_DATE_TIME = 8640000000000000;

const MINUTE_MS = 60000;
const DAY_MS = 86400000;

const EVERY_DAY = Array.from({ length: 31 }, (_, i) => i + 1);

// The Gregorian calendar repeats exactly every 400 years (146097 days, which is
// divisible by 7), so any satisfiable (month, day-of-month, day-of-week) pattern
// matches at least once in every 400-year window. Searching up to 400 years past
// the previous firing (or the start) is therefore provably sufficient for 5-field
// cron: canEverFire filters unsatisfiable expressions, and every satisfiable
// expression fires within the window. This covers sparse schedules such as
// "0 0 */31 2 MON" (Feb 1 on a Monday, gaps of up to 11 years) and leap-day
// schedules spanning the non-leap century year 2100 (gaps of up to 8 years).
function horizonLimit(yearStart: number): number {
  return Math.min(yearStart + GREGORIAN_CYCLE_DAYS * DAY_MS, MAX_DATE_TIME);
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

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysBeforeMonth(monthIndex: number, leap: boolean): number {
  return (DAYS_BEFORE_MONTH[monthIndex] ?? 0) + (leap && monthIndex > 1 ? 1 : 0);
}

function daysInMonth(monthIndex: number, leap: boolean): number {
  return monthIndex === 1 && !leap ? 28 : (MONTH_MAX_DAYS.get(monthIndex + 1) ?? 31);
}

function domFitsSomeMonth(expanded: ExpandedCron): boolean {
  return [...expanded.months].some((month) => {
    const maxDays = MONTH_MAX_DAYS.get(month) ?? 31;
    return [...expanded.daysOfMonth].some((day) => day <= maxDays);
  });
}

export function canEverFire(ast: CronAst, expanded: ExpandedCron = expandCron(ast)): boolean {
  if (expanded.minutes.size === 0 || expanded.hours.size === 0 || expanded.months.size === 0) {
    return false;
  }
  if (expanded.dayCombination === "union") {
    return (
      (expanded.daysOfMonth.size > 0 && domFitsSomeMonth(expanded)) || expanded.daysOfWeek.size > 0
    );
  }
  if (expanded.daysOfWeek.size === 0) return false;
  if (expanded.daysOfMonth.size === 0) return false;
  return domFitsSomeMonth(expanded);
}

export function neverFiresReason(
  ast: CronAst,
  expanded: ExpandedCron = expandCron(ast),
): string | null {
  if (canEverFire(ast, expanded)) return null;
  if (expanded.daysOfMonth.size > 0 && !domFitsSomeMonth(expanded)) {
    const months = [...expanded.months].sort((a, b) => a - b);
    const days = [...expanded.daysOfMonth].sort((a, b) => a - b);
    return `this expression will never fire: day-of-month ${days.join(", ")} never occurs in month ${months.join(", ")}`;
  }
  return "this expression will never fire: the field constraints admit no date";
}

export function nextFirings(
  ast: CronAst,
  from: Date,
  count: number,
  expanded: ExpandedCron = expandCron(ast),
): Date[] {
  const results: Date[] = [];
  if (!Number.isSafeInteger(count) || count <= 0) return results;
  const fromTime = from.getTime();
  if (Number.isNaN(fromTime)) return results;
  if (!canEverFire(ast, expanded)) return results;
  const sortedMinutes = [...expanded.minutes].sort((a, b) => a - b);
  const sortedHours = [...expanded.hours].sort((a, b) => a - b);
  // Outside union mode a day matches only if its day-of-month is listed, so
  // the scan visits just those days. Parsed values are in range, so 31 of them
  // are exactly EVERY_DAY.
  const candidateDays =
    expanded.dayCombination === "union" || expanded.daysOfMonth.size === EVERY_DAY.length
      ? EVERY_DAY
      : [...expanded.daysOfMonth].sort((a, b) => a - b);
  const startTime = Math.floor(fromTime / MINUTE_MS) * MINUTE_MS + MINUTE_MS;
  if (startTime > MAX_DATE_TIME) return results;
  const start = new Date(startTime);
  const startYear = start.getUTCFullYear();
  let year = startYear;
  let leap = isLeapYear(year);
  const startMonth = start.getUTCMonth();
  const startDom = start.getUTCDate();
  const startDay = Math.floor(startTime / DAY_MS) * DAY_MS;
  // yearStart stays a number because 1 January of the start year can fall
  // before the minimum representable Date.
  let yearStart = startDay - (daysBeforeMonth(startMonth, leap) + startDom - 1) * DAY_MS;
  let limit = horizonLimit(yearStart);
  while (yearStart <= limit && results.length < count) {
    for (let monthIndex = year === startYear ? startMonth : 0; monthIndex < 12; monthIndex += 1) {
      if (!expanded.months.has(monthIndex + 1)) continue;
      const monthStart = yearStart + daysBeforeMonth(monthIndex, leap) * DAY_MS;
      const lastDom = daysInMonth(monthIndex, leap);
      // 1970-01-01 (day 0) was a Thursday.
      const firstDow = (((Math.floor(monthStart / DAY_MS) + 4) % 7) + 7) % 7;
      for (const dom of candidateDays) {
        if (dom > lastDom) break;
        const dayStart = monthStart + (dom - 1) * DAY_MS;
        if (dayStart < startDay) continue;
        if (dayStart > limit) return results;
        if (!dayMatches(expanded, dom, (firstDow + dom - 1) % 7)) continue;
        const isFirstDay = dayStart === startDay;
        const startHour = isFirstDay ? start.getUTCHours() : 0;
        const startMinute = isFirstDay ? start.getUTCMinutes() : 0;
        for (const hour of sortedHours) {
          if (hour < startHour) continue;
          for (const minute of sortedMinutes) {
            if (hour === startHour && minute < startMinute) continue;
            const time = dayStart + (hour * 60 + minute) * MINUTE_MS;
            if (time > MAX_DATE_TIME) return results;
            results.push(new Date(time));
            if (results.length >= count) return results;
            limit = horizonLimit(yearStart);
          }
        }
      }
    }
    yearStart += (leap ? 366 : 365) * DAY_MS;
    year += 1;
    leap = isLeapYear(year);
  }
  return results;
}

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

export function minimumIntervalMinutes(
  ast: CronAst,
  expanded: ExpandedCron = expandCron(ast),
): number | null {
  if (!canEverFire(ast, expanded)) return null;
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
    if (
      expanded.months.has(day.getUTCMonth() + 1) &&
      dayMatches(expanded, day.getUTCDate(), day.getUTCDay())
    ) {
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
export function firesMoreOftenThanEveryFiveMinutes(
  ast: CronAst,
  expanded: ExpandedCron = expandCron(ast),
): boolean {
  if (!canEverFire(ast, expanded)) return false;
  const times = sortedDayTimes(expanded);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  if (firstTime === undefined || lastTime === undefined) return false;
  if (minWithinDayGap(times) < 5) return true;
  if (1440 - (lastTime - firstTime) >= 5) return false;
  const min = minimumIntervalMinutes(ast, expanded);
  return min !== null && min < 5;
}
