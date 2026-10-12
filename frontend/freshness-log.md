# Freshness log

Applies to: all

Append-only, newest first. Each entry: date and trigger, packages old → new, findings with sources, a decision per finding. Ledger: [stack.md](stack.md).

## 2026-10-12 — interview and ADRs through Pocock skills

Trigger: explicit request. No package changes.

| Finding | Source | Decision |
|---|---|---|
| The interview and decision records duplicated the `grill-with-docs` and `domain-modeling` skills | skills | project-types interview runs through `grill-with-docs`; WF-2 ADRs move to `docs/adr/` in the domain-modeling format |

## 2026-10-11 — initial rulebook

Trigger: rulebook created (revision 2026-10-11). Experiments: create-next-app 16.4.0, create-vite 9.2.1 and pnpm 12 scratch projects; Node 24.15.0.

Packages: baseline, none → the versions in [stack.md](stack.md).

| Finding | Source | Decision |
|---|---|---|
| TypeScript 7.0.2 has no JS API; dependency-cruiser 18.5 finds 0 modules with it and exits 0 | experiment; `depcruise --info` | Pin `typescript ~6.0` (TOOL-2); add TOOL-8 (0 modules fails); watch W-1 |
| Next 16.4 builds and type-checks with TS 7 | Next `useTypeScriptCli.md`; experiment | Recorded; not adopted while W-1 is open |
| plugin-react 6 `compiler: true` is experimental | plugin-react 6.1.2 README | CMP-8 uses `@rolldown/plugin-babel` + `reactCompilerPreset()` |
| Next React Compiler is top-level `reactCompiler: true`, stable | https://nextjs.org/docs/app/guides/upgrading/version-16 | CMP-8 (next) |
| pnpm 12 fails installs on unapproved build scripts | experiment | TOOL-1: approvals in `pnpm-workspace.yaml` `allowBuilds` |
| Next custom PostCSS config disables autoprefixer and preset-env | https://nextjs.org/docs/pages/guides/post-css | NXT-12; autoprefixer added only when targets need it |
| global-data + custom-media + `composes` from `@/…` work in Vite 8 and Next 16 (Turbopack and webpack, dev and build) | experiment | STY-4 and TOOL-7 use the alias form |
| TanStack Table 9 replaced `useReactTable` with `useTable` / `createTableHook` | package d.ts | KIT-2 |
| `next/script` `beforeInteractive` does not block hydration | https://nextjs.org/docs/app/api-reference/components/script | NXT-10: inline `<script>` in `<head>` |
| CSS chunking merges and reorders CSS by default | Next `cssChunking.md` | STY-6: no cross-file order dependence |
| `middleware` renamed to `proxy.ts`, Node runtime only | version-16 guide | AUTH-2, NXT-14 |
| `next lint` removed; Turbopack default for dev and build | version-16 guide | TOOL-3, NXT-14 |
| Vitest 5: Node >=22.12, `clearMocks` default, strict `toHaveTextContent` | https://vitest.dev/guide/migration | TST-6 |
| Base UI package is `@base-ui/react`; state via `data-open`, `data-checked` etc., no `data-state` | npm; package grep | KIT-3, KIT-6 |
| Biome auto-detects `*.module.css`; `css.parser.cssModules` is for other files | biome 2.5.15 schema | TOOL-3 |
| create-next-app writes `cacheComponents: true` and its own `AGENTS.md` | experiment | Watch W-15; the scaffold replaces `AGENTS.md` |
