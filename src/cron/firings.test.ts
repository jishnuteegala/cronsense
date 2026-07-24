import { describe, expect, it } from 'vitest'
import {
  canEverFire,
  expandField,
  minimumIntervalMinutes,
  neverFiresReason,
  nextFirings,
  subMinimumIntervalWarning,
} from './firings'
import { parseCron } from './parse'

function ast(input: string) {
  const result = parseCron(input)
  if (!result.ok) {
    throw new Error(`failed to parse "${input}": ${result.error}`)
  }
  return result.ast
}

function iso(dates: Date[]): string[] {
  return dates.map((d) => d.toISOString().slice(0, 16) + 'Z')
}

const T0 = new Date(Date.UTC(2026, 0, 15, 12, 0))

describe('expandField', () => {
  it('expands wildcard with step', () => {
    const values = expandField(ast('*/20 * * * *').minute)
    expect([...values].sort((a, b) => a - b)).toEqual([0, 20, 40])
  })

  it('expands range with step', () => {
    const values = expandField(ast('0 8-18/4 * * *').hour)
    expect([...values].sort((a, b) => a - b)).toEqual([8, 12, 16])
  })

  it('expands lists with duplicates deduplicated', () => {
    const values = expandField(ast('0,0,30 * * * *').minute)
    expect([...values].sort((a, b) => a - b)).toEqual([0, 30])
  })
})

describe('nextFirings basics', () => {
  it('returns the next 10 occurrences for */15', () => {
    const firings = nextFirings(ast('*/15 * * * *'), T0, 10)
    expect(iso(firings)).toEqual([
      '2026-01-15T12:15Z',
      '2026-01-15T12:30Z',
      '2026-01-15T12:45Z',
      '2026-01-15T13:00Z',
      '2026-01-15T13:15Z',
      '2026-01-15T13:30Z',
      '2026-01-15T13:45Z',
      '2026-01-15T14:00Z',
      '2026-01-15T14:15Z',
      '2026-01-15T14:30Z',
    ])
  })

  it('excludes the current minute', () => {
    const firings = nextFirings(ast('0 12 * * *'), new Date(Date.UTC(2026, 0, 15, 12, 0)), 1)
    expect(iso(firings)).toEqual(['2026-01-16T12:00Z'])
  })

  it('fires at a fixed date-time each year', () => {
    const firings = nextFirings(ast('30 6 25 12 *'), T0, 2)
    expect(iso(firings)).toEqual(['2026-12-25T06:30Z', '2027-12-25T06:30Z'])
  })
})

describe('step reset across boundaries', () => {
  it('*/7 minutes resets at the top of the hour', () => {
    const firings = nextFirings(ast('*/7 * * * *'), new Date(Date.UTC(2026, 0, 15, 11, 50)), 4)
    expect(iso(firings)).toEqual([
      '2026-01-15T11:56Z',
      '2026-01-15T12:00Z',
      '2026-01-15T12:07Z',
      '2026-01-15T12:14Z',
    ])
  })

  it('range step 10-40/25 in minutes', () => {
    const firings = nextFirings(ast('10-40/25 * * * *'), new Date(Date.UTC(2026, 0, 15, 11, 0)), 3)
    expect(iso(firings)).toEqual([
      '2026-01-15T11:10Z',
      '2026-01-15T11:35Z',
      '2026-01-15T12:10Z',
    ])
  })
})

describe('month and year rollover', () => {
  it('rolls over month end', () => {
    const firings = nextFirings(ast('0 0 31 * *'), new Date(Date.UTC(2026, 0, 31, 12, 0)), 3)
    expect(iso(firings)).toEqual(['2026-03-31T00:00Z', '2026-05-31T00:00Z', '2026-07-31T00:00Z'])
  })

  it('rolls over year end', () => {
    const firings = nextFirings(ast('0 0 1 1 *'), new Date(Date.UTC(2026, 11, 31, 23, 59)), 2)
    expect(iso(firings)).toEqual(['2027-01-01T00:00Z', '2028-01-01T00:00Z'])
  })

  it('skips months not in the month set', () => {
    const firings = nextFirings(ast('0 0 15 3,9 *'), T0, 3)
    expect(iso(firings)).toEqual(['2026-03-15T00:00Z', '2026-09-15T00:00Z', '2027-03-15T00:00Z'])
  })
})

describe('stepped DOM across variable month lengths', () => {
  it('*/10 DOM resets at each month start across February and March', () => {
    const firings = nextFirings(ast('0 0 */10 * *'), new Date(Date.UTC(2026, 0, 31, 12, 0)), 8)
    expect(iso(firings)).toEqual([
      '2026-02-01T00:00Z',
      '2026-02-11T00:00Z',
      '2026-02-21T00:00Z',
      '2026-03-01T00:00Z',
      '2026-03-11T00:00Z',
      '2026-03-21T00:00Z',
      '2026-03-31T00:00Z',
      '2026-04-01T00:00Z',
    ])
  })

  it('*/10 DOM includes day 31 only in 31-day months', () => {
    const firings = nextFirings(ast('0 0 */10 * *'), new Date(Date.UTC(2026, 3, 21, 12, 0)), 5)
    expect(iso(firings)).toEqual([
      '2026-05-01T00:00Z',
      '2026-05-11T00:00Z',
      '2026-05-21T00:00Z',
      '2026-05-31T00:00Z',
      '2026-06-01T00:00Z',
    ])
  })
})

describe('leap years', () => {
  it('Feb 29 fires only in leap years', () => {
    const firings = nextFirings(ast('0 0 29 2 *'), T0, 2)
    expect(iso(firings)).toEqual(['2028-02-29T00:00Z', '2032-02-29T00:00Z'])
  })

  it('returns a full 10 leap-day firings across decades', () => {
    const firings = nextFirings(ast('0 0 29 2 *'), T0, 10)
    expect(iso(firings)).toEqual([
      '2028-02-29T00:00Z',
      '2032-02-29T00:00Z',
      '2036-02-29T00:00Z',
      '2040-02-29T00:00Z',
      '2044-02-29T00:00Z',
      '2048-02-29T00:00Z',
      '2052-02-29T00:00Z',
      '2056-02-29T00:00Z',
      '2060-02-29T00:00Z',
      '2064-02-29T00:00Z',
    ])
  })

  it('returns a full 10 annual firings', () => {
    const firings = nextFirings(ast('0 0 1 1 *'), T0, 10)
    expect(firings).toHaveLength(10)
    expect(iso(firings)[0]).toBe('2027-01-01T00:00Z')
    expect(iso(firings)[9]).toBe('2036-01-01T00:00Z')
  })

  it('skips the non-leap century year 2100', () => {
    const firings = nextFirings(ast('0 0 29 2 *'), new Date(Date.UTC(2097, 0, 1)), 2)
    expect(iso(firings)).toEqual(['2104-02-29T00:00Z', '2108-02-29T00:00Z'])
  })

  it('Feb 28 fires every year', () => {
    const firings = nextFirings(ast('0 0 28 2 *'), T0, 2)
    expect(iso(firings)).toEqual(['2026-02-28T00:00Z', '2027-02-28T00:00Z'])
  })
})

describe('DOM/DOW OR semantics (provisional, awaiting empirical verification)', () => {
  it('fires on union when both restricted', () => {
    const firings = nextFirings(ast('0 0 15 * MON'), new Date(Date.UTC(2026, 4, 31, 23, 59)), 5)
    expect(iso(firings)).toEqual([
      '2026-06-01T00:00Z',
      '2026-06-08T00:00Z',
      '2026-06-15T00:00Z',
      '2026-06-22T00:00Z',
      '2026-06-29T00:00Z',
    ])
  })

  it('uses DOM only when DOW is *', () => {
    const firings = nextFirings(ast('0 0 15 * *'), T0, 2)
    expect(iso(firings)).toEqual(['2026-02-15T00:00Z', '2026-03-15T00:00Z'])
  })

  it('uses DOW only when DOM is *', () => {
    const firings = nextFirings(ast('0 0 * * SUN'), T0, 2)
    expect(iso(firings)).toEqual(['2026-01-18T00:00Z', '2026-01-25T00:00Z'])
  })

  it('treats */1 in DOM as restricted so it fires every day under OR', () => {
    const firings = nextFirings(ast('0 0 */1 * MON'), new Date(Date.UTC(2026, 0, 1, 0, 0)), 4)
    expect(iso(firings)).toEqual([
      '2026-01-02T00:00Z',
      '2026-01-03T00:00Z',
      '2026-01-04T00:00Z',
      '2026-01-05T00:00Z',
    ])
  })

  it('treats */N in DOM as restricted for OR purposes', () => {
    const firings = nextFirings(ast('0 0 */10 * WED'), new Date(Date.UTC(2026, 0, 1, 0, 0)), 5)
    expect(iso(firings)).toEqual([
      '2026-01-07T00:00Z',
      '2026-01-11T00:00Z',
      '2026-01-14T00:00Z',
      '2026-01-21T00:00Z',
      '2026-01-28T00:00Z',
    ])
  })
})

describe('name tokens in ranges and steps (provisional pending GHA-validator arbitration)', () => {
  it('fires on MON-FRI weekdays only', () => {
    const firings = nextFirings(ast('0 9 * * MON-FRI'), new Date(Date.UTC(2026, 0, 16, 12, 0)), 4)
    expect(iso(firings)).toEqual([
      '2026-01-19T09:00Z',
      '2026-01-20T09:00Z',
      '2026-01-21T09:00Z',
      '2026-01-22T09:00Z',
    ])
  })

  it('fires on every second weekday of mon-fri/2 in mixed case', () => {
    const firings = nextFirings(ast('0 9 * * mon-FRI/2'), new Date(Date.UTC(2026, 0, 18, 12, 0)), 3)
    expect(iso(firings)).toEqual([
      '2026-01-19T09:00Z',
      '2026-01-21T09:00Z',
      '2026-01-23T09:00Z',
    ])
  })

  it('fires on odd months from JAN/2 across a year rollover', () => {
    const firings = nextFirings(ast('0 0 1 JAN/2 *'), new Date(Date.UTC(2026, 9, 15, 0, 0)), 3)
    expect(iso(firings)).toEqual([
      '2026-11-01T00:00Z',
      '2027-01-01T00:00Z',
      '2027-03-01T00:00Z',
    ])
  })

  it('fires only in JAN-MAR/2 months', () => {
    const firings = nextFirings(ast('0 0 15 JAN-MAR/2 *'), T0, 3)
    expect(iso(firings)).toEqual([
      '2026-03-15T00:00Z',
      '2027-01-15T00:00Z',
      '2027-03-15T00:00Z',
    ])
  })
})

describe('years below 100', () => {
  it('does not remap two-digit years to the 1900s', () => {
    const from = new Date('0098-06-15T12:00:00Z')
    const firings = nextFirings(ast('0 0 1 1 *'), from, 2)
    expect(iso(firings)).toEqual(['0099-01-01T00:00Z', '0100-01-01T00:00Z'])
  })
})

describe('never fires', () => {
  it('detects Feb 30', () => {
    expect(canEverFire(ast('0 0 30 2 *'))).toBe(false)
    expect(neverFiresReason(ast('0 0 30 2 *'))).toContain('never fire')
    expect(nextFirings(ast('0 0 30 2 *'), T0, 10)).toEqual([])
  })

  it('detects Feb 31 and Apr 31', () => {
    expect(canEverFire(ast('0 0 31 2 *'))).toBe(false)
    expect(canEverFire(ast('0 0 31 4 *'))).toBe(false)
  })

  it('Feb 29 can fire (leap years)', () => {
    expect(canEverFire(ast('0 0 29 2 *'))).toBe(true)
    expect(neverFiresReason(ast('0 0 29 2 *'))).toBeNull()
  })

  it('DOM 31 in Feb with DOW restriction still fires via DOW (OR)', () => {
    expect(canEverFire(ast('0 0 31 2 MON'))).toBe(true)
    const firings = nextFirings(ast('0 0 31 2 MON'), T0, 2)
    expect(iso(firings)).toEqual(['2026-02-02T00:00Z', '2026-02-09T00:00Z'])
  })
})

describe('minimumIntervalMinutes', () => {
  it('computes 1 for every minute', () => {
    expect(minimumIntervalMinutes(ast('* * * * *'))).toBe(1)
  })

  it('computes 15 for */15', () => {
    expect(minimumIntervalMinutes(ast('*/15 * * * *'))).toBe(15)
  })

  it('detects the 4-minute boundary gap for */7', () => {
    expect(minimumIntervalMinutes(ast('*/7 * * * *'))).toBe(4)
  })

  it('spans the day boundary for a late-plus-early pair', () => {
    expect(minimumIntervalMinutes(ast('0,59 23,0 * * *'))).toBe(1)
  })

  it('computes 1440 for a daily schedule', () => {
    expect(minimumIntervalMinutes(ast('0 12 * * *'))).toBe(1440)
  })

  it('computes a weekly gap for a single weekday', () => {
    expect(minimumIntervalMinutes(ast('0 0 * * MON'))).toBe(7 * 1440)
  })

  it('handles the leap-day annual schedule', () => {
    expect(minimumIntervalMinutes(ast('0 0 29 2 *'))).toBe(4 * 365 * 1440 + 1440)
  })

  it('returns null for never-firing expressions', () => {
    expect(minimumIntervalMinutes(ast('0 0 30 2 *'))).toBeNull()
  })
})

describe('subMinimumIntervalWarning', () => {
  it('warns for every-minute schedules quoting the docs', () => {
    const warning = subMinimumIntervalWarning(ast('* * * * *'))
    expect(warning).toContain('once every 5 minutes')
    expect(warning).toContain('undocumented')
  })

  it('warns for */7 because of the 4-minute boundary gap', () => {
    expect(subMinimumIntervalWarning(ast('*/7 * * * *'))).not.toBeNull()
  })

  it('does not warn for */5', () => {
    expect(subMinimumIntervalWarning(ast('*/5 * * * *'))).toBeNull()
  })

  it('does not warn for hourly schedules', () => {
    expect(subMinimumIntervalWarning(ast('0 * * * *'))).toBeNull()
  })

  it('returns null for never-firing expressions', () => {
    expect(subMinimumIntervalWarning(ast('0 0 30 2 *'))).toBeNull()
  })
})
