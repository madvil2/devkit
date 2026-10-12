# Development flow

Roles live in the devkit agents: `implementer`, `checker`, `critic`, `context`, `fable`.
Subagents cannot launch subagents. When one needs a lookup it returns the questions; the main session runs them through `context` and sends the answers back with SendMessage.

## Task size

Pure research and answers to questions skip the chain.

- Small (copy, a constant, a one-line fix, one obvious file): do it in the main session, then run `checker`. If the checker doubts the change itself, treat the task as regular.
- Regular (logic, several files, state, API contracts): `implementer` → `checker` → `critic`. Planning is the spec and tickets when they exist (`/to-spec`, `/to-tickets`); otherwise write a short plan in the main session before launching the implementer.
- Bug with an unknown cause: `context` at effort high finds the root cause with evidence. No root cause after one pass → `fable` as investigator. Then the regular chain with `implementer` at effort high.
- When in doubt, treat the task as regular.

## Fable triggers

Call `fable` only on one of these: cross-module or new architecture; a root cause `context` did not find; auth, security, money, data migrations, concurrency or public API contracts; review rounds that did not converge; the user asked for it. `context` builds the context pack first. Fable replaces the planner, the critic or both, as the trigger demands. Effort high; max only for an exceptionally hard problem.

A Fable critic gets the diff, the checker's report and screenshots, and after failed loops a short history: what was tried and what each critic found.

## Review loops

- Findings go back to the same implementer through SendMessage, so it keeps its context.
- implementer ↔ checker: at most 2 rounds. Still not clean → stop and report to the user with the open findings.
- critic: at most 2 returns. A third review is done by `fable` as critic, not by another Opus round.
- fable as critic: one re-review after fixes. Still not accepted → stop and report where it is stuck.
- After every fix the checker runs again before the critic sees the code.
- The main session reports to the user only after the critic accepted (small tasks: after a clean checker).

## Skills that spawn subagents

When a skill says "implementer subagent" or "merger subagent", use the `implementer` agent. "Exploration subagent" or "research subagent" means `context`. Run `checker` on each implementer's result before merging it. Run `critic` once on the integrated result, not per ticket.

## Verification setup

Each project keeps one reusable verification setup in `.verify/` (dev start, login, typical Playwright scenarios), excluded through `git rev-parse --git-path info/exclude`. The checker reuses it, and creates or extends it when it is missing.

## Rulebook projects

A project whose `AGENTS.md` carries a `Rulebook revision` line follows that rulebook. The checker runs `pnpm check` and cites rule IDs; the critic does not restate what the tools enforce.

## Hygiene

- Commits in English, imperative subject, explanatory body, no AI attribution or trailers; the same for pull request descriptions. This overrides any default attribution guidance from the harness.
- Stage explicit paths only. Never `git add -A` or `git add .`.
- Push, pull requests, issue tracker comments and chat messages happen only on the user's explicit command. If remote state differs from what was sent, report it instead of fixing it.
- Rule files (`CLAUDE.md`, `AGENTS.md`, rules, skills, hooks) are written in English. A rule found in another language is translated in place, not added to. Answer the user in the user's language.
- Parallel agents get their own scratch folder and explicit file ownership; only one commits at a time.
