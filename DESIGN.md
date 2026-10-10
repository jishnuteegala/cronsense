---
name: Cronsense
description: The cron checker that tells you when your GitHub Actions workflow will actually fire.
colors:
  ink: "#16181d"
  ink-strong: "#0a0c10"
  muted: "#5b616e"
  faint: "#656b78"
  bg: "#f7f8fa"
  surface: "#ffffff"
  surface-2: "#f2f4f7"
  surface-inset: "#f7f8fa"
  accent: "#4f46e5"
  accent-hover: "#4338ca"
  accent-soft: "#eef0fe"
  accent-contrast: "#ffffff"
  rule: "#e5e8ee"
  rule-strong: "#d3d8e0"
  warn-fg: "#7a4a00"
  warn-accent: "#b8791f"
  warn-bg: "#fdf6e9"
  danger-fg: "#a3001a"
  danger-accent: "#cf3040"
  danger-bg: "#fdeef0"
typography:
  title:
    fontFamily: "Inter Variable, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  summary:
    fontFamily: "Inter Variable, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.4rem, 1.15rem + 1.2vw, 1.75rem)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter Variable, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter Variable, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  mono:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Cascadia Code, Menlo, Consolas, monospace"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "0.75rem"
  s4: "1rem"
  s5: "1.5rem"
  s6: "2rem"
  s7: "3rem"
components:
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "{spacing.s3} {spacing.s4}"
  note:
    textColor: "{colors.muted}"
    borderLeft: "2px {colors.rule-strong}"
    paddingLeft: "{spacing.s3}"
---

# Design System: Cronsense

## 1. Overview

**Creative North Star: "The Lab Notebook"**

Cronsense reads like a careful engineer's notebook: a clean sheet, a monospaced entry, a sourced margin note dated to the day it was checked. The interface is a single flat column - no cards, no panels, no paragraphs of framing copy. A terse label row names the input; the answer arrives below in plain language, then a dense table of exact times. Nothing competes with the reading. The register is tool, not marketing: the design serves a developer mid-task who distrusts hand-wavy answers and wants the times to be right.

The page is flat: a neutral body, hairline rules, and no decorative elevation. The one saturated color, indigo, appears only on the brand mark, links, primary focus, and the input's active border. It never decorates. Warning and danger states borrow amber and red, but only to distinguish a documented gotcha from a fatal parse error. This system explicitly rejects the generic cron-site look: no ad units, no interstitials, no hero gradients, no stock illustration, no marketing filler around a precise answer.

Both light and dark themes are first-class, driven entirely by `prefers-color-scheme`. Every text-and-background pair clears WCAG AA. The tool is meant to disappear into the task.

**Key Characteristics:**

- Flat column, terse labels, one answer, one dense table: the tool leads, not the chrome.
- Indigo used on ≤10% of any screen; its rarity is the point.
- Monospace for every machine value (cron field, UTC/local time); sans for prose.
- Sourced margin notes: every caveat quotes the docs and carries a dated verification stamp.
- Flat everywhere; color responds only to state.

## 2. Colors

A restrained near-neutral palette anchored by a single indigo accent, with amber and red reserved strictly for advisory and fatal states.

### Primary

- **Signal Indigo** (`#4f46e5`, dark `#8b8bf7`): The one voice. Brand mark gradient, links, the input's focused border, focus rings, and the skip link. Never used as a decorative fill.
- **Indigo Deep** (`#4338ca`, dark `#a2a2fb`): The gradient partner and hover state for the brand mark and interactive accents.
- **Indigo Wash** (`#eef0fe`, dark `#1e1f36`): A barely-there soft tint for accent-adjacent surfaces.

### Neutral

- **Ink** (`#16181d`, dark `#e6e8ec`): Body text and table data.
- **Ink Strong** (`#0a0c10`, dark `#f6f7f9`): Headings, the summary sentence, and the value the eye lands on.
- **Muted** (`#5b616e`, dark `#9aa1ad`): Field labels, subnotes, the contextual note, and secondary prose.
- **Faint** (`#656b78`, dark `#868d9a`): Uppercase section labels, table headers, the field hint, verification stamps.
- **Page** (`#f7f8fa`, dark `#0b0d10`): The flat body background.
- **Surface** (`#ffffff`, dark `#16181d`): The input field and gotcha articles.
- **Surface 2** (`#f2f4f7`, dark `#1d2027`): Table header rows, inline `code`, and small chips.
- **Rule** (`#e5e8ee`, dark `#262a31`) / **Rule Strong** (`#d3d8e0`, dark `#333842`): Hairline borders and dividers; the stronger weight edges the input.

### Tertiary

- **Caution Amber** (fg `#7a4a00`, accent `#b8791f`, bg `#fdf6e9`; dark fg `#f2c879`): Advisory warnings for documented GitHub Actions behaviours (delay, minimum interval, inactivity pause).
- **Fault Red** (fg `#a3001a`, accent `#cf3040`, bg `#fdeef0`; dark fg `#ff9aa5`): Parse errors and diagnostic warnings, the difference between "this is a caveat" and "this will not run".

### Named Rules

**The One Voice Rule.** Indigo appears on no more than ~10% of any screen: the mark, links, focus, and the active input edge. Everything else is neutral. Its rarity is what makes a focused field or a link legible at a glance.

**The Meaning-Only Color Rule.** Amber and red are never decorative. Amber means "documented gotcha", red means "fatal or diagnostic". If a state has no meaning, it stays neutral.

## 3. Typography

**Body Font:** Inter Variable, self-hosted (with Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)
**Mono Font:** ui-monospace (with SF Mono, JetBrains Mono, Cascadia Code, Menlo, Consolas)

**Character:** One well-tuned sans carries every prose role; a monospace family carries every machine value. The split is semantic, not decorative: if it's a cron field, a UTC timestamp, or a local time, it's mono; if it's language, it's Inter. Inter runs with `cv11` and `ss01` feature settings enabled.

### Hierarchy

- **Title** (weight 650, 1.05rem, line-height 1.2, tracking -0.015em): The "Cronsense" wordmark in the masthead, deliberately smaller than the answer it precedes.
- **Summary** (weight 650, `clamp(1.4rem, 1.15rem + 1.2vw, 1.75rem)`, line-height 1.2, tracking -0.02em, `text-wrap: balance`): The plain-English translation of the expression, and the lead of the results block. It is amplified to read first, ahead of the input; the answer leads, the tool recedes.
- **Next-firing time** (mono, weight 500, `clamp(1.3rem, 1.1rem + 1vw, 1.6rem)`, tracking -0.01em, tabular-nums): The single computed time the reader lands on. The focal payload of the results.
- **Body** (weight 400, 1rem, line-height 1.55): The sparse prose that remains on the tool page.
- **Label** (weight 600, 0.78rem, tracking 0.06em, uppercase): Section headers ("Next 10 firings") and table column heads, in Faint.
- **Field Label** (weight 600, 0.82rem, tracking 0.02em): The "Cron expression" input label, in Muted; its sibling hint ("or a workflow file") sits at 0.8rem in Faint.
- **Mono** (weight 400, 0.86rem in tables / 1.05rem in the input, tabular-nums): The cron input and every time value.

### Named Rules

**The Mono-Is-A-Value Rule.** Monospace signals "this is machine-exact". Use it only for the cron expression and computed times; never for emphasis or flavour in prose.

**The Self-Hosted Font Rule.** Inter Variable ships as same-origin `woff2` in `public/fonts/`, declared via `@font-face` in the shared token CSS with `font-display: swap`. No font is ever fetched from a third party (no Google Fonts link); the product's "no third-party requests" principle covers fonts, not just scripts. Both the SPA and the static gotcha pages resolve the font from `/fonts/`.

## 4. Elevation

Flat, full stop. No drop shadows anywhere in the system; layering is hairline rules (`rule`, `rule-strong`) and tinted fills only. The single exception is the input's 3px focus ring, which is a state indicator, not decoration.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. The only reactive elevation is the input's focus ring. The one motion in the system is the next-firing relative time's rise-and-fade on value change, which conveys state, not decoration, and is disabled under `prefers-reduced-motion`.

## 5. Components

### Buttons

No text buttons exist. The single primary affordance is the input itself; the skip link is the only button-shaped element, hidden off-screen until focused, then indigo on `accent-contrast` text at `radius-sm`.

### Inputs / Fields

- **Style:** Full 1px `rule-strong` border on a `surface` background, `radius-md` (10px), monospace at 1.05rem, min-height 48px (≥48px touch target).
- **Hover:** Border shifts toward indigo (`color-mix` 45%).
- **Focus:** Border becomes solid indigo and a 3px `accent-ring` glow appears. No outline duplication.
- **Error:** `aria-invalid="true"` turns the border `danger-accent`; on focus the ring recolors to a red mix. The error message renders in the `.error` block below.

### Cards / Containers

- **Gotcha article** (deep-dive pages): `surface` background, 1px `rule` border, `radius-lg` (16px), `space-6` padding, no shadow.
- **Note** (contextual caveat): a plain margin strip - muted text, quote set off by a 2px `rule-strong` left rule, plus a dated source stamp and a link to the gotcha page. No fill, no border.

### Alerts

- **Error** (`.error`): `danger-bg` fill, `danger-fg` text, a uniform 1px `danger-accent`-mix border, `role="alert"`. State comes from the tinted fill plus border, not decoration.
- **Warning** (`.warning`): `warn-bg` fill, `warn-fg` text, a uniform 1px `warn-accent`-mix border; the `.diagnostic` variant recolors to the danger tokens. Each carries a quoted doc excerpt and verification date.

### Next firing (focal element)

The one answer a developer debugging a schedule arrives for, promoted to the lead of the results. A borderless typographic statement (no card, no box), separated from the summary by a hairline `rule` top border:

- **Label** (`.next-label`): "Next firing" in `accent` (indigo), 0.72rem, weight 600, tracking 0.08em, uppercase. Indigo earns its place here as a state indicator, the one firing that is next, not decoration; it stays inside the ≤10% One Voice budget.
- **Time** (`.next-time`): the next UTC firing in mono at the Next-firing display step (above), Ink Strong.
- **Relative** (`.next-rel`): a plain-language "in 3 hours" in Muted, recomputed each minute against the live clock. On update it plays a 0.4s rise-and-fade (`ease-out-quart`), keyed off the text so it only animates when the value actually changes. Disabled under `prefers-reduced-motion`. This is the system's one moment of state-conveying motion.

### Tables (signature component)

- **Firings table:** The densest surface. 1px `rule` border, `radius-md`, `overflow: hidden` for clean corners, `border-collapse: separate`. Header row on `surface-2` with uppercase Faint labels; body cells in mono at 0.86rem with `tabular-nums`. First column (UTC) is Ink Strong and semibold; rows tint to `surface-inset` on hover. This is where the product's precision lives, so alignment and monospaced columns matter most.
- **The next row** (`tr.is-next`): the first (soonest) firing is marked, giving the table a point of view relative to _now_. Its cells take an `accent-soft` wash and Ink Strong text, and the UTC cell carries a small solid-indigo `next` chip (`accent` fill, `accent-contrast` text, `radius-sm`, uppercase). No side-stripe; the tint plus chip carry the state. Hover deepens the wash slightly rather than replacing it.

### Brand mark

A 28px rounded-square (`radius-sm`) with a `150deg` indigo-to-indigo-deep gradient, holding a white stroked clock glyph (circle + hands) at `stroke-width 2.4`, `stroke-linecap: round`. Kept deliberately small so the tool leads, not the logo. Rendered identically as the PWA icon set.

## 6. Do's and Don'ts

### Do:

- **Do** keep indigo to ≤10% of any screen: mark, links, focus, active input edge, the "Next firing" label, and the `next` row chip only.
- **Do** set every cron field and time value in monospace with `tabular-nums`; set all prose in Inter.
- **Do** pair every caveat with the exact doc quote, a dated verification stamp, and a link to the primary GitHub documentation.
- **Do** keep card radii at 16px (`radius-lg`) and control radii at 10px (`radius-md`); tags/small chips may use 6px.
- **Do** distinguish confirmed from provisional: provisional subnotes take `warn-fg`, never the neutral body color.
- **Do** support light and dark equally through `prefers-color-scheme`, and honour `prefers-reduced-motion`.

### Don't:

- **Don't** clutter the page with ad units, interstitials, hero gradients, or stock illustration; this is the exact generic-cron-site look the product rejects.
- **Don't** add marketing filler around a precise answer; density of real information beats decoration.
- **Don't** assert undocumented behaviour as fact, in copy or in styling; community lore (the "~15 minute" delay figure) stays absent.
- **Don't** use indigo, amber, or red as decoration; color here always carries meaning (accent, caution, fault).
- **Don't** use colored side-stripe borders (`border-left`/`border-right` accents) anywhere; alerts carry state through a tinted full border plus background, quote indents use a 2px neutral rule only.
- **Don't** pair a 1px border with a wide (≥16px blur) drop shadow as decoration, and don't round cards past 16px.
- **Don't** animate elevation or add motion that doesn't convey state; transitions stay in the 150ms range and serve feedback only.
