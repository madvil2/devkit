const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const isSafeMethod = (method: string) => SAFE_METHODS.has(method)

const urlHost = (value: string) => {
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

type HeaderReader = {
  headers: { get: (name: string) => string | null }
}

export const isSameOriginRequest = (request: HeaderReader) => {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite !== null && fetchSite !== 'same-origin') return false
  const host = request.headers.get('host')
  const source = request.headers.get('origin') ?? request.headers.get('referer')
  if (source) return host !== null && urlHost(source) === host
  return fetchSite === 'same-origin'
}
