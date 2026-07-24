import { useEffect, useMemo, useState } from "react";
import { domDowProvisionalNote, neverFiresReason, nextFirings } from "./cron/firings";
import { parseCron } from "./cron/parse";
import { translate } from "./cron/translate";
import { evaluateWarnings, INACTIVITY_NOTE } from "./cron/warning-engine";

export const DST_NOTE =
  "scheduled times are computed in UTC; local times shift when your timezone changes for DST";

export function formatUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  return `${year}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
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
  timeZone,
  locale,
}: {
  initialExpression?: string;
  timeZone?: string;
  locale?: string;
}) {
  const [input, setInput] = useState(initialExpression);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextMinute = () => {
      const delay = 60000 - (Date.now() % 60000);
      timer = setTimeout(() => {
        setNow(new Date());
        scheduleNextMinute();
      }, delay);
    };
    scheduleNextMinute();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  const result = useMemo(() => parseCron(input), [input]);
  const nowMinute = Math.floor(now.getTime() / 60000);
  const output = useMemo(() => {
    if (!result.ok) return null;
    const never = neverFiresReason(result.ast);
    const domDowNote = domDowProvisionalNote(result.ast);
    const warnings = evaluateWarnings(result.ast);
    return {
      translation: translate(result.ast),
      firings: never ? [] : nextFirings(result.ast, new Date(nowMinute * 60000), 10),
      never,
      warnings,
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
      {INACTIVITY_NOTE && (
        <p style={{ color: "#555" }}>
          {INACTIVITY_NOTE.message}{" "}
          <span style={{ fontSize: "0.85rem" }}>
            (verified against <a href={INACTIVITY_NOTE.sourceUrl}>GitHub docs</a> on{" "}
            {INACTIVITY_NOTE.verifiedOn})
          </span>
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
          {output.warnings
            .filter((warning) => warning.id !== "inactivity-pause")
            .map((warning) => (
              <p
                key={warning.id}
                role={warning.rank === "diagnostic" ? "alert" : undefined}
                style={{ color: "#8a5a00", fontWeight: warning.emphasised ? "bold" : "normal" }}
              >
                {warning.message}{" "}
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  (verified against{" "}
                  <a href={warning.sourceUrl} style={{ color: "inherit" }}>
                    GitHub docs
                  </a>{" "}
                  on {warning.verifiedOn})
                </span>
              </p>
            ))}
          {!output.never && (
            <>
              <h2>
                {output.firings.length < 10
                  ? `Next ${output.firings.length} firing${output.firings.length === 1 ? "" : "s"}`
                  : "Next 10 firings"}
              </h2>
              {output.firings.length < 10 && (
                <p style={{ fontSize: "0.85rem", color: "#555" }}>
                  Only {output.firings.length} firing{output.firings.length === 1 ? "" : "s"} can be
                  shown: later occurrences fall beyond the maximum date JavaScript can represent.
                </p>
              )}
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
                        {formatLocal(firing, timeZone, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
      {(!result.ok || !output || output.never !== null) && (
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "1rem" }}>Note: {DST_NOTE}.</p>
      )}
    </main>
  );
}
