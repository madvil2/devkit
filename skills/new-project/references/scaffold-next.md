# Scaffold: Next types (marketing, landing + product)

Run by opus-implementer in step 5. `<skill>`, `<path>`, `<answers>` as in `scaffold-vite.md`. Marketing uses structure variant C (`src/app → sections → shared`); landing + product uses variant B (`src/app → views → widgets → features → entities → shared`). The renderer derives `{{layers}}` from `type`.

## 1. Preflight

Same as `scaffold-vite.md` §1.

## 2. Official CLI (verified 2026-11-02, stack.md W-15)

```sh
cd <parent of path>
pnpm dlx create-next-app@<version> <name> --ts --no-tailwind --biome --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --no-agent-feedback --no-react-compiler --yes
git -C <path> init -b main
```

`--no-react-compiler` is deliberate: the compiler is wired by the template (`reactCompiler: true` in `next.config.ts`, CMP-8) after the TypeScript pin.

The CLI always writes `cacheComponents: true, partialPrefetching: true` and has no flag to turn them off. A static-export project (`output: 'export'`, marketing only, NXT-7) removes both: `cacheComponents: true` fails `next build` with `Invariant: PPR cannot be enabled in export mode`, and `partialPrefetching` requires `cacheComponents` (verified 16.4.4, stack.md W-15). A marketing project with `deploy: static` renders `templates/next-export` (§4), whose `next.config.ts` has `output: 'export'`, neither key and no `headers`; the security, CSP and cache headers live in its `nginx.conf` and are checked by TST-7 (AUTH-8, NXT-6).

## 3. Normalise the CLI output (NXT-13)

- TypeScript: `pnpm add -D typescript@~6.0` (the CLI pins `^5`; stack.md W-1).
- Biome: `pnpm add -D @biomejs/biome@<stack.md version>` (the CLI pins an older one); the rendered `biome.json` replaces the CLI one.
- `@types/node`: `pnpm add -D @types/node@<Node LTS major>` (the CLI pins `^20`).
- `next.config.ts`: the CLI writes `cacheComponents: true, partialPrefetching: true`. The template's `next.config.ts` replaces it; decide `cacheComponents` per project against NXT-6 (static by default) and record the decision in the ADR (stack.md W-15). An export project keeps both off (§2).
- `AGENTS.md`: the CLI writes its own; it is replaced by the rendered rulebook (`agents-md-outline.md`).
- `pnpm-workspace.yaml`: remove the pnpm 10 `ignoredBuiltDependencies` key; approvals per `scaffold-vite.md` §4 (`sharp`, `unrs-resolver` are expected).
- Demo files (`src/app/page.tsx`, `page.module.css`, `globals.css`, `public/*.svg`) are removed by the renderer.

## 4. Render templates

```sh
node <skill>/references/render.mjs --answers <answers> --target <path>
```

Overlays `templates/common` then `templates/next`; a marketing project with `deploy: static` also overlays `templates/next-export` (output: 'export', NXT-7, stack.md W-20). `{{siteUrl}}` comes from `answers.siteUrl` (default `http://localhost:<port>`). The renderer also:

- fills placeholders in every `package.fragment.json` and deep-merges them into `package.json` (`scripts.dev`/`start` on the port, `typecheck` = `next typegen && tsc --noEmit`, `check` building into `.next-build`), dropping the CLI `format` script (use `lint:fix`);
- adds `.next*/types/**/*.ts`, `.next*/dev/types/**/*.ts` and the explicit `.next-build`/`.next-e2e` type paths to `tsconfig.json` `include`, so builds with `NEXT_DIST_DIR` do not rewrite `tsconfig.json`;
- writes `.env.example`, `.env.development` and `.env.production` from `templates/next`;
- fills `{{nodeMajor}}` in `Dockerfile` and `.nvmrc` (`answers.versions.nodeMajor` is required, as for Vite; DEP-1).

Export overlay (`next-export`):

- replaces `next.config.ts` (`output: 'export'`, `images.unoptimized: true`, no `headers`, no `cacheComponents`/`partialPrefetching`), `src/shared/config/env.server.ts` (`siteEnv()` only), `.env.example`, `.env.production`, `Dockerfile` (nginx image, DEP-1), `.dockerignore` (adds `out`), `playwright.config.ts` and `src/app/robots.ts`/`sitemap.ts` (with `export const dynamic = 'force-static'`, W-20);
- adds `nginx.conf` and `scripts/serve-export.mjs`; `scripts.start` serves `out` with it (`next start` refuses export);
- does not render `src/proxy.ts`, `src/instrumentation.ts`, `src/app/api/`, `src/shared/api/bff.server.ts`, `src/shared/api/server.ts`, `src/shared/auth/` or `src/shared/lib/safe-redirect/`.

Then format once: `pnpm exec biome check --write` (after §5, when Biome is installed).

## 5. Dependencies

```sh
cd <path>
pnpm pkg set packageManager=pnpm@<stack.md pnpm version> engines.node=">=<nodeMajor>"
pnpm --version
pnpm add @tanstack/react-query zustand zod @base-ui/react lucide-react server-only
pnpm add -D babel-plugin-react-compiler dependency-cruiser postcss postcss-custom-media @csstools/postcss-global-data vitest @testing-library/react happy-dom @playwright/test @axe-core/playwright
```

`<stack.md pnpm version>` is the full 12.x version from the stack.md pnpm row (for example `12.16.1`), never the output of a local `pnpm --version`: the CLI sets `packageManager` to the local pnpm, which may be 10.x. A local pnpm 10 then switches to the pinned 12.x itself (`scaffold-vite.md` §4); `pnpm --version` inside `<path>` must print 12.x before `pnpm add`.

landing + product adds `react-hook-form @hookform/resolvers`.

## 6. Scripts

Set by the renderer from the common and next fragments (§4); check the result with `pnpm pkg get scripts`. Agents build with `NEXT_DIST_DIR=.next-build` so a running `next dev` keeps its `.next` (NXT-7, TOOL-6). `next lint` does not exist (NXT-14).

## 7. Env files (CFG-1, CFG-2)

`.env.example` lists every variable:

```
SITE_URL=http://localhost:<port>
API_UPSTREAM_URL=https://api.example.com
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_URL=/api
```

`.env.development` holds the safe mock-mode defaults only: `SITE_URL=http://localhost:<port>`, `NEXT_PUBLIC_API_MODE=mock`, `NEXT_PUBLIC_API_URL=/api`. `API_UPSTREAM_URL` is not needed in mock mode; to run dev against a real backend, set it together with `NEXT_PUBLIC_API_MODE=http` in `.env.development.local` (ignored by git). `.env.production` comes from the template. Public values are read only in `src/shared/config/public-env.ts`, server values only in `src/shared/config/env.server.ts`.

Export projects have no `API_UPSTREAM_URL` and no `/api` BFF: `.env.example` and `.env.production` set `NEXT_PUBLIC_API_URL=https://api.example.com`, an absolute URL; replace it with the real API and add its origin to `connect-src` in `nginx.conf`.

## 8. Generated code

As `scaffold-vite.md` §6, with Next specifics:

- The golden slice is a `views/<domain>` (variant B) or a `sections/<name>` (variant C) rendered by `src/app/<route>/page.tsx` (thin route file, STR-6, default export of an arrow function: no function declarations, CMP-2).
- Server Components fetch through `src/shared/api/server.ts`; client islands get data by props or prefetch + `HydrationBoundary` (DAT-6).
- `public/og.png` (1200×630) is required by the SEO kit (NXT-4); generate a neutral one from the tokens or ask for the asset.
- Fonts only through `src/app/fonts.ts` (`next/font`, NXT-11).
- Export: pages never call `cookies()` or `headers()`; data comes at build time through `request()` from `@/shared/api` (the mock transport in mock mode, a reachable absolute `NEXT_PUBLIC_API_URL` in http mode), or the sections are content only.

## 9. Verification specifics (step 6)

- `pnpm test:e2e` builds into `.next-e2e` with `NEXT_PUBLIC_API_MODE=mock`, copies `public` and `<distDir>/static` into the standalone folder and runs `node .next-e2e/standalone/server.js` (handled by `playwright.config.ts`).
- Export: `pnpm test:e2e` exports into `.next-e2e` and serves it with `scripts/serve-export.mjs`; `headers.spec.ts` is skipped there (TST-7). Every route is `○`, and `<distDir>/index.html`, `404.html`, `robots.txt` and `sitemap.xml` exist.
- Export, TST-7 against the image when Docker is available: `docker build --build-arg SITE_URL=<url> -t <name> .` (`SITE_URL` is required: an empty build `ENV` wins over `.env.production` and fails `siteEnv()`), `docker run --rm -d -p 127.0.0.1:8080:80 --name <name> <name>`, `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e`, `docker stop <name>`. Use `127.0.0.1`: the CSP has `upgrade-insecure-requests`.

- The root layout stays static: `NEXT_DIST_DIR=.next-build pnpm build` output marks `/` as static (`○`).
- PostCSS custom media and `composes` from `@/…` resolve under Turbopack (stack.md W-7); a custom `webpack` config is not allowed (NXT-14).
- A custom PostCSS config disables Next's autoprefixer; follow STY-11 if a prefix is needed.
