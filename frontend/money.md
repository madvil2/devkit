# Money

Applies to: money

Changes to this file need a Fable critic review.

- **MNY-1** `{ amount: string; currency: string }`, never a `number`. Arithmetic in integer minor units with BigInt helpers in `shared/lib/money`; the scale comes from the currency, never a float.
- **MNY-2** One formatter in `shared/lib/money` (ISO fiat may use `Intl.NumberFormat` inside it, fed from the string, not a parsed float). The `Amount` component is the only renderer of amounts.
- **MNY-3** Payment flows:
  - no double submit; an idempotency key per attempt when the backend supports it;
  - reset after success;
  - never debit an unknown source;
  - gate on loaded balances (DAT-3), never on a default of zero.
- **MNY-4** Input: amount fields accept a decimal string, normalize the locale separator, reject more fraction digits than the currency scale, and validate with zod before submit.
