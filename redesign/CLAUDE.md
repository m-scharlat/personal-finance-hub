# CLAUDE.md — Finance Hub redesign handoff

You are helping port a complete visual redesign onto the existing Finance Hub
codebase. The design has already been finalized — your job is to apply it
cleanly, **one file at a time**, in dependency order, without changing app
behavior.

---

## What's in this redesign package

The user has dropped a `redesign/` (or similarly-named) folder into the repo
containing:

- `DESIGN_SYSTEM.md` — **read this first.** The full spec: tokens, typography,
  geometry, component library, per-page composition, and a port checklist (§9).
- `tokens.css` — drop-in CSS variables. Goes into `src/index.css`.
- `tailwind.extend.js` — extensions for `tailwind.config.js`. Merge — do not
  overwrite the existing config.
- `src/cozy/*.jsx` — **reference implementations only.** Plain React with inline
  styles. Read them as visual blueprints; do not import or copy verbatim. Match
  the *structure* (layout grid, hierarchy, what sits where) but use Tailwind
  utility classes that reference our CSS variables.
- `Finance Tracker.html` — the interactive design canvas, for the user's
  reference. You don't need to open it.

---

## Ground rules

1. **One file per session.** Do not attempt to port multiple pages in one go.
   The user will pick which file to port and you focus on that file only.

2. **Branch per page.** Before editing, create a branch like `redesign/<page-name>`.
   Commit at logical checkpoints (foundation files, sidebar, then one page per
   commit). Never push directly to `main`.

3. **Behavior is sacred.** Do not change:
   - Supabase queries / data fetching
   - Recharts component selection
   - framer-motion animations (re-style them, don't replace them)
   - dnd-kit sortable wiring
   - React Router routes
   - Any TypeScript types in `src/types/index.ts`
   Only the visual layer changes. If you find yourself rewriting business logic,
   stop and ask.

4. **Tailwind utility classes only.** No new CSS files beyond what the package
   provides. No CSS-in-JS. If you need a value that's not in the Tailwind
   config, add it to the config first.

5. **Reference the spec by section.** When deciding e.g. how a card looks, cite
   `DESIGN_SYSTEM.md §6 Cards`. This makes review easier.

6. **Match the schema.** The redesign honors the existing types:
   - `AccountType: 'cash' | 'savings' | 'investment' | 'retirement' | 'debt'`
   - `TransactionType: 'expense' | 'income' | 'savings'`
   Every account dot/bar must use the `AccountTypeColor` mapping from the spec.

7. **Category colors come from the 12-color rotation.** Categories use the
   **extended categorical palette** (see `DESIGN_SYSTEM.md §2 Extended
   categorical palette` and `§2 Categorical assignment`). Don't reach for raw
   hex values \u2014 always assign via `CATEGORICAL_SERIES[sortOrder % 12]` and
   store the resolved palette key on the category record. Colors must be
   **stable per category** \u2014 do not compute them on each render or they'll
   flicker as the list reorders.

7. **Don't touch unrelated files.** A port of `Dashboard.tsx` does not include
   tweaks to `Tracker.tsx`. Stay focused.

---

## Standard workflow per file

1. Confirm the branch (create one if not present).
2. Read the existing TSX file fully before writing.
3. Read the matching reference in `redesign/src/cozy/*.jsx` to understand the
   visual structure.
4. Read the relevant `DESIGN_SYSTEM.md` sections.
5. Show the user a brief plan: "Here's what I'll change in `<file>`, here's
   what I'll leave alone." Wait for confirmation.
6. Make the edit.
7. Test build (`npm run build`) and report any TS errors.
8. Show the diff. Ask the user to test in `npm run dev` before committing.
9. Commit on the branch with a focused message.

---

## Foundation files (always port first)

Before any page is ported, these must be in place. They unlock everything else:

1. `index.html` — replace Inter Google Font link with Geist + Geist Mono
2. `src/index.css` — replace contents with `redesign/tokens.css`
3. `tailwind.config.js` — merge `redesign/tailwind.extend.js`

Once those land and the dev server reloads, the user should already see a
warmer background and Geist type before any page-level changes.

---

## Page port order

See `DESIGN_SYSTEM.md §9` for the full checklist. The user will direct which
to do next. Typical order:

1. Foundation files (above)
2. `src/components/Nav.tsx` → vertical `Sidebar.tsx` + `App.tsx` layout change
3. `src/components/dashboard/MetricCard.tsx` (foundation component for KPIs)
4. `src/components/dashboard/CategoryBreakdown.tsx` (used in Dashboard)
5. `src/pages/Dashboard.tsx`
6. `src/pages/NetWorth.tsx` + `src/components/dashboard/NetWorthWidget.tsx`
7. `src/pages/Tracker.tsx`
8. `src/pages/Import.tsx`
9. `src/pages/settings/Categories.tsx`
10. `src/pages/settings/ImportMappings.tsx`
11. `src/pages/settings/NetWorth.tsx`

---

## Dark mode

The CSS variables in `tokens.css` already handle theme swap via a `.dark` class
on `<html>`. When porting, do NOT inline color values — always use the Tailwind
classes that reference the variables (e.g. `bg-surface`, `text-ink-muted`,
`border-border`).

If the user wants the theme toggle wired up: it's a `useState` that toggles a
class on `document.documentElement`. Persist to `localStorage` keyed by the
Supabase user id.

---

## When in doubt

- **Visual question?** → `DESIGN_SYSTEM.md` + the matching `cozy/*.jsx` reference
- **Color value?** → `tokens.css` is the source of truth
- **"Should I refactor this while I'm here?"** → No. File the thought, port the
  visual. Refactors get their own PR.
- **Reference and existing code disagree?** → Ask the user. Don't guess.
