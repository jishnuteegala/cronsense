import { useEffect, useMemo, useRef, useState } from "react";
import { Results } from "./Results";
import { analyze } from "./cron/analyze";
import { parseCron } from "./cron/parse";
import { CONTEXTUAL_NOTES } from "./cron/warning-engine";
import { expressionHash, isToolPage, parseHash } from "./hash";
import { scanWorkflow } from "./workflow-scan";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentInput = useRef(input);
  const previousInput = useRef(input);
  const hashNavigation = useRef<string | null>(null);
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
        hashNavigation.current = null;
        currentInput.current = "";
        setInput("");
        return;
      }
      const state = parseHash(rawHash);
      if (!state) return;
      hashNavigation.current = state.expression === currentInput.current ? null : rawHash;
      currentInput.current = state.expression;
      setInput(state.expression);
      if (state.warningId) setPendingWarningId(state.warningId);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [onToolPage]);
  const scan = useMemo(() => scanWorkflow(input), [input]);
  const result = useMemo(() => parseCron(input), [input]);
  const nowMinute = Math.floor(now.getTime() / 60000);
  const output = useMemo(
    () => (result.ok ? analyze(result, new Date(nowMinute * 60000)) : null),
    [result, nowMinute],
  );

  useEffect(() => {
    if (!pendingWarningId) return;
    focusWarning(pendingWarningId);
    setPendingWarningId(null);
  }, [pendingWarningId]);

  useEffect(() => {
    const resizeInput = () => {
      const element = inputRef.current;
      if (!element) return;
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    };
    resizeInput();
    window.addEventListener("resize", resizeInput);
    return () => window.removeEventListener("resize", resizeInput);
  }, [input]);

  useEffect(() => {
    if (!onToolPage || previousInput.current === input) return;
    previousInput.current = input;
    const navigatedHash = hashNavigation.current;
    hashNavigation.current = null;
    if (scan.kind === "cron") {
      window.history.replaceState(null, "", navigatedHash ?? expressionHash(input));
    }
  }, [input, onToolPage, scan]);

  const inputIsEmpty = input.trim() === "";
  const inputIsInvalid =
    !inputIsEmpty &&
    (scan.kind === "error" ||
      scan.kind === "none" ||
      scan.kind === "schedule-not-list" ||
      (scan.kind === "cron" && !result.ok));

  const updateInput = (value: string) => {
    currentInput.current = value;
    setInput(value);
  };

  const selectCron = (value: string) => {
    currentInput.current = value;
    setInput(value);
    if (onToolPage) window.location.hash = expressionHash(value);
  };

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to main content
      </a>
      <main className="app" id="main-content" tabIndex={-1}>
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
        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="cron-expression">
              Cron expression
            </label>
            <span className="field-hint">or a workflow file</span>
          </div>
          <textarea
            ref={inputRef}
            id="cron-expression"
            className="cron-input"
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            rows={1}
            aria-invalid={inputIsInvalid}
            aria-describedby={inputIsInvalid ? "cron-expression-error" : undefined}
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
              <p className="meta">
                verified against <a href={note.sourceUrl}>GitHub docs</a> on {note.verifiedOn}
                {" - "}
                <a href={`/gotchas/${note.gotcha.slug}/`}>details</a>
              </p>
            </div>
          ))}
        </aside>
        <Results
          scan={scan}
          result={result}
          output={output}
          inputIsEmpty={inputIsEmpty}
          nowMinute={nowMinute}
          timeZone={timeZone}
          locale={locale}
          onSelectCron={selectCron}
        />
      </main>
      <footer className="page site-footer">
        <span>&copy; {new Date().getFullYear()} Jishnu Teegala</span>
        <a href="https://jishnuteegala.com/privacy">Privacy</a>
        <a href="https://github.com/jishnuteegala/cronsense">Source</a>
      </footer>
    </>
  );
}
