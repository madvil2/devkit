# Tooling

Applies to: all

- **TOOL-1** pnpm via `packageManager`/corepack. Node LTS in `.nvmrc` + `engines`.
  - pnpm 12 fails installs on unapproved dependency build scripts (`ERR_PNPM_IGNORED_BUILDS`, exit 1).
  - Approvals live in `pnpm-workspace.yaml` under `allowBuilds: { <pkg>: true }`, written by `pnpm approve <pkg>`; each approval is reviewed. Never `pnpm approve --all`.
  - The pnpm 10 `ignoredBuiltDependencies` key that `create-next-app` writes is removed (stack.md W-10).
- **TOOL-2** TypeScript `~6.0` (stack.md W-1: dependency-cruiser does not support TS 7). TS flags: [ts]
  - `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`;
  - `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `noImplicitOverride`;
  - no `any`, no `!`, `import type`.
  - `*.module.css` typing: (vite) `vite/client`; (next) built in.
- **TOOL-3** Biome is the only linter and formatter (no ESLint, no oxlint, no `next lint`):
  - `recommended` + `react`/`project` domains;
  - `noExplicitAny`, `noNonNullAssertion`, `useImportType`, `useExportType`, `noParameterAssign`, `useTemplate`;
  - `noConsole` (allow warn/error);
  - a11y recommended;
  - `noDefaultExport` + framework overrides (STR-7);
  - `*.module.css` is parsed as CSS Modules automatically (`css.parser.cssModules` is only for other file names);
  - override `noDuplicateProperties` off for `*.module.css`;
  - generated files (`routeTree.gen.ts`, `shared/api/generated/`) excluded.
  - Formatter: 2 spaces, width 100, single quotes, semicolons as needed, trailing commas all.
- **TOOL-4** dependency-cruiser (`.dependency-cruiser.cjs`) rules, listed in the catalogue below. Layer list per variant; `.css` excluded from the graph; tsconfig paths resolved.
- **TOOL-5** The check-rules catalogue below. Each check has an ID equal to a rule annotation. The allowlist lives in `scripts/check-rules.config.json`; every entry needs `file`, `check` and `reason`, and is reviewed.
- **TOOL-6** Scripts:
  - `dev`, `build`, `preview|start`, `typecheck`;
  - `lint` (`biome check`), `lint:fix`, `lint:arch`, `lint:rules`;
  - `test`, `test:e2e`;
  - `check` = `lint && lint:arch && lint:rules && typecheck && test && build` (next: into `.next-build`).
- **TOOL-7** PostCSS, the same `postcss.config.mjs` in Vite and Next. Plugins:
  - `@csstools/postcss-global-data` with `files: ['src/shared/styles/tokens/media.css']`;
  - then `postcss-custom-media`.
  - This makes `@custom-media` names usable in every module without a custom bundler plugin.
  - `composes` from `@/…` resolves in Vite 8 (with `resolve.alias`) and Next 16 (Turbopack and webpack); verified 2026-10-11 (stack.md W-7).
  - No custom shared-styles plugin. Prefixing per STY-11.
- **TOOL-8** `lint:arch` fails when dependency-cruiser reports 0 cruised modules. A silent empty graph (for example under TypeScript 7) is a failure, not a pass. [ci]

## check-rules catalogue (`scripts/check-rules.mjs`)

Node ESM on `oxc-parser` (no TypeScript API) plus a small CSS tokenizer. Output `file:line ID message`; exit 1 on any error.

| Check | Rule | Level |
|---|---|---|
| `R-comments` | WF-1 | error |
| `R-native-elements` | KIT-1 | error |
| `R-one-component` | CMP-1 | error |
| `R-hook-fields` | CMP-4 | error |
| `R-no-function-decl` | CMP-2 | error |
| `R-inline-style` | STY-10 | error |
| `R-inline-regex` | CMP-12 | error |
| `R-manual-memo` | CMP-8 | warn |
| `R-fetch` | API-1 | error |
| `R-endpoint-literals` | API-2 | error |
| `R-env-access` | CFG-1 | error |
| `R-storage` | CFG-5 | error |
| `R-telegram-global` | TMA-1 | error |
| `R-error-message` | API-6 | warn until tuned |
| `R-module-scope-side-effects` | CMP-9 | warn until tuned |
| `R-classname` | STY-3 | error |
| `R-composes-source` | STY-4 | error |
| `R-global-css-import` | STY-7 | error |
| `R-raw-values` | TOK-1, TOK-4, STY-1 | error |
| `R-token-tiers` | TOK-1 | error |
| `R-literal-nbsp` | TXT-2 | error |
| `R-typography` | TXT-2 | error |

`R-raw-values` flags, in any `.css` outside `src/shared/styles/tokens/`: hex colors; `rgb(`/`hsl(`/`oklch(`/`color(`; named colors other than `transparent`/`currentColor`/`inherit`; px other than `1px`; rem/em literals; ms/s literals; `z-index` numbers other than `0`/`-1`; `@media` with raw values. Allowed: `0`, `%`, `fr`, `auto`, keywords, `var()`, `calc()` of vars.

## dependency-cruiser catalogue

| Rule | Rule ID |
|---|---|
| `layers` | STR-1 |
| `no-circular` | STR-1 |
| `no-deep-import` | STR-2 |
| `no-sibling-slices` | STR-3 |
| `relative-only-within-slice` | STR-8 |
| `vendor-ui-only-in-shared` | KIT-6 |
| `client-cannot-import-server-only` | NXT-1 |
| `mocks-only-from-transport` | API-4 |
