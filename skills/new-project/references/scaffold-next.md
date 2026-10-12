# Scaffold: Next types (marketing, landing + product)

Run by opus-implementer in step 5. `<skill>`, `<path>`, `<answers>` as in `scaffold-vite.md`. Marketing uses structure variant C (`src/app → sections → shared`); landing + product uses variant B (`src/app → views → widgets → features → entities → shared`). The renderer derives `{{layers}}` from `type`.

## 1. Preflight

Same as `scaffold-vite.md` §1.

## 2. Official CLI (verified 2026-10-11, stack.md W-15)

```sh
cd <parent of path>
pnpm dlx create-next-app@<version> <name> --ts --no-tailwind --biome --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --no-agent-feedback --no-react-compiler --yes
git -C <path> init -b main
```

`--no-react-compiler` is deliberate: the compiler is wired by the template (`reactCompiler: true` in `next.config.ts`, CMP-8) after the TypeScript pin.

## 3. Normalise the CLI output (NXT-13)

- TypeScript: `pnpm add -D typescript@~6.0` (the CLI pins `^5`; stack.md W-1).
- Biome: `pnpm add -D @biomejs/biome@<stack.md version>` (the CLI pins an older one); the rendered `biome.json` replaces the CLI one.
- `@types/node`: `pnpm add -D @types/node@<Node LTS major>` (the CLI pins `^20`).
- `next.config.ts`: the CLI writes `cacheComponents: true, partialPrefetching: true`. The template's `next.config.ts` replaces it; decide `cacheComponents` per project against NXT-6 (static by default) and record the decision in the ADR (stack.md W-15).
- `AGENTS.md`: the CLI writes its own; it is replaced by the rendered rulebook (`agents-md-outline.md`).
- `pnpm-workspace.yaml`: remove the pnpm 10 `ignoredBuiltDependencies` key; approvals per `scaffold-vite.md` §4 (`sharp`, `unrs-resolver` are expected).
- Demo files (`src/app/page.tsx`, `page.module.css`, `globals.css`, `public/*.svg`) are removed by the renderer.

## 4. Render templates

```sh
node <skill>/references/render.mjs --answers <answers> --target <path>
```

Overlays `templates/common` then `templates/next`. `{{siteUrl}}` comes from `answers.siteUrl` (default `http://localhost:<port>`). The renderer also:

- fills placeholders in every `package.fragment.json` and deep-merges them into `package.json` (`scripts.dev`/`start` on the port, `typecheck` = `next typegen && tsc --noEmit`, `check` building into `.next-build`), dropping the CLI `format` script (use `lint:fix`);
- adds `.next*/types/**/*.ts`, `.next*/dev/types/**/*.ts` and the explicit `.next-build`/`.next-e2e` type paths to `tsconfig.json` `include`, so builds with `NEXT_DIST_DIR` do not rewrite `tsconfig.json`;
- writes `.env.example`, `.env.development` and `.env.production` from `templates/next`.

Then format once: `pnpm exec biome check --write` (after §5, when Biome is installed).

## 5. Dependencies

```sh
cd <path>
pnpm pkg set packageManager=pnpm@<pnpm version> engines.node=">=<nodeMajor>"
pnpm add @tanstack/react-query zustand zod @base-ui/react lucide-react server-only
pnpm add -D babel-plugin-react-compiler dependency-cruiser oxc-parser postcss postcss-custom-media @csstools/postcss-global-data vitest @testing-library/react happy-dom @playwright/test @axe-core/playwright
```

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

## 8. Generated code

As `scaffold-vite.md` §6, with Next specifics:

- The golden slice is a `views/<domain>` (variant B) or a `sections/<name>` (variant C) rendered by `src/app/<route>/page.tsx` (thin route file, STR-6, default export of an arrow function: no function declarations, CMP-2).
- Server Components fetch through `src/shared/api/server.ts`; client islands get data by props or prefetch + `HydrationBoundary` (DAT-6).
- `public/og.png` (1200×630) is required by the SEO kit (NXT-4); generate a neutral one from the tokens or ask for the asset.
- Fonts only through `src/app/fonts.ts` (`next/font`, NXT-11).

## 9. Verification specifics (step 6)

- `pnpm test:e2e` builds into `.next-e2e` with `NEXT_PUBLIC_API_MODE=mock`, copies `public` and `<distDir>/static` into the standalone folder and runs `node .next-e2e/standalone/server.js` (handled by `playwright.config.ts`).
- Dev smoke: start `pnpm dev`, smoke through the project's `.verify/` setup, then stop the listener on the port.

- The root layout stays static: `NEXT_DIST_DIR=.next-build pnpm build` output marks `/` as static (`○`).
- PostCSS custom media and `composes` from `@/…` resolve under Turbopack (stack.md W-7); a custom `webpack` config is not allowed (NXT-14).
- A custom PostCSS config disables Next's autoprefixer; follow STY-11 if a prefix is needed.
