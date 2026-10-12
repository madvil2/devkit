# Components

Applies to: all

- **CMP-1** One component per file. The file name is the kebab-case of the component name. [rules: R-one-component]
- **CMP-2** Arrow functions only. [rules: R-no-function-decl]
- **CMP-3** The component body is limited to:
  - at most one call to its own `use<Name>` from `use-<name>.ts` (in the slice's `model/`; in `shared/ui`, inside the component folder);
  - destructuring;
  - `return` JSX.
  - Pure presentational components have no hook and only map props.
- **CMP-4** At most **10** destructured fields from the view hook. [rules: R-hook-fields]
  - Over the cap, split into children with their own hooks.
  - Pass ids/entities, not callback bags.
  - `{...group}` counts as one field.
- **CMP-5** JSX purity. Allowed in JSX:
  - identifiers and member access (`t.ns.key`, `styles.root`);
  - `flag && <X/>`;
  - `flag ? <A/> : <B/>` on a bare identifier;
  - `list.map(renderX)`;
  - `list.map((x) => <Row key={x.id} item={x} />)` with an expression body.
  - Nothing else: no calls, arithmetic, template strings or nested ternaries.
- **CMP-6** View hooks compose query hooks (`api/`), stores (`model/`) and pure helpers (`lib/`). They never call `fetch` or the client directly.
- **CMP-7** `useEffect` only syncs with external systems. Never derived state, never data fetching.
- **CMP-8** React Compiler is on; no `useMemo`/`useCallback`/`memo` without a profiler trace. [rules: R-manual-memo warn]
  - (vite) `babel({ presets: [reactCompilerPreset()] })` from `@rolldown/plugin-babel` next to `react()`, with `@babel/core` and `babel-plugin-react-compiler`. `react({ compiler: true })` is experimental and not used (stack.md W-4).
  - (next) top-level `reactCompiler: true` in `next.config.ts`, with `babel-plugin-react-compiler`.
- **CMP-9** Nothing runs at module scope in slices: no storage, env, `window`, `Date` or URL reads. Initialization happens via `init*` called from bootstrap/providers. [rules: R-module-scope-side-effects]
- **CMP-10** JSX repeated twice becomes a component. Logic repeated twice becomes a hook in `model/` or `shared/lib/hooks`.
- **CMP-11** `type XProps = {...}`. No `React.FC`. Refs as props (React 19, no `forwardRef`).
- **CMP-12** No regex literals in feature code; named helpers in `shared/lib/patterns`. [rules: R-inline-regex]
- **CMP-13** (next) `'use client'` sits on the leaf component file. Its view hook is a client module. Server components may have no view hook (data arrives via props or async server functions).

## Shape

```
features/invite/ui/invite-form.tsx        component: hook call, destructure, JSX
features/invite/ui/invite-form.module.css
features/invite/model/use-invite-form.ts  view hook: queries, store, handlers, derived values
features/invite/model/use-invite-form.test.ts
```
