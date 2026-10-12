import type { TelegramPort } from './types'

const memory = new Map<string, string>()

export const createBrowserPort = (): TelegramPort => {
  let backHandlers: Array<() => void> = []
  return {
    env: 'browser',
    platform: 'web',
    initData: '',
    viewerHint: null,
    ready: () => undefined,
    close: () => window.history.back(),
    setHeaderColor: () => undefined,
    setBackgroundColor: () => undefined,
    setBottomBarColor: () => undefined,
    setBackButtonVisible: () => undefined,
    onBackButtonClick: (handler) => {
      backHandlers = [...backHandlers, handler]
      return () => {
        backHandlers = backHandlers.filter((item) => item !== handler)
      }
    },
    haptic: () => undefined,
    openLink: (url) => {
      window.open(url, '_blank', 'noopener')
    },
    openTelegramLink: (url) => {
      window.open(url, '_blank', 'noopener')
    },
    storageGet: async (keys) =>
      Object.fromEntries(
        keys.flatMap((key) => {
          const value = memory.get(key)
          return value === undefined ? [] : [[key, value]]
        }),
      ),
    storageSet: async (key, value) => {
      memory.set(key, value)
    },
  }
}
