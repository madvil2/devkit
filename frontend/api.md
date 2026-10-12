# API

Applies to: all

- **API-1** One client, `shared/api/client.ts`: `request<T>(endpoint, { method, query, body, schema, signal, auth })`. [rules: R-fetch] Exception: (next) the BFF route handler and `shared/api/server.ts`.
- **API-2** Endpoint paths only in `shared/api/endpoints.ts` (`API` constants + builders). [rules: R-endpoint-literals]
- **API-3** Responses are parsed by a zod `schema` in the slice's `api/`; types come from `z.infer`. OpenAPI → generated types in `shared/api/generated/` (never edited, lint-excluded), still called through the registry.
- **API-4** `Transport` seam: `fetchTransport | mockTransport`, chosen by the validated `API_MODE`. [arch: mocks-only-from-transport] [ci]
  - Mocks live in `src/mocks/<domain>.ts` and declare every branched status.
  - The mock module is loaded by dynamic `import()`, so it is absent from production bundles.
  - Cutover changes no feature code.
  - The skill's dry run greps the build output for mock markers.
- **API-5** `TODO(api): <replacement> (docs/<feature>.md)` is the only prose comment, removed at cutover. Every stand-in for a missing endpoint carries one.
- **API-6** Errors: [rules: R-error-message]
  - `ApiError { status, code, details }` / `NetworkError`;
  - `shared/api/errors.ts` exports `errorKey(error): MessageKey` (fallbacks `errors.generic`/`errors.network`) and `fieldErrors(error)`;
  - UI never renders `.message` or backend text; third-party SDK errors go through `errorKey` too.
- **API-7** Auth headers only in the client. Tokens never in web storage (AUTH-4).

## Layout

```
shared/api/
  client.ts       request(), auth, signal, schema parsing
  transport.ts    Transport type, fetchTransport, lazy mockTransport
  endpoints.ts    API registry
  errors.ts       ApiError, NetworkError, errorKey, fieldErrors
  index.ts
  server.ts       (next) server-only fetch for Server Components
  realtime/       socket client (DAT-8)
  generated/      OpenAPI types, never edited
src/mocks/<domain>.ts
```
