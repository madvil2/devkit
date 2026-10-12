# Stack and freshness ledger

Applies to: all

Every row carries the date it was last verified and its source. Versions are lines to install with `pnpm add`, not pins in templates. Change procedure: [README.md](README.md#changing-the-rulebook). Run history: [freshness-log.md](freshness-log.md).

Version source unless noted: `npm view <pkg> version time dist-tags`, https://www.npmjs.com/package/<pkg>.

## Packages

| Area | Package | Line | Verified | Source | Notes |
|---|---|---|---|---|---|
| Runtime | Node LTS | 24 (`.nvmrc`) | 2026-10-11 | https://nodejs.org/dist/index.json; `depcruise --info` | dependency-cruiser needs ^22, ^24 or >=26; Vitest 5 needs >=22.12 |
| Runtime | pnpm | 12.11.2 | 2026-10-11 | npm | Unapproved build scripts fail installs (TOOL-1) |
| Language | typescript | ~6.0 (6.0.3) | 2026-10-11 | npm; experiment | 7.0.2 is latest but blocks dependency-cruiser (watch item W-1) |
| Core | react, react-dom | 19.3.0 | 2026-10-11 | npm | |
| Vite | vite | 8.3.4 | 2026-10-11 | npm | CSS minified by Lightning CSS; PostCSS config still applied |
| Vite | @vitejs/plugin-react | 6.1.2 | 2026-10-11 | npm | Peer vite ^8; no Babel dependency |
| Vite | @rolldown/plugin-babel, @babel/core, babel-plugin-react-compiler | latest; compiler 1.0.0 | 2026-10-11 | plugin-react 6.1.2 README | Stable React Compiler route in Vite (CMP-8) |
| Vite | create-vite | 9.2.1 | 2026-10-11 | npm; `create-vite --help` | Template `react-ts` ships oxlint; removed at scaffold |
| Vite | @tanstack/react-router, @tanstack/router-plugin | 1.170.42 / 1.168.43 | 2026-10-11 | npm | Still v1; plugin peer vite >=5..8, no typescript dependency |
| Next | next, create-next-app | 16.4.0 | 2026-10-11 | npm | Turbopack default; `proxy.ts`; no `next lint` (next.md) |
| CSS | postcss | 8.5.29 | 2026-10-11 | npm | |
| CSS | postcss-custom-media | 12.0.3 | 2026-10-11 | npm | |
| CSS | @csstools/postcss-global-data | 4.0.0 | 2026-10-11 | npm | |
| Data | @tanstack/react-query | 5.104.1 | 2026-10-11 | npm | Still v5 |
| Data | @tanstack/react-table | 9.2.8 | 2026-10-11 | package `dist/*.d.ts` | v9 API: `useTable`, `createTableHook`, `Subscribe`, `FlexRender`; no `useReactTable` (KIT-2) |
| Data | zustand | 5.0.15 | 2026-10-11 | npm | |
| Data | zod | 4.6.5 | 2026-10-11 | npm | |
| Forms | react-hook-form | 7.89.0 | 2026-10-11 | npm | v8 still beta (8.0.0-beta.4); stay on 7 |
| Forms | @hookform/resolvers | 5.9.1 | 2026-10-11 | npm | |
| UI | @base-ui/react | 1.9.0 | 2026-10-11 | npm; package grep | `@base-ui-components/react` is frozen at 1.0.0-rc.0; never install it |
| UI | lucide-react | 1.55.0 | 2026-10-11 | npm | |
| Tooling | @biomejs/biome | 2.5.15 | 2026-10-11 | npm; configuration_schema.json | `*.module.css` auto-detected as CSS Modules |
| Tooling | dependency-cruiser | 18.5.0 | 2026-10-11 | npm; `depcruise --info` | Supports typescript >=2.0.0 <7.0.0 |
| Tooling | oxc-parser | 0.153.0 | 2026-10-11 | package README | 0.x; `parseSync` returns `program` + `comments` |
| Test | vitest | 5.0.3 | 2026-10-11 | npm; https://vitest.dev/guide/migration | Peer vite ^6.4/^7/^8 (TST-6) |
| Test | @testing-library/react | 16.3.3 | 2026-10-11 | npm | |
| Test | happy-dom | 20.14.6 | 2026-10-11 | npm | |
| Test | @playwright/test | 1.64.0 | 2026-10-11 | npm | |
| Test | @axe-core/playwright | 4.13.0 | 2026-10-11 | npm | |
| Add-on | vite-plugin-pwa | 2.0.0 | 2026-10-11 | npm; https://github.com/vite-pwa/vite-plugin-pwa/releases | Node >=20.19; peer vite 3..8 |
| TMA | @types/telegram-web-app | 10.1.0 | 2026-10-11 | npm | Tags up to ts7.1 |
| TMA | @tma.js/sdk-react | 3.0.23 | 2026-10-11 | npm | Not used by default; the port wraps `window.Telegram.WebApp` (TMA-1) |

## Watch items

Each item is re-checked on every freshness run.

| ID | Item | State | Verified | Source |
|---|---|---|---|---|
| W-1 | TypeScript 7 | `typescript@7.0.2` has only `bin.tsc` (no JS API). Next 16.4 build and `tsc -b` pass with it; router plugin and Vitest 5 do not depend on it. dependency-cruiser 18.5 silently finds 0 modules with it (exit 0). Stay on `~6.0` until dependency-cruiser supports TS 7; TOOL-8 catches a regression | 2026-10-11 | experiment; `depcruise --info`; Next `useTypeScriptCli.md` |
| W-2 | Next `middleware` → `proxy.ts` | Renamed; proxy runs on the Node runtime only (AUTH-2) | 2026-10-11 | https://nextjs.org/docs/app/guides/upgrading/version-16 |
| W-3 | `next lint` | Removed in Next 16; Biome is the linter (TOOL-3) | 2026-10-11 | version-16 guide; `next/dist/cli` listing |
| W-4 | React Compiler | Next: top-level `reactCompiler: true`, stable, off by default. Vite: plugin-react 6 `compiler: true` is experimental (needs `oxc-transform-react`); use `@rolldown/plugin-babel` with `reactCompilerPreset()` (CMP-8) | 2026-10-11 | version-16 guide; plugin-react 6.1.2 README |
| W-5 | Turbopack default | `next dev` and `next build` use Turbopack; a custom `webpack` config fails the build; `--webpack` opts out | 2026-10-11 | version-16 guide |
| W-6 | Next custom PostCSS | A custom config disables Next's autoprefixer and preset-env defaults (NXT-12); with Turbopack the root config wins | 2026-10-11 | https://nextjs.org/docs/pages/guides/post-css; `turbopackLocalPostcssConfig.md` |
| W-7 | global-data + custom-media + `composes` from `@/…` | Work in Vite 8 build/dev and Next 16 Turbopack/webpack build/dev; the alias form is the default (STY-4) | 2026-10-11 | experiment |
| W-8 | Theme script in Next | `next/script` `beforeInteractive` does not block hydration; use an inline `<script>` in `<head>` (NXT-10). Inferred from docs | 2026-10-11 | https://nextjs.org/docs/app/api-reference/components/script |
| W-9 | CSS chunking | `experimental.cssChunking` defaults to `true` and may reorder CSS; `'strict'` is webpack-only (STY-6) | 2026-10-11 | Next `cssChunking.md` |
| W-10 | pnpm 12 build approvals | `ERR_PNPM_IGNORED_BUILDS` fails installs; `pnpm approve` writes `allowBuilds` to `pnpm-workspace.yaml`; create-next-app still writes the pnpm 10 `ignoredBuiltDependencies` key (status under 12 inferred) (TOOL-1) | 2026-10-11 | experiment |
| W-11 | Biome 2.5 CSS Modules | `css.parser.cssModules` applies only to files not named `*.module.css`; `composes` parses clean. Nursery `noUnusedClasses`/`noUndeclaredClasses` and GritQL `plugins` exist (candidates to replace checks) | 2026-10-11 | biome schema; experiment |
| W-12 | Vitest 5 | Node >=22.12; `clearMocks` default true; strict `toHaveTextContent`; top-level `vi.mock`; no parent-dir config lookup; CSS Modules import with defaults (TST-6) | 2026-10-11 | https://vitest.dev/guide/migration |
| W-13 | TanStack Table 9 | New API (`useTable`, `createTableHook`); v8 API only through `useLegacyTable` (KIT-2) | 2026-10-11 | package d.ts |
| W-14 | Base UI state attributes | `data-open`/`data-closed`, `data-checked`/`data-unchecked`, `data-disabled`, `data-highlighted`, `data-selected`, `data-pressed`, `data-popup-open`, `data-side`, `data-align`, `data-starting-style`/`data-ending-style`; no `data-state` (KIT-3) | 2026-10-11 | package grep |
| W-15 | create-next-app defaults | Pins `typescript ^5`, an older Biome, `@types/node ^20`; writes `cacheComponents: true`, `partialPrefetching: true` and an `AGENTS.md`. The scaffold re-adds current versions and replaces `AGENTS.md`. Non-interactive flags verified, plus `--empty`, `--cache-components`, `--skip-install` | 2026-10-11 | experiment |
| W-16 | create-vite 9 | `create-vite <dir> --template react-ts --no-interactive`; pins `typescript ~6.0.2`; `react-compiler-ts` template exists | 2026-10-11 | `create-vite --help`; experiment |
| W-17 | oxc-parser | 0.x: minor bumps can change the AST; check-rules is re-run on templates after an upgrade | 2026-10-11 | README |
| W-18 | vite-plugin-pwa 2 | No config-shape change found; the full breaking-change list is not published | 2026-10-11 | releases page |

## Open unknowns

- W-1: when dependency-cruiser gains TS 7 support.
- W-8: the no-flash behavior of the inline script is inferred, confirmed only by the smoke test (TST-3).
- W-10: whether pnpm 12 still honors `ignoredBuiltDependencies`.
- W-15: interplay of `cacheComponents: true` with NXT-6 static-by-default; decided per project until settled.
- W-18: vite-plugin-pwa 2 breaking changes.
- AUTH-8: CSP needs for Next 16 inline flight-data scripts were not verified in this pass.
- Vite 8: whether Lightning CSS minification adds vendor prefixes for the browserslist targets (NXT-12 analog for Vite).
