# Config

Applies to: all

- **CFG-1** Env modules: [rules: R-env-access]
  - (vite) `shared/config/env.ts` parses `import.meta.env` with zod;
  - (next) `shared/config/env.ts` (public `NEXT_PUBLIC_*`) + `shared/config/env.server.ts` (`server-only`).
  - Invalid env fails at startup with the list of problems.
  - Reading env elsewhere is banned.
- **CFG-2** `.env.example` lists every var. `.env.development` holds safe defaults (mock mode). `.env*.local` is ignored.
- **CFG-3** Named `UPPER_SNAKE` constants for meaningful numbers. Closed sets once as `as const`.
- **CFG-4** `shared/config/app-config.ts`. Flags are `Record<PageKey, boolean>`. Disabled pages redirect.
- **CFG-5** Web storage and CloudStorage only through `shared/lib/storage` with a keys registry, hydrated in bootstrap. [rules: R-storage]

