import { useMemo, useState } from 'react'
import { neverFiresReason, nextFirings } from './cron/firings'
import { parseCron } from './cron/parse'
import { translate } from './cron/translate'

const DST_NOTE =
  'Scheduled times are computed in UTC; local times shift when your timezone changes for DST.'

function formatUtc(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

function formatLocal(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function App() {
  const [input, setInput] = useState('*/15 9-17 * * MON-FRI')
  const result = useMemo(() => parseCron(input), [input])
  const output = useMemo(() => {
    if (!result.ok) return null
    const never = neverFiresReason(result.ast)
    return {
      translation: translate(result.ast),
      firings: never ? [] : nextFirings(result.ast, new Date(), 10),
      never,
    }
  }, [result])

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
      <h1>Cronsense</h1>
      <p>Paste a GitHub Actions cron expression.</p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="Cron expression"
        spellCheck={false}
        style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace', fontSize: '1rem' }}
      />
      {!result.ok && (
        <p role="alert" style={{ color: '#b00020' }}>
          {result.error}
        </p>
      )}
      {result.ok && output && (
        <>
          <p>{output.translation.sentence}</p>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>{output.translation.timezoneNote}</p>
          {output.never ? (
            <p role="alert" style={{ color: '#b00020' }}>
              {output.never}
            </p>
          ) : (
            <>
              <h2>Next 10 firings</h2>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.25rem' }}>UTC</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.25rem' }}>Your local time</th>
                  </tr>
                </thead>
                <tbody>
                  {output.firings.map((firing) => (
                    <tr key={firing.getTime()}>
                      <td style={{ padding: '0.25rem', fontFamily: 'monospace' }}>{formatUtc(firing)}</td>
                      <td style={{ padding: '0.25rem', fontFamily: 'monospace' }}>{formatLocal(firing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: '0.85rem', color: '#555' }}>{DST_NOTE}</p>
            </>
          )}
        </>
      )}
    </main>
  )
}
