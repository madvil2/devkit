# Devkit

This repository is the kit, not a product. Everything here is read by agents in other projects.

- All rule files, agent prompts and skills are written in English.
- `rules/flow.md` is loaded into every session of the user who installs the kit.
- `frontend/` rule IDs are contracts: never renumber or reuse an ID. New rules take the next free number in their file. Change order: rule text → `frontend/stack.md` row → `frontend/freshness-log.md` entry → bump `Rulebook revision` in `frontend/README.md`.
- Skills listed in `pocock-skills.json` are vendored from mattpocock/skills: never edit them by hand, run `node scripts/sync-pocock-skills.mjs` instead.
- Nothing personal goes in: no absolute home paths, no secrets, no transcripts.
- Commits: English imperative subject, body explains why, explicit paths, no attribution trailers.
