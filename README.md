# Devkit

A knowledge base for Claude Code: agents, global rules, skills and a frontend rulebook, kept in one repository so they can be shared and improved. Nothing here installs itself; take the files you need.

## What is inside

| Path | What it is |
|---|---|
| `agents/` | Six agents: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Model and effort live in each file's frontmatter. |
| `rules/flow.md` | Global rules for every session: roles, chains by task size, Fable triggers, review loops, hygiene. Meant for a global `CLAUDE.md`. |
| `frontend/` | The frontend rulebook: Next.js or Vite + React 19, CSS Modules with tiered tokens, TanStack, zustand, zod, Base UI. Every rule has a stable ID and a bracket naming the tool that enforces it. |
| `skills/new-project/` | Scaffolds a frontend project from the rulebook: interview, freshness check, official CLI, templates, rendered `AGENTS.md`, verification. |
| `hooks/` | A `PreToolUse` hook that runs the project's Biome check before `git push` and denies the push when it fails. |

## How to use

- **Agents:** copy the files you want from `agents/` into `~/.claude/agents/` or a project's `.claude/agents/`.
- **Flow rules:** paste `rules/flow.md`, or the parts you agree with, into your `CLAUDE.md`.
- **new-project:** copy `skills/new-project/` together with `frontend/`; the skill reads the rulebook from `../../frontend`. It relies on Matt Pocock's `grill-with-docs`, `domain-modeling` and `research` skills.

## Credits

The agents, the flow rules, the frontend rulebook and the `new-project` skill with its templates are Vlad's, with the parts that depended on his hub repository removed. Additions: the "Skills that spawn subagents" section at the end of `rules/flow.md`, and `new-project` running its interview, ADRs and freshness check through Matt Pocock's skills.

MIT.
