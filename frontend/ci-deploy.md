# CI and deploy

Applies to: all

- **CI-1** `ci.yml` on PR and on push to main:
  - pnpm/Node from `.nvmrc`;
  - `pnpm install --frozen-lockfile` (build approvals per TOOL-1);
  - `pnpm check`;
  - Playwright chromium install;
  - `pnpm test:e2e`.
  - Concurrency cancel. `permissions: contents: read`.
- **CI-2** CD per target: dokku via `workflow_call` reuse of ci, static/CDN, or Vercel. Secrets only in CI.
- **DEP-1** (next) Dockerfile:
  - multi-stage on `node:<nodeMajor>-alpine`, the `.nvmrc` major (never the floating `lts` tag, which moves to a new major); pnpm per TOOL-1;
  - standalone output;
  - non-root user;
  - telemetry off;
  - public env as `ARG` with no secret defaults;
  - `/api/health`;
  - under `output: 'export'` (NXT-7): the same build stage, then `nginx:alpine` serving the export directory with `nginx.conf` (`try_files $uri $uri.html $uri/index.html`, `404.html`, AUTH-8 headers, NXT-6 cache headers: `/_next/static/` immutable, HTML `no-cache`) and `/healthz`, as DEP-2.
- **DEP-2** (vite) Build stage on `node:<nodeMajor>-alpine` (pnpm per TOOL-1), then `nginx:alpine` with SPA fallback, SPA-4 caching and AUTH-9 headers.
- **DEP-3** `dependabot.yml`: weekly, grouped minor/patch. Major bumps of rows with a watch item in stack.md go through a freshness run first.
