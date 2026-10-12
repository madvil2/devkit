const INTERNAL_ORIGIN = 'http://internal.invalid'

const isRootRelative = (value: string) =>
  value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')

export const safeNextPath = (value: string | null | undefined, fallback = '/') => {
  if (!value || !isRootRelative(value)) return fallback
  try {
    const url = new URL(value, INTERNAL_ORIGIN)
    const path = `${url.pathname}${url.search}${url.hash}`
    return url.origin === INTERNAL_ORIGIN && isRootRelative(path) ? path : fallback
  } catch {
    return fallback
  }
}
