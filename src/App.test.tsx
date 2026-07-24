import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App, DST_NOTE, formatLocal, formatUtc } from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
  });

  it("shows the never-fires message without a table and keeps the DST note", () => {
    render(<App initialExpression="0 0 30 2 *" />);
    expect(screen.getByRole("alert").textContent).toContain("never fire");
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

  it("renders warning source metadata with a docs link and verification date", () => {
    render(<App initialExpression="* * * * *" />);
    const link = screen.getByRole("link", { name: "GitHub docs" });
    expect(link.getAttribute("href")).toContain("https://docs.github.com/");
    expect(screen.getByText(/verified against/).textContent).toMatch(/on \d{4}-\d{2}-\d{2}/);
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

  it("flags DOM/DOW OR semantics as provisional when both fields are restricted", () => {
    render(<App initialExpression="0 0 15 * 1" />);
    expect(screen.getByText(/POSIX\/Vixie OR union/)).toBeTruthy();
  });

  it("flags wildcard-origin DOM/DOW intersection as provisional", () => {
    render(<App initialExpression="0 0 */2 * 1" />);
    expect(screen.getByText(/Vixie cron source precedent/)).toBeTruthy();
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
