# Tokens

Applies to: all

Three tiers: primitive → semantic → component. The token files are the only place raw values appear.

- **TOK-1** Tiers in `src/shared/styles/tokens/` are the only files with raw values. [rules: R-raw-values, R-token-tiers]
  - `primitives.css`: raw values only. `--palette-<hue>-<step>`, raw size steps, font stacks (`--font-sans: var(--font-sans-face), system-ui, sans-serif`), raw durations.
  - `semantic.css`: `var()` references only. Light in `:root`, dark in `:root[data-theme='dark']`, plus `color-scheme` per block.
  - `components.css`: `--<component>-<prop>`. `var()` or rem/% geometry for art direction; no colors. Global scales never get one-offs.
  - `media.css`: `@custom-media --bp-sm/md/lg/xl (min-width: …rem)` and `--motion-ok (prefers-reduced-motion: no-preference)`. Injected into every module at build time (TOOL-7) and removed from output.
  - `fonts.css` (vite): `@font-face` with self-hosted woff2 (or `@fontsource-variable/*` imports) that defines the `--font-*-face` family names. (next) `next/font` defines them instead (NXT-11).
  - (tma) `safe-area.css`.
- **TOK-2** Semantic color roles (minimum), named `--color-<role>`:
  - `bg`, `bg-subtle`, `surface`, `surface-raised`;
  - `fg`, `fg-muted`, `fg-subtle`, `fg-on-accent`;
  - `border`, `border-strong`;
  - `accent`, `accent-hover`, `accent-subtle`;
  - `focus-ring`;
  - `success`/`warning`/`danger`/`info` (+ `-subtle`);
  - `overlay`, `disabled`.
- **TOK-3** Scales:
  - `--space-3xs…3xl` (4px grid in rem);
  - `--radius-xs…xl, full`;
  - `--font-sans/mono/display`;
  - `--text-xs…4xl` + `--leading-*`;
  - `--weight-*`;
  - `--shadow-xs…lg`;
  - `--z-base 0, raised 10, sticky 100, header 200, overlay 300, modal 400, toast 500, tooltip 600`;
  - `--duration-fast/base/slow`, `--ease-standard/emphasized/exit`;
  - `--opacity-disabled/muted`;
  - `--blur-*`;
  - breakpoints via custom media (TOK-1).
- **TOK-4** Sizes in rem. px only for hairlines and platform insets. Media queries only through custom media names. [rules: R-raw-values]
- **TOK-5** A missing value gets a token at the right tier first.
- **TOK-6** Theme switching (all types, no flash of the wrong theme):
  - the preference is `light | dark | system`, stored through `shared/lib/storage`;
  - an inline pre-paint script (`shared/lib/theme/pre-paint.ts` exports the script string) resolves `system` via `matchMedia` and sets `data-theme` on `<html>` before first paint;
  - while the preference is `system`, it follows changes in system preference;
  - CSS has only `:root` and `:root[data-theme='dark']`;
  - (vite) the script is inlined in `index.html` (SPA-2); (next) see NXT-10;
  - (tma) the theme comes from the tenant/stored choice and never from Telegram.
- **TOK-7** (multi-tenant) A tenant overrides semantic (or primitive) tokens via an injected `<style>` after the bundle. Zero code per tenant.

## Example

`primitives.css`:

```css
:root {
  --palette-slate-50: #f8fafc;
  --palette-slate-950: #020617;
  --space-md: 1rem;
}
```

`semantic.css`:

```css
:root {
  color-scheme: light;
  --color-bg: var(--palette-slate-50);
}
:root[data-theme='dark'] {
  color-scheme: dark;
  --color-bg: var(--palette-slate-950);
}
```
