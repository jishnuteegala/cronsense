import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { analyze, type Analysis } from "./cron/analyze";
import { parseCron, type ParseResult } from "./cron/parse";
import { CONTEXTUAL_NOTES, type ActiveWarning } from "./cron/warning-engine";
import { VERIFICATION_URL } from "./cron/warnings";
import { DST_NOTE, formatLocal, formatRelative, formatUtc } from "./format";
import { expressionHash, isToolPage, parseHash } from "./hash";
import { scanWorkflow, type WorkflowScan } from "./workflow-scan";

const DEFAULT_EXPRESSION = "*/15 9-17 * * MON-FRI";
const ERROR_ID = "cron-expression-error";
const FIRING_COUNT = 10;

interface AppProps {
  initialExpression?: string;
  timeZone?: string;
  locale?: string;
}

function readHashExpression(): { expression: string; warningId: string | null } | null {
  if (!isToolPage(window.location.pathname)) return null;
  return parseHash(window.location.hash);
}

function currentMinute(): Date {
  return new Date(Math.floor(Date.now() / 60000) * 60000);
}

function WarningCard({ warning }: { warning: ActiveWarning }) {
  return (
    <div
      className={`warning${warning.emphasised ? " emphasised" : ""}`}
      role={warning.rank === "diagnostic" ? "alert" : undefined}
      id={warning.id}
      tabIndex={-1}
    >
      <p className="warning-message">{warning.message}</p>
      <details className="warning-quote">
        <summary>docs quote</summary>
        {warning.quotes.map((quote) => (
          <blockquote key={quote} cite={warning.sourceUrl}>
            {quote}
          </blockquote>
        ))}
        <p className="warning-verified">
          {warning.provenance === "empirical" ? (
            <>
              empirically confirmed via <a href={VERIFICATION_URL}>cronsense-verification</a> on{" "}
              {warning.verifiedOn}
            </>
          ) : (
            `verified against GitHub docs on ${warning.verifiedOn}`
          )}
        </p>
      </details>
      <p className="warning-meta">
        verified {warning.verifiedOn} · <a href={warning.sourceUrl}>GitHub docs</a>
      </p>
    </div>
  );
}

function Firings({
  analysis,
  now,
  timeZone,
  locale,
}: {
  analysis: Analysis;
  now: Date;
  timeZone?: string;
  locale?: string;
}) {
  if (analysis.never !== null) return null;
  const [first] = analysis.firings;
  if (!first) return null;
  return (
    <>
      <p className="next-firing">
        Next firing <strong>{formatUtc(first)}</strong> · {formatRelative(now, first)}
      </p>
      <h2>
        Next {analysis.firings.length} firing{analysis.firings.length === 1 ? "" : "s"}
      </h2>
      <table>
        <thead>
          <tr>
            <th>UTC</th>
            <th>
              Your local time <span className="dst">({DST_NOTE})</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {analysis.firings.map((firing, index) => (
            <tr key={firing.getTime()}>
              <td>
                {formatUtc(firing)}
                {index === 0 && <span className="mark"> next</span>}
              </td>
              <td>{formatLocal(firing, timeZone, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {analysis.firings.length < FIRING_COUNT && (
        <p className="truncated">
          the list ends early: later firings fall past the maximum date JavaScript can represent
        </p>
      )}
    </>
  );
}

function ScanResults({
  scan,
  onPick,
}: {
  scan: Extract<WorkflowScan, { kind: "scan" }>;
  onPick: (value: string) => void;
}) {
  return (
    <>
      <p className="scan-summary">
        {scan.crons.length} parsed, {scan.unparseable.length} unparseable
      </p>
      <ul className="scan-list" aria-label="Workflow schedule crons">
        {scan.entries.map((entry, index) => (
          <li key={index} className="scan-card">
            {entry.kind === "cron" ? (
              <>
                <button type="button" onClick={() => onPick(entry.cron.value)}>
                  <code>{entry.cron.value}</code>
                </button>{" "}
                <span>{entry.cron.summary}</span>
                {entry.cron.duplicateOf !== null && (
                  <span className="dup"> duplicate of #{entry.cron.duplicateOf}</span>
                )}
              </>
            ) : (
              <>
                <code>{entry.cron.raw}</code>{" "}
                {entry.cron.reason.split("`${{ }}`").map((part, partIndex) => (
                  <span key={partIndex}>
                    {partIndex > 0 && <code>{"${{ }}"}</code>}
                    {part}
                  </span>
                ))}
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="scan-note">Extracts on.schedule crons; does not lint workflows.</p>
    </>
  );
}

export function App({ initialExpression, timeZone, locale }: AppProps) {
  const [input, setInput] = useState(
    () => initialExpression ?? readHashExpression()?.expression ?? DEFAULT_EXPRESSION,
  );
  const [anchor, setAnchor] = useState<string | null>(() =>
    initialExpression === undefined ? (readHashExpression()?.warningId ?? null) : null,
  );
  const [now, setNow] = useState(currentMinute);

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(
        () => {
          setNow(currentMinute());
          arm();
        },
        60000 - (Date.now() % 60000),
      );
    };
    arm();
    const onVisible = () => {
      if (!document.hidden) setNow(currentMinute());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (!isToolPage(window.location.pathname)) return;
      const raw = window.location.hash;
      if (raw === "" || raw === "#") {
        setInput("");
        setAnchor(null);
        return;
      }
      const state = parseHash(raw);
      if (state === null) return;
      setInput(state.expression);
      setAnchor(state.warningId);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (anchor === null) return;
    const target = document.getElementById(anchor);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  }, [anchor, input]);

  const scan = useMemo(() => scanWorkflow(input), [input]);
  const parsed: ParseResult | null = useMemo(
    () => (scan.kind === "cron" ? parseCron(input.trim()) : null),
    [scan, input],
  );
  const analysis = useMemo(() => (parsed?.ok ? analyze(parsed, now) : null), [parsed, now]);

  const onInput = (value: string) => {
    setInput(value);
    setAnchor(null);
    if (!isToolPage(window.location.pathname)) return;
    if (value.includes("\n") && scanWorkflow(value).kind !== "cron") return;
    window.history.replaceState(
      null,
      "",
      value === "" ? window.location.pathname + window.location.search : expressionHash(value),
    );
  };

  const onSkip = (event: MouseEvent) => {
    event.preventDefault();
    document.getElementById("main-content")?.focus();
  };

  const hasInput = input.trim() !== "";
  const inputError =
    (scan.kind === "cron" && parsed && !parsed.ok && hasInput) || scan.kind === "error";
  const inputAlert = inputError || scan.kind === "none" || scan.kind === "schedule-not-list";
  const notes: string[] = !hasInput
    ? []
    : [
        ...new Set([
          ...(analysis?.provisionalNotes ?? []),
          ...(analysis === null ? [] : [analysis.translation.timezoneNote]),
          ...(analysis !== null && analysis.firings.length > 0 ? [] : [DST_NOTE]),
        ]),
      ];

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={onSkip}>
        Skip to main content
      </a>
      <header className="site-head">
        <a className="brand" href="/">
          Cronsense
        </a>
        <a href="/gotchas/">gotchas</a>
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="field-head">
          <label htmlFor="cron-expression">Cron expression</label>
          <span className="hint">or workflow YAML</span>
        </div>
        <textarea
          id="cron-expression"
          value={input}
          onChange={(event) => onInput(event.target.value)}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={inputError}
          aria-describedby={inputAlert ? ERROR_ID : undefined}
        />
        {hasInput && (
          <aside className="context-note" aria-label="Contextual note">
            {CONTEXTUAL_NOTES.map((note) => (
              <p key={note.id}>
                {note.quotes[0]} · verified {note.verifiedOn} ·{" "}
                <a href={`/gotchas/${note.gotcha.slug}/`}>details</a>
              </p>
            ))}
          </aside>
        )}
        <section id="results" aria-label="Results">
          {scan.kind === "cron" && parsed && !parsed.ok && hasInput && (
            <div role="alert" id={ERROR_ID} className="error">
              {parsed.error}
            </div>
          )}
          {scan.kind === "none" && (
            <div role="alert" id={ERROR_ID} className="error">
              this workflow has no on.schedule triggers
            </div>
          )}
          {scan.kind === "schedule-not-list" && (
            <div role="alert" id={ERROR_ID} className="error">
              on.schedule is present but not a list; expected a list of cron entries
            </div>
          )}
          {scan.kind === "error" && (
            <div role="alert" id={ERROR_ID} className="error">
              Unable to parse workflow YAML: {scan.error}
            </div>
          )}
          {scan.kind === "scan" && <ScanResults scan={scan} onPick={onInput} />}
          {analysis !== null && (
            <>
              <p className="translation">{analysis.translation.sentence}</p>
              <Firings analysis={analysis} now={now} timeZone={timeZone} locale={locale} />
              {analysis.warnings.map((warning) => (
                <WarningCard key={warning.id} warning={warning} />
              ))}
            </>
          )}
          {notes.length > 0 && (
            <details className="notes">
              <summary>
                {notes.length} note{notes.length === 1 ? "" : "s"}
              </summary>
              <ul>
                {notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      </main>
      <footer className="site-foot">
        © {new Date().getFullYear()} Jishnu Teegala ·{" "}
        <a href="https://jishnuteegala.com/privacy">Privacy</a> ·{" "}
        <a href="https://github.com/jishnuteegala/cronsense">Source</a>
      </footer>
    </>
  );
}
