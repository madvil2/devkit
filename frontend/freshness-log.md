# Freshness log

Applies to: all

Append-only, newest first. Each entry: date and trigger, packages old → new, findings with sources, a decision per finding. Ledger: [stack.md](stack.md).

## 2026-10-12 — check-rules on Biome GritQL plugins; typography per locale

Trigger: explicit request. Experiments: `@biomejs/biome@2.5.15` scratch fixtures (one failing and one passing sample per check); rendered tma and landing-product templates. Packages: `oxc-parser` 0.153.0 → removed.

| Finding | Source | Decision |
|---|---|---|
| 21 of 22 checks are expressible as GritQL plugins with the same scopes | experiment: fixtures; 0 findings on rendered templates | TOOL-3, TOOL-5 |
| Comments are invisible to GritQL (trivia, not nodes) | experiment | R-comments stays in a parser-free `scripts/check-rules.mjs` |
| The plugin-level `includes` matches absolute paths, so only `**/` globs work | experiment | W-19; plugins are attached through `overrides[].plugins` |
| A runtime plugin error is an info diagnostic and `biome check` exits 0 | experiment | `scripts/check-rules.mjs` fails on any `<stem> errored:` diagnostic |
| `biome-ignore lint/plugin/<stem>: <reason>` suppressions work; an empty reason is an error | experiment | Allowlist = suppression comments; the JSON allowlist file next to `check-rules.mjs` removed |
| Nursery `noUnusedClasses`/`noUndeclaredClasses`, `noRestrictedElements`, `noInlineStyles`, `noProcessEnv` and `noRestrictedGlobals` use fixed messages or miss cases | experiment | Not adopted (W-11) |
| oxc AST churn no longer applies | — | W-17 retired |
| The RU short-word list ran on every dictionary, and TXT-2 contained a literal U+00A0 | rulebook review | TXT-1, TXT-2, new TXT-4 |
| The universal number check bound a number to any following word (`Step 2 of 5`, `Since 2019 we help`) yet missed `{count} items` and non-letter units (`5 %`, `100 ₽`) | critic review; fixtures | TXT-1 keeps the em dash and `№`/`§` bindings for every locale; number-unit pairs become per-locale unit lists in TXT-4 next to the short words; a number before an ordinary word is review-enforced |
| The typography plugins read source text: the digits of `\u00a0`/`\u2014` counted as a number, a short word after `\u00a0` was not seen, and `\u2116`/`\u00a7` were not recognised | critic review; fixtures | Any `\uXXXX` escape separates words, escape digits are never a number, and the escaped `№`/`§`/em dash count as the characters |
| The R-comments lexer read `</tag>` as a regex start and JSX text as code, so comments after closing tags or after an apostrophe in JSX text were missed and a URL in JSX text was reported | critic review; fixtures | The scanner tracks JSX tags, attributes and text, counts type arguments inside a tag (`<Select<Option> />`), and `++`/`--` end a value. A `<` misread as a tag (a generic signature such as `<T>(x: T) => T` or `<const T,>`) is recovered at the next raw `>` or `}`, which JSX text cannot contain; a comment between the misread `<` and that point is still missed, a known limit |
| `biome-ignore lint: …` and `biome-ignore-all lint/plugin: …` silenced every check in a file | critic review; experiment | `scripts/check-rules.mjs` reports a suppression whose category is `lint`, `lint/plugin` or `lint/<group>` (TOOL-5) |
| Behaviour changes: R-one-component flags all components in a multi-component file; R-hook-fields counts `...rest`; R-endpoint-literals ignores module sources; R-composes-source checks relative paths by shape without resolving them; R-typography no longer runs the RU list on non-RU files, skips `index.ts`, adds `№`/`§`, the EN `a`/`I` checks and the per-locale unit lists, and no longer checks a number before an ordinary word; CSS strings containing `/*` are no longer comments; R-fetch adds `self.fetch`; R-token-tiers in `components.css` flags a raw color inside a `var()` fallback (`var(--x, red)`), intended because a fallback is a raw value; R-raw-values cites TOK-1 for `z-index`; R-one-component checks the hyphenation of the file name for names of up to six words (`invitef-orm.tsx` for `InviteForm` fails). Restored to the old behaviour: comma-separated `var()` lists in `semantic.css`; `@container` size features (`(min-width: 30rem)`) are not checked by R-raw-values, while the declarations inside the block are; object and class getters and setters and the `if (import.meta.hot)` block are not module-scope side effects; R-literal-nbsp covers string-literal types, quoted keys, root `*.config.{js,cjs}`, `.dependency-cruiser.cjs` and `.mjs`/`.cjs`/`.mts`/`.cts` files; `css/R-literal-nbsp` again covers `scripts/**/*.css` and `tests/**/*.css`. Known limits: the ru unit `с` collides with the preposition `с`, so `'Курс 1 с нуля'` is reported and must be written as `'Курс 1\u00a0с нуля'`; the HMR exemption of R-module-scope-side-effects covers any `if` whose test mentions `import.meta.hot`, including `if (!import.meta.hot)`, its `else` branch and `||` tests; getters in a class expression (`export const C = class { get w() { return window.innerWidth } }`) are still reported, while class declarations pass; component file names with an acronym (`HTMLView`) or seven or more words get a case-insensitive comparison only | experiment: old vs new on the fixtures | Accepted |

## 2026-10-12 — interview and ADRs through Pocock skills

Trigger: explicit request. No package changes.

| Finding | Source | Decision |
|---|---|---|
| The interview and decision records duplicated the `grill-with-docs` and `domain-modeling` skills | skills | project-types interview runs through `grill-with-docs`; WF-2 ADRs move to `docs/adr/` in the domain-modeling format |

## 2026-10-11 — initial rulebook

Trigger: rulebook created (revision 2026-10-11). Experiments: create-next-app 16.4.0, create-vite 9.2.1 and pnpm 12 scratch projects; Node 24.15.0.

Packages: baseline, none → the versions in [stack.md](stack.md).

| Finding | Source | Decision |
|---|---|---|
| TypeScript 7.0.2 has no JS API; dependency-cruiser 18.5 finds 0 modules with it and exits 0 | experiment; `depcruise --info` | Pin `typescript ~6.0` (TOOL-2); add TOOL-8 (0 modules fails); watch W-1 |
| Next 16.4 builds and type-checks with TS 7 | Next `useTypeScriptCli.md`; experiment | Recorded; not adopted while W-1 is open |
| plugin-react 6 `compiler: true` is experimental | plugin-react 6.1.2 README | CMP-8 uses `@rolldown/plugin-babel` + `reactCompilerPreset()` |
| Next React Compiler is top-level `reactCompiler: true`, stable | https://nextjs.org/docs/app/guides/upgrading/version-16 | CMP-8 (next) |
| pnpm 12 fails installs on unapproved build scripts | experiment | TOOL-1: approvals in `pnpm-workspace.yaml` `allowBuilds` |
| Next custom PostCSS config disables autoprefixer and preset-env | https://nextjs.org/docs/pages/guides/post-css | NXT-12; autoprefixer added only when targets need it |
| global-data + custom-media + `composes` from `@/…` work in Vite 8 and Next 16 (Turbopack and webpack, dev and build) | experiment | STY-4 and TOOL-7 use the alias form |
| TanStack Table 9 replaced `useReactTable` with `useTable` / `createTableHook` | package d.ts | KIT-2 |
| `next/script` `beforeInteractive` does not block hydration | https://nextjs.org/docs/app/api-reference/components/script | NXT-10: inline `<script>` in `<head>` |
| CSS chunking merges and reorders CSS by default | Next `cssChunking.md` | STY-6: no cross-file order dependence |
| `middleware` renamed to `proxy.ts`, Node runtime only | version-16 guide | AUTH-2, NXT-14 |
| `next lint` removed; Turbopack default for dev and build | version-16 guide | TOOL-3, NXT-14 |
| Vitest 5: Node >=22.12, `clearMocks` default, strict `toHaveTextContent` | https://vitest.dev/guide/migration | TST-6 |
| Base UI package is `@base-ui/react`; state via `data-open`, `data-checked` etc., no `data-state` | npm; package grep | KIT-3, KIT-6 |
| Biome auto-detects `*.module.css`; `css.parser.cssModules` is for other files | biome 2.5.15 schema | TOOL-3 |
| create-next-app writes `cacheComponents: true` and its own `AGENTS.md` | experiment | Watch W-15; the scaffold replaces `AGENTS.md` |
