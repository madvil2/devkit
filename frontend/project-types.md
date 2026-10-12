# Project types and interview

Applies to: all

The single source for type selection. The `new-project` skill reads this file.

## Decision matrix

Styling is CSS Modules + tiered tokens in every row.

| Type | Stack | Structure | Rendering | Auth | Default deploy |
|---|---|---|---|---|---|
| Marketing / SEO landing | Next (App Router) | C | SSG; `output: 'export'` if no server features | none | dokku Docker, or static if export |
| Landing + product | Next | B (+ `widgets/landing-*`) | RSC marketing + client islands | AUTH-1 BFF | dokku Docker standalone |
| Admin / back-office | Vite + React + TanStack Router/Query/Table | A | CSR | AUTH-4 | static nginx behind auth |
| Client SPA, no public SEO | Vite | A | CSR | AUTH-4 | static |
| Client app with public SEO pages | becomes "Landing + product" | | | | |
| Telegram Mini App | Vite + Telegram port | A (rem pin, tenant tokens) | CSR + boot loader | AUTH-5 | static HTTPS |
| PWA (add-on to Vite types) | + vite-plugin-pwa | — | — | — | — |
| Mobile store shell (add-on) | Vite SPA + Capacitor | — | — | — | web part scaffolded only |

Structure variants are defined in [structure.md](structure.md) (STR-1).

Out of scope: backend, React Native/Expo. The skill says so and stops.

## Interview

Ask in the user's language, at most 3 questions per round, skip derivable ones, use AskUserQuestion when available.

1. What is it, in one sentence, and the name/slug?
2. Must public pages rank in search or render link previews? (yes → Next)
3. Is there a logged-in part, and who issues auth?
4. Where does it run: browser, Telegram, installed (PWA/store)?
5. Backend: exists (URL, OpenAPI?), not yet (mock + `TODO(api)`), or none?
6. Locales, default locale, and whether copy is edited remotely.
7. White-label / multi-tenant?
8. Money or payments? Realtime?
9. Design source: Figma link or brand tokens?
10. Deploy target and domain; parent folder.

Skip logic:
- Answer 4 = Telegram → type is Telegram Mini App; skip 2.
- Answer 2 = no and no logged-in part → ask whether it is a marketing page before choosing between marketing and client SPA.
- Answer 2 = yes with a logged-in part → Landing + product; skip the SPA add-ons.
- Answer 5 = none → skip auth details in 3 unless an external provider issues auth.
- Answer 6 = remote copy → enable `(i18n-remote)`; answer 7 = yes → enable `(multi-tenant)`; answer 8 = money → enable `(money)`.
- Ask for the parent folder once; default `~/Projects`.

Rules:
- Money or auth → a Fable critic on those parts of the scaffold.
- A combination outside the matrix → stop and propose a Fable planner.
- The project path is `<parent folder>/<name>`.
