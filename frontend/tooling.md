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
  - GritQL plugins in `biome-plugins/` carry the check-rules catalogue (TOOL-5). Each plugin is attached to its paths by an `overrides[].plugins` entry; the plugin-level `includes` is not used (stack.md W-19). Biome formats the `.grit` files like any source.
  - Formatter: 2 spaces, width 100, single quotes, semicolons as needed, trailing commas all.
- **TOOL-4** dependency-cruiser (`.dependency-cruiser.cjs`) rules, listed in the catalogue below. Layer list per variant; `.css` excluded from the graph; tsconfig paths resolved.
- **TOOL-5** The check-rules catalogue below. Each check ID equals a rule annotation and is the file stem of its plugin (`biome-plugins/**/R-<check>.grit`); every diagnostic message starts with the ID. Scope lives in `biome.json` `overrides`, one entry per path set. Allowlist: Biome suppression comments naming the check, `// biome-ignore lint/plugin/R-<check>: <reason>` for one line or `biome-ignore-all` at the top of a file; Biome rejects an empty reason and reports a suppression that matches nothing; `scripts/check-rules.mjs` rejects a broad category (`lint`, `lint/plugin` or a bare `lint/<group>`), so every suppression names `lint/plugin/R-<check>` or `lint/<group>/<rule>`. Each suppression is reviewed. Exempting a path set (a negated glob in the check's override) needs an ADR. `R-comments` is the one check a plugin cannot express (comments are invisible to GritQL): `scripts/check-rules.mjs`, a parser-free scanner that reads JSX text as text, reports it, and also fails when a plugin errors at runtime (Biome reports that as info and exits 0).
- **TOOL-6** Scripts:
  - `dev`, `build`, `preview|start`, `typecheck`;
  - `lint` (`biome check`, runs the GritQL plugins), `lint:fix`, `lint:arch`, `lint:rules` (`scripts/check-rules.mjs`: R-comments and the plugin-failure guard);
  - `test`, `test:e2e`;
  - `check` = `lint && lint:arch && lint:rules && typecheck && test && build` (next: into `.next-build`).
- **TOOL-7** PostCSS, the same `postcss.config.mjs` in Vite and Next. Plugins:
  - `@csstools/postcss-global-data` with `files: ['src/shared/styles/tokens/media.css']`;
  - then `postcss-custom-media`.
  - This makes `@custom-media` names usable in every module without a custom bundler plugin.
  - `composes` from `@/…` resolves in Vite 8 (with `resolve.alias`) and Next 16 (Turbopack and webpack); verified 2026-10-11 (stack.md W-7).
  - No custom shared-styles plugin. Prefixing per STY-11.
- **TOOL-8** `lint:arch` fails when dependency-cruiser reports 0 cruised modules. A silent empty graph (for example under TypeScript 7) is a failure, not a pass. [ci]

## check-rules catalogue (biome-plugins/, scripts/check-rules.mjs)

Biome GritQL plugins (stack.md W-19) plus a parser-free comment scanner. A failure is a Biome diagnostic whose message starts with the check ID, or a `file:line R-comments …` line; exit 1 on any error.

| Check | Rule | Level | Plugin |
|---|---|---|---|
| `R-comments` | WF-1, TOOL-5 | error | `scripts/check-rules.mjs` |
| `R-native-elements` | KIT-1 | error | `R-native-elements.grit` |
| `R-one-component` | CMP-1 | error | `R-one-component.grit`, `name/` |
| `R-hook-fields` | CMP-4 | error | `R-hook-fields.grit` |
| `R-no-function-decl` | CMP-2 | error | `R-no-function-decl.grit` |
| `R-inline-style` | STY-10 | error | `R-inline-style.grit`, `shared-ui/` |
| `R-inline-regex` | CMP-12 | error | `R-inline-regex.grit` |
| `R-manual-memo` | CMP-8 | warn | `R-manual-memo.grit` |
| `R-fetch` | API-1 | error | `R-fetch.grit` |
| `R-endpoint-literals` | API-2 | error | `R-endpoint-literals.grit` |
| `R-env-access` | CFG-1 | error | `R-env-access.grit` |
| `R-storage` | CFG-5 | error | `R-storage.grit` |
| `R-telegram-global` | TMA-1 | error | `R-telegram-global.grit` |
| `R-error-message` | API-6 | warn until tuned | `R-error-message.grit` |
| `R-module-scope-side-effects` | CMP-9 | warn until tuned | `R-module-scope-side-effects.grit` |
| `R-classname` | STY-3 | error | `R-classname.grit` |
| `R-composes-source` | STY-4 | error | `css/` |
| `R-global-css-import` | STY-7 | error | `R-global-css-import.grit`, `css/` |
| `R-raw-values` | TOK-1, TOK-4, STY-1 | error | `css/` |
| `R-token-tiers` | TOK-1 | error | `tokens-unknown/`, `tokens-semantic/`, `tokens-components/` |
| `R-literal-nbsp` | TXT-2 | error | `R-literal-nbsp.grit`, `css/` |
| `R-typography` | TXT-1, TXT-4 | error | `R-typography.grit`, `typography/<lang>/` |

`R-raw-values` flags, in any `.css` under `src/` outside `src/shared/styles/tokens/`: hex colors; `rgb(`/`rgba(`/`hsl(`/`hsla(`/`hwb(`/`lab(`/`lch(`/`oklab(`/`oklch(`/`color(`; the CSS named colors other than `transparent`/`currentColor`/`inherit`; px other than `1px`; rem/em literals; ms/s literals other than `0`; `z-index` numbers other than `0`/`-1`; `@media` features other than a custom media name. `@container` queries are not checked: container sizes have no custom-media equivalent. Values inside `var()` (fallbacks included), `url()` and strings are not checked. Allowed: `0`, `%`, `fr`, `auto`, keywords, `var()`, `calc()` of vars.

`R-typography` runs on `src/shared/i18n/locales/<lang>.ts` (not `index.ts`). On every dictionary it checks the universal TXT-1 bindings: a plain space before an em dash and after `№` or `§`. On a dictionary that `biome.json` gives a TXT-4 file it also checks that locale's short words and number-unit pairs. It reads source text: the `\u00a0` escape counts as bound, `\u2014`, `\u2116` and `\u00a7` count as the characters, any `\uXXXX` escape and `\n`/`\r`/`\t` separate words, and the digits of an escape are never read as a number. A number before an ordinary word, initials, EN headings and buttons, and nbsp used for spacing are review-enforced.

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
