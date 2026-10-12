// biome-ignore lint/plugin/R-fetch: legacy SDK needs a raw fetch until v2
export const url = 'http://example.com/*not*/'
export const tpl = `a // b ${'/* c */'} d`
export const ratio = (x: number, y: number) => x / y / 2
export const re = /\/\/[^/]*/g
export const div = [1][0] / 2
export const nested = `x${`y // ${1}`}z`
export const TODO = 1
// TODO(api): replace with GET /orders (docs/orders.md)
export const lazy = () => import(/* @vite-ignore */ './x')
