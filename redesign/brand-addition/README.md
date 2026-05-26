# Cairn — Brand addition

This is the **brand half** of the redesign — split out separately so you can
add it to the existing `redesign/` folder in your repo without re-uploading
everything else.

## What's in here

- `BRAND.md` — the brand guide (name, mark specs, lockup rules, voice)
- `brand/` — finished SVG assets:
  - `favicon.svg` (32×32, drop into `public/`)
  - `app-icon.svg` (256×256, drop into `public/`)
  - `mark.svg` (64×64 three-color mark)
  - `mark-mono.svg` (white-on-terra mark for the brand tile)
  - `wordmark.svg` (320×80 two-line lockup)
  - `wordmark-horizontal.svg` (460×64 single-line lockup)

## How to add to your repo

Copy `BRAND.md` and the `brand/` folder into the existing `redesign/` folder.
Your tree should look like:

```
redesign/
├── BRAND.md          ← NEW
├── brand/            ← NEW
│   ├── favicon.svg
│   ├── app-icon.svg
│   ├── mark.svg
│   ├── mark-mono.svg
│   ├── wordmark.svg
│   └── wordmark-horizontal.svg
├── CLAUDE.md         ← already there
├── DESIGN_SYSTEM.md  ← already there
├── tokens.css        ← already there
├── tailwind.extend.js
└── src/
```

## What to tell Claude Code

When you're ready to apply the rename, paste this into your Claude Code session:

> The app is being renamed to **Cairn** with a new brand mark. I've added
> `redesign/BRAND.md` and the `redesign/brand/` folder with the assets.
> Please read `redesign/BRAND.md`, then make the following changes on a new
> branch `redesign/rebrand`:
>
> 1. In `index.html`: change `<title>` to `Cairn — Personal Finance`. Add
>    the favicon and apple-touch-icon `<link>` tags per `BRAND.md § Drop-in
>    HTML`.
> 2. Copy `redesign/brand/favicon.svg` and `redesign/brand/app-icon.svg`
>    into `public/`.
> 3. In `src/components/Nav.tsx` (or wherever the brand currently appears):
>    replace the existing "Finance Hub" text with the new Cairn brand tile +
>    wordmark + descriptor as specified in `BRAND.md § Lockups #2 Brand tile`.
>    Use an inline React `<CairnMark>` component (three rounded rects per the
>    spec) so colors come from the theme.
> 4. Anywhere else "Finance Hub" appears as user-facing copy (page metadata,
>    placeholder text, README, etc.) — update to "Cairn — Personal Finance".
> 5. Build (`npm run build`) and show me the diff. Do not touch anything else.

That keeps the brand swap as one focused commit. If you've already started
the sidebar port, just do steps 1, 2, and 4 here and apply the brand tile
when porting the sidebar.
