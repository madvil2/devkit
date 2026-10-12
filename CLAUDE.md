# Devkit

This repository is the kit, not a product. Everything here is read by agents in other projects.

- All rule files, agent prompts and skills are written in English.
- `agents/*.md` bodies are system prompts: short, imperative, no examples longer than a few lines.
- `rules/flow.md` is loaded into every session of the user who installs the kit. Keep it under about 80 lines.
- `frontend/` rule IDs are contracts: never renumber or reuse an ID. New rules take the next free number in their file. Change order: rule text → `frontend/stack.md` row → `frontend/freshness-log.md` entry → bump `Rulebook revision` in `frontend/README.md`.
- Nothing personal goes in: no absolute home paths, no project names of other people, no secrets, no transcripts.
- Commits: English imperative subject, body explains why, explicit paths, no attribution trailers.
