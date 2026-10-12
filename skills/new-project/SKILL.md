---
name: new-project
description: "Start a new frontend project (Next.js or Vite + React, CSS Modules, tiered tokens) from the devkit frontend rulebook. Interviews, checks current versions on the web, scaffolds from templates, verifies with `pnpm check` and Playwright."
disable-model-invocation: true
---

# new-project

Creates a frontend project that follows the devkit frontend rulebook. Instructions are English; every question to the user is asked in the user's language.

## Paths

- `<skill>` is the folder of this file. `<rulebook>` is `<skill>/../../frontend`. Resolve both through symlinks: `readlink -f` on this file, or `${CLAUDE_PLUGIN_ROOT}/frontend` when installed as a plugin.
- `<scratchpad>` is the session scratchpad directory.

Roles follow the devkit flow: `implementer` scaffolds, `checker` verifies, `critic` reviews, `context` runs the freshness check, `fable` reviews auth and money parts. The main session interviews, reconciles and confirms.

## Arguments

- `--answers <file>`: pre-filled answers (shape: `<skill>/references/answers.example.json`); the interview only asks what is missing.
- `--target <dir>`: project directory instead of the default path.
- `--dry-run`: no questions, no git commit, no rulebook edits, freshness is report-only, and every step runs directly in the executing session. Requires `--answers` and `--target` (a scratchpad directory).

## Scope

In scope: the rows of the matrix in `<rulebook>/project-types.md` (marketing, landing + product, admin, client SPA, Telegram Mini App, PWA and store-shell add-ons). Backend services and React Native/Expo are out of scope: say so and stop. A combination outside the matrix: stop and propose `fable` as planner.

## Steps

### 0. [main] Load

Read `<rulebook>/README.md` (principles, `Rulebook revision`), `<rulebook>/project-types.md` (matrix + interview) and `<rulebook>/stack.md` (versions, watch items).

### 1. [main] Interview

- Ask the questions from `project-types.md` with AskUserQuestion, at most 3 per round, in the user's language; skip anything derivable from earlier answers or `--answers`.
- Derive the type, structure variant (A/B/C), auth pattern and default deploy from the matrix.
- Path: `<parent>/<name>`; the parent defaults to `~/Projects`. The path must be absent or empty.
- Port: the first port in 3200–3999 with no listener (`lsof -nP -iTCP:<port> -sTCP:LISTEN` prints nothing) and not recorded in another project's `docs/README.md` under the same parent (`grep -l "Port: <port>" <parent>/*/docs/README.md`).
- Draft the decision record at `<scratchpad>/new-project/<name>/decision.md` from `references/decision-record.md` and the answers JSON next to it.
- Money or auth in scope: plan a `fable` critic for those parts (step 7).

### 2. [context] Freshness check

Follow `references/freshness.md`: `npm view` for every applicable stack row, Node LTS, WebSearch/WebFetch of release notes since each `Verified` date, CLI flags, all watch items. Output: `package | rulebook | latest | change | source | date` plus contradictions with proposed edits by rule ID. No web access: continue only with the user's consent and record "not verified".

### 3. [main] Reconcile

For every contradiction ask the user: (a) update the rulebook now (`implementer`: rule text, `stack.md`, `freshness-log.md`, revision bump; templates and a re-run of the dry run if a template changes; devkit commit only on command), (b) keep the rulebook with the reason in the ADR, (c) adopt for this project only, recorded in the ADR. Never diverge silently. With no contradictions, still refresh the `Verified` dates and append a log entry (not in dry-run mode).

### 4. [main] Confirmation summary

Show: name, path, type; stack with exact versions; structure variant and layers; auth pattern; locales; deploy; port; add-ons; generated files; build-script approvals needed; what will not happen (no commit, push, remote or deploy). Wait for an explicit yes.

### 5. [implementer] Scaffold

- Vite types: `references/scaffold-vite.md`. Next types: `references/scaffold-next.md`.
- Both use the official CLI non-interactively, then `node <skill>/references/render.mjs --answers <answers> --target <path>` to overlay `references/templates/{common,vite|next,tma}` with the placeholders filled, then the decided `pnpm add` set with versions from step 2 (TypeScript on the `~6.0` line while stack.md W-1 stands).
- pnpm build approvals per TOOL-1: detect the running major with `pnpm --version` inside the project; 12+ uses `pnpm approve <pkg>` (`allowBuilds`), 10/11 uses `onlyBuiltDependencies`; never approve all.
- Generated, not templated: the golden slice (mock-backed, named after the domain), translations of non-default locales, tokens from Figma variables when given, `AGENTS.md` per `references/agents-md-outline.md`, `CLAUDE.md` (`@AGENTS.md`), `README.md`, `docs/architecture.md`, `docs/decisions/0001-stack.md`.
- `docs/README.md` records `Port: <port>`, the deploy target and a one-paragraph description (SPA-3).
- `git init -b main`, no commit. Add `CLAUDE.local.md` to `$(git -C <path> rev-parse --git-path info/exclude)`.

### 6. [checker] Verify

- `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test:e2e`.
- Dev server on the port: start `pnpm dev` in the background, open `http://127.0.0.1:<port>/` with Playwright, check one `h1`, no console errors, `data-theme` set on `<html>`, save a screenshot to `<scratchpad>/new-project/<name>/`, then stop the server (`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`).
- Negative probes, each must fail with the right ID, then revert: `<span>x</span>` in a page → `R-native-elements`; `// note` → `R-comments`; `color: #fff` in a component module → `R-raw-values`; `className={cx(a, b)}` in a feature → `R-classname`; `composes` from a feature module → `R-composes-source`; a sibling-slice import → `no-sibling-slices`.
- `grep -r mock-transport dist` is empty after `pnpm build` (vite); (next) the root layout is static in the build output.
- `AGENTS.md` contains every in-scope rule ID and is at most 300 lines.

### 7. [critic] Review

Review the scaffold against the rulebook. `fable` as critic for auth and money parts when flagged in step 1.

### 8. [main] Initial commit only on the user's command

When the user says so, `implementer` stages explicit paths (never `git add -A` or `git add .`) and commits "Scaffold <name>" with no attribution. Remote and push only on a separate explicit command.

### 9. [main] Hand-off

Path, port, commands (`pnpm dev`, `pnpm check`, `pnpm test:e2e`), `cd <path> && claude`, and open items: `TODO(api)` endpoints, tokens to replace, deploy secrets, pending approvals, pending Fable review, "not verified" freshness if any.

## Files

- `references/freshness.md`: commands, output table, reconcile procedure.
- `references/scaffold-vite.md`, `references/scaffold-next.md`: exact scaffold steps per framework.
- `references/agents-md-outline.md`: sections of the generated `AGENTS.md` with source files, rule IDs and the scope filter.
- `references/decision-record.md`: ADR template.
- `references/answers.example.json`: answers for the admin dry run.
- `references/render.mjs`: template renderer.
- `references/templates/`: `common/`, `vite/`, `tma/`, `next/`.
