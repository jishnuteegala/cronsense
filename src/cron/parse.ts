export type FieldName = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

export type FieldTerm =
  | { kind: 'wildcard'; step: number }
  | { kind: 'value'; value: number }
  | { kind: 'range'; from: number; to: number; step: number }

export interface FieldAst {
  field: FieldName
  terms: FieldTerm[]
}

export interface CronAst {
  minute: FieldAst
  hour: FieldAst
  dayOfMonth: FieldAst
  month: FieldAst
  dayOfWeek: FieldAst
}

export type ParseResult =
  | { ok: true; ast: CronAst; provisionalNotes: string[] }
  | { ok: false; error: string }

interface FieldSpec {
  field: FieldName
  min: number
  max: number
  names?: Record<string, number>
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const FIELD_SPECS: FieldSpec[] = [
  { field: 'minute', min: 0, max: 59 },
  { field: 'hour', min: 0, max: 23 },
  { field: 'dayOfMonth', min: 1, max: 31 },
  { field: 'month', min: 1, max: 12, names: MONTH_NAMES },
  { field: 'dayOfWeek', min: 0, max: 6, names: DOW_NAMES },
]

const SHORTCUTS = ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@hourly', '@reboot']

export const FIELD_RANGES: Record<FieldName, { min: number; max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
}

function parseValue(
  token: string,
  spec: FieldSpec,
): { value: number; named: boolean } | string {
  if (/^\d+$/.test(token)) {
    const value = Number(token)
    if (value < spec.min || value > spec.max) {
      return `${spec.field} value ${value} is out of range (${spec.min}-${spec.max})`
    }
    return { value, named: false }
  }
  const named = spec.names?.[token.toUpperCase()]
  if (named !== undefined) {
    return { value: named, named: true }
  }
  if (/^(L|W|\d+L|\d+W|LW)$/i.test(token)) {
    return `"${token}" in ${spec.field} uses L/W tokens that are not part of GitHub Actions cron syntax (presumed rejected; pending GHA-validator confirmation)`
  }
  if (/^[a-z]+$/i.test(token)) {
    return `"${token}" is not a valid ${spec.field} name`
  }
  return `"${token}" is not a valid ${spec.field} value`
}

function parseStep(token: string, spec: FieldSpec): number | string {
  if (!/^\d+$/.test(token)) {
    return `step value "${token}" in ${spec.field} must be a positive number`
  }
  const step = Number(token)
  if (step === 0) {
    return `step value in ${spec.field} must be at least 1`
  }
  return step
}

function nameOperatorNote(token: string, spec: FieldSpec): string {
  return `"${token}" uses a name token in a range or step in ${spec.field}; GitHub documents name tokens only as plain field values, so this interpretation is provisional and awaits GHA-validator arbitration`
}

function parseTerm(
  token: string,
  spec: FieldSpec,
  notes: string[],
): FieldTerm | string {
  if (token === '') {
    return `empty entry in ${spec.field} field`
  }
  const slashParts = token.split('/')
  if (slashParts.length > 2) {
    return `"${token}" has more than one "/" in ${spec.field}`
  }
  const base = slashParts[0] ?? ''
  const stepToken = slashParts.length === 2 ? (slashParts[1] ?? '') : undefined
  let step = 1
  if (stepToken !== undefined) {
    const parsed = parseStep(stepToken, spec)
    if (typeof parsed === 'string') return parsed
    step = parsed
  }
  if (base === '*') {
    return { kind: 'wildcard', step }
  }
  const rangeParts = base.split('-')
  if (rangeParts.length > 2) {
    return `"${token}" has more than one "-" in ${spec.field}`
  }
  if (rangeParts.length === 2) {
    const from = parseValue(rangeParts[0] ?? '', spec)
    if (typeof from === 'string') return from
    const to = parseValue(rangeParts[1] ?? '', spec)
    if (typeof to === 'string') return to
    if (from.named || to.named) {
      notes.push(nameOperatorNote(token, spec))
    }
    if (from.value > to.value) {
      return `range ${base} in ${spec.field} is reversed (${from.value} > ${to.value})`
    }
    return { kind: 'range', from: from.value, to: to.value, step }
  }
  const value = parseValue(base, spec)
  if (typeof value === 'string') return value
  if (stepToken !== undefined) {
    if (value.named) {
      notes.push(nameOperatorNote(token, spec))
    }
    return { kind: 'range', from: value.value, to: spec.max, step }
  }
  return { kind: 'value', value: value.value }
}

function parseField(raw: string, spec: FieldSpec, notes: string[]): FieldAst | string {
  const unsupportedToken = raw.match(/[#?]/)
  if (unsupportedToken) {
    return `"${unsupportedToken[0]}" in ${spec.field} is not part of GitHub Actions cron syntax (presumed rejected; pending GHA-validator confirmation)`
  }
  const terms: FieldTerm[] = []
  for (const token of raw.split(',')) {
    const term = parseTerm(token, spec, notes)
    if (typeof term === 'string') return term
    terms.push(term)
  }
  return { field: spec.field, terms }
}

export function parseCron(input: string): ParseResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'expression is empty' }
  }
  const lower = trimmed.toLowerCase()
  const shortcut = SHORTCUTS.find((s) => lower === s)
  if (shortcut) {
    return {
      ok: false,
      error: `GitHub Actions does not support the non-standard syntax ${shortcut} (documented: @yearly, @monthly, @weekly, @daily, @hourly, and @reboot are unsupported)`,
    }
  }
  if (trimmed.startsWith('@')) {
    return {
      ok: false,
      error: `unknown shortcut "${trimmed}"; GitHub Actions does not support @-shortcuts`,
    }
  }
  const fields = trimmed.split(/\s+/)
  if (fields.length === 6) {
    return {
      ok: false,
      error:
        'six fields found; GitHub Actions cron has exactly five fields and no seconds field (presumed rejected; pending GHA-validator confirmation)',
    }
  }
  if (fields.length !== 5) {
    return {
      ok: false,
      error: `expected 5 fields (minute hour day-of-month month day-of-week), got ${fields.length}`,
    }
  }
  const parsed: FieldAst[] = []
  const provisionalNotes: string[] = []
  for (const spec of FIELD_SPECS) {
    const result = parseField(fields[parsed.length] ?? '', spec, provisionalNotes)
    if (typeof result === 'string') {
      return { ok: false, error: result }
    }
    parsed.push(result)
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    return { ok: false, error: 'internal parse error' }
  }
  return {
    ok: true,
    ast: { minute, hour, dayOfMonth, month, dayOfWeek },
    provisionalNotes,
  }
}

export function isRestricted(field: FieldAst): boolean {
  return !field.terms.some((term) => term.kind === 'wildcard' && term.step === 1)
}
