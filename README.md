# Devkit

A development flow for Claude Code that can be shared and improved in one place: role agents with bounded review loops, a frontend rulebook with stable rule IDs enforced by tools, a `new-project` skill that scaffolds from the rulebook, and a Biome pre-push gate.

## What is inside

| Path | What it is |
|---|---|
| `agents/` | Five agent definitions: `implementer`, `checker`, `critic`, `context`, `fable`. Model and effort live in each file's frontmatter. |
| `rules/flow.md` | The flow rules for the main session: task sizes, chains, Fable triggers, review loop limits, how skills that spawn subagents map onto the roles, hygiene. Imported into the global `~/.claude/CLAUDE.md`. |
| `frontend/` | The frontend rulebook: Next.js or Vite + React 19, CSS Modules with tiered tokens, TanStack, zustand, zod, Base UI. About 200 rules with stable IDs, each either enforced by a tool or marked review-only. Includes the stack ledger with verified dates and watch items. |
| `skills/new-project/` | Interviews, checks the ledger for freshness, scaffolds from the official CLIs, generates tooling and kit, renders a self-contained `AGENTS.md`, verifies with `pnpm check` and a Playwright smoke test. |
| `hooks/` | A `PreToolUse` hook that runs the project's Biome check before `git push` and denies the push when it fails. |
| `scripts/install.sh` | Symlink install for local development of the kit itself. |

## How the flow works

- Small tasks are done in the main session and then passed to `checker`.
- Regular tasks run `implementer → checker → critic`. Findings go back to the same implementer. The checker gets two rounds, the critic two returns, then `fable` reviews once; if it still does not converge, the run stops and the user gets a summary.
- `fable` is called only on triggers: cross-module architecture, an unfound root cause, auth, money, migrations, concurrency, public API contracts, non-converging reviews, or an explicit request. `context` assembles a context pack first so Fable reads code only to fill gaps.
- Skills that say "implementer subagent" (for example `/implement-spec`) use the `implementer` agent; "exploration subagent" means `context`.

Details: [rules/flow.md](rules/flow.md).

## Frontend rulebook

Start at [frontend/README.md](frontend/README.md). Every rule has an ID like `CMP-4` or `STY-6` and a bracket saying what enforces it (`[biome: …]`, `[arch: …]`, `[rules: R-…]`, `[ts: …]`, `[ci]`, `[e2e]`); no bracket means review. `frontend/stack.md` records every package line with the date it was verified and the source, plus watch items for things that are known to move. Changing the rulebook follows the order in its README: rule text, ledger row, freshness log entry, revision bump.

The `new-project` skill does not yet ship generated templates (`check-rules.mjs`, `.dependency-cruiser.cjs`, token files). It generates them from the catalogues on the first run and asks to copy them into `templates/<type>/` for reuse.

## Install

As a plugin:

```bash
claude plugin marketplace add madvil2/devkit
claude plugin install devkit@devkit
```

Then import the flow rules into your global `~/.claude/CLAUDE.md` by adding one line pointing at the plugin's `rules/flow.md`, or paste the file in.

For working on the kit itself, clone and link:

```bash
git clone https://github.com/madvil2/devkit ~/Projects/devkit
~/Projects/devkit/scripts/install.sh
```

The script symlinks `agents/` and `skills/` into `~/.claude` (and `~/.agents/skills` when that exists, for Codex parity) and appends an `@…/rules/flow.md` import to `~/.claude/CLAUDE.md`. Edits in the repo are live immediately.

## Improving it

- Agent files are the system prompts; keep them short and in English.
- A new rule gets the next free ID in its file and is never renumbered. If a tool can enforce it, add the bracket and the check.
- Rules should come from real review findings. The table at the bottom of `frontend/README.md` maps past weak spots to the rules that close them; extend it.
- Open a pull request or an issue.

## Credits

The frontend rulebook was written by Vlad and is adapted here with the hub-specific parts removed. The flow is a trimmed version of his, without the mandatory planner and the hub.

MIT.
