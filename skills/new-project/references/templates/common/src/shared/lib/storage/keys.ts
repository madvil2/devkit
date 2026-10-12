import { THEME_STORAGE_KEY } from '../theme/pre-paint'

export const STORAGE_KEYS = {
  theme: THEME_STORAGE_KEY,
  locale: '{{name}}:locale',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
