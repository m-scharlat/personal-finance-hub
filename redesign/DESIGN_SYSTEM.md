# Finance Hub — Design System Spec

A consolidated visual system for `m-scharlat/personal-finance-hub`. Two themes (Cozy light + Twilight dark) share one palette, type scale, and component library.

---

## 1. Design direction

**Calm, playful, soft, modern.** Influenced by Claude (warm cream surfaces, terracotta accents) and Arc (rounded geometry, breath). Crisp white cards floating on a warm cream canvas in light mode; same palette inverted onto a warm charcoal in dark mode.

### Goals

- **One palette, used everywhere.** Account dots, chart bars, KPI accents, badges, recurrence pills — every colored element resolves to the same 7 tokens. Change one HSL, propagates everywhere.
- **Cards are crisp.** Pure white surfaces against the cream bg so primary content "lifts" — not flat, not boxy.
- **Numbers are first-class.** Tabular figures (`font-variant-numeric: tabular-nums`) on every monetary value. Geist's mono companion (`Geist Mono`) for recurrence chips and code-like values.
- **Type density is balanced.** Not Linear-tight, not Notion-airy. Reads at desk distance.

---

## 2. Color tokens

### Semantic palette (7 tokens)

These seven carry **semantic meaning** — they're the primary tokens used for
brand, status, and account-type identity. Use them deliberately; don't pick a
color by aesthetics, pick it by what the element *means*.

| Token | Light | Dark | Primary use |
|---|---|---|---|
| `terra`  | `#c66b46` | `#e89072` | Brand · primary CTA · headline charts · "savings" txn |
| `forest` | `#3d6b54` | `#7ec99c` | Income · positive deltas · cumulative savings |
| `red`    | `#b8492f` | `#e0826b` | Expenses · liabilities · negative deltas |
| `amber`  | `#c98a3a` | `#e8b878` | Retirement accounts · current-month highlight |
| `violet` | `#7a6bd6` | `#a89be8` | Investment accounts · trigger chips |
| `blue`   | `#5a7fb8` | `#8aa8d6` | Cash accounts |
| `teal`   | `#3d8a8a` | `#7ec5c5` | Savings accounts (HYSA) |

### Extended categorical palette (+5 = 12 total)

For **category breakdowns and other multi-series visualizations** where 7
colors isn't enough (the app currently has 11 expense categories). These have
no fixed semantic meaning — they exist to extend the palette in a harmonious
way. All share similar chroma and lightness so they read as a system.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `mustard` | `#b89535` | `#d4b568` | Warm yellow, between amber and sage |
| `sage`    | `#6b8a52` | `#a8c590` | Yellow-green, between mustard and forest |
| `plum`    | `#9a5fa8` | `#c590d0` | Magenta-purple, between violet and rose |
| `rose`    | `#c45a82` | `#e890b0` | Pink-red, between plum and red |
| `slate`   | `#6b7a85` | `#a0adb8` | Cool neutral — use for "Other" / uncategorized |

### Categorical assignment (for ChartBreakdowns)

When rendering a category breakdown chart, rotate through this **12-color
series** in order. Save the assigned color on the category record itself
(don't compute on the fly per render — colors must be stable):

```ts
const CATEGORICAL_SERIES = [
  'terra', 'forest', 'amber', 'violet', 'blue',
  'teal',  'rose',   'sage',  'plum',  'mustard',
  'red',   'slate',
] as const

// Assign on category creation (e.g. in a Supabase RPC or client-side)
function assignCategoryColor(sortOrder: number) {
  return CATEGORICAL_SERIES[sortOrder % CATEGORICAL_SERIES.length]
}
```

**Ordering rationale:** the series interleaves warm + cool + neutral so
adjacent slots in the rotation are visually distinct. The first 7 lead with
the semantic tokens (they're the most-tuned colors); positions 8–12 are the
extended set. `slate` is last because it works well as the "overflow" / "Other"
bucket color.

**Special case — Income vs Expense categories:** if you want to visually group
them (e.g. all expense bars one shade, all income bars another), use
`red`/`forest` as the family colors instead of rotating. Categorical rotation is
for *within* a single type.

### Account-type mapping

Hardcoded in `src/data.js → AccountTypeColor`. Every place an account is rendered with a dot/bar must use this mapping.

```ts
const AccountTypeColor = {
  cash:       'blue',
  savings:    'teal',
  investment: 'violet',
  retirement: 'amber',
  debt:       'red',
}
```

### Transaction-type mapping

```ts
const TxnTypeColor = {
  income:  'forest',
  expense: 'red',
  savings: 'terra',
}
```

### Surfaces & ink

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f1ebe1` | `#15151a` | Page background, sidebar |
| `bgAlt` | `#ebe4d6` | `#101015` | Strip behind sidebar logo / deeper recess |
| `surface` | `#ffffff` | `#1e1e24` | All cards |
| `surfaceAlt` | `#fbf8f2` | `#26262d` | Filter chips, table headers, sub-surface |
| `border` | `rgba(60,40,20,0.07)` | `rgba(255,255,255,0.06)` | Hairline dividers |
| `borderStrong` | `rgba(60,40,20,0.12)` | `rgba(255,255,255,0.10)` | Inputs, focused borders |
| `ink` | `#2a201a` | `#f0ece3` | Primary text, headlines |
| `inkMuted` | `#7a6a5c` | `#9c948a` | Secondary text, labels |
| `inkFaint` | `#a89789` | `#6b645c` | Tertiary text, axis labels, hints |

### Soft alpha variants

Generated from each semantic token at 10–22% opacity. Used for pill backgrounds, KPI accent tints, and hover states.

```
terraSoft       = rgba(terra, 0.10–0.15)
forestSoft      = rgba(forest, 0.10–0.14)
redSoft         = rgba(red, 0.10–0.14)
amberSoft       = rgba(amber, 0.12–0.14)
terraSoftStrong = rgba(terra, 0.16–0.22)
```

---

## 3. Typography

### Families

- **Body & UI:** [Geist](https://vercel.com/font) (400, 500, 600, 700)
- **Numbers & code:** [Geist Mono](https://vercel.com/font) (400, 500) — used for recurrence chips, ⌘K shortcut hints, trigger phrase chips
- **Tabular figures** enabled inline on every currency value via `font-variant-numeric: tabular-nums`

### Scale

| Token | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `display`  | 44px | 600 | 1.05 | -0.03em | Hero net worth number |
| `display-2`| 30px | 600 | 1.1  | -0.02em | Recurring expenses total |
| `h1` | 26px | 600 | 1.2 | -0.02em | Page titles |
| `h2` | 18px | 600 | 1.3 | -0.015em | Section titles ("Trends", "Saved mappings") |
| `h3` | 16px | 600 | 1.4 | normal | Card titles in setting forms |
| `body` | 14px | 400 | 1.5 | normal | Default text |
| `body-strong` | 13.5px | 500 | 1.4 | normal | Table cells, account names |
| `caption` | 12.5px | 400 | 1.4 | normal | Secondary descriptions, filter labels |
| `label-eyebrow` | 11px | 500 | 1.4 | 0.10em uppercase | Card eyebrow labels ("BREAKDOWN", "NET WORTH") |
| `chip-mono` | 11px | 500 | 1.4 | normal | Recurrence chips, ⌘K hints (Geist Mono) |

---

## 4. Geometry

| Token | Light | Dark | Use |
|---|---|---|---|
| `radius` | 12px | 12px | Inputs, chips, small buttons |
| `radiusLg` | 18px | 18px | All cards, tables |
| `radiusFull` | 999px | 999px | Pills, badges, toggles, account dots |

### Card elevation

```css
/* Light */
box-shadow:
  0 1px 2px rgba(60,40,20,0.04),
  0 4px 14px rgba(60,40,20,0.04);

/* Dark */
box-shadow:
  0 1px 2px rgba(0,0,0,0.3),
  0 4px 14px rgba(0,0,0,0.18);
```

Primary CTA buttons (terracotta) get an additional colored shadow:
```css
box-shadow:
  0 1px 2px rgba(0,0,0,0.05),
  0 4px 14px rgba(terra, 0.22);
```

---

## 5. Spacing

8px-based, but the most-used values are:

- **4** — gap inside chips, between dot + label
- **6** — gap between label and value in a row
- **10** — gap between sibling chips, KPI value to delta line
- **14** — gap between adjacent cards in a grid
- **18** — card internal padding (small cards), card-to-card gap (larger gaps)
- **22** — card row padding (table rows, setting list rows)
- **28** — card internal padding (hero/full-bleed cards)
- **36** — page horizontal padding

---

## 6. Component library

### Sidebar nav

- Width: **232px**, padding: `22px 12px 20px`
- Brand: 30×30 terracotta square + brand text, no border
- Items: 8×12 padding, 10px radius, stroke icons (16px), label
- Active state: white surface + soft shadow + tiny terra dot on the right
- Sections: "Overview" group (3 items: Net Worth / Dashboard / Transactions), "Manage" group (Import / Settings)
- Footer: theme toggle pill (Light / Dark) + user chip with gradient avatar

### Cards

```
background: theme.surface
border: 1px solid theme.border
border-radius: theme.radiusLg
box-shadow: theme.cardShadow
padding: 24
```

### Eyebrow label

```
font-size: 11px
color: theme.inkMuted
text-transform: uppercase
letter-spacing: 0.10em
font-weight: 500
```

### Buttons

- **Primary** — terra bg, white text, 10px radius, `9–10px / 14–18px` padding, terra shadow
- **Secondary** — transparent bg, terra border (`1px solid terraSoftStrong`), terra text — used for "Log Balance" on Settings/Accounts
- **Ghost / link** — terra text only, no bg/border — used for "Manage accounts →", "Show all 11 →", "View all"
- **Segmented (SegBtn)** — 5–7px / 11–14px padding, 8px radius. Active = `surfaceAlt` bg + ink text. Inactive = transparent + inkMuted

### Chips & pills

- **Type badge** (Income / Expense / Savings) — soft tint bg + matching colored text, 5px dot inside, 11.5px text, full-radius
- **Recurrence chip** — `amberSoft`/`terraSoft` bg, `amber`/`terra` text, Geist Mono 10.5px, ↻ or ÷ icon prefix, 6px radius
- **Trigger chip** (mappings) — violet tint bg, violet text, Geist Mono 12px, 6px radius
- **Filter chip** — transparent + border (inactive) or ink bg + bg text (active), 999 radius

### Tables

- Header row: `surfaceAlt` bg, `border` underline, 11px uppercase eyebrow text, 13×22px padding
- Body row: 14×22px padding, 13.5px text, hairline border between rows
- Grid columns explicit (no `auto`), with explicit `column-gap` between right-aligned amount column and the next column

### Charts

- **Line/area** — single color (`terra` for net worth, `forest` for cumulative savings) at 2.25px stroke, smooth catmull-rom curves
- **Area fill** — vertical gradient from `color @ 22% opacity` → `color @ 0%`
- **Projection segment** — same color, `stroke-dasharray: 5 6`, opacity 0.6
- **Last-actual marker** — circle, surface fill, 2.5px stroke in line color, r=5.5
- **Y-grid lines** — `border` color with `3 4` dasharray (except baseline = solid)
- **Bar pairs** (Income vs Expenses) — 9px wide bars, 3px gap inside pair, 2.5px radius, `forest`+`red`, partial month = 0.35 opacity
- **Axis text** — 10–10.5px, `inkFaint`

### Calendar grid cells (Dashboard Calendar view)

Three states distinguishable at a glance:
- **Past/in-the-green** — `forestSoft` bg, solid `forestSoft` border
- **Current month** — `amberSoft` bg, solid `amber` border, amber month label
- **Empty future** — `surface` bg, dashed `border`, faint en-dash
Inside each: month label + net amount in top row, three mini bars (Income / Expenses / Net Savings) with palette-matched dot labels.

---

## 7. Per-page composition

### Net Worth
1. Header (title + subtitle + sync pill)
2. **Hero card** — 320px left column (gradient tint of `terraSoft → transparent`, large net worth value, delta pill, assets/liabilities rows, "Manage accounts →") + breakdown column (account list with bars)
3. **Chart card** — net worth over time, single `terra` line + dashed projection, history/1Y/5Y/10Y segmented control

### Dashboard
1. Header (title + year stepper + period select)
2. KPI row (4 cards: Income / Expenses / Net Cash Flow / Savings Rate)
3. View toggle ("Trends" ↔ "Calendar")
4. **Trends view:** 2×2 grid — bars chart, spending by category, cumulative savings area, recurring expenses summary
5. **Calendar view:** 4×3 month grid

### Transactions
1. Header (title + subtitle + primary `+ Add Transaction` CTA)
2. Filter card (Year/Month selects, prev/next, This Year / This Month, type filter chips on right)
3. Tabs (Transactions / Summary) + search + Select toggle
4. Table

### Import
1. Header (title + subtitle)
2. 1.6fr / 1fr split:
   - **Left:** month/year + paste area (mono font, syntax-colored placeholder), parse button + help
   - **Right:** syntax cheatsheet card + last imports card

### Settings
1. Header (title + subtitle)
2. Tabs pill (Accounts / Categories / Import Mappings) — segmented control, not underline
3. **Accounts:** assets list card + liabilities list card. Each row: drag handle + colored dot + name + type pill + balance "as of date" + Log Balance + edit + trash
4. **Categories:** 2-column grid. Expense Categories (left) + Income Sources (right). Each row: drag handle + initial badge + name + edit + trash
5. **Mappings:** Add Mapping form card (trigger phrases input with chips + type/category selects + save button) + Saved mappings list

---

## 8. Tailwind config

Add to `tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        terra:  { DEFAULT: '#c66b46', dark: '#e89072' },
        forest: { DEFAULT: '#3d6b54', dark: '#7ec99c' },
        red:    { DEFAULT: '#b8492f', dark: '#e0826b' },
        amber:  { DEFAULT: '#c98a3a', dark: '#e8b878' },
        violet: { DEFAULT: '#7a6bd6', dark: '#a89be8' },
        blue:   { DEFAULT: '#5a7fb8', dark: '#8aa8d6' },
        teal:   { DEFAULT: '#3d8a8a', dark: '#7ec5c5' },

        // Extended categorical — for breakdowns when 7 isn't enough
        mustard:{ DEFAULT: '#b89535', dark: '#d4b568' },
        sage:   { DEFAULT: '#6b8a52', dark: '#a8c590' },
        plum:   { DEFAULT: '#9a5fa8', dark: '#c590d0' },
        rose:   { DEFAULT: '#c45a82', dark: '#e890b0' },
        slate:  { DEFAULT: '#6b7a85', dark: '#a0adb8' },
        cream:  { 50: '#fbf8f2', 100: '#f1ebe1', 200: '#ebe4d6' },
        ink: {
          DEFAULT: '#2a201a',
          muted:   '#7a6a5c',
          faint:   '#a89789',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(60,40,20,0.04), 0 4px 14px rgba(60,40,20,0.04)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.18)',
        terra: '0 1px 2px rgba(0,0,0,0.05), 0 4px 14px rgba(198,107,70,0.22)',
      },
      borderRadius: { xl: '12px', '2xl': '18px' },
      letterSpacing: { eyebrow: '0.10em' },
    },
  },
  plugins: [],
}
```

Recommended approach: use **CSS custom properties** in `src/index.css` so light/dark swap by toggling a `.dark` class on `<html>` (matches Tailwind's `darkMode: 'class'`):

```css
:root {
  --bg: #f1ebe1;
  --surface: #ffffff;
  --surface-alt: #fbf8f2;
  --border: rgba(60,40,20,0.07);
  --ink: #2a201a;
  --ink-muted: #7a6a5c;
  --ink-faint: #a89789;

  --terra: #c66b46;
  --forest: #3d6b54;
  --red: #b8492f;
  --amber: #c98a3a;
  --violet: #7a6bd6;
  --blue: #5a7fb8;
  --teal: #3d8a8a;
}

.dark {
  --bg: #15151a;
  --surface: #1e1e24;
  --surface-alt: #26262d;
  --border: rgba(255,255,255,0.06);
  --ink: #f0ece3;
  --ink-muted: #9c948a;
  --ink-faint: #6b645c;

  --terra: #e89072;
  --forest: #7ec99c;
  --red: #e0826b;
  --amber: #e8b878;
  --violet: #a89be8;
  --blue: #8aa8d6;
  --teal: #7ec5c5;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

Then in Tailwind extend the colors to reference vars:
```js
colors: {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  // ...
}
```

---

## 9. Port checklist (per file)

A suggested order, smallest blast radius first:

1. **`src/index.css`** — drop in the CSS variable block above
2. **`tailwind.config.js`** — extend colors/fonts as shown
3. **`index.html`** — replace Inter Google Font link with Geist + Geist Mono
4. **`src/components/Nav.tsx`** — replace top horizontal nav with vertical sidebar (`Sidebar.tsx`); restructure `App.tsx` to use a flex layout (sidebar + main) instead of `pt-16`
5. **`src/components/dashboard/MetricCard.tsx`** — update color enum (`green`→`forest`, `red`→`red`, `indigo`→`terra`, `gray`→`ink`); add accent shadow to value
6. **`src/components/dashboard/CategoryBreakdown.tsx`** — replace `NEUTRAL = '#9ca3af'` with `var(--ink-faint)`; pull category colors from a palette map keyed on category name
7. **`src/pages/Dashboard.tsx`** — update card chrome (`bg-white` → `bg-surface`, `border-gray-200` → `border-border`, etc.)
8. **`src/pages/NetWorth.tsx`** + **`src/components/dashboard/NetWorthWidget.tsx`** — apply hero layout, switch line chart to use `var(--terra)` with gradient fill + dashed projection
9. **`src/pages/Tracker.tsx`** — apply new table layout, type badges, recurrence chips
10. **`src/pages/Import.tsx`** — apply two-column layout, mono placeholder
11. **`src/pages/settings/*`** — apply tab pill nav + card list rows

---

## 10. Open questions / decisions to make

- **Theme toggle persistence** — store in `localStorage` keyed by user, or sync to Supabase user prefs?
- **Account color** — currently mapped by `accountType`. If two cash accounts should be visually distinct, consider per-account override stored in `net_worth_accounts.color`.
- **Calendar view drill-down** — click a month cell to open the transaction list filtered to that month?
- **Empty states** — currently shown as faint dashes. Worth a richer empty state for new users (e.g. "Add your first account to see your net worth here").

---

**Files in this design package:**
- `Finance Tracker.html` — interactive design canvas with all 16 artboards
- `DESIGN_SYSTEM.md` — this document
- `tokens.css` — drop-in CSS variables
- `tailwind.extend.js` — Tailwind config additions
- `src/` — React reference implementation of every screen (themed via the unified `theme` object)
