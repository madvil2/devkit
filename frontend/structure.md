# Structure

Applies to: all

- **STR-1** Layers point strictly downward. `widgets`/`entities` are created when first needed. No import cycles. [arch: layers, no-circular]
  - (A, vite) `app → pages → widgets → features → entities → shared`;
  - (B, next) `src/app` (Next router: route files, layouts, providers, fonts) `→ views → widgets → features → entities → shared`;
  - (C, marketing) `src/app → sections → shared`.
  - Why `views` in B: a top-level `pages` folder would be read by Next as a Pages Router.
- **STR-2** Every slice has an `index.ts` public API. Imports from outside go through `@/<layer>/<slice>` only. [arch: no-deep-import]
- **STR-3** No imports between sibling slices of one layer. Entities may import each other only with `import type` via the public API. [arch: no-sibling-slices]
- **STR-4** Segments:
  - `ui/` components + their `.module.css`;
  - `model/` view hooks + stores + domain logic;
  - `api/` requests + schemas + query options;
  - `lib/` pure helpers;
  - `config/` constants.
  - Tests sit next to code as `*.test.ts`.
- **STR-5** `shared` contains:
  - `ui/<component>/` (own `index.ts`; no giant barrel);
  - `lib/<topic>/`, `api/`, `config/`, `i18n/`;
  - `styles/` (tokens + recipes);
  - `effects/` (decorative), `seo/` (next).
- **STR-6** Route files stay thin: parse params/search, guard, render one page/view. (vite) `routeTree.gen.ts` is never edited and is excluded from Biome. Code splitting is automatic.
- **STR-7** Naming: [biome: noDefaultExport + overrides]
  - kebab-case files and folders;
  - PascalCase named component exports;
  - `use-x.ts` exports `useX`;
  - `UPPER_SNAKE` constants;
  - closed sets as `as const` object + derived type;
  - no `I` prefix;
  - default exports only where the framework requires them (Next `page`/`layout`/`route`/`error`/`not-found`/`robots`/`sitemap`, config files).
- **STR-8** The `@/` alias maps to `src/`. Relative imports only inside one slice. CSS `composes` paths follow STY-4. [arch: relative-only-within-slice]
- **STR-9** Code used by two or more slices moves down a layer. Never copy it.
- **STR-10** Routes are never string literals outside the framework's route declarations: (vite) TanStack Router typed `to`/`params`; (next) `shared/config/routes.ts` builders.

## Layout example (variant A)

```
src/
  app/            bootstrap.tsx, providers.tsx, router.tsx, routes/
  pages/<page>/   ui/, model/, index.ts
  widgets/<w>/    ui/, model/, index.ts
  features/<f>/   ui/, model/, api/, index.ts
  entities/<e>/   ui/, model/, api/, index.ts
  shared/         ui/, lib/, api/, config/, i18n/, styles/, effects/
  mocks/          <domain>.ts
```
