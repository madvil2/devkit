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
  - multi-stage on Node LTS;
  - standalone output;
  - non-root user;
  - telemetry off;
  - public env as `ARG` with no secret defaults;
  - `/api/health`.
- **DEP-2** (vite) Build stage, then `nginx:alpine` with SPA fallback, SPA-4 caching and AUTH-9 headers.
- **DEP-3** `dependabot.yml`: weekly, grouped minor/patch. Major bumps of rows with a watch item in stack.md go through a freshness run first.
