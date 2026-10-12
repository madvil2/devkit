# Styling

Applies to: all

CSS Modules with tiered tokens ([tokens.md](tokens.md)) in every project type. No runtime styling library.

- **STY-1** One `<name>.module.css` per component, next to it. Only tokens via `var()`. [rules: R-raw-values]
- **STY-2** Variants and states are attribute selectors in the owning module (`.root[data-variant='primary']`, `.root[aria-disabled='true']`, `.root[data-open]`). No conditional class building in feature code.
- **STY-3** Feature JSX uses `className={styles.<name>}` with one class only. [rules: R-classname]
  - `cx` lives in `shared/lib/cx.ts`: `(...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ')`.
  - It is used only in `shared/ui` for passthrough (KIT-11). No class-joining library.
- **STY-4** Shared recipes live in `src/shared/styles/*.module.css`: [rules: R-composes-source]
  - `layouts` (`stack*`, `row*`, `center`, `between`, `fill`, `cover`, `srOnly`);
  - `surfaces`;
  - `typography` (text presets matching `Text`/`Heading` sizes);
  - `animations` (keyframes + the reduced-motion opt-out);
  - `focus`.
  - Reached only with `composes: <recipe> from '@/shared/styles/<x>.module.css'` (the alias form is verified for Vite 8 and Next 16 Turbopack/webpack, stack.md W-7; fall back to a relative path only if a re-check fails). Never copy declarations.
  - `composes` comes first in the rule. Compose only when the recipe reproduces the block exactly.
  - `composes` from any other module is banned; local `composes: a` within one file is allowed.
  - Biome turns `noDuplicateProperties` off for `*.module.css` (TOOL-3).
- **STY-5** For JSX layout, prefer the `Stack`/`Row`/`Grid` kit components. Use recipes for module-internal layout.
- **STY-6** Cascade safety. CSS Modules order is not guaranteed across files: it can differ between dev and prod, and (next) `experimental.cssChunking` (default `true`) merges and reorders CSS chunks.
  - No module depends on the order of another file's CSS. `cssChunking: 'strict'` is not a fix (webpack only).
  - Never override another module's class at equal specificity.
  - A consumer's `className` on a kit component is placement only (KIT-11).
  - Visual changes are new kit variants.
- **STY-7** Global CSS is only `shared/styles/global.css` (reset, base element styles from tokens, `@import` of the token files). It is imported once: (vite) in `main.tsx`; (next) in `src/app/layout.tsx`. No other non-module CSS imports. [rules: R-global-css-import]
- **STY-8** Animations come from the `animations` recipes with the reduced-motion opt-out next to the keyframes. Moving elements carry no `backdrop-filter`. Never stack blur layers.
- **STY-9** Scrollbars, safe areas, page padding and fixed footers belong to `Page`/layout primitives. Never re-created per screen.
- **STY-10** No inline `style={{}}` outside `shared/ui`. Inside it, only runtime CSS variables (`style={{ '--progress': value }}`). [rules: R-inline-style]
- **STY-11** PostCSS is the shared `postcss.config.mjs` (TOOL-7): global-data + custom-media only.
  - (next) A custom PostCSS config disables Next's built-in autoprefixer and preset-env features (stack.md W-6).
  - Add `autoprefixer` to the shared config only when a property in use needs a prefix for the project's browserslist targets (for example `-webkit-backdrop-filter` for older Safari); check the built CSS before and after.
  - Never hand-write vendor prefixes in modules.

## Example

```css
.root {
  composes: stack from '@/shared/styles/layouts.module.css';
  gap: var(--space-md);
  background: var(--color-surface);
}
.root[data-tone='danger'] {
  border-color: var(--color-danger);
}
@media (--bp-md) {
  .root {
    gap: var(--space-lg);
  }
}
```
