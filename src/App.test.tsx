import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App, DST_NOTE, formatLocal, formatUtc } from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

describe("App", () => {
  it("shows translation, firings table, and the DST note for a valid expression", () => {
    render(<App initialExpression="0 12 * * *" />);
    expect(screen.getByText("At 12:00 UTC.")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("UTC")).toBeTruthy();
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBe(1);
    expect(screen.getAllByRole("row").length).toBe(11);
  });

  it("renders the single DST note inside the local-time column header", () => {
    render(<App initialExpression="0 12 * * *" />);
    const localHeader = screen.getByRole("columnheader", { name: new RegExp("Your local time") });
    expect(localHeader.textContent).toContain(DST_NOTE);
  });

  it("keeps the DST note visible next to the local-time column", () => {
    render(<App initialExpression="30 6 * * MON" />);
    const localHeader = screen.getByRole("columnheader", { name: new RegExp("Your local time") });
    expect(localHeader.textContent).toContain(DST_NOTE);
  });

  it("shows a parse error and still shows the DST note for invalid input", () => {
    render(<App initialExpression="@hourly" />);
    expect(screen.getByRole("alert").textContent).toContain("GitHub Actions does not support");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/scheduled workflows are automatically disabled/)).toBeTruthy();
  });

  it("shows all caveats for a never-firing expression without a table", () => {
    render(<App initialExpression="0 0 30 2 *" />);
    expect(screen.getByRole("alert").textContent).toContain("never fire");
    expect(screen.getByText(/some queued jobs may be dropped/)).toBeTruthy();
    expect(screen.getByText(/scheduled workflows are automatically disabled/)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByText(new RegExp(DST_NOTE)).length).toBeGreaterThanOrEqual(1);
  });

  it("shows the timezone-key note", () => {
    render(<App initialExpression="0 0 * * *" />);
    expect(screen.getByText(/`timezone` key/).textContent).toContain(
      "UTC-based firing times do not apply",
    );
  });

  it("rolls expired firings out as time advances", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 12, 0, 30)));
    render(<App initialExpression="* * * * *" />);
    const firstBefore = screen.getAllByRole("row")[1]?.textContent;
    expect(firstBefore).toContain("2026-01-15 12:01 UTC");
    act(() => {
      vi.advanceTimersByTime(120000);
    });
    const firstAfter = screen.getAllByRole("row")[1]?.textContent;
    expect(firstAfter).toContain("2026-01-15 12:03 UTC");
  });

  it("shows the sub-minimum-interval warning for every-minute schedules", () => {
    render(<App initialExpression="* * * * *" />);
    expect(screen.getByText(/once every 5 minutes/)).toBeTruthy();
  });

  it("visibly emphasises the high-load caveat at minute zero", () => {
    render(<App initialExpression="0 * * * *" />);
    expect(screen.getByText(/some queued jobs may be dropped/).style.fontWeight).toBe("bold");
  });

  it("renders warning source metadata with a docs link and verification date", () => {
    render(<App initialExpression="* * * * *" />);
    const [link] = screen.getAllByRole("link", { name: "GitHub docs" });
    if (!link) throw new Error("expected a GitHub docs link");
    expect(link.getAttribute("href")).toContain("https://docs.github.com/");
    expect(screen.getAllByText(/verified against/)[0]?.textContent).toMatch(/on \d{4}-\d{2}-\d{2}/);
  });

  it("shows the sub-minimum-interval warning for */7 boundary gaps", () => {
    render(<App initialExpression="*/7 * * * *" />);
    expect(screen.getByText(/once every 5 minutes/)).toBeTruthy();
  });

  it("does not show the sub-minimum-interval warning for */15", () => {
    render(<App initialExpression="*/15 * * * *" />);
    expect(screen.queryByText(/once every 5 minutes/)).toBeNull();
  });

  it("flags name tokens in ranges as provisional", () => {
    render(<App initialExpression="0 9 * * MON-FRI" />);
    expect(screen.getByText(/awaits GHA-validator arbitration/)).toBeTruthy();
  });

  it("suppresses the empirically gated DOM/DOW warning", () => {
    render(<App initialExpression="0 0 15 * 1" />);
    expect(screen.queryByText(/POSIX\/Vixie OR union/)).toBeNull();
  });

  it("does not expose provisional DOM/DOW caveat text", () => {
    render(<App initialExpression="0 0 */2 * 1" />);
    expect(screen.queryByText(/Vixie cron source precedent/)).toBeNull();
  });

  it("loads the expression from an encoded permalink", () => {
    window.location.hash = "#0%2012%20*%20*%20*";
    render(<App />);
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe("0 12 * * *");
    expect(screen.getByText("At 12:00 UTC.")).toBeTruthy();
  });

  it("updates the expression permalink when the input changes", () => {
    render(<App initialExpression="0 12 * * *" />);
    fireEvent.change(screen.getByLabelText("Cron expression"), { target: { value: "5 8 * * *" } });
    expect(window.location.hash).toBe("#e=5%208%20*%20*%20*");
  });

  it("round-trips the namespaced permalink for any input, including empty and reserved words", () => {
    for (const value of ["", "results", "0 0 30 2", "30 6 * * MON"]) {
      cleanup();
      window.history.replaceState(null, "", "/");
      render(<App initialExpression="0 12 * * *" />);
      fireEvent.change(screen.getByLabelText("Cron expression"), { target: { value } });
      const hash = window.location.hash;
      cleanup();
      window.location.hash = hash;
      render(<App />);
      expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe(value);
    }
  });

  it("loads a compound namespaced permalink with a warning anchor", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "#e=*%20*%20*%20*%20*#sub-minimum-interval";
    render(<App />);
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe("* * * * *");
    expect(document.activeElement?.id).toBe("sub-minimum-interval");
  });

  it("gives each rendered warning a composable permalink anchor", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "#*%20*%20*%20*%20*#sub-minimum-interval";
    render(<App />);
    const warning = screen
      .getAllByRole("alert")
      .find((element) => /shortest interval/.test(element.textContent ?? ""));
    expect(warning?.id).toBe("sub-minimum-interval");
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe("sub-minimum-interval");
  });

  it("focuses a warning that only exists after a hashchange to a new expression", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "#0%2012%20*%20*%20*";
    render(<App />);
    expect(document.getElementById("sub-minimum-interval")).toBeNull();
    act(() => {
      window.location.hash = "#*%20*%20*%20*%20*#sub-minimum-interval";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(document.activeElement?.id).toBe("sub-minimum-interval");
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("does not steal focus back to the warning on the minute refresh", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 12, 0, 30)));
    window.location.hash = "#*%20*%20*%20*%20*#sub-minimum-interval";
    render(<App />);
    expect(document.activeElement?.id).toBe("sub-minimum-interval");
    const input = screen.getByLabelText("Cron expression");
    act(() => {
      input.focus();
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(document.activeElement).toBe(input);
  });

  it("ignores hash state on non-tool paths", () => {
    window.history.replaceState(null, "", "/gotchas/foo#0%205%20*%20*%20*");
    render(<App />);
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe(
      "*/15 9-17 * * MON-FRI",
    );
    fireEvent.change(screen.getByLabelText("Cron expression"), { target: { value: "5 8 * * *" } });
    expect(window.location.hash).toBe("#0%205%20*%20*%20*");
    window.history.replaceState(null, "", "/");
  });

  it("still loads legacy un-namespaced permalinks", () => {
    window.location.hash = "#0%2012%20*%20*%20*";
    render(<App />);
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe("0 12 * * *");
  });

  it("does not treat a direct /#results load as a cron expression", () => {
    window.location.hash = "#results";
    render(<App />);
    expect(screen.queryByRole("alert")?.textContent ?? "").not.toContain("results");
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe(
      "*/15 9-17 * * MON-FRI",
    );
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("moves focus to results on skip-link activation without clobbering the permalink", () => {
    render(<App initialExpression="0 12 * * *" />);
    window.history.replaceState(null, "", "#0%2012%20*%20*%20*");
    fireEvent.click(screen.getByRole("link", { name: "Skip to results" }));
    expect(document.activeElement?.id).toBe("results");
    expect(window.location.hash).toBe("#0%2012%20*%20*%20*");
    expect((screen.getByLabelText("Cron expression") as HTMLInputElement).value).toBe("0 12 * * *");
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("associates the parser error with the input for assistive technology", () => {
    render(<App initialExpression="@hourly" />);
    const input = screen.getByLabelText("Cron expression");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("cron-expression-error");
    expect(document.getElementById("cron-expression-error")?.textContent).toContain(
      "GitHub Actions does not support",
    );
  });

  it("marks valid input as not invalid", () => {
    render(<App initialExpression="0 12 * * *" />);
    const input = screen.getByLabelText("Cron expression");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });

  it("names the results region for assistive technology", () => {
    render(<App initialExpression="0 12 * * *" />);
    expect(screen.getByRole("region", { name: "Results" }).id).toBe("results");
  });

  it("focuses the results region via the skip link even for invalid input", () => {
    render(<App initialExpression="@hourly" />);
    fireEvent.click(screen.getByRole("link", { name: "Skip to results" }));
    expect(document.activeElement?.id).toBe("results");
    expect(document.activeElement?.textContent).toContain("GitHub Actions does not support");
  });

  it("discloses a truncated firing list near the maximum representable date", () => {
    vi.useFakeTimers();
    const from = new Date(Date.UTC(2026, 0, 1));
    from.setUTCFullYear(275755);
    vi.setSystemTime(from);
    render(<App initialExpression="0 0 29 2 *" />);
    expect(screen.getByRole("heading", { level: 2, name: /Next \d firings?/ })).toBeTruthy();
    expect(screen.getByText(/maximum date JavaScript can represent/)).toBeTruthy();
    expect(screen.queryByText("Next 10 firings")).toBeNull();
  });

  it("refreshes exactly at the next minute boundary, not mount-relative", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 12, 0, 29)));
    render(<App initialExpression="* * * * *" />);
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("2026-01-15 12:01 UTC");
    act(() => {
      vi.advanceTimersByTime(31000);
    });
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("2026-01-15 12:02 UTC");
  });

  it("refreshes when the page becomes visible again", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 12, 0, 0)));
    render(<App initialExpression="* * * * *" />);
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("2026-01-15 12:01 UTC");
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 12, 5, 30)));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("2026-01-15 12:06 UTC");
  });

  it("pairs each UTC row with its converted local time across a DST transition", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 2, 29, 0, 30)));
    render(<App initialExpression="0 0,2 29 3 *" timeZone="Europe/London" locale="en-GB" />);
    const rows = screen.getAllByRole("row").map((row) => row.textContent ?? "");
    expect(rows[1]).toContain("2026-03-29 02:00 UTC");
    expect(rows[1]).toContain("03:00");
    expect(rows[1]).toContain("BST");
    expect(rows[2]).toContain("2027-03-29 00:00 UTC");
    expect(rows[2]).toContain("01:00");
    expect(rows[2]).toContain("BST");
  });

  it("renders distinct local times in a non-hour-offset timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 11, 30)));
    render(<App initialExpression="0 12,14 * * *" timeZone="Asia/Kolkata" locale="en-GB" />);
    const rows = screen.getAllByRole("row").map((row) => row.textContent ?? "");
    expect(rows[1]).toContain("2026-01-15 12:00 UTC");
    expect(rows[1]).toContain("17:30");
    expect(rows[2]).toContain("2026-01-15 14:00 UTC");
    expect(rows[2]).toContain("19:30");
  });
});

describe("formatUtc", () => {
  it("formats a normal date", () => {
    expect(formatUtc(new Date(Date.UTC(2026, 0, 15, 12, 5)))).toBe("2026-01-15 12:05 UTC");
  });

  it("formats extended ISO years without truncating the minutes", () => {
    const date = new Date(Date.UTC(2000, 0, 1, 9, 30));
    date.setUTCFullYear(275500);
    expect(formatUtc(date)).toBe("275500-01-01 09:30 UTC");
  });

  it("pads sub-100 years to four digits", () => {
    const date = new Date(Date.UTC(2000, 11, 31, 23, 59));
    date.setUTCFullYear(99);
    expect(formatUtc(date)).toBe("0099-12-31 23:59 UTC");
  });
});

describe("formatLocal", () => {
  it("converts UTC to a DST-observing zone in summer", () => {
    const text = formatLocal(new Date(Date.UTC(2026, 6, 1, 12, 0)), "Europe/London", "en-GB");
    expect(text).toContain("13:00");
    expect(text).toContain("BST");
  });

  it("converts UTC to the same zone in winter without the DST offset", () => {
    const text = formatLocal(new Date(Date.UTC(2026, 0, 1, 12, 0)), "Europe/London", "en-GB");
    expect(text).toContain("12:00");
    expect(text).toContain("GMT");
  });

  it("handles zones with non-hour offsets", () => {
    const text = formatLocal(new Date(Date.UTC(2026, 0, 1, 12, 0)), "Asia/Kolkata", "en-GB");
    expect(text).toContain("17:30");
  });
});
