import { describe, expect, it } from 'vitest'
import { parseCron } from './parse'
import { TIMEZONE_KEY_NOTE, translate } from './translate'

function sentence(input: string): string {
  const result = parseCron(input)
  if (!result.ok) {
    throw new Error(`failed to parse "${input}": ${result.error}`)
  }
  return translate(result.ast).sentence
}

describe('translate', () => {
  it('every minute', () => {
    expect(sentence('* * * * *')).toBe('Every minute.')
  })

  it('fixed time daily', () => {
    expect(sentence('30 5 * * *')).toBe('At 05:30 UTC.')
  })

  it('zero-pads times', () => {
    expect(sentence('5 9 * * *')).toBe('At 09:05 UTC.')
  })

  it('wildcard step minutes', () => {
    expect(sentence('*/15 * * * *')).toBe(
      'At every 15 minutes starting at minute 0 (resetting each boundary) of every hour (UTC).',
    )
  })

  it('minute list past an hour', () => {
    expect(sentence('0,30 9 * * *')).toBe('At minute 0 and minute 30 past hour 9 (UTC).')
  })

  it('every minute during an hour range', () => {
    expect(sentence('* 9-17 * * *')).toBe(
      'Every minute during every hour from 9 through 17 (UTC).',
    )
  })

  it('day-of-week names', () => {
    expect(sentence('0 9 * * MON-FRI')).toBe('At 09:00 UTC, on Monday through Friday.')
  })

  it('single day of week', () => {
    expect(sentence('0 0 * * SUN')).toBe('At 00:00 UTC, on Sunday.')
  })

  it('day of month', () => {
    expect(sentence('0 0 15 * *')).toBe('At 00:00 UTC, on day-of-month 15.')
  })

  it('month names', () => {
    expect(sentence('0 0 1 JAN *')).toBe('At 00:00 UTC, on day-of-month 1, in January.')
  })

  it('month range', () => {
    expect(sentence('0 12 1 3-5 *')).toBe(
      'At 12:00 UTC, on day-of-month 1, in March through May.',
    )
  })

  it('month step from name token', () => {
    expect(sentence('0 0 1 JAN/2 *')).toBe(
      'At 00:00 UTC, on day-of-month 1, in every 2 from January through December.',
    )
  })

  it('DOM/DOW both restricted spells out OR with the verification caveat', () => {
    const text = sentence('0 0 15 * MON')
    expect(text).toContain('on day-of-month 15, or on Monday')
    expect(text).toContain('either matching day fires')
    expect(text).toContain('awaiting empirical verification')
  })

  it('stepped day-of-month starts at day 1, not 0', () => {
    expect(sentence('0 0 */10 * *')).toBe(
      'At 00:00 UTC, on every 10 day-of-months starting at day-of-month 1 (resetting each boundary).',
    )
  })

  it('range with step in hours', () => {
    expect(sentence('0 8-18/2 * * *')).toBe(
      'At minute 0 past every 2 hours from 8 through 18 (UTC).',
    )
  })

  it('list of days of week', () => {
    expect(sentence('0 6 * * 1,3,5')).toBe(
      'At 06:00 UTC, on Monday, Wednesday, and Friday.',
    )
  })

  it('always carries the timezone-key note', () => {
    const result = parseCron('0 0 * * *')
    if (!result.ok) throw new Error(result.error)
    const translation = translate(result.ast)
    expect(translation.timezoneNote).toBe(TIMEZONE_KEY_NOTE)
    expect(translation.timezoneNote).toContain('timezone')
    expect(translation.timezoneNote).toContain('UTC-based firing times do not apply')
  })
})
