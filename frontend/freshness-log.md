# Freshness log

Applies to: all

Append-only, newest first. Each entry: date and trigger, packages old → new, findings with sources, a decision per finding. Ledger: [stack.md](stack.md).

## 2026-11-02 — static export templates and the served-site header check

Trigger: follow-up to the stones run: 0475ed3 promised a smoke test on the deployed site that nothing defined, and left the export `next.config.ts` as a manual post-render edit. Experiments: create-next-app 16.4.4 marketing project rendered with `deploy: static` (locales `en`, `ru`), `pnpm check`, `pnpm test:e2e`, `pnpm build`, `next dev` during a `NEXT_DIST_DIR=.next-build` build, `docker build` of the nginx image and `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e` against it; `rules-selftest` with `@biomejs/biome@2.6.4`. Local toolchain: node v24.14.1, pnpm 10.33.0 (12.16.1 in the project). Packages: none.

| Finding | Source | Decision |
|---|---|---|
| Under `output: 'export'` with `distDir` not `.next`, `distDir` is the export directory and build files go to `.next`; `next build` keeps `.next/dev`, `cache`, `lock`; `next dev` kept serving (200 before and after the build and after an edit) while `NEXT_DIST_DIR=.next-build pnpm build` ran | next 16.4.4 `dist/export/utils.js:23-34`, `dist/build/index.js:623-632`, `dist/server/config.js:1108`; experiment | W-20; NXT-7 describes the export directory and `.next/dev`; `pnpm start` serves the export with `scripts/serve-export.mjs` because `next start` refuses export (`dist/server/next.js:260`) |
| Under Turbopack the export build fails on `robots.ts` (`export const dynamic = "force-static"/export const revalidate not configured on route "/robots.txt"`): the webpack metadata loader that adds `force-static` is not used | experiment; `dist/server/route-modules/app-route/module.js:172-176`; `dist/build/webpack/loaders/next-metadata-route-loader.js:107` | W-20; the `next-export` set overlays `robots.ts` and `sitemap.ts` with `export const dynamic = 'force-static'` |
| `next/image` with the default loader fails the export unless `images.unoptimized`; `headers()` only warns; `instrumentation` `register` did not run during the export build; force-dynamic route handlers (BFF, `/api/health`) throw | `dist/export/index.js:322-333`; `dist/server/config.js:477`; experiment | NXT-5 export bullet; the `next-export` set drops `src/proxy.ts`, `src/instrumentation.ts`, `src/app/api`, the BFF, auth and safe-redirect files, and keeps only `siteEnv()` in `env.server.ts` |
| Nothing defined the "smoke test against the deployed site" that AUTH-8 and NXT-6 cited | 0475ed3 | New TST-7 (`tests/e2e/headers.spec.ts`, runs with `E2E_BASE_URL`); `playwright.config.ts` starts no server in that mode; AUTH-8 and NXT-6 cite TST-7; `agents-md-outline.md` renders AUTH-8 for every next project and lists TST-7 |
| The nginx image (`nginx.conf` with AUTH-8 headers, `/_next/static/` immutable, HTML `no-cache`, `$uri.html` fallback, `404.html`, `/healthz`) passes TST-7 and the smoke test with no console errors under `script-src 'self' 'unsafe-inline'`; `/nope` returns 404; the same `headers.spec.ts` against `serve-export.mjs` (no headers) fails | experiment | DEP-1 export bullet; project-types.md marketing row; stack.md AUTH-8 open unknown settled for the export template only |
| A local pnpm 10.33.0 does not switch to 12.16.1: `Failed to switch pnpm to v12.16.1 ... spawnSync .../.tools/pnpm/12.16.1/bin/pnpm ENOEXEC` (12.16's `bin/pnpm` is a shebang-less shell shim), reproduced with an empty `PNPM_HOME`; running that shim with `sh` works, and `npm install -g pnpm@12.16.1` in `node:24-alpine` (DEP-1) works | experiment | Not settled here: `scaffold-vite.md` §4 and `scaffold-next.md` §5 still say pnpm 10 switches itself; needs a separate decision on the documented install path |
| A single-locale (`en`) next project fails `tsc`: `src/shared/config/routes.ts(24,32): Property 'length' does not exist on type 'never'` (TypeScript infers a type predicate for the `LOCALES.find` callback) | experiment | Not in this change; the verification used two locales |
| `biome check --write` reformats the rendered `.github/dependabot.yml` (`'*'` → `"*"`) and the `docs/README.md` table | experiment | Templates now ship the formatted text |

## 2026-11-02 — freshness run for a static-export marketing project (stones)

Trigger: `new-project` freshness step, Next marketing type with `output: 'export'`; the user chose (a) for all four contradictions. Experiments: create-next-app 16.4.4 export build; dependency-cruiser 18.7.1 `--info` with TS 7; `rules-selftest` with `@biomejs/biome@2.6.4`. Local toolchain: node v24.14.1, pnpm 10.33.0.

Packages: pnpm 12.11.2 → 12.16.1; react, react-dom 19.3.0 → 19.3.1; next, create-next-app 16.4.0 → 16.4.4; postcss 8.5.29 → 8.5.32; @tanstack/react-query 5.104.1 → 5.105.2; zustand 5.0.15 → 5.0.16; zod 4.6.5 → 4.6.7; lucide-react 1.55.0 → 1.66.0; @biomejs/biome 2.5.15 → 2.6.4; dependency-cruiser 18.5.0 → 18.7.1; vitest 5.0.3 → 5.0.5; @playwright/test 1.64.0 → 1.64.1; @axe-core/playwright 4.13.0 → 4.14.0. Re-verified unchanged: typescript ~6.0 (6.0.3), postcss-custom-media 12.0.3, @csstools/postcss-global-data 4.0.0, @base-ui/react 1.9.0, @testing-library/react 16.3.3. Not adopted: happy-dom 20.14.6 → 21.0.4 (major; row left at its old `Verified` date).

| Finding | Source | Decision |
|---|---|---|
| With `output: 'export'`, `cacheComponents: true` fails `next build` (`Invariant: PPR cannot be enabled in export mode`), and `partialPrefetching` without `cacheComponents` fails too; with both removed the export builds | experiment; next 16.4.4 `dist/export/index.js:660`; https://nextjs.org/docs/app/guides/static-exports | W-15, NXT-6: a static-export project removes both; `scaffold-next.md` §2 edits `next.config.ts` for export projects; W-15 open unknown settled for export only |
| project-types.md allowed `output: 'export'` for marketing while NXT-7 required `standalone`; `headers()` (AUTH-8 security headers and CSP, NXT-6 cache headers) is not applied under export | https://nextjs.org/docs/app/guides/static-exports#unsupported-features; https://nextjs.org/docs/messages/export-no-custom-routes; experiment | NXT-7 allows `export` for a marketing site with no server features; AUTH-8 and NXT-6 move the headers to the static host's config (web server or CDN), checked by the smoke test on the deployed site; project-types.md row cites them |
| Biome 2.6 matches plugin-level `includes` globs relative to the config directory | Biome CHANGELOG 2.6.2 (#12264); https://github.com/biomejs/biome/pull/12264 | W-19 reworded; plugins stay on `overrides[].plugins` (tooling.md unchanged); `rules-selftest` 180 samples, 0 failures; `biome migrate`: no migration needed |
| Next 16.4.0 is affected by GHSA-673q-mjm6-r5xr (RCE in `use cache`), GHSA-2464-fhr4-w9xw (RCE in Image Optimization with SVG) and GHSA-p3m5-59mp-jv5r (Server Actions DoS), fixed in 16.4.1 | https://github.com/vercel/next.js/releases/tag/v16.4.1 | Next row 16.4.4, never below 16.4.1 |
| create-next-app sets `packageManager` to the local pnpm (10.33.0 here), and the scaffold's `pnpm pkg set packageManager=pnpm@<pnpm version>` did not say which version | experiment | `scaffold-next.md` §5 sets the 12.x version from the stack.md pnpm row and checks `pnpm --version` in the project |
| dependency-cruiser 18.7.1 still declares `typescript >=2.0.0 <7.0.0` | `depcruise --info`; npm | W-1 unchanged: stay on `~6.0` |
| pnpm 12.12–12.16.1 keep `allowBuilds`; create-next-app 16.4.4 still writes `ignoredBuiltDependencies` | https://github.com/pnpm/pnpm/releases/tag/v12.12.0; https://github.com/pnpm/pnpm/releases/tag/v12.15.0; experiment | W-10 unchanged; whether pnpm 12 honors the old key stays open |
| happy-dom 21 turns off CSS file and iframe loading by default; `disableCSSFileLoading` deprecated | https://github.com/capricorn86/happy-dom/releases/tag/v21.0.0 | Inferred no rule impact (TST-2 imports CSS Modules through Vitest; the template sets only `environment: 'happy-dom'`); the major bump is left for a separate decision |
| Inferred unchanged, not re-run: W-4, W-6, W-7, W-8, W-9 (Next and PostCSS moved by patch only) | npm | `Verified` dates kept |

## 2026-11-02 — Docker images without corepack; Sec-Fetch-Site in the CSRF check

Trigger: explicit request, port from an upstream review. Experiments: `docker run` and stage builds on `node:24-alpine`, `node:26-alpine` and `node:lts-alpine`. Packages: none.

| Finding | Source | Decision |
|---|---|---|
| Corepack is not distributed from Node 25; `node:26-alpine` and `node:lts-alpine` (26.13.0) have none | https://nodejs.org/docs/latest-v24.x/api/corepack.html; experiment | TOOL-1 no longer relies on corepack |
| The Next Dockerfile used the floating `node:lts-alpine` with `corepack enable` and fails since 2026-10-28; the Vite one fails once `nodeMajor` is 25 or later | experiment | DEP-1, DEP-2: `node:{{nodeMajor}}-alpine`, `npm install -g pnpm@<packageManager version>`; built on 24 and 26 |
| The image does not verify pnpm against a `+sha512` hash in `packageManager` | inference | Accepted, known limit |
| `isSameOriginRequest` accepted a matching `Origin` even when `Sec-Fetch-Site` said `same-site` or `cross-site` (for example an `http:` page on the same host) | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site | AUTH-3 rewritten; `same-origin.ts` rejects any sent value other than `same-origin`; truth-table test added |
| AUTH-3 claimed that `same-origin` adds a port check over the Origin match, but `new URL(origin).host` already carries a non-default port; only the scheme is not compared | review; `same-origin.ts` | AUTH-3 Why reworded; the test adds `same-origin` with a foreign Origin |
| A missing or non-pnpm `packageManager` made the Docker pnpm step install the latest pnpm | review; experiment | DEP-1, DEP-2 templates: the version lookup throws and fails the build; the unused `PNPM_HOME` lines removed from the Next Dockerfile |
| `__Host-` cookie prefix (upstream AUTH-1) | upstream review | Deferred: needs a `Secure` gate on the `SITE_URL` scheme and a WebKit check over plain-HTTP dev |

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
| The R-comments lexer read `</tag>` as a regex start and JSX text as code, so comments after closing tags or after an apostrophe in JSX text were missed and a URL in JSX text was reported | critic review; fixtures | The scanner tracks JSX tags, attributes and text, counts type arguments inside a tag (`<Select<Option> />`), and `++`/`--` end a value. A `<` misread as a tag (a generic signature such as `<T>(x: T) => T` or `<const T,>`) is recovered at the next raw `>` or `}`, which JSX text cannot contain; a comment between the misread `<` and that point is still missed, including a same-line comment when a string inside a misread signature contains `>` or `}`, a known limit |
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
