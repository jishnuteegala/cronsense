import { useEffect, useMemo, useState } from "react";
import { neverFiresReason, nextFirings } from "./cron/firings";
import { parseCron } from "./cron/parse";
import { translate } from "./cron/translate";
import { CONTEXTUAL_NOTES, evaluateWarnings } from "./cron/warning-engine";
import { expressionHash, parseHash } from "./hash";

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
  initialExpression,
  timeZone,
  locale,
}: {
  initialExpression?: string;
  timeZone?: string;
  locale?: string;
}) {
  const initialHash = typeof window === "undefined" ? null : parseHash(window.location.hash);
  const [input, setInput] = useState(
    initialHash?.expression ?? initialExpression ?? "*/15 9-17 * * MON-FRI",
  );
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
  useEffect(() => {
    const onHashChange = () => {
      const state = parseHash(window.location.hash);
      if (!state || state.expression === "results") return;
      setInput(state.expression);
      if (state.warningId) document.getElementById(state.warningId)?.scrollIntoView();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const result = useMemo(() => parseCron(input), [input]);
  const nowMinute = Math.floor(now.getTime() / 60000);
  const output = useMemo(() => {
    if (!result.ok) return null;
    const never = neverFiresReason(result.ast);
    const warnings = evaluateWarnings(result.ast);
    return {
      translation: translate(result.ast),
      firings: never ? [] : nextFirings(result.ast, new Date(nowMinute * 60000), 10),
      never,
      warnings,
      provisionalNotes: result.provisionalNotes,
    };
  }, [result, nowMinute]);

  useEffect(() => {
    const warningId = parseHash(window.location.hash)?.warningId;
    if (warningId) document.getElementById(warningId)?.scrollIntoView();
  }, [output]);

  const updateInput = (value: string) => {
    setInput(value);
    window.history.replaceState(null, "", expressionHash(value));
  };

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 1rem",
      }}
    >
      <a
        href="#results"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("results")?.focus();
        }}
      >
        Skip to results
      </a>
      <h1>Cronsense</h1>
      <p>Paste a GitHub Actions cron expression.</p>
      <label htmlFor="cron-expression">Cron expression</label>
      <input
        id="cron-expression"
        value={input}
        onChange={(e) => updateInput(e.target.value)}
        spellCheck={false}
        style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", fontSize: "1rem" }}
      />
      {!result.ok && (
        <p role="alert" style={{ color: "#b00020" }}>
          {result.error}
        </p>
      )}
      <aside
        aria-label="Contextual note"
        style={{ borderLeft: "3px solid #666", paddingLeft: "0.75rem" }}
      >
        {CONTEXTUAL_NOTES.map((note) => (
          <p key={note.id} style={{ color: "#555" }}>
            {note.message}{" "}
            <span style={{ fontSize: "0.85rem" }}>
              (verified against <a href={note.sourceUrl}>GitHub docs</a> on {note.verifiedOn})
            </span>
          </p>
        ))}
      </aside>
      {result.ok && output && (
        <section id="results" tabIndex={-1}>
          <p>{output.translation.sentence}</p>
          <p style={{ fontSize: "0.9rem", color: "#555" }}>{output.translation.timezoneNote}</p>
          {output.provisionalNotes.map((note) => (
            <p key={note} style={{ fontSize: "0.9rem", color: "#8a5a00" }}>
              {note}
            </p>
          ))}
          {output.warnings.map((warning) => (
            <article
              id={warning.id}
              key={warning.id}
              role={warning.rank === "diagnostic" ? "alert" : undefined}
              style={{
                borderLeft: `3px solid ${warning.rank === "diagnostic" ? "#b00020" : "#8a5a00"}`,
                color: warning.rank === "diagnostic" ? "#8a0018" : "#664400",
                fontWeight: warning.emphasised ? "bold" : "normal",
                margin: "1rem 0",
                paddingLeft: "0.75rem",
              }}
            >
              {warning.message}{" "}
              <span style={{ fontSize: "0.85rem", color: "#555" }}>
                (verified against{" "}
                <a href={warning.sourceUrl} style={{ color: "inherit" }}>
                  GitHub docs
                </a>{" "}
                on {warning.verifiedOn})
              </span>
            </article>
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
        </section>
      )}
      {(!result.ok || !output || output.never !== null) && (
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "1rem" }}>Note: {DST_NOTE}.</p>
      )}
    </main>
  );
}
