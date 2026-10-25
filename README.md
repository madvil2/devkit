# Devkit

A knowledge base for Claude Code: agents, global rules, skills and a frontend rulebook, kept in one repository so they can be shared and improved. Nothing here installs itself; take the files you need.

## What is inside

| Path | What it is |
|---|---|
| `agents/` | Six agents: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Model and effort live in each file's frontmatter. |
| `global/CLAUDE.md` | The global `CLAUDE.md`: rules for every session, covering roles, chains by task size, Fable triggers, review loops, hygiene. |
| `frontend/` | The frontend rulebook: Next.js or Vite + React 19, CSS Modules with tiered tokens, TanStack, zustand, zod, Base UI. Every rule has a stable ID and a bracket naming the tool that enforces it. |
| `skills/new-project/` | Scaffolds a frontend project from the rulebook: interview, freshness check, official CLI, templates, rendered `AGENTS.md`, verification. |
| `skills/<others>` | Matt Pocock's skills this flow relies on, vendored unchanged from [mattpocock/skills](https://github.com/mattpocock/skills). The list and the upstream commit live in `vendor.json`. |
| `hooks/` | A `PreToolUse` hook that runs the project's Biome check before `git push` and denies the push when it fails. |
| `plugins/` | Three third-party Claude Code plugins, vendored unchanged from Millon15/cc-millz: security-audit, toolsmith, codex-delegation. Listed in the devkit marketplace; install the ones you want. |

## How to use

- **Agents:** copy the files you want from `agents/` into `~/.claude/agents/` or a project's `.claude/agents/`.
- **Flow rules:** import `global/CLAUDE.md` from your `~/.claude/CLAUDE.md` with a line like `@~/Projects/devkit/global/CLAUDE.md` (adjust the path to your clone), so edits to the kit reach every session. Or paste the parts you agree with into your `CLAUDE.md`.
- **new-project:** copy `skills/new-project/` together with `frontend/`; the skill reads the rulebook from `../../frontend`. It relies on Matt Pocock's `grill-with-docs`, `domain-modeling` and `research` skills.
- **Plugins:** run `claude plugin marketplace add madvil2/devkit`, then `claude plugin install <name>@devkit` for each plugin you want, or try one with `claude --plugin-dir plugins/<name>`. The plugins' own READMEs say `@cc-millz`; from devkit use `@devkit`. Install a plugin from one marketplace only: devkit's copy is pinned and audited, while cc-millz tracks upstream HEAD. To take a devkit update, run `claude plugin marketplace update devkit`, then `claude plugin update <name>@devkit`. If a vendored plugin changed without a version bump (the sync warns and its pull request says so), reinstall it with `claude plugin uninstall <name>@devkit` and then `claude plugin install <name>@devkit`.

## Vendored skills and plugins

Vendored: `grill-with-docs`, `grilling`, `domain-modeling`, `research` (used by `new-project`), `to-spec`, `to-tickets`, `implement-spec`, `implement` (spec to code), `tdd`, `codebase-design`, `code-review` (their dependencies), `setup-matt-pocock-skills` (configures the issue tracker the others need), and `writing-for-agents`, `prototype`, `pr`, `handoff`, `retro`.

Vendored plugins, each listed in the devkit marketplace and installed only when you ask for it:

| Plugin | Source | What it needs | Caveat from the audit |
|---|---|---|---|
| `security-audit` | Millon15/cc-millz | git, ripgrep; semgrep optional | When run, it clones or downloads the audit target into `$TMPDIR/security-audit/` and writes its reports to `$TMPDIR/security-audits/`. |
| `toolsmith` | Millon15/cc-millz | bash, jq; bun for the skill finder | Its vendor script clones third-party skills without scanning them, its skill finder needs bun, and the finder's `--remote` tier queries skills.sh and GitHub code search. |
| `codex-delegation` | Millon15/cc-millz | the codex CLI and `codex@openai-codex` installed from `openai/codex-plugin-cc` | Needs the codex CLI and `codex@openai-codex` from its own marketplace, runs Codex with `danger-full-access` for GUI checks, and sends delegated work and repository content to OpenAI through Codex. |

If you installed agterm-lanes, merge-kit or skill-eval from devkit, run `claude plugin uninstall <name>@devkit`; agterm-lanes' restore pin survives that, so also run `agtermctl session restore --clear --target <session id>`, adding `--pane-id <pane id>` for a split pane.

Never edit vendored folders; the sync overwrites them. Customize a plugin through its own config files or environment variables. To update everything, run:

```bash
node scripts/sync-vendor.mjs
```

It reads `vendor.json`, fetches only the listed skill and plugin folders of each source, replaces them, copies each upstream license, and records the upstream commit and per-folder hashes. It stops without touching anything when a listed folder is renamed or removed upstream, and warns when a skill starts calling a skill that is not vendored. To add an item, add it to `items` in `vendor.json`; for a new upstream, add a source. The sync never deletes folders: to drop an item, remove it from `items` and `hashes`, `git rm -r` its folder, and for a plugin also remove its `.claude-plugin/marketplace.json` entry and its README rows; no sync run is needed. Drop a source left with no items together with its license file. A GitHub Action runs the sync every Monday and opens one pull request when something changed. **A pull request that changes `plugins/` is merged only after a security audit of the upstream diff**, because those plugins ship hooks and scripts that run on the installing machine. A local sync that fails the post-copy verification leaves `plugins/` or `skills/` modified, and `git checkout -- plugins skills && git clean -fd plugins skills` restores them; in CI the sync step fails before the pull request step runs.

## Credits

The agents, the flow rules, the frontend rulebook and the `new-project` skill with its templates are Vlad's, with the parts that depended on his hub repository removed. Additions: the "Skills that spawn subagents" section at the end of `global/CLAUDE.md`, and `new-project` running its interview, ADRs and freshness check through Matt Pocock's skills.

The vendored skills are Matt Pocock's, MIT, license in `skills/LICENSE-mattpocock-skills`.

The vendored plugins are Vitautas Brazas's (Millon15), MIT, license in `plugins/LICENSE-cc-millz`.

MIT.
