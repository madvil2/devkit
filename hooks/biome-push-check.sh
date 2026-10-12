#!/usr/bin/env bash
# PreToolUse hook: before `git push`, run the project's Biome check and DENY the
# push if it fails, so CI never fails on formatting/lint again.
# Allows the push (exit 0, no output) when: not a git push, not a git repo, or
# the project has no Biome (no biome config and no biome-based lint script).

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

# Only gate git push.
case "$cmd" in
  *"git push"*) ;;
  *) exit 0 ;;
esac

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

# Detect Biome: a biome config, or a lint script that invokes biome.
has_biome=0
lint_script=""
for f in biome.json biome.jsonc; do [ -f "$f" ] && has_biome=1; done
if [ -f package.json ]; then
  lint=$(jq -r '.scripts.lint // ""' package.json 2>/dev/null)
  case "$lint" in *biome*) has_biome=1; lint_script="lint" ;; esac
fi
[ "$has_biome" = "1" ] || exit 0

# Run Biome the way this project runs it.
if [ -n "$lint_script" ] && command -v pnpm >/dev/null 2>&1; then
  out=$(pnpm run "$lint_script" 2>&1); code=$?
elif command -v pnpm >/dev/null 2>&1; then
  out=$(pnpm exec biome check . 2>&1); code=$?
elif command -v npx >/dev/null 2>&1; then
  out=$(npx --yes @biomejs/biome check . 2>&1); code=$?
else
  exit 0  # no runner available — don't block
fi

[ "$code" -eq 0 ] && exit 0

reason=$(printf 'Biome check FAILED — this push would fail CI. Fix before pushing:\n  1. run: biome check --write .   (auto-fixes formatting + safe lint)\n  2. resolve any remaining errors by hand\n  3. push again\n\n--- biome output (tail) ---\n%s' "$(printf '%s' "$out" | tail -40)")

jq -cn --arg r "$reason" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
