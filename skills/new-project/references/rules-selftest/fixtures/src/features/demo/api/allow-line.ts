// biome-ignore lint/plugin/R-fetch: legacy SDK needs a raw fetch until v2
export const load = () => fetch(API.users)
