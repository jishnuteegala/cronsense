import { useEffect, useMemo, useState } from "react";
import {
  domDowProvisionalNote,
  neverFiresReason,
  nextFirings,
  subMinimumIntervalWarning,
} from "./cron/firings";
import { parseCron } from "./cron/parse";
import { translate } from "./cron/translate";

export const DST_NOTE =
  "scheduled times are computed in UTC; local times shift when your timezone changes for DST";

function formatUtc(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function formatLocal(date: Date, timeZone?: string, locale?: string): string {
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  });
}

export function App({
  initialExpression = "*/15 9-17 * * MON-FRI",
}: {
  initialExpression?: string;
}) {
  const [input, setInput] = useState(initialExpression);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  const result = useMemo(() => parseCron(input), [input]);
  const nowMinute = Math.floor(now.getTime() / 60000);
  const output = useMemo(() => {
    if (!result.ok) return null;
    const never = neverFiresReason(result.ast);
    const domDowNote = domDowProvisionalNote(result.ast);
    const subMinimum = never ? null : subMinimumIntervalWarning(result.ast);
    return {
      translation: translate(result.ast),
      firings: never ? [] : nextFirings(result.ast, new Date(nowMinute * 60000), 10),
      never,
      subMinimum,
      provisionalNotes: domDowNote
        ? [...result.provisionalNotes, domDowNote]
        : result.provisionalNotes,
    };
  }, [result, nowMinute]);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 1rem",
      }}
    >
      <h1>Cronsense</h1>
      <p>Paste a GitHub Actions cron expression.</p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="Cron expression"
        spellCheck={false}
        style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", fontSize: "1rem" }}
      />
      {!result.ok && (
        <p role="alert" style={{ color: "#b00020" }}>
          {result.error}
        </p>
      )}
      {result.ok && output && (
        <>
          <p>{output.translation.sentence}</p>
          <p style={{ fontSize: "0.9rem", color: "#555" }}>{output.translation.timezoneNote}</p>
          {output.provisionalNotes.map((note) => (
            <p key={note} style={{ fontSize: "0.9rem", color: "#8a5a00" }}>
              {note}
            </p>
          ))}
          {output.subMinimum && (
            <p role="alert" style={{ color: "#8a5a00" }}>
              {output.subMinimum}
            </p>
          )}
          {output.never && (
            <p role="alert" style={{ color: "#b00020" }}>
              {output.never}
            </p>
          )}
          {!output.never && (
            <>
              <h2>Next 10 firings</h2>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #ccc",
                        padding: "0.25rem",
                      }}
                    >
                      UTC
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #ccc",
                        padding: "0.25rem",
                      }}
                    >
                      Your local time
                      <span
                        style={{
                          display: "block",
                          fontWeight: "normal",
                          fontSize: "0.8rem",
                          color: "#555",
                        }}
                      >
                        {DST_NOTE}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {output.firings.map((firing) => (
                    <tr key={firing.getTime()}>
                      <td style={{ padding: "0.25rem", fontFamily: "monospace" }}>
                        {formatUtc(firing)}
                      </td>
                      <td style={{ padding: "0.25rem", fontFamily: "monospace" }}>
                        {formatLocal(firing)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
      <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "1rem" }}>Note: {DST_NOTE}.</p>
    </main>
  );
}
