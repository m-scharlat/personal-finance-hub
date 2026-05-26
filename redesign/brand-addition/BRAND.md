# Cairn — Brand guide

A short companion to `DESIGN_SYSTEM.md`. Names the brand, defines the mark,
and gives rules for when to use which lockup.

---

## Name

**Cairn.** A cairn is a stack of stones marking a trail — each transaction is
one stone in your journey. Calm, intentional, distinctive.

**Always pair Cairn with a descriptor** (`Personal Finance`) anywhere the
brand appears in product chrome (sidebar, page titles, page metadata). The
name alone is intentionally a little oblique; the descriptor does the heavy
lifting of saying *what it is*. Don't bake the descriptor into the name as a
compound (~~`CairnHub`~~ ~~`CairnFinance`~~) — keep the name a single word.

### Voice

- Quiet and warm, not chirpy or corporate
- Says "your" and "you" — this is *your* money, *your* cairn
- Uses calm verbs (track, mark, set, see) over hype verbs (crush, dominate, optimize)

### Sample copy

| Surface | Copy |
|---|---|
| Browser tab | `Cairn — Personal Finance` |
| Sidebar (in product) | `Cairn` / `PERSONAL FINANCE` (small caps eyebrow) |
| Welcome screen | `Welcome to Cairn. Your money, marked.` |
| Email subject | `Your Cairn this week` |
| Empty state | `Nothing here yet. Add a transaction to set the first stone.` |

---

## Mark

Three stacked, rounded "stones" — terra (bottom), forest (middle), amber
(top). Three palette colors used together is the visual signature of Cairn;
no other element in the system stacks colors like this.

### Specs

- Canvas: **64×64** viewBox
- Stones: rounded rectangles, **14px tall**, **7px radius** (always a
  full-pill on the short axis)
- Stack: bottom **40w**, middle **28w** (offset +6px x), top **16w** (offset
  +12px x) — each stone visibly smaller and centered above the one below
- Vertical rhythm: 2px gap between stones (rendered visually larger by the
  border radius)
- Stroke: **none** — these are filled solid shapes

### Color rules

| Context | Bottom | Middle | Top |
|---|---|---|---|
| **Standard (on light bg)** | `terra` | `forest` | `amber` |
| **On terra tile** (sidebar brand tile, app icon) | white | white | white |
| **Monochrome** (e.g. printed, ink-only) | `ink` | `ink` | `ink` |
| **Dark mode** | `terra` (dark variant) | `forest` (dark variant) | `amber` (dark variant) |

**Never** invert just one stone, swap stone order, recolor a stone in a
non-palette color, add a fourth stone, or remove the third stone. Three is
canonical.

---

## Lockups

Use the right lockup for the surface. From most to least common:

### 1. Mark only (`brand/mark.svg`)
For tight spaces — favicons, app icons, profile avatars, in-row brand
references. Defaults to the three-color stack.

### 2. Brand tile (sidebar header)
The mark in white inside a 32–40px rounded-square terra tile. **This is the
canonical in-product brand surface.** Paired with the wordmark + descriptor
in the sidebar header:

```
[ ▲ tile ]  Cairn
            PERSONAL FINANCE
```

The tile uses `brand/mark-mono.svg`. The text uses Geist 600/15px for "Cairn"
and Geist 500/10.5px uppercase tracked at `0.08em` for the descriptor.

### 3. Wordmark (`brand/wordmark.svg`)
Two-line lockup with the mark to the left of "Cairn" / "PERSONAL FINANCE".
Use for hero areas, login pages, marketing.

### 4. Horizontal lockup (`brand/wordmark-horizontal.svg`)
Single line: mark + "Cairn | Personal Finance Hub". Use in footers, email
signatures, anywhere vertical space is constrained.

### 5. App icon (`brand/app-icon.svg`)
256×256, rounded-square (56px radius), terra background, white mark, full
bleed. Use for: web app manifest, iOS / macOS / Android app icons, PWA.

### 6. Favicon (`brand/favicon.svg`)
32×32 mark only, no padding. Drop this in as `/public/favicon.svg`.

---

## Asset files

All in `brand/`:

| File | Use |
|---|---|
| `mark.svg` | 64×64 three-color mark |
| `mark-mono.svg` | 64×64 white-on-terra mark (for the brand tile) |
| `favicon.svg` | 32×32 mark, ready for `/public/favicon.svg` |
| `app-icon.svg` | 256×256 rounded-square app icon |
| `wordmark.svg` | 320×80 two-line lockup (preferred) |
| `wordmark-horizontal.svg` | 460×64 single-line lockup |

All SVGs reference colors by hex (not CSS variables) so they render correctly
in email and other contexts where stylesheets don't apply. Inside the React
app, prefer the inline `<CairnMark>` component (in `src/cozy/shell.jsx`) so
the colors pull from the theme.

---

## Drop-in HTML

Browser tab + open-graph metadata for the app:

```html
<title>Cairn — Personal Finance</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/app-icon.svg" />

<meta property="og:title" content="Cairn — Personal Finance" />
<meta property="og:description" content="Track expenses, income, and savings. Your money, marked." />
```

For the React app, swap `/public/favicon.svg` to the one in this package. The
existing Inter-based favicon (if any) can be deleted.

---

## What not to do

- **Don't compound the name.** `CairnHub`, `Cairn.io`, `Cairn Finance` —
  no. The name is just "Cairn"; the descriptor lives in supporting text.
- **Don't outline the mark.** Strokes break the visual rhythm — keep stones
  solid fills.
- **Don't tilt or rotate the mark.** It's a *cairn*; a leaning cairn is a
  collapsing one.
- **Don't add a tagline above or below the mark inside the brand tile.** The
  tile is for the mark only; supporting text lives outside.
- **Don't use the mark on busy/photo backgrounds without the brand tile.**
  Always provide a clear, single-color backdrop.
