# Next.js

Applies to: next

- **NXT-1** Server Components by default. `'use client'` only on interactive leaves. `server-only`/`client-only` imports mark boundaries. [arch: client-cannot-import-server-only]
- **NXT-2** `shared/seo/metadata.ts` `buildMetadata({ title, description, path, locale, image, noindex })` returns canonical, alternates, OG and Twitter. Every page uses it. `metadataBase` comes from `SITE_URL`.
- **NXT-3** A `JsonLd` component with `<`-escaped serialization. Organization, WebSite, BreadcrumbList, FAQPage, Product/SoftwareApplication.
- **NXT-4** `app/robots.ts` and `app/sitemap.ts` come from the routes registry × locales. Private routes are `noindex` and excluded. OG image 1200×630.
- **NXT-5** Performance:
  - `next/image` with `sizes`;
  - LCP image preloaded;
  - no client JS in static sections;
  - motion libraries lazy;
  - mobile budget: LCP < 2.5 s, CLS < 0.1, INP < 200 ms (manual Lighthouse at DoD for marketing).
- **NXT-6** Static by default. Dynamic only where cookies are read. The root layout never reads cookies (it would make every page dynamic). Explicit `revalidate`. Cache headers in `next.config.ts`. Whether `cacheComponents` stays on is recorded in the project ADR (stack.md W-15).
- **NXT-7** `output: 'standalone'`; `distDir: process.env.NEXT_DIST_DIR || '.next'`. Agents build with `NEXT_DIST_DIR=.next-build` so they never clobber a running dev server.
- **NXT-8** `error.tsx`, `not-found.tsx` and `loading.tsx` per route group, with i18n messages.
- **NXT-9** Decorative effects live in `shared/effects` or `sections/`, never in `shared/ui`.
- **NXT-10** CSS and theme in the App Router:
  - `src/app/layout.tsx` imports `@/shared/styles/global.css` (STY-7);
  - CSS Modules are imported from server and client components alike (no runtime cost; RSC-safe);
  - `<html>` gets `suppressHydrationWarning`;
  - the pre-paint theme script is the first child of `<head>`, rendered as a plain inline `<script dangerouslySetInnerHTML>` from the `shared/lib/theme/pre-paint.ts` string. `next/script` `beforeInteractive` is not used: it does not block hydration (stack.md W-8);
  - the layout stays static.
- **NXT-11** Fonts:
  - only `next/font`, in `src/app/fonts.ts`: `const sans = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-sans-face' })`;
  - the `.variable` classes go on `<html>`;
  - `primitives.css` defines `--font-sans: var(--font-sans-face), system-ui, sans-serif`;
  - no other font loading.
- **NXT-12** PostCSS: Next uses the shared `postcss.config.mjs` (TOOL-7). A custom config completely disables Next's default autoprefixer and preset-env features; nothing is added back by default. Add `autoprefixer` only per STY-11. With Turbopack the root config wins.
- **NXT-13** `create-next-app` output is a base, not a standard: its pinned TypeScript, Biome and `@types/node` lines are replaced with the stack.md lines, and its `AGENTS.md` is replaced by the rendered rulebook.
- **NXT-14** Next 16 specifics (stack.md W-2, W-3, W-5):
  - route guards live in `src/proxy.ts` (the `middleware` file name is deprecated; proxy runs on the Node runtime only);
  - `next lint` does not exist; Biome is the linter (TOOL-3);
  - Turbopack is the default for `dev` and `build`; no custom `webpack` config (it fails the Turbopack build); `--webpack` only as a recorded fallback.

## App folder (variant B)

```
src/app/
  layout.tsx  fonts.ts  providers.tsx  robots.ts  sitemap.ts  not-found.tsx  error.tsx
  (marketing)/page.tsx
  (app)/dashboard/page.tsx
  api/[...path]/route.ts   BFF (AUTH-1)
  api/health/route.ts
src/proxy.ts
```
