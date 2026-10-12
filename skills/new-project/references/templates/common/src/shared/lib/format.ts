const numberFormats = new Map<string, Intl.NumberFormat>()
const dateFormats = new Map<string, Intl.DateTimeFormat>()

const cacheKey = (locale: string, options: object): string => `${locale}:${JSON.stringify(options)}`

export const formatNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
): string => {
  const key = cacheKey(locale, options)
  const cached = numberFormats.get(key)
  const formatter = cached ?? new Intl.NumberFormat(locale, options)
  if (!cached) numberFormats.set(key, formatter)
  return formatter.format(value)
}

export const formatDate = (
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string => {
  const key = cacheKey(locale, options)
  const cached = dateFormats.get(key)
  const formatter = cached ?? new Intl.DateTimeFormat(locale, options)
  if (!cached) dateFormats.set(key, formatter)
  return formatter.format(value instanceof Date ? value : new Date(value))
}

export const formatRelative = (
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string,
): string => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit)
