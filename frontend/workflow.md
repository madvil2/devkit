# Workflow

Applies to: all

- **WF-1** No comments in code. Exceptions: `biome-ignore` with a reason, `TODO(api):`, `.d.ts` triple-slash directives, generated files, build markers. [rules: R-comments]
- **WF-2** `docs/<feature>.md` updated in the same change. Index in `docs/README.md`. ADRs in `docs/adr/` (domain-modeling format); domain terms in `GLOSSARY.md`.
- **WF-3** English in code, commits and agent rules. UI copy only via i18n.
- **WF-4** Commits:
  - English imperative subject ≤ 72 chars; body explains why;
  - one logical change each;
  - stage explicit paths only;
  - no AI attribution.
- **WF-5** Definition of done:
  - `pnpm check` green;
  - `test:e2e` green if UI or routes changed;
  - docs updated;
  - no raw values or untranslated strings;
  - all locales updated;
- **WF-6** `AGENTS.md` is the self-contained rulebook render (with its `Rulebook revision` line). `CLAUDE.md` = `@AGENTS.md`. `CLAUDE.local.md` stays local and excluded.
