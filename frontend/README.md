# Frontend rulebook

Applies to: all

Rulebook revision: 2026-10-12

The standard for new frontend projects. The `new-project` skill (`skills/new-project/`) reads this rulebook, renders the in-scope rules verbatim into the project's `AGENTS.md`, and never links back here: project sessions do not read the rulebook.

## Principles

- **Tokens only.** Raw design values live only in the token tier files ([tokens.md](tokens.md)).
- **Logic in hooks, markup in the kit.** Components are a view-hook call plus pure JSX built from `shared/ui` ([components.md](components.md), [ui-kit.md](ui-kit.md)).
- **One way to do each thing.** One client, one store per concern, one formatter, one modal API, one env module.
- **Rules enforced by tools.** Biome, dependency-cruiser, `scripts/check-rules.mjs`, TypeScript, Playwright ([tooling.md](tooling.md)).
- **Docs instead of comments.** No code comments; behavior is documented in `docs/<feature>.md` ([workflow.md](workflow.md)).
- Styling is CSS Modules with tiered tokens in every project type. Tailwind is not used.

## Files

| File | Covers |
|---|---|
| [project-types.md](project-types.md) | Decision matrix and the interview the skill runs |
| [stack.md](stack.md) | Versions with verified dates, watch items (freshness ledger) |
| [freshness-log.md](freshness-log.md) | Append-only log of freshness runs |
| [structure.md](structure.md) | Layers, variants A/B/C, slices, segments, naming, public API |
| [components.md](components.md) | Decomposition, view hooks, JSX purity, effects, React Compiler |
| [ui-kit.md](ui-kit.md) | Native-element ban, kit per type, variants, a11y, overlays |
| [tokens.md](tokens.md) | Tiers, scales, theming, tenants, fonts, rem |
| [styling.md](styling.md) | CSS Modules files, variants, `composes` recipes, `cx`, cascade safety |
| [data.md](data.md) | TanStack Query and zustand contracts, render states, realtime, URL state |
| [api.md](api.md) | Client, endpoints registry, transport and mocks, schemas, errors |
| [auth.md](auth.md) | Next BFF cookies, SPA sessions, TMA initData, CSRF, redirects, headers |
| [config.md](config.md) | Env parsing, app config and flags, storage, constants |
| [i18n.md](i18n.md) | Dictionaries, plurals, Intl, locale routing, typography |
| [forms.md](forms.md) | react-hook-form + zod, Field kit, submit, server errors |
| [money.md](money.md) | Decimal strings, one formatter, `Amount` |
| [next.md](next.md) | RSC boundaries, CSS in the App Router, SEO, caching, build dir |
| [vite-spa.md](vite-spa.md) | TanStack Router, bootstrap, static deploy, PWA add-on |
| [tma.md](tma.md) | Telegram port, pre-paint, safe areas, back, CloudStorage |
| [testing.md](testing.md) | Vitest, hook tests, Playwright smoke + axe, regressions |
| [tooling.md](tooling.md) | TS, Biome, PostCSS, dependency-cruiser, check-rules catalogue, scripts |
| [ci-deploy.md](ci-deploy.md) | CI gate, CD targets, Dockerfiles, dependabot |
| [workflow.md](workflow.md) | Comments, docs per feature, commits, definition of done |

## Format and scope legend

- Every rule starts with a stable ID in bold (for example CMP-3). IDs are never renumbered or reused; new rules get the next free number.
- `Applies to:` under each title gives the file scope. A narrower scope is a suffix on the rule or bullet:
  - `(next)` Next.js types: marketing and landing + product;
  - `(vite)` Vite types: admin, client SPA, TMA;
  - `(spa)` same as `(vite)` when contrasted with Next;
  - `(tma)` Telegram Mini App;
  - `(marketing)` marketing / SEO landing;
  - `(money)` projects with money or payments;
  - `(i18n-remote)` copy edited remotely or per tenant;
  - `(multi-tenant)` white-label projects;
  - `(pwa)` the PWA add-on.
- Enforcement in brackets:
  - `[biome: rule]` Biome lint;
  - `[arch: rule]` dependency-cruiser rule;
  - `[rules: R-…]` `scripts/check-rules.mjs` check;
  - `[ts: flag]` TypeScript;
  - `[ci]` CI gate;
  - `[e2e]` Playwright smoke.
  - No bracket means review-enforced.

## How the skill uses the rulebook

1. Loads this file, [project-types.md](project-types.md) and [stack.md](stack.md).
2. Interviews per [project-types.md](project-types.md) and picks a type and add-ons.
3. Runs the freshness check against [stack.md](stack.md) and reconciles contradictions by rule ID.
4. Scaffolds from the official CLIs plus the skill templates.
5. Renders `AGENTS.md` with every in-scope rule ID verbatim and this revision line.

## Changing the rulebook

- Only through the skill's freshness step or an explicit request.
- Order: rule text → [stack.md](stack.md) row → [freshness-log.md](freshness-log.md) entry → bump `Rulebook revision` above.
- Rule IDs, check IDs (`R-…`) and dependency-cruiser rule names are contracts with the skill templates; a rename is a coordinated change.

## Weak spots of earlier projects and the rules that close them

| Weak spot | Seen in | Rule IDs |
|---|---|---|
| Storage read at module evaluation, before bootstrap hydration (REVIEW Major 1) | pintopay miniapp | CMP-9, CFG-5, DAT-7 |
| Feature imports a widget, inverting layer order (REVIEW Major 3) | pintopay miniapp | STR-1, STR-3, TOOL-4 |
| Empty state flashes before data arrives; `loaded` flags (REVIEW Major 5) | pintopay miniapp | DAT-1, DAT-3, DAT-7, TST-3 |
| Missing `TODO(api):` marker on a stand-in | pintopay miniapp | API-5, DAT-8 |
| `cause.message` and backend text rendered on screen (REVIEW Major 7) | pintopay miniapp | API-6 |
| Mock transport bundled into production | pintopay miniapp | API-4 |
| Custom bundler plugin for shared styles | pintopay miniapp | STY-4, TOOL-7 |
| Global token scale mixed with component one-offs | pintopay miniapp | TOK-1, TOK-5 |
| No lint, typecheck or test gate in CI | pintopay miniapp, postcraft-web | CI-1, TOOL-6 |
| Domain folders with no direction rule, no enforcement | postcraft-web | STR-1, STR-2, TOOL-4 |
| View hook returning about 35 fields | postcraft-web | CMP-4 |
| Hooks calling the fetch wrapper directly | postcraft-web | CMP-6, DAT-2, API-1 |
| Backend error text shown to users | postcraft-web | API-6 |
| Landing effects mixed into UI primitives | postcraft-web | KIT-5, NXT-9 |
| No spacing or z-index tokens; landing-only tokens in globals | postcraft-web | TOK-3, TOK-5 |
| Conditional class maps in feature code | postcraft-web | STY-2, STY-3 |
| `next lint` with no config (removed in Next 16) | postcraft-web | TOOL-3 |
| `process.env` read across the codebase | postcraft-web | CFG-1 |
| Literal U+00A0 in copy; typography checked by hand | postcraft-web | TXT-2 |
| No tests | postcraft-web | TST-1, TST-3 |
