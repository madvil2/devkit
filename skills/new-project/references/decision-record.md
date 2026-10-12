# Decision record template

The main session drafts it during the interview at `<scratchpad>/new-project/<name>/decision.md`; the scaffold writes it to `<path>/docs/decisions/0001-stack.md`. English. Fill every field; write "none" rather than deleting a line.

```markdown
# 0001. Stack and structure

Date: <YYYY-MM-DD>
Status: accepted
Rulebook revision: <YYYY-MM-DD>

## Context

<one sentence: what the product is and for whom>

## Answers

| Question | Answer |
|---|---|
| Name / slug | <name> |
| Public pages must rank or render previews | <yes/no> |
| Logged-in part, auth issuer | <none / backend session / BFF / Telegram initData> |
| Runs in | <browser / Telegram / PWA / store shell> |
| Backend | <exists: URL, OpenAPI? / not yet: mocks + TODO(api) / none> |
| Locales, default, remote copy | <en, ru; default en; no> |
| Multi-tenant | <yes/no> |
| Money, realtime | <no/no> |
| Design source | <Figma link / brand tokens / neutral starter> |
| Deploy, domain, group, path | <static nginx; none; personal; ~/Projects/<name>> |

## Decision

- Type: <row of the project-types matrix>
- Stack: <framework + versions from the freshness table>
- Structure variant: <A / B / C>, layers <list>
- Auth pattern: <AUTH-x>
- Rendering: <CSR / SSG / RSC + islands>
- Deploy: <target>; port <port>
- Add-ons: <pwa / store shell / none>

## Freshness

| package | rulebook | installed | note |
|---|---|---|---|

Verified on <date> (or "not verified: <reason>, user consent on <date>").

## Deviations from the rulebook

| Rule ID | Deviation | Reason | Scope (project only / rulebook updated) |
|---|---|---|---|

## Open items

- <TODO(api) endpoints, tokens to replace, deploy secrets, pending Fable review>
```
