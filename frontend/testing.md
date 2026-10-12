# Testing

Applies to: all

- **TST-1** Vitest. Unit tests for every `shared/lib` function and for the `errorKey`/format/money helpers. Stores are tested via actions.
- **TST-2** View hooks with `renderHook` (happy-dom) where they branch. No markup snapshots. CSS Modules import under the default Vitest config; tests never assert class names.
- **TST-3** Playwright smoke per main route, run on the production build with `API_MODE=mock`: [e2e]
  - one `h1`;
  - no console errors, no failed requests;
  - axe has no serious/critical issues;
  - both themes render with the right `data-theme` (no FOUC: `data-theme` is present at `DOMContentLoaded`);
  - no empty state before data (DAT-3);
  - viewports 390×844, plus 1440×900 for web.
- **TST-4** Every bug fix gets a regression test.
- **TST-5** Tests reuse the mock transport handlers.
- **TST-6** Vitest 5 specifics (stack.md W-12):
  - Node >=22.12;
  - `clearMocks` is on by default; tests do not rely on mock state across tests;
  - `toHaveTextContent` is strict; use `toMatchTextContent` for partial matches;
  - `vi.mock` only at top level;
  - the config sits in the project root (no parent-directory lookup); artifacts go to `.vitest/`, which is git-ignored.
