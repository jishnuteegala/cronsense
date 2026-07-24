import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App, DST_NOTE } from './App'

afterEach(cleanup)

describe('App', () => {
  it('shows translation, firings table, and the DST note for a valid expression', () => {
    render(<App initialExpression="0 12 * * *" />)
    expect(screen.getByText('At 12:00 UTC.')).toBeTruthy()
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getByText('UTC')).toBeTruthy()
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('row').length).toBe(11)
  })

  it('keeps the DST note visible next to the local-time column', () => {
    render(<App initialExpression="30 6 * * MON" />)
    const localHeader = screen.getByRole('columnheader', { name: new RegExp('Your local time') })
    expect(localHeader.textContent).toContain(DST_NOTE)
  })

  it('shows a parse error and still shows the DST note for invalid input', () => {
    render(<App initialExpression="@hourly" />)
    expect(screen.getByRole('alert').textContent).toContain('GitHub Actions does not support')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBeGreaterThanOrEqual(1)
  })

  it('shows the never-fires message without a table and keeps the DST note', () => {
    render(<App initialExpression="0 0 30 2 *" />)
    expect(screen.getByRole('alert').textContent).toContain('never fire')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBeGreaterThanOrEqual(1)
  })

  it('shows the timezone-key note', () => {
    render(<App initialExpression="0 0 * * *" />)
    expect(screen.getByText(/`timezone` key/).textContent).toContain(
      'UTC-based firing times do not apply',
    )
  })

  it('shows the sub-minimum-interval warning for every-minute schedules', () => {
    render(<App initialExpression="* * * * *" />)
    expect(screen.getByText(/once every 5 minutes/)).toBeTruthy()
  })

  it('shows the sub-minimum-interval warning for */7 boundary gaps', () => {
    render(<App initialExpression="*/7 * * * *" />)
    expect(screen.getByText(/once every 5 minutes/)).toBeTruthy()
  })

  it('does not show the sub-minimum-interval warning for */15', () => {
    render(<App initialExpression="*/15 * * * *" />)
    expect(screen.queryByText(/once every 5 minutes/)).toBeNull()
  })

  it('flags name tokens in ranges as provisional', () => {
    render(<App initialExpression="0 9 * * MON-FRI" />)
    expect(screen.getByText(/awaits GHA-validator arbitration/)).toBeTruthy()
  })

  it('flags DOM/DOW OR semantics as provisional when both fields are restricted', () => {
    render(<App initialExpression="0 0 15 * 1" />)
    expect(screen.getByText(/POSIX OR interpretation/)).toBeTruthy()
  })
})
