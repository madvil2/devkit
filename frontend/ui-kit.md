# UI kit

Applies to: all

- **KIT-1** No `span p a h1–h6 button input select textarea form label img pre` outside `shared/ui`. [rules: R-native-elements] Allowed outside it:
  - `div section header main footer nav ul ol li article aside`;
  - inline SVG only inside icon components.
- **KIT-2** Kit at scaffold:
  - `Text`, `Heading` (`level` decoupled from `size`), `Button` (variants primary/secondary/ghost/danger; sizes sm/md/lg; `loading`; blocked = `aria-disabled`), `Link` (router link / `next/link`; external with `rel`), `Icon` (registry by name), `Image` (`next/image` wrapper or sized lazy `img` with placeholder);
  - `Stack`/`Row`/`Grid` (gap typed as a space-token name, rendered as `data-gap`), `Card`, `Field`, `Input`, `Form`;
  - `Spinner`, `Skeleton`, `AsyncState`, `Dialog` via `modal.open()`, `toast.show()`, `VisuallyHidden`.
  - Admin adds `Table`, `Select`, `Tabs`, `Pagination`, `Badge`, `EmptyState`. `Table` is built on TanStack Table v9: `createTableHook` in the kit, `useTable`, `FlexRender`, `Subscribe`. `useReactTable` does not exist in v9; `useLegacyTable` is not used.
  - Marketing adds `Section`, `Container`, `JsonLd`.
  - TMA adds `Pressable`, `Page`, `Amount`.
- **KIT-3** Variants are props rendered as `data-variant`/`data-size`/`data-tone`. States:
  - `aria-*` where semantic (`aria-disabled`, `aria-pressed`, `aria-invalid`, `aria-current`);
  - otherwise boolean `data-<state>` attributes in the Base UI vocabulary: `data-open`/`data-closed`, `data-checked`/`data-unchecked`, `data-disabled`, `data-highlighted`, `data-selected`, `data-pressed`, `data-popup-open`, `data-side`, `data-align`, `data-starting-style`/`data-ending-style`; own states follow the same pattern (`data-loading`);
  - no `data-state`.
  - The kit styles them in its own module.
- **KIT-4** Extend the kit with variants/presets rather than one-off markup. One component type looks the same everywhere.
- **KIT-5** `shared/ui` imports nothing from slices and holds no copy. Labels and aria text arrive as props.
- **KIT-6** Base UI (`@base-ui/react`, unstyled; its `data-*` state attributes are styled directly in our modules) and `lucide-react` are imported only inside `shared/ui`. `@base-ui-components/react` is never installed. [arch: vendor-ui-only-in-shared]
- **KIT-7** A11y: [e2e: axe]
  - token focus ring;
  - accessible names on every control;
  - labels tied to inputs;
  - `aria-disabled` for blocked feedback;
  - one `h1` per page;
  - landmarks;
  - `prefers-reduced-motion` honored;
  - AA contrast for semantic fg/bg pairs.
- **KIT-8** One modal API and one toast channel. Prefer the native `<dialog>`/popover top layer over z-index.
- **KIT-9** One clipboard helper. (tma) Haptics are built into the kit.
- **KIT-10** Figma source: Figma variables (`get_variable_defs`) feed primitives/semantic. Kit names match Figma components.
- **KIT-11** Kit components accept `className` only for placement by the parent (margin, grid area, flex sizing), merged with `cx(styles.root, className)`. Never use it to restyle the kit. (See STY-6 for why.)

## Component folder

```
shared/ui/button/
  button.tsx          named export Button
  button.module.css   .root + [data-variant] / [data-size] / [aria-disabled] selectors
  use-button.ts       optional view hook
  index.ts            export { Button } and its props type
```
