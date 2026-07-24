import type { CronAst, FieldAst, FieldTerm } from './parse'
import { hasWildcardOrigin, isRestricted } from './parse'

export const TIMEZONE_KEY_NOTE =
  'If this workflow uses the `timezone` key on its schedule, GitHub Actions evaluates the schedule in that timezone and these UTC-based firing times do not apply.'

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DOW_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function monthLabel(value: number): string {
  return MONTH_LABELS[value - 1] ?? String(value)
}

function dowLabel(value: number): string {
  return DOW_LABELS[value] ?? String(value)
}

function joinList(parts: string[]): string {
  if (parts.length === 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function describeNumericTerm(term: FieldTerm, unit: string, min: number): string {
  if (term.kind === 'wildcard') {
    if (term.step === 1) return `every ${unit}`
    return `every ${term.step} ${unit}s starting at ${unit} ${min} (resetting each boundary)`
  }
  if (term.kind === 'value') {
    return `${unit} ${term.value}`
  }
  if (term.step === 1) {
    return `every ${unit} from ${term.from} through ${term.to}`
  }
  return `every ${term.step} ${unit}s from ${term.from} through ${term.to}`
}

function describeLabeledTerm(
  term: FieldTerm,
  label: (v: number) => string,
  everyText: string,
  unit: string,
  first: number,
): string {
  if (term.kind === 'wildcard') {
    if (term.step === 1) return everyText
    return `every ${term.step} ${unit}s starting with ${label(first)} (resetting each boundary)`
  }
  if (term.kind === 'value') {
    return label(term.value)
  }
  if (term.step === 1) {
    return `${label(term.from)} through ${label(term.to)}`
  }
  return `every ${term.step} from ${label(term.from)} through ${label(term.to)}`
}

function describeField(field: FieldAst, describe: (term: FieldTerm) => string): string {
  return joinList(field.terms.map(describe))
}

function timePhrase(ast: CronAst): string {
  const minuteSimple = ast.minute.terms.length === 1 && ast.minute.terms[0]?.kind === 'value'
  const hourSimple = ast.hour.terms.length === 1 && ast.hour.terms[0]?.kind === 'value'
  if (minuteSimple && hourSimple) {
    const minuteTerm = ast.minute.terms[0]
    const hourTerm = ast.hour.terms[0]
    if (minuteTerm?.kind === 'value' && hourTerm?.kind === 'value') {
      return `At ${pad(hourTerm.value)}:${pad(minuteTerm.value)} UTC`
    }
  }
  const minutePart = describeField(ast.minute, (t) => describeNumericTerm(t, 'minute', 0))
  if (!isRestricted(ast.hour)) {
    if (!isRestricted(ast.minute)) {
      return 'Every minute'
    }
    return `At ${minutePart} of every hour (UTC)`
  }
  const hourPart = describeField(ast.hour, (t) => describeNumericTerm(t, 'hour', 0))
  if (!isRestricted(ast.minute)) {
    return `Every minute during ${hourPart} (UTC)`
  }
  return `At ${minutePart} past ${hourPart} (UTC)`
}

function dayPhrase(ast: CronAst): string {
  const domRestricted = isRestricted(ast.dayOfMonth)
  const dowRestricted = isRestricted(ast.dayOfWeek)
  const union = !hasWildcardOrigin(ast.dayOfMonth) && !hasWildcardOrigin(ast.dayOfWeek)
  const domPart = describeField(ast.dayOfMonth, (t) => describeNumericTerm(t, 'day-of-month', 1))
  const dowPart = describeField(ast.dayOfWeek, (t) =>
    describeLabeledTerm(t, dowLabel, 'every day of the week', 'weekday', 0),
  )
  if (domRestricted && dowRestricted) {
    if (union) {
      return `on ${domPart}, or on ${dowPart} (either matching day fires; awaiting empirical verification of GHA's combined day-of-month/day-of-week behaviour)`
    }
    return `on ${domPart} that is also ${dowPart} (wildcard-origin day fields intersect, per Vixie cron precedent; awaiting empirical verification of GHA's combined day-of-month/day-of-week behaviour)`
  }
  if (domRestricted) {
    return `on ${domPart}`
  }
  if (dowRestricted) {
    return `on ${dowPart}`
  }
  return ''
}

function monthPhrase(ast: CronAst): string {
  if (!isRestricted(ast.month)) return ''
  const part = describeField(ast.month, (t) =>
    describeLabeledTerm(t, monthLabel, 'every month', 'month', 1),
  )
  return `in ${part}`
}

export interface Translation {
  sentence: string
  timezoneNote: string
}

export function translate(ast: CronAst): Translation {
  const parts = [timePhrase(ast), dayPhrase(ast), monthPhrase(ast)].filter((p) => p !== '')
  return {
    sentence: `${parts.join(', ')}.`,
    timezoneNote: TIMEZONE_KEY_NOTE,
  }
}
