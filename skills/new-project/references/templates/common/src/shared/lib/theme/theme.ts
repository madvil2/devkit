import { readStorage, STORAGE_KEYS, writeStorage } from '../storage'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type Theme = Exclude<ThemePreference, 'system'>

const DARK_QUERY = '(prefers-color-scheme: dark)'

let preference: ThemePreference = 'system'
let unsubscribe: (() => void) | null = null

const isPreference = (value: string | null): value is ThemePreference =>
  THEME_PREFERENCES.some((item) => item === value)

const systemTheme = (): Theme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme
}

const follow = (next: ThemePreference): void => {
  unsubscribe?.()
  unsubscribe = null
  if (next !== 'system') {
    applyTheme(next)
    return
  }
  applyTheme(systemTheme())
  const media = window.matchMedia(DARK_QUERY)
  const onChange = () => applyTheme(systemTheme())
  media.addEventListener('change', onChange)
  unsubscribe = () => media.removeEventListener('change', onChange)
}

export const initTheme = (): void => {
  const stored = readStorage(STORAGE_KEYS.theme)
  preference = isPreference(stored) ? stored : 'system'
  follow(preference)
}

export const getThemePreference = (): ThemePreference => preference

export const setThemePreference = (next: ThemePreference): void => {
  preference = next
  writeStorage(STORAGE_KEYS.theme, next)
  follow(next)
}
