# Scaffold: Vite types (admin, client SPA, TMA, + PWA add-on)

Run by opus-implementer in step 5. `<skill>` is the new-project skill folder, `<path>` the project directory, `<answers>` the answers JSON (shape: `<skill>/references/answers.example.json`). Versions come from the freshness table (step 2), never from memory.

## 1. Preflight

- `<path>` is absent or empty.
- The port is free: pick from 3200–3999, skip every listener (`lsof -nP -iTCP:<port> -sTCP:LISTEN`).
- Node major ≥ 22.12 (Vitest 5, dependency-cruiser).

## 2. Official CLI

```sh
cd <parent of path>
pnpm dlx create-vite@<create-vite version> <name> --template react-ts --no-interactive --no-immediate
git -C <path> init -b main
```

## 3. Render templates

`<answers>` must carry `rulebookRevision` (from `<rulebook>/README.md`) and `versions.biome`, `versions.nodeMajor`.

```sh
node <skill>/references/render.mjs --answers <answers> --target <path>
```

The renderer:

- overlays `templates/common`, `templates/vite` and, for `type: "tma"`, `templates/tma` (later sets win);
- fills `{{name}}`, `{{port}}`, `{{locales}}` (`'en', 'ru'`), `{{defaultLocale}}`, `{{siteUrl}}`, `{{rulebookRevision}}`, `{{layers}}`, `{{biomeVersion}}`, `{{nodeMajor}}`, the derived `{{localeLoaders}}`, and after rendering the CSP hashes `{{prePaintHash}}` / `{{tmaPrePaintHash}}`;
- renames `__defaultLocale__.ts` and copies the base dictionary into every other locale (translate those copies in step 6);
- removes the create-vite demo files and `.oxlintrc.json`, drops `oxlint` from `devDependencies` (SPA-6);
- merges `package.fragment.json` scripts into `package.json` (TOOL-6);
- fails on any unfilled placeholder.

## 4. Package manager and dependencies

```sh
cd <path>
pnpm pkg set packageManager=pnpm@<pnpm version> engines.node=">=<nodeMajor>"
pnpm --version
```

`pnpm` 10 switches to the pinned version itself (verified: local 10.33.1 ran 12.11.2). Read the major that actually runs from `pnpm --version` inside `<path>`.

Runtime:

```sh
pnpm add react@latest react-dom@latest @tanstack/react-query @tanstack/react-router zustand zod @base-ui/react lucide-react
```

Dev (TypeScript pinned to the line from stack.md W-1, `~6.0` today):

```sh
pnpm add -D typescript@~6.0 @biomejs/biome dependency-cruiser oxc-parser postcss postcss-custom-media @csstools/postcss-global-data vitest @testing-library/react happy-dom @playwright/test @axe-core/playwright @tanstack/router-plugin @rolldown/plugin-babel @babel/core babel-plugin-react-compiler
```

Per type:

| Type / add-on | Add |
|---|---|
| admin | `@tanstack/react-table react-hook-form @hookform/resolvers` |
| spa | `react-hook-form @hookform/resolvers` |
| tma | `react-hook-form @hookform/resolvers`; dev `@types/telegram-web-app` |
| pwa | dev `vite-plugin-pwa` |

Build-script approvals (TOOL-1):

- pnpm ≥ 12: an unapproved build script fails the install with `ERR_PNPM_IGNORED_BUILDS`. Approve each listed package by name after reviewing it: `pnpm approve <pkg>` (writes `allowBuilds: { <pkg>: true }` to `pnpm-workspace.yaml`). Never `pnpm approve --all`. Remove any `ignoredBuiltDependencies` key.
- pnpm 10/11: list ignored builds with `pnpm ignored-builds`; approve by adding the package to `onlyBuiltDependencies` in `pnpm-workspace.yaml`.
- Known-safe packages: `esbuild`, `@parcel/watcher`, `unrs-resolver`, `sharp`. Anything else goes to the user in the confirmation summary (dry run: record it and skip).
- pnpm 12 may also report "Agent skills awaiting approval" (for example `@tanstack/router-plugin`); this is not a build script, do not approve it, mention it in the hand-off.

## 5. Generate and format

```sh
pnpm build
pnpm exec biome check --write
```

`pnpm build` generates `src/app/routeTree.gen.ts` (STR-6); keep it in git, `pnpm typecheck` runs before `pnpm build` in `pnpm check`.

## 6. Generated code (from the rulebook, not templates)

- Golden slice named after the domain (DAT-2, DAT-3, API-3, API-4, CMP-3..CMP-6, I18N-1, WF-2):
  - `src/entities/<entity>/api/` (zod schema, `<entity>Keys`, `<entity>Queries`), `src/entities/<entity>/index.ts`;
  - `src/mocks/<domain>.ts` with every branched status, registered in `src/mocks/handlers.ts`; endpoints in `src/shared/api/endpoints.ts`;
  - `src/pages/<domain>/` list page with `model/use-<domain>-page.ts` + `ui/<domain>-page.tsx` + module CSS, `AsyncState` with `Skeleton`, empty state only after success;
  - route file `src/app/routes/<domain>.tsx`, link from the home page;
  - i18n keys in every locale; translate the non-default locale copies; `R-typography` must pass;
  - `docs/<domain>.md` + row in `docs/README.md`.
- admin: kit additions `Table` (TanStack Table v9: `useTable`/`createTableHook`, `FlexRender`; the v8 `useReactTable` API exists only as `useLegacyTable`, do not use it), `Select`, `Tabs`, `Pagination`, `Badge`, `EmptyState`, built on `@base-ui/react` inside `shared/ui` and styled through Base UI state attributes (`data-open`, `data-checked`, `data-selected`, `data-highlighted`, `data-disabled`, ...; never `data-state`, KIT-3).
- Forms: `react-hook-form` + zod adapters inside the kit (FRM-1, FRM-2).
- Tokens: from Figma variables (`get_variable_defs`) when a link was given, otherwise keep the neutral starter palette (TOK-*, KIT-10).
- Project files: `AGENTS.md` per `agents-md-outline.md`; `CLAUDE.md` with the single line `@AGENTS.md`; `README.md` (commands, port, structure, links to docs); `docs/architecture.md`; ADRs in `docs/adr/` and `GLOSSARY.md` from the interview.
- `CLAUDE.local.md` goes into `$(git rev-parse --git-path info/exclude)` (WF-6).
- No commit (step 9 decides).

## 7. Type notes

- **TMA**: the `tma` overlay replaces `vite.config.ts` (injects the theme pre-paint, the Telegram SDK and `src/app/boot/pre-paint.js`), `index.html` (`viewport-fit=cover`), `src/main.tsx` (adds `safe-area.css`), `src/app/bootstrap.tsx` (Telegram port first, locale hint from Telegram, chrome colors from tokens), `tsconfig.app.json` (`telegram-web-app` types) and `nginx.conf` (Telegram `frame-ancestors`, SDK origin, both script hashes). Auth per AUTH-5: send raw `initData` to the backend; never trust `initDataUnsafe`. Device testing needs an HTTPS tunnel (TMA-8).
- **PWA add-on**: `vite-plugin-pwa` in `vite.config.ts` with `registerType: 'prompt'`, `workbox.navigateFallback: '/index.html'`, runtime caching only for the app shell and hashed assets, never API routes (SPA-5); an offline state component in the kit; the manifest from `{{name}}` and the semantic tokens.
- **Mobile store shell add-on**: scaffold the web part only; Capacitor is a follow-up.

## 8. Facts the checker relies on

- `pnpm check` = lint → lint:arch → lint:rules → typecheck → test → build.
- `lint:arch` fails when dependency-cruiser cruises 0 modules (TOOL-8; verified by installing `typescript@7.0.2`).
- `test:e2e` builds with `--mode e2e` (mock API) into `dist-e2e` and serves it on `127.0.0.1:<port>`.
- Mock marker: `mock-transport:<name>`; `grep -r "mock-transport" dist` must be empty after `pnpm build` (the mock chunk is not emitted when `VITE_API_MODE` is not `mock`).
- `tests/unit/csp.test.ts` fails when the pre-paint script changes without updating the `nginx.conf` hash (AUTH-9).
- Known build warning: "A PostCSS plugin did not pass the `from` option" comes from `@csstools/postcss-global-data`; harmless.
