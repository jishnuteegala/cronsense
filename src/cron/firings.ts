import type { CronAst, FieldAst, FieldName } from './parse'
import { FIELD_RANGES, isRestricted } from './parse'

export function expandField(field: FieldAst): Set<number> {
  const { min, max } = FIELD_RANGES[field.field]
  const values = new Set<number>()
  for (const term of field.terms) {
    if (term.kind === 'wildcard') {
      for (let v = min; v <= max; v += term.step) {
        values.add(v)
      }
    } else if (term.kind === 'value') {
      values.add(term.value)
    } else {
      for (let v = term.from; v <= term.to; v += term.step) {
        values.add(v)
      }
    }
  }
  return values
}

export interface ExpandedCron {
  minutes: Set<number>
  hours: Set<number>
  daysOfMonth: Set<number>
  months: Set<number>
  daysOfWeek: Set<number>
  domRestricted: boolean
  dowRestricted: boolean
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
  }
}

function dayMatches(expanded: ExpandedCron, date: Date): boolean {
  const dom = date.getUTCDate()
  const dow = date.getUTCDay()
  const domMatch = expanded.daysOfMonth.has(dom)
  const dowMatch = expanded.daysOfWeek.has(dow)
  if (expanded.domRestricted && expanded.dowRestricted) {
    return domMatch || dowMatch
  }
  if (expanded.domRestricted) {
    return domMatch
  }
  if (expanded.dowRestricted) {
    return dowMatch
  }
  return true
}

const MAX_YEARS_PER_FIRING = 9

export function canEverFire(ast: CronAst): boolean {
  const expanded = expandCron(ast)
  if (
    expanded.minutes.size === 0 ||
    expanded.hours.size === 0 ||
    expanded.months.size === 0
  ) {
    return false
  }
  if (expanded.domRestricted && !expanded.dowRestricted) {
    if (expanded.daysOfMonth.size === 0) return false
  }
  if (expanded.dowRestricted && !expanded.domRestricted) {
    if (expanded.daysOfWeek.size === 0) return false
  }
  if (expanded.domRestricted && expanded.dowRestricted) {
    if (expanded.daysOfMonth.size === 0 && expanded.daysOfWeek.size === 0) return false
  }
  if (!expanded.dowRestricted || expanded.domRestricted) {
    const monthMaxDays = new Map<number, number>([
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
    ])
    if (expanded.domRestricted && !expanded.dowRestricted) {
      const anyDayFits = [...expanded.months].some((month) => {
        const maxDays = monthMaxDays.get(month) ?? 31
        return [...expanded.daysOfMonth].some((day) => day <= maxDays)
      })
      if (!anyDayFits) return false
    }
  }
  return true
}

export function neverFiresReason(ast: CronAst): string | null {
  if (canEverFire(ast)) return null
  const expanded = expandCron(ast)
  if (expanded.domRestricted && !expanded.dowRestricted) {
    const months = [...expanded.months].sort((a, b) => a - b)
    const days = [...expanded.daysOfMonth].sort((a, b) => a - b)
    return `this expression will never fire: day-of-month ${days.join(', ')} never occurs in month ${months.join(', ')}`
  }
  return 'this expression will never fire: the field constraints admit no date'
}

export function nextFirings(ast: CronAst, from: Date, count: number): Date[] {
  const expanded = expandCron(ast)
  const results: Date[] = []
  if (!canEverFire(ast)) return results
  const sortedMinutes = [...expanded.minutes].sort((a, b) => a - b)
  const sortedHours = [...expanded.hours].sort((a, b) => a - b)
  const start = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      from.getUTCHours(),
      from.getUTCMinutes() + 1,
    ),
  )
  let limit = Date.UTC(start.getUTCFullYear() + MAX_YEARS_PER_FIRING, 0, 1)
  const day = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  )
  let isFirstDay = true
  while (day.getTime() < limit && results.length < count) {
    const month = day.getUTCMonth() + 1
    if (!expanded.months.has(month)) {
      day.setUTCMonth(day.getUTCMonth() + 1, 1)
      isFirstDay = false
      continue
    }
    if (dayMatches(expanded, day)) {
      const startHour = isFirstDay ? start.getUTCHours() : 0
      const startMinute = isFirstDay ? start.getUTCMinutes() : 0
      for (const hour of sortedHours) {
        if (hour < startHour) continue
        for (const minute of sortedMinutes) {
          if (hour === startHour && isFirstDay && minute < startMinute) continue
          results.push(
            new Date(
              Date.UTC(
                day.getUTCFullYear(),
                day.getUTCMonth(),
                day.getUTCDate(),
                hour,
                minute,
              ),
            ),
          )
          if (results.length >= count) return results
          limit = Date.UTC(day.getUTCFullYear() + MAX_YEARS_PER_FIRING, 0, 1)
        }
      }
    }
    day.setUTCDate(day.getUTCDate() + 1)
    isFirstDay = false
  }
  return results
}

const GREGORIAN_CYCLE_DAYS = 146097

export function minimumIntervalMinutes(ast: CronAst): number | null {
  if (!canEverFire(ast)) return null
  const expanded = expandCron(ast)
  const times: number[] = []
  for (const hour of expanded.hours) {
    for (const minute of expanded.minutes) {
      times.push(hour * 60 + minute)
    }
  }
  times.sort((a, b) => a - b)
  const firstTime = times[0]
  const lastTime = times[times.length - 1]
  if (firstTime === undefined || lastTime === undefined) return null
  let minWithinDay = Infinity
  for (let i = 1; i < times.length; i += 1) {
    const gap = (times[i] ?? 0) - (times[i - 1] ?? 0)
    if (gap < minWithinDay) minWithinDay = gap
  }
  const day = new Date(Date.UTC(2000, 0, 1))
  let firstMatch: number | null = null
  let lastMatch: number | null = null
  let minDayGap = Infinity
  for (let i = 0; i < GREGORIAN_CYCLE_DAYS; i += 1) {
    if (expanded.months.has(day.getUTCMonth() + 1) && dayMatches(expanded, day)) {
      if (firstMatch === null) firstMatch = i
      if (lastMatch !== null) {
        const gap = i - lastMatch
        if (gap < minDayGap) minDayGap = gap
      }
      lastMatch = i
    }
    day.setUTCDate(day.getUTCDate() + 1)
  }
  if (firstMatch === null || lastMatch === null) return null
  const wrapGap = firstMatch + GREGORIAN_CYCLE_DAYS - lastMatch
  if (wrapGap < minDayGap) minDayGap = wrapGap
  const crossDay = minDayGap * 1440 - (lastTime - firstTime)
  return Math.min(minWithinDay, crossDay)
}

export const SUB_MINIMUM_INTERVAL_WARNING =
  'GitHub docs: "The shortest interval you can run scheduled workflows is once every 5 minutes." This expression fires more often; the docs do not say what happens to such an expression, so the outcome on GitHub Actions is undocumented.'

export function subMinimumIntervalWarning(ast: CronAst): string | null {
  const min = minimumIntervalMinutes(ast)
  if (min !== null && min < 5) {
    return SUB_MINIMUM_INTERVAL_WARNING
  }
  return null
}

export const DOM_DOW_PROVISIONAL_NOTE =
  'This expression restricts both day-of-month and day-of-week. GitHub does not document how these combine; the firing times below assume the POSIX OR interpretation (a day matching either field fires) and are provisional until empirically verified against GitHub Actions.'

export function domDowProvisionalNote(ast: CronAst): string | null {
  if (isRestricted(ast.dayOfMonth) && isRestricted(ast.dayOfWeek)) {
    return DOM_DOW_PROVISIONAL_NOTE
  }
  return null
}

export function restrictedFields(ast: CronAst): FieldName[] {
  const fields: FieldName[] = []
  for (const field of [ast.minute, ast.hour, ast.dayOfMonth, ast.month, ast.dayOfWeek]) {
    if (isRestricted(field)) fields.push(field.field)
  }
  return fields
}
