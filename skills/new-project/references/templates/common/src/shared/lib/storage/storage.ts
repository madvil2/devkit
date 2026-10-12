import type { StorageKey } from './keys'

const memory = new Map<string, string>()

const webStorage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const readStorage = (key: StorageKey): string | null => {
  const storage = webStorage()
  try {
    return storage ? storage.getItem(key) : (memory.get(key) ?? null)
  } catch {
    return memory.get(key) ?? null
  }
}

export const writeStorage = (key: StorageKey, value: string): void => {
  memory.set(key, value)
  try {
    webStorage()?.setItem(key, value)
  } catch {
    memory.set(key, value)
  }
}

export const removeStorage = (key: StorageKey): void => {
  memory.delete(key)
  try {
    webStorage()?.removeItem(key)
  } catch {
    memory.delete(key)
  }
}
