# Finance Hub — Redesign package

A complete visual redesign for `m-scharlat/personal-finance-hub` with two themes
(Cozy light + Twilight dark), a unified color palette, and reference implementations
of all 5 pages.

## What's in here

| File | Purpose |
|---|---|
| **`Finance Tracker.html`** | Interactive design canvas — open in a browser. 16 artboards (5 pages × 2 themes, plus Dashboard's Calendar variant and a palette reference). Pan/zoom, drag-reorder, double-click an artboard to focus, ←/→/Esc to navigate. |
| **`DESIGN_SYSTEM.md`** | The full spec: tokens, type, geometry, component library, per-page composition, port checklist. **Start here.** |
| **`tokens.css`** | Drop-in CSS variables for both themes. Lands in `src/index.css`. |
| **`tailwind.extend.js`** | Additions for `tailwind.config.js` (fonts + colors that reference CSS vars). |
| **`src/`** | React source for every screen in the design canvas. Themed via a single `theme` prop — flip Cozy ↔ Twilight by passing a different theme object. |
| **`design-canvas.jsx`** | The pan/zoom canvas component the HTML uses. |

## Recommended port order

See **DESIGN_SYSTEM.md → §9 Port checklist** for the full list. TL;DR:

1. `src/index.css` ← `tokens.css`
2. `tailwind.config.js` ← merge `tailwind.extend.js`
3. `index.html` ← swap Inter for Geist + Geist Mono Google Font link
4. `src/components/Nav.tsx` → new vertical `Sidebar.tsx`
5. Walk page-by-page applying the design

Nothing destructive — do it on a branch.

## Open in browser

Just open `Finance Tracker.html` in any modern browser. No build step.
