import { create } from 'zustand'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/shared/lib/storage'
import type { Dict, Locale } from './locales'
import { BASE_DICT, DEFAULT_LOCALE, LOCALES, loadDict } from './locales'

type I18nState = {
  locale: Locale
  dict: Dict
}

const useI18nStore = create<I18nState>(() => ({ locale: DEFAULT_LOCALE, dict: BASE_DICT }))

const isLocale = (value: string | null | undefined): value is Locale =>
  LOCALES.some((locale) => locale === value)

const browserLocale = (): Locale | null => {
  const candidates = typeof navigator === 'undefined' ? [] : navigator.languages
  const match = candidates
    .map((candidate) => candidate.toLowerCase().split('-')[0])
    .find((candidate) => isLocale(candidate))
  return isLocale(match) ? match : null
}

const apply = async (locale: Locale): Promise<void> => {
  const dict = await loadDict[locale]()
  useI18nStore.setState({ locale, dict })
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export const initI18n = async (explicit?: string): Promise<void> => {
  const locale = isLocale(explicit)
    ? explicit
    : ([readStorage(STORAGE_KEYS.locale)].find(isLocale) ?? browserLocale() ?? DEFAULT_LOCALE)
  await apply(locale)
}

export const setLocale = async (locale: Locale): Promise<void> => {
  writeStorage(STORAGE_KEYS.locale, locale)
  await apply(locale)
}

export const getLocale = (): Locale => useI18nStore.getState().locale

export const useT = (): Dict => useI18nStore((state) => state.dict)

export const useLocale = (): Locale => useI18nStore((state) => state.locale)
