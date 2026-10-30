# Rules for all projects

## Model roles on coding tasks

The main session is the only one that talks to the user: it launches subagents, relays their results and asks the user for decisions. It does not gather context, plan, edit code or review itself; it delegates.

Opus does everything by default; Fable is called only on the triggers below.

Roles are predefined agents in `~/.claude/agents/`: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Launch them with `subagent_type`; model, role and default effort are set in each file. Override effort per launch: `effort: "xhigh"` for opus-planner on a bug with an unknown root cause, `effort: "high"` for opus-implementer on bug fixes, `effort: "max"` for fable only on an exceptionally hard problem, `effort: "high"` for opus-context when it prepares a Fable pack.

Subagents cannot launch subagents: a planner or fable returns its lookup questions to the main session, which runs them through opus-context and sends the answers back via SendMessage.

Fable triggers (any one):
- an ambiguous or cross-module design decision, or a new architecture;
- a root cause that opus-planner at effort xhigh did not find in one attempt;
- a high-risk change: auth or security, money, data migrations, concurrency, public API contracts;
- review loops that did not converge (see Loops);
- the user asks for Fable.

Feeding Fable:
- Before a Fable planner, an opus-context agent at `effort: "high"` prepares a pack: the task, constraints, `file:line` pointers with excerpts, facts apart from guesses. For a root-cause investigation, the pack also includes opus-planner's findings and what it ruled out. Fable reads code itself only to fill gaps.
- A Fable critic gets the diff, the checker's report and screenshots, and, after failed loops, a short history: what was tried and what each critic found. Launch it right after the cross-check.

Scale the chain:
- **Small task** (a text, a constant, a one-line fix, a single obvious file): opus-implementer → opus-checker → report. If the checker has any doubt about the change itself (not just the mechanics), the task becomes regular and opus-critic reviews it.
- **Regular task** (logic, several files, state, API contracts): opus-planner → opus-implementer → opus-checker → opus-critic → report.
- **Bug with an unknown root cause**: opus-planner with `effort: "xhigh"` returns the root cause with evidence and a fix plan; if it does not find the cause in one attempt, fable investigates. Then the regular chain continues.
- **Trigger task**: the same chain with fable as the planner and/or the critic, as the trigger requires.
- **When in doubt**: treat it as regular.

Loops (findings always go back to the same implementer via SendMessage):
- implementer ↔ checker: at most 2 rounds; if still not clean, escalate to fable as critic with the checker's open findings.
- opus-critic: at most 2 returns; the next review is by fable instead of a third Opus round.
- fable critic: one re-review after its findings are fixed; if it still does not converge, stop and bring the user a summary of where it is stuck.
- After every fix the checker runs again before the critic sees it. The main session reports to the user only after the critic (Opus or Fable) accepts; on a small task, after the checker is clean.
- Every opus-checker, opus-critic and fable critic report ends with one line, `Verdict: <clean|findings>; blocking: n; non-blocking: m` (the critics write `accept|return`); clean and accept mean no blocking findings. The main session acts on that line and on a doubt note at the top of a checker's report, which still makes a small task regular: blocking findings go back to the implementer and count as a round; non-blocking findings alone do not start one and are listed in the report to the user.
- A critic's re-review gets its earlier findings and the diff since that review.

Parallel agents:
- Give each parallel agent its own scratch subfolder (`<scratchpad>/<agent-task>/`); no two agents write the same scratch files.
- Split parallel implementers by explicit file or folder ownership; only one of them commits at a time.

Pure research and answers to questions may skip the chain. Outward-facing actions (push, PR, issue tracker, chat) happen only on the user's explicit command and are executed by opus-implementer. If the stored state of an outward action differs from what was sent (a missing mention, an edited comment, a changed status), report it to the user instead of "fixing" it: the user may have changed it on purpose.

Commit attribution: commits are in English, with no mention of Claude and no Co-Authored-By or other attribution trailers; PR descriptions carry no Claude attribution either. This overrides any default attribution guidance from the harness.

## Language of rules

Every agent instruction file is written in English: `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/rules/*`, `.agents/*`, skill and hook instructions. A rule found in another language is translated in place, not added to. Replies to the user follow the user's language; the rules stay English.

## Skills and plugins

Before delegating or answering, the main session checks the available skills and plugin commands for ones that fit the task; one the user names always fits. A skill built around talking to the user or launching subagents (grilling, code-review, implement-spec) runs in the main session, which follows its steps with the role mapping below. Any other fitting skill is named in the prompt of the subagent whose role covers it (tdd for opus-implementer), and that subagent invokes it; subagents may also invoke skills that fit their own role. When a subagent's skill reaches a step that needs the user, another subagent or an outward action, the subagent returns that step in its report: the main session asks the user or launches the agent and sends the answer back via SendMessage, and outward steps go to opus-implementer on the user's explicit command. A skill does not move work between roles: its context gathering, planning, edits and reviews still go to the agents that own them.

When a skill says "implementer subagent" or "merger subagent", use `opus-implementer`; "exploration subagent" or "research subagent" means `opus-context`; a review sub-agent (code-review's Standards and Spec) means `opus-critic`. Each implementer's result goes through `opus-checker` before it is merged; `opus-critic` reviews the integrated result. code-review's report goes to the user; it is not the chain's critic step and does not count toward critic loops.
