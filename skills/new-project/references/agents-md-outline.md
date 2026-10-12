# Generated AGENTS.md outline

The project's `AGENTS.md` is a self-contained render of the devkit frontend rulebook. Project sessions never read the rulebook (WF-6). `CLAUDE.md` holds the single line `@AGENTS.md`.

## Render rules

- Copy rule text verbatim with its ID (`**CMP-3** …`). Keep enforcement tags (`[rules: …]`, `[arch: …]`, `[ts]`, `[ci]`, `[e2e]`).
- Scope filter: include a rule when its scope tag matches the project. Scopes: `all` always; `vite` for admin/spa/tma; `next` for marketing and landing + product; `tma`; `money` when the project handles money; `auth` rules per the chosen pattern (AUTH-1..3, AUTH-8 for next with BFF; AUTH-4, AUTH-9 for vite; AUTH-5 for tma; AUTH-6, AUTH-7 always); `marketing`; `pwa`; `i18n-remote` when copy is edited remotely; `multi-tenant` (TOK-7) when white-label.
- Inside an included rule, drop sub-bullets whose suffix tag is out of scope (for example the `(next)` line of CMP-8 in a Vite project).
- Substitute project paths and names (`<name>`, port, locales, layer list of the variant). Drop references to `stack.md` and other rulebook files; inline the fact instead (for example "TypeScript stays on 6.x: dependency-cruiser does not support 7").
- No Cyrillic outside the TXT-4 data examples. No AI attribution.
- At most 300 lines. Over the cap, shorten "Why" lines first, never drop a rule ID.
- Line 3: `Rulebook revision: <YYYY-MM-DD>` from `<rulebook>/README.md`.

## Sections, in order

| # | Section | Source file | Rule IDs |
|---|---|---|---|
| 1 | Title, one-sentence purpose, `Rulebook revision`, commands (`pnpm dev/check/test:e2e`), port | `README.md`, `tooling.md` (TOOL-6) | — |
| 2 | Principles (5 lines) and definition of done | `README.md`, `workflow.md` | WF-5 |
| 3 | Structure: layer chain of the variant, slices, segments, naming, public API, routes | `structure.md` | STR-1 … STR-10 |
| 4 | Components and view hooks | `components.md` | CMP-1 … CMP-13 |
| 5 | UI kit and a11y | `ui-kit.md` | KIT-1 … KIT-11 |
| 6 | Tokens and theming | `tokens.md` | TOK-1 … TOK-7 |
| 7 | Styling with CSS Modules | `styling.md` | STY-1 … STY-11 |
| 8 | Data: server state, client state, render states | `data.md` | DAT-1 … DAT-9 |
| 9 | API client, endpoints, mocks, errors | `api.md` | API-1 … API-7 |
| 10 | Auth for this project's pattern | `auth.md` | AUTH-1 … AUTH-9 (filtered) |
| 11 | Config, env and storage | `config.md` | CFG-1 … CFG-5 |
| 12 | i18n and typography | `i18n.md` | I18N-1 … I18N-5, TXT-1 … TXT-4 |
| 13 | Forms | `forms.md` | FRM-1 … FRM-5 |
| 14 | Money (only with money) | `money.md` | MNY-1 … MNY-4 |
| 15 | Framework: Vite SPA or Next | `vite-spa.md` or `next.md` | SPA-1 … SPA-6 or NXT-1 … NXT-14 |
| 16 | Telegram Mini App (only tma) | `tma.md` | TMA-1 … TMA-8 |
| 17 | Testing | `testing.md` | TST-1 … TST-6 |
| 18 | Tooling: TypeScript, Biome, PostCSS, dependency-cruiser, check-rules catalogue | `tooling.md` | TOOL-1 … TOOL-8 |
| 19 | CI and deploy | `ci-deploy.md` | CI-1, CI-2, DEP-1 … DEP-3 (DEP-1 next, DEP-2 vite) |
| 20 | Workflow: no comments, docs, commits, local files | `workflow.md` | WF-1 … WF-6 |

Rule IDs added after rev. 1 that must appear when in scope: TOOL-8, STY-11, NXT-13, NXT-14, TST-6, SPA-6, AUTH-9, MNY-4, TXT-4.

## Check-rules and dependency-cruiser tables

Section 18 carries the two catalogue tables from `tooling.md` (check → rule → level → plugin; dependency-cruiser rule → rule ID), so a failing check in the project points to the rule text in the same file. The allowlist is Biome suppression comments: `// biome-ignore lint/plugin/R-<check>: <reason>`, or `biome-ignore-all` for a file; an empty reason fails `biome check`, and a broad category (`lint`, `lint/plugin`, `lint/<group>`) fails `lint:rules`.

## Verification of the render

- Every in-scope rule ID from the source files appears exactly once:

  ```sh
  grep -ohE '\*\*[A-Z0-9]+-[0-9]+\*\*' AGENTS.md | sort | uniq -d
  ```

  is empty, and the set equals the in-scope set.
- `wc -l AGENTS.md` ≤ 300.
