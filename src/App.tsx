import { useEffect, useMemo, useState } from "react";
import { neverFiresReason, nextFirings } from "./cron/firings";
import { parseCron } from "./cron/parse";
import { translate } from "./cron/translate";
import { CONTEXTUAL_NOTES, evaluateWarnings } from "./cron/warning-engine";
import { expressionHash, isToolPage, parseHash } from "./hash";

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

function focusWarning(warningId: string) {
  const element = document.getElementById(warningId);
  if (!element) return;
  element.scrollIntoView();
  element.focus();
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
  const onToolPage = typeof window !== "undefined" && isToolPage(window.location.pathname);
  const initialHash = onToolPage ? parseHash(window.location.hash) : null;
  const [input, setInput] = useState(
    initialHash?.expression ?? initialExpression ?? "*/15 9-17 * * MON-FRI",
  );
  const [pendingWarningId, setPendingWarningId] = useState(initialHash?.warningId ?? null);
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
    if (!onToolPage) return;
    const onHashChange = () => {
      const rawHash = window.location.hash;
      const value = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
      if (value === "") {
        setInput("");
        return;
      }
      const state = parseHash(rawHash);
      if (!state) return;
      setInput(state.expression);
      if (state.warningId) setPendingWarningId(state.warningId);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [onToolPage]);
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
    if (!pendingWarningId) return;
    focusWarning(pendingWarningId);
    setPendingWarningId(null);
  }, [pendingWarningId]);

  const updateInput = (value: string) => {
    setInput(value);
    if (onToolPage) window.history.replaceState(null, "", expressionHash(value));
  };

  return (
    <main className="app">
      <a
        className="skip-link"
        href="#results"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("results")?.focus();
        }}
      >
        Skip to results
      </a>
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="16" cy="16" r="8.5" />
              <path d="M16 11.5V16l3 2" />
            </g>
          </svg>
        </span>
        <h1>Cronsense</h1>
      </header>
      <p className="lede">Paste a GitHub Actions cron expression.</p>
      <div className="panel">
        <div className="field">
          <label className="field-label" htmlFor="cron-expression">
            Cron expression
          </label>
          <input
            id="cron-expression"
            className="cron-input"
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={!result.ok}
            aria-describedby={result.ok ? undefined : "cron-expression-error"}
          />
        </div>
        <aside className="note" aria-label="Contextual note">
          {CONTEXTUAL_NOTES.map((note) => (
            <div key={note.id}>
              {note.quotes.map((quote) => (
                <blockquote className="quote" key={quote} cite={note.sourceUrl}>
                  {quote}
                </blockquote>
              ))}
              <p>
                {note.message}{" "}
                <span className="meta">
                  (verified against <a href={note.sourceUrl}>GitHub docs</a> on {note.verifiedOn})
                </span>
              </p>
            </div>
          ))}
        </aside>
      </div>
      <section className="results" id="results" tabIndex={-1} aria-label="Results">
        {!result.ok && (
          <p className="error" id="cron-expression-error" role="alert">
            {result.error}
          </p>
        )}
        {result.ok && output && (
          <>
            <p className="summary">{output.translation.sentence}</p>
            <p className="subnote">{output.translation.timezoneNote}</p>
            {output.provisionalNotes.map((note) => (
              <p className="subnote provisional" key={note}>
                {note}
              </p>
            ))}
            {output.warnings.map((warning) => (
              <article
                className={[
                  "warning",
                  warning.rank === "diagnostic" && "diagnostic",
                  warning.emphasised && "emphasised",
                ]
                  .filter(Boolean)
                  .join(" ")}
                id={warning.id}
                key={warning.id}
                tabIndex={-1}
                role={warning.rank === "diagnostic" ? "alert" : undefined}
              >
                {warning.quotes.map((quote) => (
                  <blockquote className="quote" key={quote} cite={warning.sourceUrl}>
                    {quote}
                  </blockquote>
                ))}
                {warning.message}{" "}
                <span className="meta">
                  (verified against <a href={warning.sourceUrl}>GitHub docs</a> on{" "}
                  {warning.verifiedOn})
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
                  <p className="subnote">
                    Only {output.firings.length} firing{output.firings.length === 1 ? "" : "s"} can
                    be shown: later occurrences fall beyond the maximum date JavaScript can
                    represent.
                  </p>
                )}
                <table className="firings">
                  <thead>
                    <tr>
                      <th>UTC</th>
                      <th>
                        Your local time
                        <span className="col-note">{DST_NOTE}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.firings.map((firing) => (
                      <tr key={firing.getTime()}>
                        <td>{formatUtc(firing)}</td>
                        <td>{formatLocal(firing, timeZone, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </section>
      {(!result.ok || !output || output.never !== null) && (
        <p className="subnote">Note: {DST_NOTE}.</p>
      )}
    </main>
  );
}
