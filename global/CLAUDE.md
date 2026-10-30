# Rules for all projects

## Model roles on coding tasks

The main session is the only one that talks to the user: it launches subagents, relays their results and asks the user for decisions. It does not gather context, plan, edit code or review itself, apart from the commit check under Loops; it delegates.

Opus does everything by default; Fable is called only on the triggers below.

Roles are predefined agents in `~/.claude/agents/`: `opus-context`, `opus-planner`, `opus-implementer`, `opus-checker`, `opus-critic`, `fable`. Launch them with `subagent_type`; model, role and default effort are set in each file. Override effort per launch: `effort: "xhigh"` for opus-planner on a bug with an unknown root cause, `effort: "high"` for opus-implementer on bug fixes, `effort: "max"` for fable only on an exceptionally hard problem, `effort: "high"` for opus-context when it prepares a Fable pack.

Subagents cannot launch subagents: a planner or fable returns its lookup questions to the main session, which runs them through opus-context and sends the answers back via SendMessage.

opus-context, opus-planner, opus-critic and fable have Edit, Write and NotebookEdit removed in their frontmatter (`disallowedTools`); opus-checker has Edit and NotebookEdit removed and writes only its own scratch files. Bash and MCP tools stay, so these roles could still change files or post: their no-edit rule and the outward-action rules below still bind them. When a skill asks opus-context to save notes or files, it returns their content and the main session has an opus-implementer write them.

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

Loops (findings always go back to the same implementer via SendMessage, unless it came back unfinished; then they go to its successor, see Worker notes and successors):
- implementer ↔ checker: at most 2 rounds; if still not clean, escalate to fable as critic with the checker's open findings.
- opus-critic: at most 2 returns; the next review is by fable instead of a third Opus round.
- fable critic: one re-review after its findings are fixed; if it still does not converge, stop and bring the user a summary of where it is stuck.
- After every fix the checker runs again before the critic sees it. The main session reports to the user only after the critic (Opus or Fable) accepts; on a small task, after the checker is clean.
- Every opus-checker, opus-critic and fable critic report ends with a `Verified:` list of what the reviewer checked itself and one line, `Verdict: <clean|findings|inconclusive>; commit: <sha>; blocking: n; non-blocking: m` (the critics write `accept|return|inconclusive`); clean and accept mean no blocking findings, no required check left unrun and a non-empty `Verified:` list, and a report that claims clean or accept without them counts as inconclusive. The main session acts on that line and on a doubt note at the top of a checker's report, which still makes a small task regular: blocking findings go back to the implementer and count as a round; non-blocking findings alone do not start one and are listed in the report to the user.
- Inconclusive means a required check could not run (a missing environment, tool, service or permission) or the tree was not clean when the review started; blocking findings still make the verdict findings or return. It is neither a pass nor a round, and nothing goes to the implementer as a finding. For uncommitted paths, the main session has the implementer that owns them commit or clean them up, never another one; for a setup step from the project's own docs or scripts (install dependencies, start a service, install a browser) that changes no tracked file, it gives the step to an opus-implementer as a setup task. Then the same reviewer runs again; when that is not possible, or the same check comes back inconclusive twice, the main session asks the user. A report without its `Verified:` list goes to a fresh reviewer of the same role.
- A verdict holds only for the commit it names, and the critic's must name the same commit as the checker's clean verdict. When fable reviews after the implementer ↔ checker loop did not converge, the checker runs once more after Fable's accept: the main session puts Fable's rulings in its prompt and tells it to rerun only the mechanical checks (typecheck, lint, tests, scenarios) and not to raise again a finding Fable ruled on. The final pair is that clean verdict and Fable's accept on the same commit, and blocking mechanical failures left at that point go to the user instead of a new round. Before reporting a change to the user and before a push or PR, the main session itself runs `git rev-parse HEAD` and `git status --porcelain -- ':/' ':(top,exclude,glob)**/.playwright-mcp/**'` in the change's worktree and confirms that HEAD is the commit the final verdicts name and the status is empty; in a shared worktree these are the verdicts after integration. Any change after them voids them and the chain runs again from the checker; when `git diff <sha> HEAD` is empty (a squash or a reworded message), a checker re-check of the commit messages is enough, the critic's verdict carries over to the new commit, and the main session names both commits in its report. For a push or PR, the main session names the approved commit in the implementer's prompt.
- The main session names in each reviewer's prompt the worktree it checks.
- A critic's re-review gets its earlier findings and the diff from the commit its last verdict named to the one it now reviews.

Parallel agents:
- Give each parallel agent its own scratch subfolder (`<scratchpad>/<agent-task>/`); no two agents write the same scratch files.
- Split parallel implementers by explicit file or folder ownership; only one of them commits at a time.
- Tell each parallel implementer in its prompt that it works in parallel in a shared worktree, so the squash and test limits in its agent file apply.
- In a shared worktree, start checkers only after every parallel implementer has returned and committed.
- Parallel implementers in one worktree each run only the tests for their own files; after integration the main session has an opus-checker run the full suite once.

Waiting (every session and agent; each turn re-reads the whole context, so idle turns cost as much as working ones):
- Wait for background commands and agents through their completion notifications, never by polling or by loops that print.
- Run every background command, and any foreground command that may outlast the Bash tool's timeout, under a hard time limit, so it always ends and notifies: `timeout <seconds>` or `gtimeout <seconds>`; where neither exists (stock macOS), `node ~/.claude/scripts/bounded.mjs <seconds> -- <command> [args...]` or `node ~/.claude/scripts/bounded.mjs <seconds> "<shell command>"`. On its own timeout (exit 124) or on TERM, INT or HUP it stops the command's whole process group. It closes stdin, so put a pipeline inside the quoted shell form. If none of them is installed, run the command in the foreground under the Bash tool's timeout.
- Wait for a server with one silent until-loop under the same limit, not with repeated checks. When a notification does not come, check the job's status at most 3 times, each with one until-loop or Monitor under a limit rather than a sleep, then report it stuck.

Worker notes and successors:
- The main session gives every implementer and checker its own scratch subfolder (`<scratchpad>/<agent-task>/`) in its prompt; the worker keeps its `progress.md` there.
- Before returning, a worker stops its own background tasks or lists their IDs in `progress.md`.
- When an implementer or checker comes back unfinished (marked partial, or out of turns or context), the main session launches a fresh agent of the same role with the plan and its predecessor's `progress.md` instead of resuming the old one. It first stops any background tasks listed there with TaskStop, so two agents never edit the same files. The successor inherits the loop rounds already spent; a second unfinished return of the same role on the same work goes to the user.

Pure research and answers to questions may skip the chain. Outward-facing actions (push, PR, issue tracker, chat) happen only on the user's explicit command and are executed by opus-implementer. If the stored state of an outward action differs from what was sent (a missing mention, an edited comment, a changed status), report it to the user instead of "fixing" it: the user may have changed it on purpose.

Commit attribution: commits are in English, with no mention of Claude and no Co-Authored-By or other attribution trailers; PR descriptions carry no Claude attribution either. This overrides any default attribution guidance from the harness.

## Language of rules

Every agent instruction file is written in English: `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/rules/*`, `.agents/*`, skill and hook instructions. A rule found in another language is translated in place, not added to. Replies to the user follow the user's language; the rules stay English.

## Skills and plugins

Before delegating or answering, the main session checks the available skills and plugin commands for ones that fit the task; one the user names always fits. A skill built around talking to the user or launching subagents (grilling, code-review, implement-spec) runs in the main session, which follows its steps with the role mapping below. Any other fitting skill is named in the prompt of the subagent whose role covers it (tdd for opus-implementer), and that subagent invokes it; subagents may also invoke skills that fit their own role. When a subagent's skill reaches a step that needs the user, another subagent or an outward action, the subagent returns that step in its report: the main session asks the user or launches the agent and sends the answer back via SendMessage, and outward steps go to opus-implementer on the user's explicit command. A skill does not move work between roles: its context gathering, planning, edits and reviews still go to the agents that own them.

When a skill says "implementer subagent" or "merger subagent", use `opus-implementer`; "exploration subagent" or "research subagent" means `opus-context`; a review sub-agent (code-review's Standards and Spec) means `opus-critic`. Each implementer's result goes through `opus-checker` before it is merged; `opus-critic` reviews the integrated result. code-review's report goes to the user; it is not the chain's critic step and does not count toward critic loops. The main session says in its reviewers' prompts that this is a code-review pass, so they skip the commit check and the Verdict line.
