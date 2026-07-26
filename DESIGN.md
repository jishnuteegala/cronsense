---
name: Cronsense
description: The cron checker that tells you when your GitHub Actions workflow will actually fire.
colors:
  fg: "#16181d"
  fg-strong: "#0a0c10"
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
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.6rem, 1.3rem + 1.4vw, 2rem)"
    fontWeight: 680
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  summary:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.8rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  mono:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Cascadia Code, Menlo, Consolas, monospace"
    fontSize: "1.05rem"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.5rem"
  6: "2rem"
  7: "3rem"
components:
  input:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.fg-strong}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    height: "52px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  mark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    rounded: "{rounded.md}"
    size: "40px"
---

# Design System: Cronsense

## 1. Overview

**Creative North Star: "The Sourced Instrument"**

Cronsense reads like a well-made developer tool that respects the reader's attention. It is a single, quiet column of content on a softly washed surface, where a pasted cron expression turns into a plain-English answer and a precise table of firing times. The register is product, not brand: the design serves the task and then disappears. Nothing shouts, nothing decorates for its own sake, and every caveat is carried in a bordered callout that cites its source.

The palette is a deliberate cool-tinted neutral system anchored by one confident indigo accent, layered so panels lift off the page with hairline borders and soft shadows rather than heavy chrome. Type is Inter throughout: a tight, high-weight display heading, uppercase micro-labels for sections, and a code-editor treatment for the cron input. Dark mode is designed, not inverted, with warm-cool near-blacks and a softened violet accent.

The system explicitly rejects the generic cron-website look: ad clutter, hero gradients, stock illustration, and any styling that would launder a provisional guess into a confident claim. Confirmed and provisional information stay visually distinct.

**Key Characteristics:**

- One quiet content column, max 680px, on a radial background wash.
- Cool-tinted neutrals with a single indigo accent used only for action and state.
- Carded surfaces with hairline borders and layered soft shadows.
- Inter throughout; monospace reserved for cron input and firing times.
- Full light and dark themes, every pair clearing WCAG AA.

## 2. Colors

A cool-tinted neutral system carrying one indigo accent, with distinct amber and red families for provisional warnings and hard errors.

### Primary

- **Indigo Accent** (#4f46e5): The single action-and-state colour. Links, focus rings, the logo mark gradient, the skip link, and the warning accent rail. Softens to #8b8bf7 in dark mode.
- **Indigo Deep** (#4338ca): Hover and the second stop of the logo mark gradient.
- **Indigo Soft** (#eef0fe): Reserved tint for accent-soft surfaces.

### Neutral

- **Ink** (#16181d): Default body text.
- **Ink Strong** (#0a0c10): Headings, the result summary, first-column table values, and input text.
- **Muted** (#5b616e): The lede, labels, secondary notes, and callout body copy.
- **Faint** (#656b78): Uppercase section labels, table headers, column notes, and metadata; darkened deliberately so muted text still clears AA.
- **Canvas** (#f7f8fa): The page background, painted over by a radial wash from #ffffff through #f4f6f9 to #eef1f5.
- **Surface** (#ffffff): Panels, the firings table body, and gotcha article cards.
- **Surface 2** (#f2f4f7): Inline code, table headers, and the contextual note background.
- **Surface Inset** (#f7f8fa): The cron input rest state and table row hover.
- **Rule** (#e5e8ee) and **Rule Strong** (#d3d8e0): Hairline borders and stronger input strokes.

### Tertiary

- **Warn Ink** (#7a4a00) on **Warn Bg** (#fdf6e9) with a **Warn Accent** (#b8791f) rail: provisional warnings and the gotcha gate banner. This family is exclusively for behaviour that is inferred or documented-but-conditional, never confirmed fact.
- **Danger Ink** (#a3001a) on **Danger Bg** (#fdeef0) with a **Danger Accent** (#cf3040) rail: parse errors and diagnostic warnings such as never-fires.

### Named Rules

**The One Accent Rule.** Indigo is the only chromatic colour that carries action and state. It is never used to decorate. Amber and red appear solely to mark provisional and error information respectively.

**The Provisional Colour Rule.** The amber warn family means "not confirmed". Nothing confirmed is ever rendered in amber, and no guess is ever rendered in the neutral body colour as if it were fact.

## 3. Typography

**Display Font:** Inter (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif)
**Body Font:** Inter (same stack)
**Label Font:** Inter (same stack)
**Mono Font:** ui-monospace (with SF Mono, JetBrains Mono, Cascadia Code, Menlo, Consolas)

**Character:** One family carries the entire interface, with `cv11` and `ss01` OpenType features and tight tracking on headings. Monospace is a functional second voice reserved for machine-exact content: the cron input and the firing times.

### Hierarchy

- **Display / H1** (680, clamp(1.6rem, 1.3rem + 1.4vw, 2rem), line-height 1.1, tracking -0.025em): The product title only.
- **Summary** (600, 1.25rem, line-height 1.35, tracking -0.01em): The plain-English translation of the parsed expression, the confident centrepiece of the result.
- **Body** (400, 1rem, line-height 1.6): Callout copy, notes, and prose; capped near 65-75ch by the 680px column.
- **Label / H2** (600, 0.8rem, tracking 0.06em, uppercase): Section headings such as "Next 10 firings" and field labels, rendered as muted micro-labels.
- **Mono** (1.05rem input, 0.86rem table): The cron input reads like a code editor; firing times use tabular numerals for column alignment.

### Named Rules

**The Machine-Exact Mono Rule.** Monospace is only for content the machine produced exactly: the cron expression and the firing timestamps. Prose and labels never use it.

## 4. Elevation

The system is layered, not flat, but restrained. Depth comes from hairline borders combined with soft, wide, low-opacity shadows so that panels and cards lift gently off the radial background wash. Shadows are ambient, establishing figure and ground, never dramatic. Callouts convey status through a background tint plus a 3px left accent rail rather than through elevation.

### Shadow Vocabulary

- **Shadow Small** (`box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)`): The logo mark and the focused skip link.
- **Shadow** (`box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06), 0 8px 24px -8px rgba(16, 24, 40, 0.12)`): Panels and gotcha article cards at rest.
- **Shadow Large** (`box-shadow: 0 4px 8px rgba(16, 24, 40, 0.05), 0 24px 48px -16px rgba(16, 24, 40, 0.18)`): Defined for the most-lifted surfaces. In dark mode all three deepen to pure-black-based values.

### Named Rules

**The Ambient-Only Rule.** Shadows establish figure and ground; they never signal state. State (hover, focus, invalid) is carried by border colour and the focus ring, not by changing elevation.

## 5. Components

### Buttons

The tool page has no button; its single action is typing into the input. The one button-shaped affordance is the skip link: accent-filled (#4f46e5), accent-contrast text, radius clipped to the bottom-right corner (0 0 6px 0), hidden off-canvas until focused.

### Cards / Containers

- **Corner Style:** Large radius (16px) on panels and gotcha article cards.
- **Background:** Surface white (#ffffff) over the radial canvas wash.
- **Shadow Strategy:** The ambient Shadow token (see Elevation).
- **Border:** A single 1px hairline in Rule (#e5e8ee) on all sides. Never a colored side-stripe.
- **Internal Padding:** 1.5rem on the tool panel, 2rem on gotcha articles.

### Inputs / Fields

- **Style:** Monospace, 52px min-height, Surface Inset background (#f7f8fa), 1px Rule Strong stroke (#d3d8e0), 10px radius, with a subtle inset top shadow.
- **Hover:** Border shifts toward the accent via `color-mix`.
- **Focus:** Background lifts to pure white, border becomes the accent, and a 3px accent ring (rgba(79,70,229,0.28)) appears.
- **Error:** `aria-invalid` swaps the border and focus ring to the danger accent (#cf3040).

### Callouts (Note / Warning / Error)

The signature component. Each is a bordered card with a 1px hairline, a 3px left accent rail, a background tint, and an optional italic blockquote carrying the sourced quote plus dated verification metadata. The note is neutral (Surface 2), the warning amber (provisional), the diagnostic warning and error red (hard failures). The emphasised variant raises weight to 600.

### Firings Table

Rounded 10px bordered container, uppercase muted header on a Surface 2 fill with a hairline rule, tabular-numeral monospace body, comfortable 0.75rem cell padding, Surface Inset row hover, and no border on the last row.

### Navigation

Minimal. A masthead pairs a 40px gradient logo mark (indigo, 10px radius, a white clock glyph) with the H1. Gotcha pages add a muted breadcrumb above the heading and a rule-separated back link below.

## 6. Do's and Don'ts

### Do:

- **Do** use indigo (#4f46e5) only for action and state: links, focus rings, the logo mark, the skip link, and the warning accent rail.
- **Do** carry every caveat in a bordered callout with the exact sourced quote, the dated verification stamp, and the primary-source link.
- **Do** reserve monospace for the cron input and firing times; everything else is Inter.
- **Do** keep depth ambient: hairline border plus a soft wide shadow, and convey state through border and focus ring.
- **Do** hold every text and background pair at WCAG AA (4.5:1 body); the faint neutral was darkened specifically to clear it.
- **Do** honour `prefers-color-scheme` and `prefers-reduced-motion`, and keep the input touch target at 52px.

### Don't:

- **Don't** render provisional behaviour in the neutral body colour; provisional is the amber warn family, and confirmed is never amber.
- **Don't** use a `border-left` greater than the 3px callout rail as decoration, and never a colored side-stripe on cards.
- **Don't** pair a 1px border with a wide drop shadow as decoration on the same element, or round cards past 16px.
- **Don't** add gradient text, glassmorphism, decorative motion, or hero gradients; this is a tool, not a marketing page.
- **Don't** introduce ads, analytics, or third-party requests; the tool stays static and self-contained.
- **Don't** assert community lore such as the "~15 minute" delay figure; if it is not sourced, it does not appear.
