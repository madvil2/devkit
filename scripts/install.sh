#!/usr/bin/env bash
# Links the devkit agents and skills into ~/.claude (and ~/.agents when present)
# and imports rules/flow.md into the global ~/.claude/CLAUDE.md.
# Symlinks keep edits in this repo live without a plugin update.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"

mkdir -p "$CLAUDE_HOME/agents" "$CLAUDE_HOME/skills"

for f in "$ROOT"/agents/*.md; do
  ln -sfn "$f" "$CLAUDE_HOME/agents/$(basename "$f")"
done
echo "agents linked into $CLAUDE_HOME/agents"

for d in "$ROOT"/skills/*/; do
  name="$(basename "$d")"
  ln -sfn "${d%/}" "$CLAUDE_HOME/skills/$name"
  if [ -d "$HOME/.agents/skills" ]; then
    ln -sfn "${d%/}" "$HOME/.agents/skills/$name"
  fi
done
echo "skills linked into $CLAUDE_HOME/skills"

IMPORT="@$ROOT/rules/flow.md"
CLAUDE_MD="$CLAUDE_HOME/CLAUDE.md"
touch "$CLAUDE_MD"
if ! grep -qxF "$IMPORT" "$CLAUDE_MD"; then
  { [ -s "$CLAUDE_MD" ] && printf '\n'; printf '%s\n' "$IMPORT"; } >> "$CLAUDE_MD"
  echo "flow rules imported into $CLAUDE_MD"
else
  echo "flow rules already imported in $CLAUDE_MD"
fi

echo
echo "Optional Biome pre-push gate: add hooks/hooks.json to your settings, or install devkit as a plugin:"
echo "  claude plugin marketplace add madvil2/devkit && claude plugin install devkit@devkit"
