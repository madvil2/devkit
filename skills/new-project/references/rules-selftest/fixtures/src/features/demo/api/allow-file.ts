// biome-ignore-all lint/plugin/R-fetch: vendored SDK shim, removed with SDK v2
export const load = () => fetch(API.users)
export const load2 = () => fetch(API.orders)
