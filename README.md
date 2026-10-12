# Devkit

Agents, global rules, skills and a frontend rulebook for Claude Code, kept in one repository so they can be shared and improved.

## What is inside

| Path | What it is |
|---|---|
| `agents/` | Six agents: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Model and effort live in each file's frontmatter. |
| `rules/flow.md` | Global rules for every session: roles, chains by task size, Fable triggers, review loops, hygiene. Imported into `~/.claude/CLAUDE.md`. |
| `frontend/` | The frontend rulebook: Next.js or Vite + React 19, CSS Modules with tiered tokens, TanStack, zustand, zod, Base UI. Every rule has a stable ID and a bracket naming the tool that enforces it. |
| `skills/new-project/` | Scaffolds a frontend project from the rulebook: interview, freshness check, official CLI, templates, rendered `AGENTS.md`, verification. |
| `hooks/` | A `PreToolUse` hook that runs the project's Biome check before `git push` and denies the push when it fails. |
| `scripts/install.sh` | Symlinks agents and skills into `~/.claude` and imports `rules/flow.md` into the global `CLAUDE.md`. |

## Install

```bash
git clone https://github.com/madvil2/devkit ~/Projects/devkit
~/Projects/devkit/scripts/install.sh
```

Edits in the repository are live immediately through the symlinks.

As a plugin:

```bash
claude plugin marketplace add madvil2/devkit
claude plugin install devkit@devkit
```

The plugin brings the agents, the skill and the hook. Add `rules/flow.md` to your global `~/.claude/CLAUDE.md` yourself.

## Credits

The agents, the flow rules, the frontend rulebook and the `new-project` skill with its templates are Vlad's, with the parts that depended on his hub repository removed. The only addition to his rules is the "Skills that spawn subagents" section at the end of `rules/flow.md`.

MIT.
