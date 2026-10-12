# Auth and security

Applies to: all (rules marked by type)

Changes to this file need a Fable critic review.

- **AUTH-1** (next) BFF:
  - `/api/<prefix>/*` proxies with the Bearer token from an httpOnly + Secure + `SameSite=Lax` cookie;
  - on 401 it rotates the refresh token once and retries; concurrent refreshes share one in-flight rotation;
  - an invalid refresh clears the cookies;
  - upstream URL and secrets are server-only env (`env.server.ts`);
  - only allowlisted path prefixes are forwarded; hop-by-hop and `cookie` headers are not passed upstream.
- **AUTH-2** (next) `src/proxy.ts` (Next 16 name for middleware; Node runtime only) only guards, redirects and handles locale. Authorization is enforced again where data is read. The `next` redirect param must be a same-origin relative path: starts with `/`, not `//` or `/\`, parsed against the own origin.
- **AUTH-3** CSRF on cookie-auth mutations: `SameSite` plus an `Origin` (fallback `Referer`) check against the own host in the BFF for every non-GET request, or a token.
- **AUTH-4** (vite) Backend-set httpOnly session cookie (`credentials: 'include'`) preferred. Otherwise the access token stays in memory and refresh goes through an httpOnly cookie endpoint. Never web storage.
- **AUTH-5** (tma) Raw `initData` goes to the backend for validation. Never authorize on `initDataUnsafe`. The session lives in memory.
- **AUTH-6** Logout clears the query cache, stores and cookies.
- **AUTH-7** No secrets in `NEXT_PUBLIC_*`/`VITE_*` or in Dockerfile `ARG` defaults.
- **AUTH-8** (next) Security headers in `next.config.ts` `headers()`:
  - `Content-Security-Policy` with `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors` (`'none'`, or the Telegram web hosts for TMA embeds);
  - `script-src`: static pages need inline scripts for Next's flight data and the pre-paint theme script, so a hash list alone does not cover them; use `'self' 'unsafe-inline'` on static routes, or a per-request nonce set in `src/proxy.ts`, which makes those routes dynamic. Decide per project in the ADR (stack.md open unknowns);
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` in production.
- **AUTH-9** (vite) Static hosts set the same headers in the server config (`nginx.conf`); the pre-paint script in `index.html` is allowed by its `sha256` hash.
