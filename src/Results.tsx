import type { Analysis } from "./cron/analyze";
import type { ParseResult } from "./cron/parse";
import { VERIFICATION_URL } from "./cron/warnings";
import { DST_NOTE, formatLocal, formatRelative, formatUtc } from "./format";
import type { WorkflowScan } from "./workflow-scan";

function ScanStatus({
  scan,
  onSelectCron,
}: {
  scan: WorkflowScan;
  onSelectCron: (value: string) => void;
}) {
  return (
    <>
      {scan.kind === "error" && (
        <p className="error" id="cron-expression-error" role="alert">
          Unable to parse workflow YAML: {scan.error}
        </p>
      )}
      {scan.kind === "none" && (
        <p className="error" id="cron-expression-error" role="alert">
          This workflow has no <code>on.schedule</code> triggers.
        </p>
      )}
      {scan.kind === "schedule-not-list" && (
        <p className="error" id="cron-expression-error" role="alert">
          This workflow&apos;s <code>on.schedule</code> is not a list.
        </p>
      )}
      <p className="subnote">
        Extracts <code>on.schedule</code> crons; does not lint workflows.
      </p>
      {scan.kind === "scan" && (
        <>
          <p className="scan-summary">
            {scan.crons.length} parsed, {scan.unparseable.length} unparseable
          </p>
          <ul className="scan-cards" aria-label="Workflow schedule crons" role={"list"}>
            {scan.entries.map((entry) =>
              entry.kind === "cron" ? (
                <li key={`${entry.cron.value}-${entry.cron.position}`}>
                  <button className="scan-card" onClick={() => onSelectCron(entry.cron.value)}>
                    <code>{entry.cron.value}</code>
                    <span>{entry.cron.summary}</span>
                    {entry.cron.duplicateOf && (
                      <small>duplicate of #{entry.cron.duplicateOf}</small>
                    )}
                  </button>
                </li>
              ) : (
                <li key={`${entry.cron.raw}-${entry.cron.position}`}>
                  <article className="scan-card unparseable">
                    <strong>Can't evaluate</strong>
                    <code>{entry.cron.raw}</code>
                    <span>{entry.cron.reason}</span>
                  </article>
                </li>
              ),
            )}
          </ul>
        </>
      )}
    </>
  );
}

function AnalysisView({
  output,
  nowMinute,
  timeZone,
  locale,
}: {
  output: Analysis;
  nowMinute: number;
  timeZone?: string;
  locale?: string;
}) {
  const next = output.firings[0];
  const relative = next && formatRelative(new Date(nowMinute * 60000), next);
  return (
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
            {warning.provenance === "empirical" ? (
              <>
                (empirically confirmed via <a href={VERIFICATION_URL}>cronsense-verification</a> on{" "}
                {warning.verifiedOn})
              </>
            ) : (
              <>
                (verified against <a href={warning.sourceUrl}>GitHub docs</a> on{" "}
                {warning.verifiedOn})
              </>
            )}
          </span>
        </article>
      ))}
      {!output.never && relative && (
        <p className="next-firing">
          <span className="next-label">Next firing</span>
          <span className="next-time">{formatUtc(next)}</span>
          <span className="next-rel" key={relative}>
            {relative}
          </span>
        </p>
      )}
      {!output.never && (
        <>
          <h2>
            {output.firings.length < 10
              ? `Next ${output.firings.length} firing${output.firings.length === 1 ? "" : "s"}`
              : "Next 10 firings"}
          </h2>
          {output.firings.length < 10 && (
            <p className="subnote">
              Only {output.firings.length} firing{output.firings.length === 1 ? "" : "s"} can be
              shown: later occurrences fall beyond the maximum date JavaScript can represent.
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
              {output.firings.map((firing, index) => (
                <tr className={index === 0 ? "is-next" : undefined} key={firing.getTime()}>
                  <td>
                    {formatUtc(firing)}
                    {index === 0 && <span className="next-chip">next</span>}
                  </td>
                  <td>{formatLocal(firing, timeZone, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

interface ResultsProps {
  scan: WorkflowScan;
  result: ParseResult;
  output: Analysis | null;
  inputIsEmpty: boolean;
  nowMinute: number;
  timeZone?: string;
  locale?: string;
  onSelectCron: (value: string) => void;
}

export function Results({
  scan,
  result,
  output,
  inputIsEmpty,
  nowMinute,
  timeZone,
  locale,
  onSelectCron,
}: ResultsProps) {
  const cronError = scan.kind === "cron" && !result.ok && !inputIsEmpty;
  return (
    <>
      <section className="results" id="results" tabIndex={-1} aria-label="Results">
        {scan.kind !== "cron" && <ScanStatus scan={scan} onSelectCron={onSelectCron} />}
        {cronError && (
          <p className="error" id="cron-expression-error" role="alert">
            {result.error}
          </p>
        )}
        {scan.kind === "cron" && result.ok && output && (
          <AnalysisView output={output} nowMinute={nowMinute} timeZone={timeZone} locale={locale} />
        )}
      </section>
      {(scan.kind !== "cron" || !result.ok || !output || output.never !== null) && (
        <p className="subnote">Note: {DST_NOTE}.</p>
      )}
    </>
  );
}
