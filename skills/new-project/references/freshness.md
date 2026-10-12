# Freshness check

Run by `context` in step 2. The goal: the stack the skill is about to install matches what is current today, and every difference from the rulebook is surfaced to the user. Never diverge from `<rulebook>/stack.md` silently.

Inputs: the chosen project type, add-ons, and `<rulebook>/stack.md` (versions table + watch items `W-*`, each with a `Verified` date).

## 1. Versions

For each stack row that applies to the type, run:

```sh
npm view <pkg> version time.modified dist-tags peerDependencies engines --json
```

Package sets per type (add the type's rows only):

| Set | Packages |
|---|---|
| all | `react`, `react-dom`, `typescript`, `@biomejs/biome`, `dependency-cruiser`, `oxc-parser`, `postcss`, `postcss-custom-media`, `@csstools/postcss-global-data`, `@tanstack/react-query`, `zustand`, `zod`, `@base-ui/react`, `lucide-react`, `vitest`, `@testing-library/react`, `happy-dom`, `@playwright/test`, `@axe-core/playwright`, `pnpm` |
| vite | `create-vite`, `vite`, `@vitejs/plugin-react`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler` |
| next | `create-next-app`, `next`, `babel-plugin-react-compiler`, `server-only` |
| admin | `@tanstack/react-table`, `react-hook-form`, `@hookform/resolvers` |
| forms (spa, tma, landing-product) | `react-hook-form`, `@hookform/resolvers` |
| tma | `@types/telegram-web-app`, `@tma.js/sdk-react` (watch only) |
| pwa | `vite-plugin-pwa` |

Node LTS:

```sh
curl -s https://nodejs.org/dist/index.json | node -e 'const r=JSON.parse(require("fs").readFileSync(0,"utf8")).filter(x=>x.lts);console.log(r[0].version,r[0].lts)'
```

Local toolchain: `node --version`, `pnpm --version`, `corepack --version`.

## 2. Breaking changes since `Verified`

For every row whose major or minor moved since its `Verified` date, and for every watch item:

- WebSearch `<package> <new version> release notes` / `breaking changes`, then WebFetch the official changelog or GitHub release page.
- Record only facts with a URL. Mark inferences as inferred.

## 3. CLI flags

Re-verify the non-interactive scaffold commands (they change between majors):

```sh
pnpm dlx create-vite@latest --help
pnpm dlx create-next-app@latest --help
```

Verified on 2026-10-11 (stack.md W-15, W-16):

- `create-vite <dir> --template react-ts --no-interactive --no-immediate`
- `create-next-app <dir> --ts --no-tailwind --biome --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --no-agent-feedback --no-react-compiler --yes`

## 4. Watch items to re-check every run

- W-1 TypeScript: does `dependency-cruiser` support the latest TS major (`depcruise --info`)? If not, stay on the `~6.0` line. TOOL-8 makes a silent empty graph fail.
- W-4 React Compiler wiring in `@vitejs/plugin-react` and Next.
- W-6/W-7 PostCSS global-data + custom-media + `composes` from `@/…` in the current Vite and Next.
- W-10 pnpm build approvals (major 12+: `allowBuilds` via `pnpm approve`; major 10: `onlyBuiltDependencies`).
- W-12 Vitest major changes; W-13 TanStack Table API; W-14 Base UI state attribute names; W-15/W-16 CLI defaults; W-17 oxc-parser AST; W-18 vite-plugin-pwa.

A watch item that can only be settled by an experiment: run it in `<scratchpad>/freshness/<item>/` (never in the devkit repository or the user's projects).

## 5. Output

Return one table and one list to the main session:

| package | rulebook | latest | change | source | date |
|---|---|---|---|---|---|

- `change`: `same`, `patch`, `minor`, `major`, `new`, `deprecated`, `renamed`.
- Contradictions: each with the affected rule IDs, the evidence URL, and a proposed rulebook edit (exact replacement text).

## 6. Reconcile (main session, step 3)

Ask the user per contradiction, in the user's language:

- (a) update the rulebook now: `implementer` edits the rule text, the `stack.md` row, appends a `freshness-log.md` entry and bumps `Rulebook revision` in `<rulebook>/README.md` (order per README). If a template is affected, edit the template and re-run the dry run. Devkit commit only on the user's command.
- (b) keep the rulebook; the reason goes into the project ADR (`docs/decisions/0001-stack.md`).
- (c) adopt for this project only; recorded in the ADR.

With no contradictions, still refresh the `Verified` dates in `stack.md` and append a log entry (outside dry-run mode).

## 7. No web access

Stop and ask the user. Continue only with explicit consent, write "not verified" in the ADR and in the hand-off, and keep the versions from `stack.md`.

## 8. Dry-run mode

Report only: produce the table and the list, change nothing in the rulebook.
