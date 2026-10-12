# Forms

Applies to: all

- **FRM-1** react-hook-form with a zod schema in `model/<form>-schema.ts`. Messages are i18n keys.
- **FRM-2** The kit `Form`/`Field`/`Input`/`Select`/`Checkbox`/`Switch` owns label, hint, error, `aria-invalid` and `aria-describedby`. The RHF adapters live in the kit.
- **FRM-3** Submit is `Button type="submit"` inside `Form`. Pending: `aria-disabled` + spinner, no double submit. Server errors map via `fieldErrors`, otherwise a form-level key.
- **FRM-4** (next) Server actions re-validate with the same schema and return `{ ok: true } | { ok: false; fieldErrors }`. They check auth themselves (AUTH-2).
- **FRM-5** Correct `inputMode`, `autoComplete` and `enterKeyHint`. Amounts are strings (MNY-1).
