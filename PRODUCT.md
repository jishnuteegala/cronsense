# Product

## Register

product

## Platform

web

## Users

Developers who write and maintain GitHub Actions scheduled workflows. They arrive mid-task, usually while debugging a `schedule:` trigger that did not fire when they expected, or while authoring a new cron line and wanting to confirm it means what they think. They read a cron expression the way they read code, expect exact times, and distrust hand-wavy "roughly every hour" answers. Many land from a search like "why didn't my scheduled workflow run".

## Product Purpose

Cronsense parses a GitHub Actions cron expression, translates it into plain English, and lists the next ten firing times in UTC alongside the browser's local time. It encodes the scheduling behaviours specific to GitHub Actions that a generic cron checker ignores: high-load delay and drop, the five-minute minimum interval, the 60-day inactivity pause on public repositories, and the rejection of `@`-shortcuts. Interpretations the docs leave open are flagged as provisional rather than asserted. Success is a developer reading the output once and trusting it enough to stop guessing.

## Positioning

The cron checker that answers a GitHub-Actions-specific question no generic cron tool can: not just what the expression means, but whether and when Actions will actually run it.

## Brand Personality

Precise, sourced, and quietly authoritative. The voice of a careful colleague who cites the documentation and marks the difference between what is confirmed and what is provisional. It never overstates: community lore such as the "~15 minute" delay figure is deliberately absent. Calm, dense with real information, no marketing tone.

## Anti-references

Generic cron-expression websites cluttered with ad units and interstitials. Tools that assert undocumented behaviour as fact. Marketing-heavy SaaS landing pages with hero gradients and stock illustration. Anything that pads a precise answer with filler.

## Design Principles

Show the source. Every caveat carries the exact quote, a dated verification stamp, and a link to the primary GitHub documentation.

Mark what is provisional. Confirmed behaviour and inferred behaviour are visually and verbally distinct; the tool never launders a guess into a fact.

The tool disappears into the task. A developer pastes an expression and reads an answer; nothing stands between the input and the result.

Static and self-contained. Everything runs client-side from a static bundle with no accounts, no analytics, and no third-party requests; the gotcha pages and `llms.txt` stay fetchable by agents and crawlers.

## Accessibility & Inclusion

Full light and dark themes driven by `prefers-color-scheme`. Every text and background pair clears WCAG AA (4.5:1 for body text). Visible focus rings, a keyboard skip link, input touch targets of at least 48px, and honoured `prefers-reduced-motion`.
