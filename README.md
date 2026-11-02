# Devkit

A knowledge base for Claude Code: agents, global rules, skills and a frontend rulebook, kept in one repository so they can be shared and improved. One command from a clone sets up Claude Code with all of it, or take only the files you need.

## What is inside

| Path | What it is |
|---|---|
| `agents/` | Six agents: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Model, effort and the removed tools (edit tools for the read-only roles, `Agent` for the roles that must not launch subagents) live in each file's frontmatter. |
| `global/CLAUDE.md` | The global `CLAUDE.md`: rules for every session, covering roles, chains by task size, Fable triggers, review loops, skill use, hygiene. |
| `frontend/` | The frontend rulebook: Next.js or Vite + React 19, CSS Modules with tiered tokens, TanStack, zustand, zod, Base UI. Every rule has a stable ID and a bracket naming the tool that enforces it. |
| `skills/new-project/` | Scaffolds a frontend project from the rulebook: interview, freshness check, official CLI, templates, rendered `AGENTS.md`, verification. |
| `skills/<others>` | Matt Pocock's skills, vendored unchanged from [mattpocock/skills](https://github.com/mattpocock/skills), and Jakub Krehel's `make-interfaces-feel-better` from [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better). The lists and the upstream commits live in `vendor.json`. |
| `hooks/` | A `PreToolUse` hook that runs the project's Biome check before `git push` and denies the push when it fails. `install.mjs` links the script and adds the settings hook. |
| `scripts/install.mjs` | The installer: links agents, scripts, the hook and skills into `~/.claude`, imports `global/CLAUDE.md`, merges the settings template and installs the plugins. See Install. |
| `install/` | The installer's data: `settings.json` (the settings template), `bypass-permissions.json` (added only with `--bypass-permissions`) and `plugins.json` (marketplaces, core and optional plugins). |
| `scripts/statusline.sh` | A two-line status line: folder, git branch, model and effort, then context and rate-limit bars and the session's diff size. Needs jq and git. |
| `scripts/bounded.mjs` | A time limit for waited commands where `timeout` and `gtimeout` are missing (stock macOS): it runs the command in its own process group, stops the whole group on timeout and exits 124. The flow rules call it as `~/.claude/scripts/bounded.mjs`. |
| `plugins/` | Three third-party Claude Code plugins, vendored unchanged from Millon15/cc-millz: security-audit, toolsmith, codex-delegation. Listed in the devkit marketplace; install the ones you want. |

## Install

Needs Node 20 or later, macOS or Linux, and jq (the status line and the Biome hook use it). From a clone:

```bash
git clone https://github.com/madvil2/devkit.git
cd devkit
node scripts/install.mjs --dry-run
node scripts/install.mjs
```

Keep the clone where it is: everything is linked from it, so `git pull` updates every session. Run the installer again after a pull that adds agents or skills; a run with nothing to do changes nothing.

Flags:

- `--dry-run` prints what would happen, prefixed `would`, and writes nothing.
- `--replace` moves anything in the way into a backup and links the devkit file in its place. Without it, such files are reported as conflicts and left alone.
- `--optional` also installs the optional plugins.
- `--bypass-permissions` also turns off the two permission-mode prompts and sets `permissions.defaultMode` to `bypassPermissions`, but only when no mode is set: your values win, so an existing `permissions.defaultMode` is kept.

The installer always sets up `~/.claude` and warns when `CLAUDE_CONFIG_DIR` points elsewhere. The `DEVKIT_CLAUDE` environment variable points it at another `claude` binary (the default is `claude` on `PATH`); its tests use this for a fake CLI, and `node --test scripts/test/install.test.mjs` runs them.

What it does:

1. **Links.** Every `agents/*.md`, `scripts/bounded.mjs`, `scripts/statusline.sh`, `hooks/biome-push-check.sh` and every skill folder in `skills/` is symlinked to the same path under `~/.claude`, so skills load under their bare names (`tdd`, not `devkit:tdd`). A folder under `~/.claude` that is itself a symlink to the matching clone folder counts as in place. One that is a symlink outside `~/.claude` (for example `~/.claude/skills` pointing to `~/.agents/skills`) is a conflict even with `--replace`: replace it with a real directory first. Nothing is ever written inside the clone.
2. **CLAUDE.md.** Adds `@<clone>/global/CLAUDE.md` to `~/.claude/CLAUDE.md`, creating the file if needed and keeping everything already there. A line importing another `global/CLAUDE.md` is a conflict.
3. **Settings.** Merges `install/settings.json` into `~/.claude/settings.json`: attribution off, model, status line, the Biome hook and a few UI preferences. Your values win: a key you already set is kept and listed as `kept`, only missing keys are added, arrays get the missing items, and a hook whose command is already there is not added twice. An invalid `settings.json` is left untouched and the run fails.
4. **Plugins.** Adds the marketplaces the plugins need and installs, at user scope, the plugins not yet installed at user scope from any marketplace. A plugin installed but disabled gets a `claude plugin enable` hint instead of a reinstall. It never uninstalls anything. Without the `claude` CLI it prints the commands to run yourself.

Anything the installer replaces or rewrites (a conflicting file, `CLAUDE.md`, `settings.json`) is copied first to `~/.claude/devkit-backups/<timestamp>/`. Exit codes: 0 when everything is in place (kept settings and a missing `claude` CLI do not count), 1 when a conflict is left or a step failed, 2 for an unknown flag.

Then restart Claude Code.

### Plugins

Core, installed by default:

```bash
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install github@claude-plugins-official
claude plugin install linear@claude-plugins-official
claude plugin install playwright@claude-plugins-official
```

Optional, installed with `--optional`:

```bash
claude plugin marketplace add Millon15/cc-millz
claude plugin install peer-chat@cc-millz
claude plugin marketplace add madvil2/autopilot-jobsearch
claude plugin install autopilot-jobsearch@autopilot-jobsearch
```

The github plugin needs `GITHUB_PERSONAL_ACCESS_TOKEN` in the environment Claude Code starts from. Authorize linear once with `/mcp` inside Claude Code.

A plugin you develop locally comes from a directory marketplace, which you add by hand: `claude plugin marketplace add <path to its repository>`, then `claude plugin install <name>@<marketplace>`.

Devkit's own marketplace lists only its vendored plugins (below): run `claude plugin marketplace add madvil2/devkit`, then `claude plugin install <name>@devkit` for each plugin you want, or try one with `claude --plugin-dir plugins/<name>`. The plugins' own READMEs say `@cc-millz`; from devkit use `@devkit`. Install a plugin from one marketplace only: devkit's copy is pinned and audited, while cc-millz tracks upstream HEAD. To take a devkit update, run `claude plugin marketplace update devkit`, then `claude plugin update <name>@devkit`. If a vendored plugin changed without a version bump (the sync warns and its pull request says so), reinstall it with `claude plugin uninstall <name>@devkit` and then `claude plugin install <name>@devkit`. Devkit itself is no longer a plugin: if you installed `devkit@devkit`, run `claude plugin uninstall devkit@devkit`, or its skills load a second time as `devkit:*`.

### Moving from the skills CLI

If you installed skills with the skills CLI, run `node scripts/install.mjs --dry-run` first. Expect conflicts for skills linked into `~/.agents/skills` and for a copied `~/.claude/hooks/biome-push-check.sh`; rerun with `--replace` to swap them for devkit links (the originals go to the backup folder). If `~/.claude/skills` itself is a symlink to `~/.agents/skills`, remove just that symlink (`rm ~/.claude/skills`, no trailing slash) and rerun. Then link back each skill you still want that devkit does not ship, for example `ln -s ~/.agents/skills/<name> ~/.claude/skills/<name>`. Leave `~/.agents` alone: other agents read it. After any later skills CLI run that targets claude-code, run `node scripts/install.mjs --replace` again.

### Optional, by hand

Terminal status hooks (iTerm2 or agterm tab status on prompts, permission requests and stops) are machine-specific and not installed. Add them to the `hooks` section of `~/.claude/settings.json` yourself if you use them.

### Taking single pieces

- **Agents:** copy the files you want from `agents/` into `~/.claude/agents/` or a project's `.claude/agents/`.
- **Flow rules:** import `global/CLAUDE.md` from your `~/.claude/CLAUDE.md` with a line like `@~/Projects/devkit/global/CLAUDE.md` (adjust the path to your clone), or paste the parts you agree with into your `CLAUDE.md`.
- **Time limit:** the flow rules call `~/.claude/scripts/bounded.mjs` where `timeout` and `gtimeout` are missing; `node --test scripts/test/bounded.test.mjs` checks it.
- **new-project:** copy `skills/new-project/` together with `frontend/`; the skill reads the rulebook from `../../frontend`. It relies on Matt Pocock's `grill-with-docs`, `domain-modeling` and `research` skills.

## Vendored skills and plugins

Vendored: `grill-with-docs`, `grilling`, `domain-modeling`, `research` (used by `new-project`), `to-spec`, `to-tickets`, `implement-spec`, `implement` (spec to code), `tdd`, `codebase-design`, `code-review` (their dependencies), `setup-matt-pocock-skills` (configures the issue tracker the others need), `writing-for-agents`, `prototype`, `pr`, `handoff`, `retro`, and `ask-matt`, `diagnosing-bugs`, `grill-me`, `improve-codebase-architecture`, `teach`, `to-questionnaire`, `triage`, `wait-what`, `wayfinder`, `wizard`, all from Matt Pocock; `make-interfaces-feel-better` from Jakub Krehel.

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

The agents, the flow rules, the frontend rulebook and the `new-project` skill with its templates are Vlad's, with the parts that depended on his hub repository removed. Additions: the "Skills and plugins" section at the end of `global/CLAUDE.md`, and `new-project` running its interview, ADRs and freshness check through Matt Pocock's skills.

The vendored skills are Matt Pocock's, MIT, license in `skills/LICENSE-mattpocock-skills`, except `make-interfaces-feel-better`, which is Jakub Krehel's, MIT, license in `skills/LICENSE-make-interfaces-feel-better`.

The vendored plugins are Vitautas Brazas's (Millon15), MIT, license in `plugins/LICENSE-cc-millz`.

`scripts/bounded.mjs` and its test come from [devhub](https://github.com/sambet1997/devhub), MIT, license in `scripts/LICENSE-devhub`; the test's helper server binds to 127.0.0.1 here.

MIT.
