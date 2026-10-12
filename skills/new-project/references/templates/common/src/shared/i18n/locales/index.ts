import type { Dict } from './{{defaultLocale}}'
import { dict as baseDict } from './{{defaultLocale}}'

export type { Dict }

export const LOCALES = [{{locales}}] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = '{{defaultLocale}}'
export const BASE_DICT: Dict = baseDict

export const loadDict: Record<Locale, () => Promise<Dict>> = {
{{localeLoaders}}
}
