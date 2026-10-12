---
name: new-project
description: "Scaffold a new frontend project (Next.js or Vite + React, CSS Modules, tiered tokens) from the devkit frontend rulebook: interview, freshness check, scaffold, tooling, kit, rendered AGENTS.md, green `pnpm check` and smoke test."
disable-model-invocation: true
---

You create a new frontend project that follows the devkit frontend rulebook from day one.

## Locate the rulebook

The rulebook is the `frontend/` folder of the devkit repository, two levels above this skill file. Resolve it through symlinks:

```bash
DEVKIT="$(cd "$(dirname "$(readlink -f "<path to this SKILL.md>")")/../.." && pwd)"
ls "$DEVKIT/frontend"
```

When installed as a plugin, `${CLAUDE_PLUGIN_ROOT}/frontend` is the same folder.

Read `frontend/README.md`, `frontend/project-types.md` and `frontend/stack.md` first. Read the other files when their scope applies.

## Steps

1. **Interview** per `project-types.md`: in the user's language, at most 3 questions per round, skip derivable answers, use AskUserQuestion when available. Pick the type and add-ons from the decision matrix. A combination outside the matrix → stop and propose `fable` as planner. Backend or React Native → out of scope, say so and stop.

2. **Freshness check** against `stack.md`. For every row, compare the ledger line with `npm view <pkg> version` (and the release notes linked in the row for watch items). Report differences by rule ID. For each difference, ask whether to update the rulebook (rule text → `stack.md` row → `freshness-log.md` entry → bump `Rulebook revision`) or to scaffold with the ledger line as is. Never change the rulebook silently.

3. **Scaffold** from the official CLI (`create-next-app` or `create-vite`, non-interactive, see `stack.md` W-15 and W-16), in the parent folder the user named (default `~/Projects`). Then bring the output up to the rulebook: replace pinned versions with the `stack.md` lines, remove oxlint or ESLint, install the stack for the chosen type with `pnpm add`, and remove any `AGENTS.md` the CLI wrote.

4. **Tooling** per `tooling.md`, `styling.md` and `tokens.md`: `tsconfig` flags (TOOL-2), `biome.json` (TOOL-3), `.dependency-cruiser.cjs` with the catalogue rules (TOOL-4), `scripts/check-rules.mjs` with every check in the catalogue and its allowlist config (TOOL-5), `postcss.config.mjs` (TOOL-7), the `check` script family (TOOL-6), token tier files (TOK-1 to TOK-3), `global.css` and the shared recipes (STY-4, STY-7), the pre-paint theme script (TOK-6). If `$DEVKIT/templates/` contains a file for the target, copy it instead of writing it.

5. **Kit and shell** per `ui-kit.md`, `api.md`, `config.md`, `data.md`, `i18n.md` and the type file (`next.md`, `vite-spa.md`, `tma.md`): the kit components listed in KIT-2 for the type, `shared/api` (client, transport, endpoints, errors, mocks), `shared/config/env.ts`, `shared/lib/storage`, i18n dictionaries, the QueryClient provider, one example route per layer that exercises the kit.

6. **Render `AGENTS.md`**: every in-scope rule, verbatim with its ID, grouped by file as in the rulebook, preceded by the `Rulebook revision` line. Drop rules whose scope suffix does not apply. Write `CLAUDE.md` containing only `@AGENTS.md` (WF-6). Add `CLAUDE.local.md` to `$(git rev-parse --git-path info/exclude)`.

7. **Verify**: `pnpm check` green; Playwright smoke per TST-3 on the production build with `API_MODE=mock`; grep the build output for mock markers (API-4). `ci.yml` per CI-1. Fix until green.

8. **Register**: `docs/README.md` with the dev port (SPA-3), the deploy target and the project's one-paragraph description. Initial commit per WF-4.

9. Money or auth in scope → run `fable` as critic on those parts of the scaffold before the first commit (project-types.md rules).

## Templates

After the first successful scaffold, copy the generated `scripts/check-rules.mjs`, `.dependency-cruiser.cjs`, `biome.json`, `postcss.config.mjs` and the token tier files into `$DEVKIT/templates/<type>/` so later runs copy instead of regenerate. Tell the user when you do.
