# Data

Applies to: all

- **DAT-1** Server state lives only in TanStack Query. zustand holds shared client state. Local state is `useState` in view hooks. No other state manager.
- **DAT-2** Each entity `api/` exports `<entity>Keys`, `<entity>Queries` (`queryOptions`) and mutation hooks. No inline keys or fetchers.
- **DAT-3** Render states: [e2e: no-empty-flash]
  - `isPending` → skeleton;
  - `isError` → `AsyncState` error with retry and an `errorKey` message;
  - empty only when `isSuccess && data.length === 0`.
- **DAT-4** Mutations invalidate through the key factories. Optimistic updates always roll back on error. Pending blocks re-submit.
- **DAT-5** The QueryClient is created in `app/providers` with named defaults. `signal` is passed through to the client.
- **DAT-6** (next) Server Components fetch via `shared/api/server.ts` (`server-only`). Client islands get data via props or prefetch + `HydrationBoundary`. Never double-fetch.
- **DAT-7** zustand:
  - one store per concern in `model/`;
  - selectors return primitives or stored references; derived values are computed in the hook body;
  - actions are module functions;
  - no `loaded`/`failed` flags;
  - persistence only via `shared/lib/storage`, hydrated in bootstrap.
- **DAT-8** Realtime: one socket client in `shared/api/realtime`. Events call `setQueryData`/`invalidateQueries`. Polling stand-ins carry `TODO(api):`.
- **DAT-9** URL state lives in typed search params: (vite) `validateSearch` + zod; (next) zod-parsed `searchParams`.

## Shape

```ts
export const orderKeys = {
  all: ['orders'] as const,
  list: (filter: OrderFilter) => [...orderKeys.all, 'list', filter] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}

export const orderQueries = {
  list: (filter: OrderFilter) =>
    queryOptions({
      queryKey: orderKeys.list(filter),
      queryFn: ({ signal }) =>
        request(API.orders.list, { query: filter, schema: orderListSchema, signal }),
    }),
}
```
